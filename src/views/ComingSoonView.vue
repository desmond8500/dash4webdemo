<script setup lang="ts">
import { computed } from 'vue'
import { DASH4_WEB_URL, NAV } from '@/navigation'

/** Écran pas encore refait « façon jeu » : on l'ouvre dans dash4-web, avec les mêmes droits. */
const props = defineProps<{ screen: string }>()
const item = computed(() => NAV.find((n) => n.name === props.screen) ?? null)
</script>

<template>
  <section class="soon panel appear" aria-labelledby="soon-title" :style="{ '--accent': item?.accent ?? 'var(--primary)' }">
    <span class="icon" aria-hidden="true">{{ item?.icon ?? '🧩' }}</span>
    <h1 id="soon-title" class="display">{{ item?.label ?? 'Écran inconnu' }}</h1>
    <p class="muted">Cet écran n'a pas encore sa version « QG ». Il est disponible dans Dash4, avec les mêmes droits.</p>
    <a v-if="item" class="btn primary" :href="`${DASH4_WEB_URL}${item.webPath}`" target="_blank" rel="noopener">Ouvrir dans Dash4 ↗</a>
    <RouterLink class="btn" :to="{ name: 'hq' }">Retour au QG</RouterLink>
  </section>
</template>

<style scoped>
.soon {
  max-width: 560px;
  margin: 2rem auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 2rem;
  border-color: var(--accent);
}
.icon {
  font-size: 4rem;
  filter: drop-shadow(0 0 16px var(--accent));
}
.btn {
  text-decoration: none;
  min-width: 220px;
}
</style>
