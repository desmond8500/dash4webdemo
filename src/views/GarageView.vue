<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { alertText, formatKm, vehicleSubtitle, type Vehicle } from '@dash4/shared'
import { api } from '@/services/api'
import { vehicleHealth } from '@/utils/game'
import GameGauge from '@/components/GameGauge.vue'

/** Garage : les véhicules en cartes de personnage (photo, points de vie = papiers et entretiens à jour). */
const vehicles = ref<Vehicle[]>([])
const loading = ref(true)
onMounted(async () => {
  vehicles.value = await api.vehicles.list().catch(() => [])
  loading.value = false
})
const kindIcon = (k: string) => (k === 'scooter' || k === 'motorcycle' ? '🛵' : k === 'truck' || k === 'utility' ? '🚚' : '🚗')
</script>

<template>
  <section aria-labelledby="garage-title" style="--accent: var(--pink)">
    <div class="page-title"><span class="icon" aria-hidden="true">🚚</span><h1 id="garage-title" class="display">Garage</h1></div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 3" :key="i" class="skeleton" style="min-height: 260px" /></div>
    <p v-else-if="!vehicles.length" class="empty">Aucun véhicule dans le garage.</p>
    <ul v-else class="grid list" style="--min: 280px">
      <li v-for="(v, i) in vehicles" :key="v.id" class="car panel tile appear" :style="{ '--i': i }">
        <div class="photo">
          <img v-if="v.photo_url" :src="v.photo_url" :alt="`Photo de ${v.name}`" loading="lazy" />
          <span v-else aria-hidden="true">{{ kindIcon(v.kind.value) }}</span>
          <span class="badge status" :style="{ '--tone': v.status.value === 'active' ? 'var(--green)' : 'var(--orange)' }">{{ v.status.label }}</span>
        </div>
        <h2>{{ v.name }}</h2>
        <p class="muted">{{ vehicleSubtitle(v) || v.kind.label }} · {{ formatKm(v.mileage) }}</p>
        <GameGauge :value="vehicleHealth(v)" label="Points de vie" />
        <ul v-if="v.alerts?.length" class="alerts">
          <li v-for="(a, k) in v.alerts" :key="k" :class="a.state === 'expired' || a.state === 'late' ? 'bad' : 'warn'">⚠️ {{ alertText(a) }}</li>
        </ul>
        <p v-else class="ok">✨ Tout est en ordre</p>
        <p v-if="v.driver" class="muted small">Pilote : {{ v.driver.full_name }}</p>
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
.car {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.photo {
  position: relative;
  height: 160px;
  margin: -1rem -1.25rem 0.25rem;
  border-radius: var(--radius) var(--radius) 0 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 4rem;
  background: linear-gradient(135deg, rgb(244 114 182 / 0.25), rgb(56 189 248 / 0.22));
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.status {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: rgb(0 0 0 / 0.6);
}
.car h2 {
  font-size: 1.1rem;
}
.car p {
  margin: 0;
}
.alerts {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.alerts .bad {
  color: var(--red);
  font-weight: 700;
}
.alerts .warn {
  color: var(--gold);
}
.ok {
  color: var(--green);
  font-weight: 700;
}
.small {
  font-size: 0.8rem;
}
</style>
