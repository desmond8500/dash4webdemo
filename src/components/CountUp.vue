<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { session } from '@/services/session'
import { compact } from '@/utils/game'

/** Nombre qui défile jusqu'à sa valeur (affiché directement sans animation). */
const props = withDefaults(defineProps<{ value: number; duration?: number; format?: (n: number) => string }>(), { duration: 900 })
const shown = ref(0)
let frame = 0

function run(to: number): void {
  cancelAnimationFrame(frame)
  const reduce = !session.settings.motion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return void (shown.value = to)
  const from = shown.value
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    shown.value = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}
watch(() => props.value, run, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span class="count" :aria-label="(props.format ?? compact)(props.value)">
    <span aria-hidden="true">{{ (props.format ?? compact)(shown) }}</span>
  </span>
</template>

<style scoped>
.count {
  font-variant-numeric: tabular-nums;
}
</style>
