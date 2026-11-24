<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { JOURNAL_TYPES, type Journal, type JournalType } from '@dash4/shared'
import { api } from '@/services/api'
import { userCan } from '@/services/session'

/** Journaux d'intervention en « carnet de bord » : type en icône, photos comptées, résumé. */
type Filter = 'mine' | 'all'
const teamScope = userCan('journals.view')
const filter = ref<Filter>(teamScope ? 'all' : 'mine')
const journals = ref<Journal[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = false
  try {
    journals.value = (await api.journals.list({ mine: filter.value === 'mine', search: search.value.trim() || undefined, per_page: 60 })).data
  } catch {
    error.value = true
    journals.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(filter, () => void load())
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => void load(), 300)
})

const ICONS: Record<JournalType, string> = { intervention: '🛠️', installation: '🏗️', maintenance: '🔧', repair: '🚑', visit: '🧭', other: '📖' }
const TYPE_LABEL = (t: JournalType) => JOURNAL_TYPES.find((o) => o.value === t)?.label ?? t
const dateOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—')
</script>

<template>
  <section aria-labelledby="journals-title" style="--accent: var(--amber)">
    <div class="page-title"><span class="icon" aria-hidden="true">📖</span><h1 id="journals-title" class="display">Journaux</h1><span class="muted">Carnet de bord</span></div>

    <div class="toolbar">
      <label class="sr-only" for="journals-search">Rechercher un journal</label>
      <input id="journals-search" v-model="search" class="input" type="search" placeholder="🔎 Titre, client, projet…" />
      <div v-if="teamScope" class="segments" role="radiogroup" aria-label="Journaux affichés">
        <button type="button" role="radio" class="btn seg" :aria-checked="filter === 'all'" @click="filter = 'all'">Équipe</button>
        <button type="button" role="radio" class="btn seg" :aria-checked="filter === 'mine'" @click="filter = 'mine'">Les miens</button>
      </div>
    </div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="error" class="empty" role="alert">Les journaux n'ont pas pu être chargés.</p>
    <p v-else-if="!journals.length" class="empty">Aucun journal ici.</p>
    <ul v-else class="grid list" style="--min: 280px">
      <li v-for="(j, i) in journals" :key="j.id" class="log panel tile appear" :style="{ '--i': Math.min(i, 12) }">
        <div class="top">
          <span class="seal" aria-hidden="true">{{ ICONS[j.type.value] }}</span>
          <span class="badge" style="--tone: var(--amber)">{{ TYPE_LABEL(j.type.value) }}</span>
          <span v-if="j.photos_count" class="badge" style="--tone: var(--info)">📷 {{ j.photos_count }}</span>
        </div>
        <h2>{{ j.title }}</h2>
        <p class="muted">
          <span v-if="j.project">🏗️ {{ j.project.name }}</span>
          <span v-else-if="j.client">🏢 {{ j.client.name }}</span>
        </p>
        <p v-if="j.summary" class="summary">{{ j.summary }}</p>
        <div class="bottom">
          <span class="muted small">{{ dateOf(j.date) }}</span>
          <span v-if="j.participants?.length" class="muted small">👥 {{ j.participants.length }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1rem;
}
.toolbar .input {
  flex: 1;
  min-width: 220px;
}
.segments {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.seg[aria-checked='true'] {
  background: linear-gradient(135deg, var(--gold), var(--orange));
  color: #111;
  border-color: transparent;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.log {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 4px solid var(--amber);
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--amber) 12%, transparent), transparent 55%),
    var(--panel);
}
.top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.seal {
  font-size: 1.6rem;
}
.log h2 {
  font-size: 1.02rem;
}
.log p {
  margin: 0;
  font-size: 0.85rem;
}
.summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
}
.small {
  font-size: 0.8rem;
}
</style>
