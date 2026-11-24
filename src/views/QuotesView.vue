<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { formatMoney, type Quote, type QuoteStatus } from '@dash4/shared'
import { api } from '@/services/api'
import { userCan } from '@/services/session'
import StatTile from '@/components/StatTile.vue'

/** Devis en « parchemins » : statut en couleur, montant (avec `prices.view`), taux de réussite de l'année. */
type Filter = 'open' | 'accepted' | 'all'
const filter = ref<Filter>('open')
const quotes = ref<Quote[]>([])
const yearQuotes = ref<Quote[]>([])
const loading = ref(true)
const search = ref('')
const seePrices = userCan('prices.view')
const year = new Date().getFullYear()

async function load(): Promise<void> {
  loading.value = true
  try {
    const status = filter.value === 'open' ? 'draft,sent' : filter.value === 'accepted' ? 'accepted' : undefined
    quotes.value = (await api.quotes.list({ status, search: search.value.trim() || undefined, per_page: 60 })).data
  } catch {
    quotes.value = []
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  void load()
  yearQuotes.value = (await api.quotes.list({ year, per_page: 500 }).catch(() => ({ data: [] as Quote[] }))).data
})
watch(filter, () => void load())
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => void load(), 300)
})

const COLORS: Record<QuoteStatus, string> = { draft: 'var(--muted)', sent: 'var(--info)', accepted: 'var(--primary)', refused: 'var(--red)', cancelled: 'var(--orange)' }
const ICONS: Record<QuoteStatus, string> = { draft: '✏️', sent: '📨', accepted: '🏆', refused: '💔', cancelled: '🚫' }
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'open', label: 'En jeu' },
  { value: 'accepted', label: 'Gagnés' },
  { value: 'all', label: 'Tous' },
]
const won = computed(() => yearQuotes.value.filter((q) => q.status.value === 'accepted'))
const decided = computed(() => yearQuotes.value.filter((q) => q.status.value === 'accepted' || q.status.value === 'refused').length)
const winRate = computed(() => (decided.value ? Math.round((won.value.length / decided.value) * 100) : 0))
const wonAmount = computed(() => won.value.reduce((s, q) => s + (q.total ?? 0), 0))
const money = (n: number) => formatMoney(n)
</script>

<template>
  <section aria-labelledby="quotes-title" style="--accent: var(--help)">
    <div class="page-title"><span class="icon" aria-hidden="true">📜</span><h1 id="quotes-title" class="display">Parchemins</h1><span class="muted">Devis</span></div>

    <div class="grid stats" style="--min: 200px">
      <StatTile icon="🏆" :label="`Gagnés en ${year}`" :value="won.length" accent="var(--primary)" />
      <StatTile icon="🎯" label="Taux de réussite" :value="winRate" accent="var(--help)" :format="(n) => `${n} %`" :hint="`${decided} devis décidés`" />
      <StatTile v-if="seePrices" icon="💰" label="Montant gagné" :value="wonAmount" accent="var(--amber)" :format="money" />
    </div>

    <div class="toolbar">
      <label class="sr-only" for="quotes-search">Rechercher un devis</label>
      <input id="quotes-search" v-model="search" class="input" type="search" placeholder="🔎 Numéro, titre, client…" />
      <div class="segments" role="radiogroup" aria-label="Devis affichés">
        <button v-for="f in FILTERS" :key="f.value" type="button" role="radio" class="btn seg" :aria-checked="filter === f.value" @click="filter = f.value">{{ f.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="!quotes.length" class="empty">Aucun devis ici.</p>
    <ul v-else class="grid list" style="--min: 280px">
      <li v-for="(q, i) in quotes" :key="q.id" class="scroll panel tile appear" :style="{ '--i': Math.min(i, 12), '--accent': COLORS[q.status.value] }">
        <div class="top">
          <span class="seal" aria-hidden="true">{{ ICONS[q.status.value] }}</span>
          <span class="number display">{{ q.number }}</span>
          <span class="badge" :style="{ '--tone': COLORS[q.status.value] }">{{ q.status.label }}</span>
        </div>
        <h2>{{ q.is_favorite ? '⭐ ' : '' }}{{ q.title }}</h2>
        <p class="muted">{{ q.client?.name }}<template v-if="q.project"> · {{ q.project.name }}</template></p>
        <div class="bottom">
          <span v-if="seePrices && q.total !== undefined" class="amount display">{{ money(q.total) }}</span>
          <span class="muted small">{{ new Date(q.issued_at).toLocaleDateString('fr-FR') }}<template v-if="q.valid_until"> → {{ new Date(q.valid_until).toLocaleDateString('fr-FR') }}</template></span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stats {
  margin-bottom: 1rem;
}
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
  background: linear-gradient(135deg, var(--help), var(--info));
  color: var(--bg);
  border-color: transparent;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.scroll {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 4px solid var(--accent);
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
    var(--panel);
}
.top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.seal {
  font-size: 1.6rem;
}
.number {
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--accent);
  flex: 1;
}
.scroll h2 {
  font-size: 1.02rem;
}
.scroll p {
  margin: 0;
  font-size: 0.85rem;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
}
.amount {
  font-weight: 900;
  font-size: 1.15rem;
  color: var(--amber);
}
.small {
  font-size: 0.8rem;
}
</style>
