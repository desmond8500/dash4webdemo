<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Task } from '@dash4/shared'
import { api } from '@/services/api'
import { userCan } from '@/services/session'
import { questProgress, questTier } from '@/utils/game'
import GameGauge from '@/components/GameGauge.vue'
import { blip } from '@/utils/sound'

/** Missions : les tâches de Dash4 en cartes de quête (priorité = couleur, sous-tâches = avancement). */
type Scope = 'mine' | 'team' | 'done'
const scope = ref<Scope>('mine')
const tasks = ref<Task[]>([])
const loading = ref(true)
const error = ref(false)
const scopes = computed(() => [
  { value: 'mine' as const, label: 'Mes missions' },
  ...(userCan('tasks.view') ? [{ value: 'team' as const, label: 'Équipe' }] : []),
  { value: 'done' as const, label: 'Accomplies' },
])

async function load(): Promise<void> {
  loading.value = true
  error.value = false
  try {
    const filters =
      scope.value === 'done' ? { assigned_to: 'me' as const, status: 'done', per_page: 30 } : scope.value === 'team' ? { open: true, per_page: 60 } : { assigned_to: 'me' as const, open: true, per_page: 60 }
    tasks.value = (await api.tasks.list(filters)).data
  } catch {
    error.value = true
    tasks.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(scope, () => {
  blip('select')
  void load()
})

const sorted = computed(() =>
  [...tasks.value].sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue) || ['high', 'normal', 'low'].indexOf(a.priority.value) - ['high', 'normal', 'low'].indexOf(b.priority.value)),
)
const TIER_COLORS = { gold: 'var(--gold)', violet: 'var(--violet)', cyan: 'var(--cyan)' }
const dueText = (t: Task) => (t.due_date ? new Date(t.due_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : null)
</script>

<template>
  <section aria-labelledby="missions-title" style="--accent: var(--gold)">
    <div class="page-title"><span class="icon" aria-hidden="true">🎯</span><h1 id="missions-title" class="display">Missions</h1></div>

    <div class="segments" role="radiogroup" aria-label="Missions affichées">
      <button
        v-for="s in scopes"
        :key="s.value"
        type="button"
        role="radio"
        class="btn seg"
        :aria-checked="scope === s.value"
        @click="scope = s.value"
      >
        {{ s.label }}
      </button>
    </div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="error" class="empty" role="alert">Les missions n'ont pas pu être chargées.</p>
    <p v-else-if="!sorted.length" class="empty">{{ scope === 'done' ? 'Aucune mission accomplie pour l’instant.' : 'Aucune mission en cours. 🎉' }}</p>
    <ul v-else class="grid quests" style="--min: 280px">
      <li
        v-for="(t, i) in sorted"
        :key="t.id"
        class="quest panel tile appear"
        :style="{ '--i': Math.min(i, 12), '--accent': TIER_COLORS[questTier(t.priority.value)] }"
      >
        <div class="top">
          <span class="badge" :style="{ '--tone': TIER_COLORS[questTier(t.priority.value)] }">{{ t.priority.label }}</span>
          <span v-if="t.is_overdue" class="badge pulse" style="--tone: var(--red)">En retard</span>
          <span v-else-if="t.status.value === 'done'" class="badge" style="--tone: var(--green)">✔ Accomplie</span>
          <span v-else class="badge" style="--tone: var(--muted)">{{ t.status.label }}</span>
        </div>
        <h2 class="title">{{ t.title }}</h2>
        <p class="muted meta">
          <span v-if="t.project">🏗️ {{ t.project.name }}</span>
          <span v-else-if="t.client">🏢 {{ t.client.name }}</span>
          <span v-if="dueText(t)"> · ⏳ {{ dueText(t) }}</span>
        </p>
        <GameGauge :value="questProgress(t)" :label="t.subtasks_count ? `Objectifs ${t.subtasks_done} / ${t.subtasks_count}` : 'Avancement'" tone="xp" />
        <div v-if="t.assignees?.length" class="team" :aria-label="`Équipe : ${t.assignees.map((a) => a.full_name).join(', ')}`">
          <span v-for="a in t.assignees.slice(0, 5)" :key="a.id" class="mate" :title="a.full_name" aria-hidden="true">{{ a.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2) }}</span>
        </div>
      </li>
    </ul>
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
.quests {
  list-style: none;
  margin: 0;
  padding: 0;
}
.quest {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-left: 4px solid var(--accent);
}
.top {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.title {
  font-size: 1.05rem;
}
.meta {
  margin: 0;
  font-size: 0.85rem;
}
.team {
  display: flex;
}
.mate {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--violet), var(--cyan));
  color: #0b1020;
  border: 2px solid var(--panel-solid);
  margin-left: -6px;
}
.mate:first-child {
  margin-left: 0;
}
</style>
