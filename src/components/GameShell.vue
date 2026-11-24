<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isReadOnly } from '@dash4/shared'
import { logout, session, userCanAny } from '@/services/session'
import { loadPlayer, player } from '@/services/player'
import { navTarget, visibleNav, type NavItem } from '@/navigation'
import { blip } from '@/utils/sound'
import GameGauge from './GameGauge.vue'
import SettingsDialog from './SettingsDialog.vue'

/**
 * Cadre du jeu : barre latérale sur ordinateur, barre d'onglets en bas sur téléphone,
 * HUD du joueur (avatar, niveau, expérience), réglages d'accessibilité.
 */
const route = useRoute()
const router = useRouter()
const nav = computed(() => visibleNav(userCanAny))
/** Barre d'onglets du téléphone : les écrans principaux, puis « Menu » pour tout le reste. */
const tabs = computed(() => nav.value.filter((n) => n.tab))
const isCurrent = (item: NavItem) => (item.ready ? route.name === item.name : route.name === 'module' && route.params.screen === item.name)
const settingsOpen = ref(false)
const initials = computed(() => (session.user ? `${session.user.firstname[0] ?? ''}${session.user.lastname[0] ?? ''}`.toUpperCase() : ''))
onMounted(loadPlayer)

async function quit(): Promise<void> {
  await logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <a href="#main" class="skip-link">Aller au contenu</a>
  <div class="shell">
    <aside class="side panel" aria-label="Navigation principale">
      <div class="brand display"><span aria-hidden="true">◆</span> Dash4 <small>QG</small></div>
      <nav>
        <RouterLink
          v-for="item in nav"
          :key="item.name"
          :to="navTarget(item)"
          class="nav-link"
          :class="{ later: !item.ready }"
          :style="{ '--accent': item.accent }"
          :aria-current="isCurrent(item) ? 'page' : undefined"
          @click="blip('select')"
        >
          <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="nav-text">{{ item.label }}<small v-if="item.nickname" class="nick">{{ item.nickname }}</small></span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main-col">
      <header class="hud panel">
        <div class="avatar" aria-hidden="true">
          <img v-if="session.user?.avatar_url" :src="session.user.avatar_url" alt="" />
          <span v-else>{{ initials }}</span>
          <span class="lvl display">{{ player.level.level }}</span>
        </div>
        <div class="who">
          <strong>{{ session.user?.full_name }}</strong>
          <span class="muted small">{{ player.level.title }} · niveau {{ player.level.level }}</span>
          <GameGauge class="xp" :value="player.level.progress" label="Expérience" tone="xp" :text="`${player.level.inLevel} / ${player.level.needed} XP`" />
        </div>
        <span v-if="isReadOnly(session.user)" class="badge" style="--tone: var(--amber)">Lecture seule</span>
        <button type="button" class="btn icon-btn" aria-label="Réglages d'affichage et d'accessibilité" @click="(settingsOpen = true), blip('open')">⚙️</button>
        <button type="button" class="btn icon-btn" aria-label="Se déconnecter" @click="quit">⏻</button>
      </header>

      <main id="main" tabindex="-1">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in"><component :is="Component" /></Transition>
        </RouterView>
      </main>
    </div>

    <nav class="tabbar panel" aria-label="Navigation">
      <RouterLink
        v-for="item in tabs"
        :key="item.name"
        :to="navTarget(item)"
        class="tab"
        :style="{ '--accent': item.accent }"
        :aria-current="isCurrent(item) ? 'page' : undefined"
        @click="blip('select')"
      >
        <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="tab-label">{{ item.nickname ?? item.label }}</span>
      </RouterLink>
      <RouterLink :to="{ name: 'menu' }" class="tab" style="--accent: var(--info)" :aria-current="route.name === 'menu' ? 'page' : undefined" @click="blip('select')">
        <span class="nav-icon" aria-hidden="true">🧭</span>
        <span class="tab-label">Menu</span>
      </RouterLink>
    </nav>

    <SettingsDialog v-model:open="settingsOpen" />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1rem;
  padding: 1rem;
  min-height: 100vh;
}
.side {
  position: sticky;
  top: 1rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100vh - 2rem);
  min-height: calc(100vh - 2rem);
}
.brand {
  font-weight: 900;
  font-size: 1.3rem;
  color: var(--cyan);
  text-shadow: 0 0 14px rgb(52 211 153 / 0.7);
}
.brand small {
  color: var(--violet);
}
.side nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow-y: auto;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 48px;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  color: var(--text);
  text-decoration: none;
  font-weight: 700;
  border: 1px solid transparent;
  transition: background calc(0.2s * var(--speed)), transform calc(0.2s * var(--speed));
}
.nav-link:hover {
  background: rgb(255 255 255 / 0.06);
  transform: translateX(calc(3px * var(--speed)));
}
.nav-link[aria-current='page'] {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent);
}
.nav-icon {
  font-size: 1.4rem;
}
.nav-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.nick {
  font-size: 0.7rem;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.nav-link.later {
  color: var(--muted);
}

.main-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.hud {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: sticky;
  top: 1rem;
  z-index: 5;
}
.avatar {
  position: relative;
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary-soft), var(--primary-strong));
  color: #022c22;
  box-shadow: 0 0 18px rgb(52 211 153 / 0.55);
}
.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.lvl {
  position: absolute;
  bottom: -6px;
  right: -6px;
  min-width: 26px;
  height: 26px;
  padding: 0 0.3rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  background: var(--gold);
  color: #000;
  border: 2px solid var(--bg);
}
.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.xp {
  max-width: 360px;
  margin-top: 0.25rem;
}
.small {
  font-size: 0.8rem;
}
.icon-btn {
  width: 48px;
  padding: 0;
  font-size: 1.2rem;
}
main {
  outline: none;
  padding-bottom: 1rem;
}
.tabbar {
  display: none;
}

@media (max-width: 820px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 0.75rem 0.75rem calc(84px + env(safe-area-inset-bottom));
  }
  .side {
    display: none;
  }
  .hud {
    top: 0.5rem;
    padding: 0.6rem 0.8rem;
    gap: 0.6rem;
  }
  .hud .badge {
    display: none;
  }
  .avatar {
    width: 44px;
    height: 44px;
  }
  .tabbar {
    display: flex;
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    bottom: calc(0.5rem + env(safe-area-inset-bottom));
    z-index: 10;
    padding: 0.35rem;
    justify-content: space-around;
    border-radius: 20px;
  }
  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    min-height: 56px;
    justify-content: center;
    border-radius: 14px;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: 700;
  }
  .tab[aria-current='page'] {
    color: var(--text);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .tab[aria-current='page'] .nav-icon {
    transform: translateY(calc(-2px * var(--speed))) scale(1.15);
  }
  .tab .nav-icon {
    transition: transform calc(0.2s * var(--speed)) var(--ease);
  }
}
</style>
