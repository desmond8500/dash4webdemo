<script setup lang="ts">
import CountUp from './CountUp.vue'

/** Tuile de statistique du QG : grande icône, nombre qui défile, libellé ; cliquable si `to`. */
const props = defineProps<{ icon: string; label: string; value: number; accent: string; hint?: string; to?: string; alert?: boolean; format?: (n: number) => string }>()
</script>

<template>
  <component
    :is="props.to ? 'RouterLink' : 'div'"
    :to="props.to"
    class="stat panel tile"
    :class="{ link: !!props.to }"
    :style="{ '--accent': props.accent, '--tone': props.accent }"
  >
    <span class="icon" aria-hidden="true">{{ props.icon }}</span>
    <span class="num display" :class="{ pulse: props.alert }"><CountUp :value="props.value" :format="props.format" /></span>
    <span class="label">{{ props.label }}</span>
    <span v-if="props.hint" class="hint muted">{{ props.hint }}</span>
  </component>
</template>

<style scoped>
.stat {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas: 'icon num' 'icon label' 'icon hint';
  align-items: center;
  column-gap: 1rem;
  color: inherit;
  text-decoration: none;
  min-height: 112px;
}
.icon {
  grid-area: icon;
  font-size: 2.4rem;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
}
.num {
  grid-area: num;
  font-size: 2rem;
  font-weight: 900;
  color: var(--accent);
  text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 60%, transparent);
  border-radius: 8px;
  justify-self: start;
  padding: 0 0.25rem;
}
.label {
  grid-area: label;
  font-weight: 700;
}
.hint {
  grid-area: hint;
  font-size: 0.8rem;
}
</style>
