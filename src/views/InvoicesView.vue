<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { formatMoney, type Invoice, type InvoiceStatus } from '@dash4/shared'
import { api } from '@/services/api'
import { userCan } from '@/services/session'
import StatTile from '@/components/StatTile.vue'

/** Factures en « coffres » : à encaisser, en retard, encaissé ce mois — montants réservés à `prices.view`/`invoices.view`. */
type Filter = 'unpaid' | 'overdue' | 'all'
const filter = ref<Filter>('unpaid')
const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const seePrices = userCan('prices.view')
const summary = ref<{ to_collect: number; unpaid_count: number; overdue_amount: number; overdue_count: number; collected_this_month: number; drafts: number } | null>(null)

async function load(): Promise<void> {
  loading.value = true
  error.value = false
  try {
    const filters = filter.value === 'overdue' ? { overdue: true, per_page: 60 } : filter.value === 'unpaid' ? { unpaid: true, per_page: 60 } : { per_page: 60 }
    invoices.value = (await api.invoices.list({ ...filters, search: search.value.trim() || undefined })).data
  } catch {
    error.value = true
    invoices.value = []
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  void load()
  summary.value = await api.invoices.summary().catch(() => null)
})
watch(filter, () => void load())
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => void load(), 300)
})

const COLORS: Record<InvoiceStatus, string> = { draft: 'var(--muted)', issued: 'var(--info)', partially_paid: 'var(--amber)', paid: 'var(--primary)', cancelled: 'var(--orange)' }
const ICONS: Record<InvoiceStatus, string> = { draft: '✏️', issued: '📨', partially_paid: '⏳', paid: '💎', cancelled: '🚫' }
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'unpaid', label: 'À encaisser' },
  { value: 'overdue', label: 'En retard' },
  { value: 'all', label: 'Toutes' },
]
const money = (n: number) => formatMoney(n)
const dateOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—')
</script>

<template>
  <section aria-labelledby="invoices-title" style="--accent: var(--help)">
    <div class="page-title"><span class="icon" aria-hidden="true">🧾</span><h1 id="invoices-title" class="display">Factures</h1><span class="muted">Coffres</span></div>

    <div v-if="seePrices && summary" class="grid stats" style="--min: 200px">
      <StatTile icon="💰" label="À encaisser" :value="summary.to_collect" accent="var(--amber)" :format="money" :hint="`${summary.unpaid_count} facture(s)`" />
      <StatTile icon="🔥" label="En retard" :value="summary.overdue_amount" accent="var(--red)" :format="money" :hint="`${summary.overdue_count} facture(s)`" :alert="summary.overdue_count > 0" />
      <StatTile icon="💎" label="Encaissé ce mois" :value="summary.collected_this_month" accent="var(--primary)" :format="money" />
    </div>

    <div class="toolbar">
      <label class="sr-only" for="invoices-search">Rechercher une facture</label>
      <input id="invoices-search" v-model="search" class="input" type="search" placeholder="🔎 Numéro, titre, client…" />
      <div class="segments" role="radiogroup" aria-label="Factures affichées">
        <button v-for="f in FILTERS" :key="f.value" type="button" role="radio" class="btn seg" :aria-checked="filter === f.value" @click="filter = f.value">{{ f.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="grid" style="--min: 280px"><div v-for="i in 6" :key="i" class="skeleton" /></div>
    <p v-else-if="error" class="empty" role="alert">Les factures n'ont pas pu être chargées.</p>
    <p v-else-if="!invoices.length" class="empty">Aucune facture ici.</p>
    <ul v-else class="grid list" style="--min: 280px">
      <li v-for="(inv, i) in invoices" :key="inv.id" class="chest panel tile appear" :style="{ '--i': Math.min(i, 12), '--accent': COLORS[inv.status.value] }">
        <div class="top">
          <span class="seal" aria-hidden="true">{{ ICONS[inv.status.value] }}</span>
          <span class="number display">{{ inv.number ?? '(brouillon)' }}</span>
          <span class="badge" :class="{ pulse: inv.is_overdue }" :style="{ '--tone': inv.is_overdue ? 'var(--red)' : COLORS[inv.status.value] }">{{ inv.is_overdue ? 'En retard' : inv.status.label }}</span>
        </div>
        <h2>{{ inv.title }}</h2>
        <p class="muted">{{ inv.client?.name }}<template v-if="inv.project"> · {{ inv.project.name }}</template></p>
        <div class="bottom">
          <span v-if="seePrices" class="amount display">{{ money(inv.remaining_amount) }}<span v-if="inv.remaining_amount !== inv.total" class="muted small"> / {{ money(inv.total) }}</span></span>
          <span class="muted small">{{ inv.due_at ? `Échéance ${dateOf(inv.due_at)}` : dateOf(inv.issued_at) }}</span>
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
.chest {
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
.chest h2 {
  font-size: 1.02rem;
}
.chest p {
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
