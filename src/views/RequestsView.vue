<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ClientRequest, ClientRequestSummary, Priority } from '@dash4/shared'
import { api } from '@/services/api'
import StatTile from '@/components/StatTile.vue'

/** Demandes clients en « signaux entrants » : à traiter d'abord, en retard qui clignotent, source en icône. */
type Box = 'open' | 'mine' | 'done'
const box = ref<Box>('open')
const requests = ref<ClientRequest[]>([])
const summary = ref<ClientRequestSummary | null>(null)
const loading = ref(true)

async function load(): Promise<void> {
  loading.value = true
  try {
    const filters = box.value === 'done' ? { status: 'done,dismissed', per_page: 40 } : box.value === 'mine' ? { open: true, assigned: 'me' as const, per_page: 60 } : { open: true, per_page: 60 }
    requests.value = (await api.clientRequests.list(filters)).data
  } catch {
    requests.value = []
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  void load()
  summary.value = await api.clientRequests.summary().catch(() => null)
})
watch(box, () => void load())

const SOURCE_ICONS: Record<string, string> = { phone: '📞', whatsapp: '💬', email: '✉️', visit: '🚪', other: '📡' }
const PRIORITY_COLORS: Record<Priority, string> = { high: 'var(--red)', normal: 'var(--amber)', low: 'var(--info)' }
const BOXES: Array<{ value: Box; label: string }> = [
  { value: 'open', label: 'À traiter' },
  { value: 'mine', label: 'Confiées à moi' },
  { value: 'done', label: 'Traitées' },
]
const sorted = computed(() =>
  [...requests.value].sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue) || ['high', 'normal', 'low'].indexOf(a.priority.value) - ['high', 'normal', 'low'].indexOf(b.priority.value)),
)
const who = (r: ClientRequest) => r.client?.name ?? r.contact_name ?? 'Inconnu'
const ago = (iso: string | null) => {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`
}
</script>

<template>
  <section aria-labelledby="requests-title" style="--accent: var(--info)">
    <div class="page-title"><span class="icon" aria-hidden="true">📨</span><h1 id="requests-title" class="display">Signaux entrants</h1><span class="muted">Demandes clients</span></div>

    <div v-if="summary" class="grid stats" style="--min: 200px">
      <StatTile icon="📡" label="À traiter" :value="summary.open" accent="var(--info)" />
      <StatTile icon="🆕" label="Nouvelles" :value="summary.new" accent="var(--primary)" />
      <StatTile icon="⏰" label="En retard" :value="summary.overdue" accent="var(--red)" :hint="`plus de ${summary.overdue_days} jours sans réponse`" :alert="summary.overdue > 0" />
      <StatTile icon="🙋" label="Pour moi" :value="summary.mine" accent="var(--amber)" />
    </div>

    <div class="segments" role="radiogroup" aria-label="Demandes affichées">
      <button v-for="b in BOXES" :key="b.value" type="button" role="radio" class="btn seg" :aria-checked="box === b.value" @click="box = b.value">{{ b.label }}</button>
    </div>

    <div v-if="loading" class="feed"><div v-for="i in 5" :key="i" class="skeleton" style="min-height: 90px" /></div>
    <p v-else-if="!sorted.length" class="empty">{{ box === 'done' ? 'Aucune demande traitée.' : 'Aucun signal en attente. 📭' }}</p>
    <ul v-else class="feed">
      <li v-for="(r, i) in sorted" :key="r.id" class="signal panel tile appear" :class="{ late: r.is_overdue }" :style="{ '--i': Math.min(i, 12), '--accent': PRIORITY_COLORS[r.priority.value] }">
        <span class="source" :class="{ pulse: r.is_overdue }" :title="r.source.label" aria-hidden="true">{{ SOURCE_ICONS[r.source.value] ?? '📡' }}</span>
        <div class="body">
          <div class="top">
            <strong>{{ who(r) }}</strong>
            <span class="badge" :style="{ '--tone': PRIORITY_COLORS[r.priority.value] }">{{ r.priority.label }}</span>
            <span v-if="r.is_overdue" class="badge" style="--tone: var(--red)">En retard</span>
            <span class="badge" style="--tone: var(--muted)">{{ r.status.label }}</span>
          </div>
          <p class="text">{{ r.body }}</p>
          <p class="muted small">
            <span class="sr-only">Reçue par {{ r.source.label }}, </span>{{ ago(r.created_at) }}<template v-if="r.assignee"> · 🎧 {{ r.assignee.full_name }}</template><template v-if="r.contact_phone"> · {{ r.contact_phone }}</template>
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stats {
  margin-bottom: 1rem;
}
.segments {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.seg[aria-checked='true'] {
  background: linear-gradient(135deg, var(--info), var(--primary));
  color: var(--bg);
  border-color: transparent;
}
.feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.signal {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  border-left: 4px solid var(--accent);
}
.signal.late {
  border-color: var(--red);
}
.source {
  font-size: 1.8rem;
  width: 52px;
  height: 52px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  --tone: var(--red);
}
.body {
  min-width: 0;
  flex: 1;
}
.top {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  align-items: center;
}
.text {
  margin: 0.35rem 0;
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.small {
  font-size: 0.8rem;
  margin: 0;
}
</style>
