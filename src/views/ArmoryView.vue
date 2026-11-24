<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { loanDueText, type Tool, type ToolStatus } from '@dash4/shared'
import { api } from '@/services/api'
import { armoryStats } from '@/utils/game'
import StatTile from '@/components/StatTile.vue'

/** Armurerie : l'outillage, avec qui a quel outil et les retours en retard. */
const tools = ref<Tool[]>([])
const loading = ref(true)
const filter = ref<'all' | ToolStatus>('all')
onMounted(async () => {
  tools.value = await api.tools.list().catch(() => [])
  loading.value = false
})
const stats = computed(() => armoryStats(tools.value))
const shown = computed(() => tools.value.filter((t) => filter.value === 'all' || t.status.value === filter.value || (filter.value === 'lent' && t.status.value === 'late')))
const COLORS: Record<ToolStatus, string> = { available: 'var(--green)', lent: 'var(--cyan)', late: 'var(--red)', unavailable: 'var(--orange)' }
const filters = computed(() => [
  { value: 'all' as const, label: `Tous (${tools.value.length})` },
  { value: 'available' as const, label: `Disponibles (${stats.value.available})` },
  { value: 'lent' as const, label: `Sortis (${stats.value.lent})` },
  { value: 'late' as const, label: `En retard (${stats.value.late})` },
])
</script>

<template>
  <section aria-labelledby="armory-title" style="--accent: var(--green)">
    <div class="page-title"><span class="icon" aria-hidden="true">🛠️</span><h1 id="armory-title" class="display">Armurerie</h1></div>

    <div class="grid stats" style="--min: 200px">
      <StatTile icon="✅" label="Disponibles" :value="stats.available" accent="var(--green)" />
      <StatTile icon="🤝" label="Sortis" :value="stats.lent" accent="var(--cyan)" />
      <StatTile icon="⏰" label="En retard" :value="stats.late" accent="var(--red)" :alert="stats.late > 0" />
    </div>

    <div class="segments" role="radiogroup" aria-label="Outils affichés">
      <button v-for="f in filters" :key="f.value" type="button" role="radio" class="btn seg" :aria-checked="filter === f.value" @click="filter = f.value">{{ f.label }}</button>
    </div>

    <div v-if="loading" class="grid" style="--min: 240px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="!shown.length" class="empty">Aucun outil ici.</p>
    <ul v-else class="grid list" style="--min: 240px">
      <li v-for="(t, i) in shown" :key="t.id" class="card panel tile appear" :style="{ '--i': Math.min(i, 12), '--accent': COLORS[t.status.value] }">
        <div class="pic">
          <img v-if="t.image_url" :src="t.image_url" alt="" loading="lazy" />
          <span v-else aria-hidden="true">🔧</span>
        </div>
        <div class="body">
          <span class="badge" :class="{ pulse: t.status.value === 'late' }" :style="{ '--tone': COLORS[t.status.value] }">{{ t.status.label }}</span>
          <h2>{{ t.name }}</h2>
          <p class="muted">{{ [t.code, t.storage_location?.name].filter(Boolean).join(' · ') }}</p>
          <p v-if="t.current_loan" class="loan">🧍 {{ t.current_loan.borrower_label }} · <span :class="{ late: t.current_loan.state === 'late' }">{{ loanDueText(t.current_loan) }}</span></p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stats {
  margin-bottom: 1rem;
}
.segments {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.seg[aria-checked='true'] {
  background: linear-gradient(135deg, var(--green), var(--cyan));
  color: #0b1020;
  border-color: transparent;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.card {
  display: flex;
  gap: 0.9rem;
  align-items: center;
  border-left: 4px solid var(--accent);
}
.pic {
  width: 72px;
  height: 72px;
  flex: none;
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
  font-size: 2rem;
  overflow: hidden;
}
.pic img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.body h2 {
  font-size: 1rem;
}
.body p {
  margin: 0;
  font-size: 0.85rem;
}
.loan .late {
  color: var(--red);
  font-weight: 800;
}
</style>
