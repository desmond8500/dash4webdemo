<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DashboardWidgets, Project } from '@dash4/shared'
import { api } from '@/services/api'
import { userCanAny } from '@/services/session'
import GameGauge from '@/components/GameGauge.vue'

/** Chantiers : les projets en cours en cartes de « monde », avec l'avancement du chantier quand il est suivi. */
const projects = ref<Project[]>([])
const progress = ref<Record<number, number>>({})
const loading = ref(true)
onMounted(async () => {
  const [list, dash] = await Promise.allSettled([
    api.projects.list({ active: true, per_page: 60 }),
    userCanAny(['dashboard.view', 'dashboard.view.own']) ? api.dashboard.get() : Promise.reject(new Error('sans tableau de bord')),
  ])
  if (list.status === 'fulfilled') projects.value = list.value.data
  if (dash.status === 'fulfilled') {
    const items = (dash.value.widgets as DashboardWidgets).sites?.items ?? []
    progress.value = Object.fromEntries(items.map((s) => [s.id, s.progress]))
  }
  loading.value = false
})
const STATUS_COLORS: Record<string, string> = { planned: 'var(--cyan)', in_progress: 'var(--gold)', on_hold: 'var(--orange)', completed: 'var(--green)', cancelled: 'var(--red)' }
const sorted = computed(() => [...projects.value].sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || a.name.localeCompare(b.name, 'fr')))
</script>

<template>
  <section aria-labelledby="sites-title" style="--accent: var(--orange)">
    <div class="page-title"><span class="icon" aria-hidden="true">🏗️</span><h1 id="sites-title" class="display">Chantiers</h1><span class="muted">{{ projects.length }} en cours</span></div>

    <div v-if="loading" class="grid" style="--min: 260px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="!projects.length" class="empty">Aucun chantier en cours.</p>
    <ul v-else class="grid list" style="--min: 260px">
      <li v-for="(p, i) in sorted" :key="p.id" class="world panel tile appear" :style="{ '--i': Math.min(i, 12), '--accent': STATUS_COLORS[p.status.value] ?? 'var(--cyan)' }">
        <div class="head">
          <span class="logo">
            <img v-if="p.logo_url" :src="p.logo_url" alt="" loading="lazy" />
            <span v-else aria-hidden="true">🏗️</span>
          </span>
          <div class="grow">
            <h2>{{ p.is_favorite ? '⭐ ' : '' }}{{ p.name }}</h2>
            <p class="muted">{{ p.client?.name ?? 'Sans client' }}</p>
          </div>
        </div>
        <span class="badge" :style="{ '--tone': STATUS_COLORS[p.status.value] ?? 'var(--cyan)' }">{{ p.status.label }}</span>
        <GameGauge v-if="progress[p.id] !== undefined" :value="(progress[p.id] ?? 0) / 100" label="Avancement du chantier" tone="xp" />
        <p v-if="p.address" class="muted small">📍 {{ p.address }}</p>
        <p v-if="p.manager" class="muted small">🧭 Chef de projet : {{ p.manager.full_name }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.world {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-top: 4px solid var(--accent);
}
.head {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.logo {
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 1.6rem;
}
.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.grow {
  min-width: 0;
}
.world h2 {
  font-size: 1rem;
}
.world p {
  margin: 0;
}
.small {
  font-size: 0.8rem;
}
.badge {
  align-self: flex-start;
}
</style>
