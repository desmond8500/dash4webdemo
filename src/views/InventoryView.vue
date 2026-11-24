<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Article } from '@dash4/shared'
import { api } from '@/services/api'
import { RARITY_LABELS, rarity, type Rarity } from '@/utils/game'

/** Inventaire : les articles du stock en cases d'inventaire de jeu (photo, quantité, rareté selon le seuil). */
const items = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const search = ref('')
const onlyLow = ref(false)
const selected = ref<Article | null>(null)

async function load(reset = true): Promise<void> {
  if (reset) page.value = 1
  loading.value = true
  try {
    const res = await api.articles.list({ search: search.value.trim() || undefined, low: onlyLow.value, page: page.value, per_page: 48 })
    items.value = reset ? res.data : [...items.value, ...res.data]
    total.value = res.meta.total
  } catch {
    if (reset) items.value = []
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
watch(onlyLow, () => void load())

function more(): void {
  page.value++
  void load(false)
}

const RARITY_COLORS: Record<Rarity, string> = {
  empty: 'var(--red)',
  rare: 'var(--orange)',
  common: 'var(--cyan)',
  epic: 'var(--violet)',
  legendary: 'var(--gold)',
}
const RARITY_ORDER: Rarity[] = ['empty', 'rare', 'common', 'epic', 'legendary']
const qty = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
const detail = computed(() => selected.value)
</script>

<template>
  <section aria-labelledby="inv-title" style="--accent: var(--violet)">
    <div class="page-title"><span class="icon" aria-hidden="true">🎒</span><h1 id="inv-title" class="display">Inventaire</h1><span class="muted">{{ total }} objets</span></div>

    <div class="toolbar">
      <label class="sr-only" for="inv-search">Rechercher un objet</label>
      <input id="inv-search" v-model="search" class="input" type="search" placeholder="🔎 Désignation, référence, code-barres…" />
      <label class="toggle"><input v-model="onlyLow" type="checkbox" /> Stock bas seulement</label>
    </div>

    <div class="legend" aria-label="Légende des couleurs">
      <span v-for="r in RARITY_ORDER" :key="r" class="badge" :style="{ '--tone': RARITY_COLORS[r] }">{{ RARITY_LABELS[r] }}</span>
    </div>

    <div class="layout">
      <ul class="slots" role="list">
        <li v-for="(a, i) in items" :key="a.id" class="appear" :style="{ '--i': Math.min(i, 16) }">
          <button
            type="button"
            class="slot tile"
            :class="rarity(a)"
            :style="{ '--accent': RARITY_COLORS[rarity(a)] }"
            :aria-pressed="selected?.id === a.id"
            :aria-label="`${a.designation}, ${qty(a.quantity)} ${a.unit ?? ''}, ${RARITY_LABELS[rarity(a)]}`"
            @click="selected = a"
          >
            <img v-if="a.image_url" :src="a.image_url" alt="" loading="lazy" />
            <span v-else class="placeholder" aria-hidden="true">📦</span>
            <span class="qty display">{{ qty(a.quantity) }}</span>
            <span class="name">{{ a.designation }}</span>
          </button>
        </li>
      </ul>

      <aside v-if="detail" class="panel card appear" :style="{ '--accent': RARITY_COLORS[rarity(detail)] }" aria-live="polite">
        <div class="big">
          <img v-if="detail.image_url" :src="detail.image_url" :alt="detail.designation" />
          <span v-else aria-hidden="true">📦</span>
        </div>
        <span class="badge" :style="{ '--tone': RARITY_COLORS[rarity(detail)] }">{{ RARITY_LABELS[rarity(detail)] }}</span>
        <h2>{{ detail.designation }}</h2>
        <p class="muted">{{ [detail.reference, detail.brand?.name, detail.category.label].filter(Boolean).join(' · ') }}</p>
        <dl>
          <dt>Quantité</dt><dd class="display">{{ qty(detail.quantity) }} {{ detail.unit ?? '' }}</dd>
          <template v-if="detail.min_quantity !== null"><dt>Seuil d'alerte</dt><dd>{{ qty(detail.min_quantity) }}</dd></template>
          <template v-if="detail.location"><dt>Rangé à</dt><dd>{{ detail.location }}</dd></template>
        </dl>
        <button type="button" class="btn" @click="selected = null">Fermer</button>
      </aside>
    </div>

    <div v-if="loading && !items.length" class="slots"><div v-for="i in 12" :key="i" class="skeleton" style="min-height: 150px" /></div>
    <p v-else-if="!loading && !items.length" class="empty">Aucun objet ne correspond.</p>
    <div v-if="items.length < total" class="more"><button type="button" class="btn" :disabled="loading" @click="more">Voir plus d'objets</button></div>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.toolbar .input {
  flex: 1;
  min-width: 220px;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-weight: 700;
}
.toggle input {
  width: 20px;
  height: 20px;
  accent-color: var(--violet);
}
.legend {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.layout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: start;
}
.slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}
.slot {
  width: 100%;
  aspect-ratio: 1 / 1.15;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  background:
    radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    var(--panel-solid);
  color: var(--text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
  gap: 0.3rem;
  font: inherit;
}
.slot.legendary {
  animation: shine calc(3s * var(--speed)) ease-in-out infinite;
}
@keyframes shine {
  50% {
    box-shadow: 0 0 22px color-mix(in srgb, var(--gold) 55%, transparent);
  }
}
.slot.empty img,
.slot.empty .placeholder {
  filter: grayscale(1);
  opacity: 0.55;
}
.slot[aria-pressed='true'] {
  outline: 3px solid var(--accent);
}
.slot img {
  width: 70%;
  height: 55%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.5));
  border-radius: 8px;
  background: #fff;
}
.placeholder {
  font-size: 2.4rem;
}
.qty {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  font-weight: 900;
  font-size: 0.85rem;
  color: var(--accent);
  text-shadow: 0 0 8px var(--accent);
}
.name {
  font-size: 0.78rem;
  line-height: 1.2;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card {
  width: 300px;
  position: sticky;
  top: 7rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-color: var(--accent);
}
.big {
  height: 180px;
  display: grid;
  place-items: center;
  font-size: 4rem;
  background: #fff;
  border-radius: 12px;
}
.big img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 1rem;
  margin: 0;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
  font-weight: 700;
}
.more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
@media (max-width: 820px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .card {
    position: fixed;
    left: 0.75rem;
    right: 0.75rem;
    bottom: calc(84px + env(safe-area-inset-bottom));
    width: auto;
    z-index: 8;
    max-height: 60vh;
    overflow: auto;
  }
  .slots {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
