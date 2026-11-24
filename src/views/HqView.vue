<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DashboardWidgets, Tool, Vehicle } from '@dash4/shared'
import { api } from '@/services/api'
import { session, userCanAny } from '@/services/session'
import { player } from '@/services/player'
import { armoryStats, greeting, vehicleHealth } from '@/utils/game'
import StatTile from '@/components/StatTile.vue'
import GameGauge from '@/components/GameGauge.vue'

/** QG : salutation, tuiles animées (missions, demandes, stock, outils, véhicules), missions du jour, chantiers. */
const widgets = ref<DashboardWidgets | null>(null)
const tools = ref<Tool[]>([])
const vehicles = ref<Vehicle[]>([])
const loading = ref(true)

onMounted(async () => {
  const jobs: Array<Promise<unknown>> = []
  if (userCanAny(['dashboard.view', 'dashboard.view.own'])) jobs.push(api.dashboard.get().then((d) => (widgets.value = d.widgets)))
  if (userCanAny(['tools.view', 'tools.view.own'])) jobs.push(api.tools.list().then((t) => (tools.value = t)))
  if (userCanAny(['vehicles.view', 'vehicles.view.own'])) jobs.push(api.vehicles.list().then((v) => (vehicles.value = v)))
  await Promise.allSettled(jobs)
  loading.value = false
})

const armory = computed(() => armoryStats(tools.value))
const fleetHealth = computed(() => (vehicles.value.length ? vehicles.value.reduce((s, v) => s + vehicleHealth(v), 0) / vehicles.value.length : 1))
const missions = computed(() => widgets.value?.my_tasks?.items ?? [])
const sites = computed(() => widgets.value?.sites?.items ?? [])
</script>

<template>
  <section aria-labelledby="hq-title">
    <div class="welcome panel appear">
      <div>
        <p class="muted">{{ greeting() }},</p>
        <h1 id="hq-title" class="display">{{ session.user?.firstname }}</h1>
        <p class="muted">{{ player.doneTasks }} mission{{ player.doneTasks > 1 ? 's' : '' }} accomplie{{ player.doneTasks > 1 ? 's' : '' }} · {{ player.level.title }}</p>
      </div>
      <div class="emblem" aria-hidden="true">🛰️</div>
    </div>

    <div v-if="loading" class="grid" style="--min: 240px">
      <div v-for="i in 4" :key="i" class="skeleton" />
    </div>
    <div v-else class="grid" style="--min: 240px">
      <StatTile v-if="widgets?.my_tasks" class="appear" style="--i: 0" icon="🎯" label="Missions en cours" :value="widgets.my_tasks.open" accent="var(--gold)" :hint="widgets.my_tasks.overdue ? `${widgets.my_tasks.overdue} en retard` : `${widgets.my_tasks.today} aujourd'hui`" :alert="widgets.my_tasks.overdue > 0" to="/taches" />
      <StatTile v-if="widgets?.client_requests" class="appear" style="--i: 1" icon="📨" label="Demandes à traiter" :value="widgets.client_requests.open" accent="var(--cyan)" :hint="widgets.client_requests.late ? `${widgets.client_requests.late} en retard` : `${widgets.client_requests.new} nouvelles`" :alert="widgets.client_requests.late > 0" />
      <StatTile v-if="widgets?.stock" class="appear" style="--i: 2" icon="🎒" label="Objets en stock bas" :value="widgets.stock.low" accent="var(--violet)" :alert="widgets.stock.low > 0" to="/stock" />
      <StatTile v-if="tools.length" class="appear" style="--i: 3" icon="🛠️" label="Outils sortis" :value="armory.lent" accent="var(--green)" :hint="armory.late ? `${armory.late} en retard` : `${armory.available} disponibles`" :alert="armory.late > 0" to="/stock/outillage" />
      <StatTile v-if="widgets?.quotes" class="appear" style="--i: 4" icon="📜" label="Devis envoyés" :value="widgets.quotes.sent" accent="var(--orange)" :hint="`${widgets.quotes.accepted_this_month} acceptés ce mois`" />
      <StatTile v-if="widgets?.team_tasks" class="appear" style="--i: 5" icon="🧑‍🤝‍🧑" label="Missions de l'équipe" :value="widgets.team_tasks.open" accent="var(--pink)" :hint="widgets.team_tasks.blocked ? `${widgets.team_tasks.blocked} bloquées` : `${widgets.team_tasks.unassigned} sans équipier`" />
    </div>

    <div class="two">
      <section class="panel appear" style="--i: 6" aria-labelledby="today-title">
        <h2 id="today-title" class="display section-title">🎯 Missions du jour</h2>
        <ul v-if="missions.length" class="missions">
          <li v-for="m in missions" :key="m.id" :class="{ late: m.overdue }">
            <span class="dot" aria-hidden="true" />
            <span class="grow">{{ m.title }}</span>
            <span v-if="m.overdue" class="badge" style="--tone: var(--red)">En retard</span>
            <span v-else-if="m.due_date" class="muted small">{{ new Date(m.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}</span>
          </li>
        </ul>
        <p v-else class="empty">Aucune mission en attente. Repos bien mérité ! 🏖️</p>
      </section>

      <section class="panel appear" style="--i: 7" aria-labelledby="status-title">
        <h2 id="status-title" class="display section-title">🛡️ État des troupes</h2>
        <div class="gauges">
          <GameGauge v-if="vehicles.length" :value="fleetHealth" label="Santé du garage" />
          <GameGauge v-if="tools.length" :value="tools.length ? armory.available / tools.length : 0" label="Outils disponibles" :text="`${armory.available} / ${tools.length}`" />
          <GameGauge v-for="s in sites.slice(0, 4)" :key="s.id" :value="s.progress / 100" :label="`Chantier ${s.name}`" tone="xp" />
        </div>
        <p v-if="!vehicles.length && !tools.length && !sites.length" class="empty">Rien à surveiller pour l'instant.</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  background:
    linear-gradient(120deg, rgb(16 185 129 / 0.25), rgb(56 189 248 / 0.2)),
    var(--panel);
}
.welcome p {
  margin: 0;
}
.welcome h1 {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  color: var(--text);
  text-shadow: 0 0 20px rgb(52 211 153 / 0.6);
}
.emblem {
  font-size: 4rem;
  animation: orbit calc(6s * var(--speed)) linear infinite;
}
@keyframes orbit {
  50% {
    transform: translateY(-8px) rotate(6deg);
  }
}
.two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.section-title {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}
.missions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.missions li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: rgb(255 255 255 / 0.04);
  border: 1px solid var(--border);
}
.missions li.late {
  border-color: color-mix(in srgb, var(--red) 60%, transparent);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 10px var(--gold);
}
.late .dot {
  background: var(--red);
  box-shadow: 0 0 10px var(--red);
}
.grow {
  flex: 1;
}
.small {
  font-size: 0.8rem;
}
.gauges {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
