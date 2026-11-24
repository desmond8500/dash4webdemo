<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Task } from '@dash4/shared'
import { api } from '@/services/api'
import { userCan } from '@/services/session'
import { blip } from '@/utils/sound'

/** Planning en « carnet de quêtes du jour » : sept jours glissants, missions programmées triées par heure. */
function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}
const today = startOfDay(new Date())
const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000))
const selected = ref(0)
const tasks = ref<Task[]>([])
const loading = ref(true)
const error = ref(false)
const teamScope = userCan('tasks.view')
const scope = ref<'mine' | 'team'>(teamScope ? 'team' : 'mine')

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function load(): Promise<void> {
  loading.value = true
  error.value = false
  const day = days[selected.value]!
  const next = new Date(day.getTime() + 86400000)
  try {
    tasks.value = (
      await api.tasks.list({
        from: iso(day),
        to: iso(next),
        per_page: 100,
        ...(scope.value === 'mine' ? { assigned_to: 'me' as const } : {}),
      })
    ).data
  } catch {
    error.value = true
    tasks.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(selected, () => void load())
watch(scope, () => {
  blip('select')
  void load()
})

const sorted = computed(() => [...tasks.value].sort((a, b) => (a.starts_at ?? a.due_date ?? '').localeCompare(b.starts_at ?? b.due_date ?? '')))
const unscheduled = computed(() => sorted.value.filter((t) => !t.starts_at))
const scheduled = computed(() => sorted.value.filter((t) => t.starts_at))

const DAY_LABELS = ['Aujourd’hui', 'Demain']
function dayLabel(d: Date, i: number): string {
  if (i < DAY_LABELS.length) return DAY_LABELS[i]!
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function timeOf(t: Task): string {
  if (!t.starts_at) return ''
  const start = new Date(t.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (!t.ends_at) return start
  return `${start} → ${new Date(t.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}
const PRIORITY_TONE: Record<string, string> = { high: 'var(--red)', normal: 'var(--amber)', low: 'var(--muted)' }
</script>

<template>
  <section aria-labelledby="planning-title" style="--accent: var(--amber)">
    <div class="page-title"><span class="icon" aria-hidden="true">🗓️</span><h1 id="planning-title" class="display">Planning</h1><span class="muted">Carnet de quêtes</span></div>

    <div v-if="teamScope" class="segments" role="radiogroup" aria-label="Planning affiché">
      <button type="button" role="radio" class="btn seg" :aria-checked="scope === 'team'" @click="scope = 'team'">Équipe</button>
      <button type="button" role="radio" class="btn seg" :aria-checked="scope === 'mine'" @click="scope = 'mine'">Mes missions</button>
    </div>

    <div class="days" role="tablist" aria-label="Choisir un jour">
      <button
        v-for="(d, i) in days"
        :key="i"
        type="button"
        role="tab"
        class="day btn"
        :aria-selected="selected === i"
        @click="
          selected = i
          blip('select')
        "
      >
        <span class="dname">{{ dayLabel(d, i) }}</span>
        <span class="dnum display">{{ d.getDate() }}</span>
      </button>
    </div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 4" :key="i" class="skeleton" /></div>
    <p v-else-if="error" class="empty" role="alert">Le planning n'a pas pu être chargé.</p>
    <p v-else-if="!sorted.length" class="empty">Rien de prévu ce jour-là. 🎉</p>
    <template v-else>
      <ul class="timeline">
        <li v-for="(t, i) in scheduled" :key="t.id" class="slot panel tile appear" :style="{ '--i': Math.min(i, 12), '--accent': PRIORITY_TONE[t.priority.value] ?? 'var(--amber)' }">
          <span class="time display">{{ timeOf(t) }}</span>
          <div class="body">
            <div class="top">
              <span class="badge" :style="{ '--tone': PRIORITY_TONE[t.priority.value] }">{{ t.priority.label }}</span>
              <span v-if="t.is_overdue" class="badge pulse" style="--tone: var(--red)">En retard</span>
              <span v-else class="badge" style="--tone: var(--muted)">{{ t.status.label }}</span>
            </div>
            <h2>{{ t.title }}</h2>
            <p class="muted">
              <span v-if="t.project">🏗️ {{ t.project.name }}</span>
              <span v-else-if="t.client">🏢 {{ t.client.name }}</span>
              <span v-if="t.location"> · 📍 {{ t.location }}</span>
            </p>
            <div v-if="t.assignees?.length" class="team" :aria-label="`Équipe : ${t.assignees.map((a) => a.full_name).join(', ')}`">
              <span v-for="a in t.assignees.slice(0, 5)" :key="a.id" class="mate" :title="a.full_name" aria-hidden="true">{{ a.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2) }}</span>
            </div>
          </div>
        </li>
      </ul>
      <template v-if="unscheduled.length">
        <h2 class="section-title">Sans horaire</h2>
        <ul class="grid list" style="--min: 240px">
          <li v-for="t in unscheduled" :key="t.id" class="panel tile appear">
            <div class="top">
              <span class="badge" :style="{ '--tone': PRIORITY_TONE[t.priority.value] }">{{ t.priority.label }}</span>
            </div>
            <h2>{{ t.title }}</h2>
            <p class="muted">
              <span v-if="t.project">🏗️ {{ t.project.name }}</span>
              <span v-else-if="t.client">🏢 {{ t.client.name }}</span>
            </p>
          </li>
        </ul>
      </template>
    </template>
  </section>
</template>

<style scoped>
.segments {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.seg[aria-checked='true'] {
  background: linear-gradient(135deg, var(--gold), var(--orange));
  color: #111;
  border-color: transparent;
}
.days {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  margin-bottom: 1rem;
}
.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 68px;
  padding: 0.5rem 0.4rem;
}
.day[aria-selected='true'] {
  background: linear-gradient(135deg, var(--gold), var(--orange));
  color: #111;
  border-color: transparent;
}
.dname {
  font-size: 0.7rem;
  text-transform: capitalize;
}
.dnum {
  font-size: 1.1rem;
  font-weight: 900;
}
.timeline {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.slot {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 1rem;
  border-left: 4px solid var(--accent);
}
.time {
  color: var(--accent);
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}
.top {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.body h2 {
  font-size: 1rem;
}
.body p {
  margin: 0;
  font-size: 0.85rem;
}
.section-title {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0 0 0.75rem;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.team {
  display: flex;
}
.mate {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-soft), var(--info));
  color: #022c22;
  border: 2px solid var(--panel-solid);
  margin-left: -6px;
}
.mate:first-child {
  margin-left: 0;
}
</style>
