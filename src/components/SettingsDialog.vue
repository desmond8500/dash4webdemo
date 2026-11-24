<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { session } from '@/services/session'

/** Réglages d'affichage : animations, contraste élevé, taille du texte, sons. Fenêtre accessible (dialog natif). */
const open = defineModel<boolean>('open', { required: true })
const dialog = ref<HTMLDialogElement | null>(null)

watch(open, async (v) => {
  await nextTick()
  if (v) dialog.value?.showModal()
  else dialog.value?.close()
})
</script>

<template>
  <dialog ref="dialog" class="panel settings" aria-labelledby="settings-title" @close="open = false">
    <h2 id="settings-title" class="display">Réglages</h2>
    <label class="row">
      <input v-model="session.settings.motion" type="checkbox" />
      <span><strong>Animations et effets</strong><br /><small class="muted">Coupées d'office si l'appareil demande moins de mouvement.</small></span>
    </label>
    <label class="row">
      <input v-model="session.settings.highContrast" type="checkbox" />
      <span><strong>Contraste élevé</strong><br /><small class="muted">Fond noir, textes et bordures blancs.</small></span>
    </label>
    <label class="row">
      <input v-model="session.settings.sound" type="checkbox" />
      <span><strong>Sons d'interface</strong><br /><small class="muted">Petits bips à la navigation.</small></span>
    </label>
    <label class="row column">
      <strong>Taille du texte : {{ Math.round(session.settings.textScale * 100) }} %</strong>
      <input v-model.number="session.settings.textScale" type="range" min="0.9" max="1.4" step="0.05" aria-label="Taille du texte" />
    </label>
    <form method="dialog"><button class="btn primary" type="submit">Fermer</button></form>
  </dialog>
</template>

<style scoped>
.settings {
  width: min(440px, 92vw);
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.settings:not([open]) {
  display: none;
}
.settings::backdrop {
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(3px);
}
.row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  cursor: pointer;
}
.row.column {
  flex-direction: column;
}
.row input[type='checkbox'] {
  width: 22px;
  height: 22px;
  margin-top: 0.15rem;
  accent-color: var(--cyan);
}
.row input[type='range'] {
  width: 100%;
  accent-color: var(--violet);
}
</style>
