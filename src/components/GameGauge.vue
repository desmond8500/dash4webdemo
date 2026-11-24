<script setup lang="ts">
import { computed } from 'vue'
import { gaugeTone } from '@/utils/game'

/** Jauge (barre de vie, d'expérience, d'avancement), lue par les lecteurs d'écran comme une barre de progression. */
const props = withDefaults(defineProps<{ value: number; label: string; tone?: 'auto' | 'xp' | 'danger' | 'warn' | 'ok'; showValue?: boolean; text?: string }>(), {
  tone: 'auto',
  showValue: true,
})
const pct = computed(() => Math.round(Math.min(1, Math.max(0, props.value)) * 100))
const toneClass = computed(() => (props.tone === 'auto' ? gaugeTone(props.value) : props.tone))
</script>

<template>
  <div class="gauge" :class="toneClass">
    <div class="head">
      <span class="label">{{ props.label }}</span>
      <span v-if="props.showValue" class="value">{{ props.text ?? `${pct} %` }}</span>
    </div>
    <div class="track" role="progressbar" :aria-label="props.label" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct" :aria-valuetext="props.text ?? `${pct} %`">
      <div class="fill" :style="{ width: `${pct}%` }" />
    </div>
  </div>
</template>

<style scoped>
.gauge {
  --c: var(--green);
}
.gauge.warn {
  --c: var(--gold);
}
.gauge.danger {
  --c: var(--red);
}
.gauge.xp {
  --c: var(--violet);
}
.head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}
.label {
  color: var(--muted);
}
.value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.track {
  height: 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.08);
}
.fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--c) 70%, #fff 0%), var(--c));
  box-shadow: 0 0 12px var(--c);
  transition: width calc(0.9s * var(--speed)) var(--ease);
  animation: grow calc(0.9s * var(--speed)) var(--ease) both;
}
@keyframes grow {
  from {
    width: 0;
  }
}
</style>
