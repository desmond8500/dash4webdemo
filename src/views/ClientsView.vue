<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Client, ClientStatus } from '@dash4/shared'
import { api } from '@/services/api'

/** Clients en cartes d'alliés : logo, statut (prospect, actif, inactif), favoris en tête. */
const clients = ref<Client[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const search = ref('')
const status = ref<'all' | ClientStatus>('all')

async function load(reset = true): Promise<void> {
  if (reset) page.value = 1
  loading.value = true
  try {
    const res = await api.clients.list({
      search: search.value.trim() || undefined,
      status: status.value === 'all' ? undefined : status.value,
      sort: 'name',
      page: page.value,
      per_page: 48,
    })
    clients.value = reset ? res.data : [...clients.value, ...res.data]
    total.value = res.meta.total
  } catch {
    if (reset) clients.value = []
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => void load(), 300)
})
watch(status, () => void load())

const COLORS: Record<ClientStatus, string> = { prospect: 'var(--info)', active: 'var(--primary)', inactive: 'var(--muted)' }
const STATUSES: Array<{ value: 'all' | ClientStatus; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'prospect', label: 'Prospects' },
  { value: 'inactive', label: 'Inactifs' },
]
const sorted = computed(() => [...clients.value].sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite)))
const initials = (name: string) => name.split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
</script>

<template>
  <section aria-labelledby="clients-title" style="--accent: var(--info)">
    <div class="page-title"><span class="icon" aria-hidden="true">🏢</span><h1 id="clients-title" class="display">Alliés</h1><span class="muted">Clients · {{ total }}</span></div>

    <div class="toolbar">
      <label class="sr-only" for="clients-search">Rechercher un client</label>
      <input id="clients-search" v-model="search" class="input" type="search" placeholder="🔎 Nom du client…" />
      <div class="segments" role="radiogroup" aria-label="Statut des clients">
        <button v-for="s in STATUSES" :key="s.value" type="button" role="radio" class="btn seg" :aria-checked="status === s.value" @click="status = s.value">{{ s.label }}</button>
      </div>
    </div>

    <div v-if="loading && !clients.length" class="grid" style="--min: 240px"><div v-for="i in 8" :key="i" class="skeleton" /></div>
    <p v-else-if="!clients.length" class="empty">Aucun client ne correspond.</p>
    <ul v-else class="grid list" style="--min: 240px">
      <li v-for="(c, i) in sorted" :key="c.id" class="ally panel tile appear" :style="{ '--i': Math.min(i, 16), '--accent': COLORS[c.status.value] }">
        <span class="logo">
          <img v-if="c.logo_url" :src="c.logo_url" alt="" loading="lazy" />
          <span v-else class="display" aria-hidden="true">{{ initials(c.name) }}</span>
        </span>
        <div class="body">
          <h2>{{ c.is_favorite ? '⭐ ' : '' }}{{ c.name }}</h2>
          <p class="muted">{{ c.type.label }}<template v-if="c.contacts_count"> · {{ c.contacts_count }} contact{{ c.contacts_count > 1 ? 's' : '' }}</template></p>
          <span class="badge" :style="{ '--tone': COLORS[c.status.value] }">{{ c.status.label }}</span>
        </div>
      </li>
    </ul>
    <div v-if="clients.length < total" class="more"><button type="button" class="btn" :disabled="loading" @click="(page++, load(false))">Voir plus de clients</button></div>
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
  background: linear-gradient(135deg, var(--info), var(--primary));
  color: var(--bg);
  border-color: transparent;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ally {
  display: flex;
  gap: 0.9rem;
  align-items: center;
  border-left: 4px solid var(--accent);
}
.logo {
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-weight: 900;
  font-size: 1.2rem;
  color: var(--bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 70%, transparent), 0 0 16px color-mix(in srgb, var(--accent) 40%, transparent);
}
.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}
.body h2 {
  font-size: 1rem;
}
.body p {
  margin: 0;
  font-size: 0.85rem;
}
.more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
