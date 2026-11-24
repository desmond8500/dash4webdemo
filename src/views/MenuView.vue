<script setup lang="ts">
import { computed } from 'vue'
import { navTarget, visibleNav } from '@/navigation'
import { userCanAny } from '@/services/session'
import { blip } from '@/utils/sound'

/** Menu complet (sur téléphone) : tous les écrans auxquels le compte a accès, en grandes tuiles. */
const items = computed(() => visibleNav(userCanAny))
</script>

<template>
  <section aria-labelledby="menu-title">
    <div class="page-title"><span class="icon" aria-hidden="true">🧭</span><h1 id="menu-title" class="display">Menu</h1></div>
    <ul class="tiles">
      <li v-for="(item, i) in items" :key="item.name" class="appear" :style="{ '--i': Math.min(i, 16) }">
        <RouterLink :to="navTarget(item)" class="tile panel entry" :style="{ '--accent': item.accent }" @click="blip('select')">
          <span class="emoji" aria-hidden="true">{{ item.icon }}</span>
          <span class="label">{{ item.nickname ?? item.label }}</span>
          <span v-if="item.nickname" class="sub muted">{{ item.label }}</span>
          <span v-if="!item.ready" class="sub muted">dans Dash4 ↗</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 130px;
  text-align: center;
  text-decoration: none;
  color: var(--text);
  border-top: 3px solid var(--accent);
}
.emoji {
  font-size: 2.4rem;
  filter: drop-shadow(0 0 10px var(--accent));
}
.label {
  font-weight: 800;
}
.sub {
  font-size: 0.75rem;
}
</style>
