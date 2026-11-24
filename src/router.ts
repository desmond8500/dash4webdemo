import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { onUnauthorized } from '@/services/api'
import { isLoggedIn, restore, session, userCanAny } from '@/services/session'
import { NAV } from '@/navigation'

/** Permissions d'un écran : celles de la même entrée du menu de dash4-web (le QG reste ouvert à tous). */
function permissionsOf(to: RouteLocationNormalized): { any: string[]; all: string[] } {
  const key = to.name === 'module' ? String(to.params.screen) : String(to.name)
  if (key === 'hq') return { any: [], all: [] }
  const item = NAV.find((n) => n.name === key)
  return { any: item?.permissions ?? [], all: item?.allOf ?? [] }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/connexion', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: 'Connexion' } },
    {
      path: '/',
      component: () => import('@/components/GameShell.vue'),
      children: [
        { path: '', name: 'hq', component: () => import('@/views/HqView.vue'), meta: { title: 'QG' } },
        { path: 'clients', name: 'clients', component: () => import('@/views/ClientsView.vue'), meta: { title: 'Alliés' } },
        { path: 'demandes', name: 'client-requests', component: () => import('@/views/RequestsView.vue'), meta: { title: 'Signaux entrants' } },
        { path: 'devis', name: 'quotes', component: () => import('@/views/QuotesView.vue'), meta: { title: 'Parchemins' } },
        { path: 'taches', name: 'missions', component: () => import('@/views/MissionsView.vue'), meta: { title: 'Missions' } },
        { path: 'planning', name: 'planning', component: () => import('@/views/PlanningView.vue'), meta: { title: 'Planning' } },
        { path: 'journaux', name: 'journals', component: () => import('@/views/JournalsView.vue'), meta: { title: 'Journaux' } },
        { path: 'factures', name: 'invoices', component: () => import('@/views/InvoicesView.vue'), meta: { title: 'Factures' } },
        { path: 'projets', name: 'sites', component: () => import('@/views/SitesView.vue'), meta: { title: 'Chantiers' } },
        { path: 'stock', name: 'inventory', component: () => import('@/views/InventoryView.vue'), meta: { title: 'Inventaire' } },
        { path: 'stock/outillage', name: 'armory', component: () => import('@/views/ArmoryView.vue'), meta: { title: 'Armurerie' } },
        { path: 'parc', name: 'garage', component: () => import('@/views/GarageView.vue'), meta: { title: 'Garage' } },
        { path: 'menu', name: 'menu', component: () => import('@/views/MenuView.vue'), meta: { title: 'Menu' } },
        { path: 'ecran/:screen', name: 'module', component: () => import('@/views/ComingSoonView.vue'), props: true, meta: { title: 'Bientôt' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'hq' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!session.ready) await restore()
  if (to.meta.public) return isLoggedIn.value && to.name === 'login' ? { name: 'hq' } : true
  if (!isLoggedIn.value) return { name: 'login', query: { retour: to.fullPath } }
  const needed = permissionsOf(to)
  const allowed = (!needed.any.length || userCanAny(needed.any)) && needed.all.every((p) => userCanAny([p]))
  return allowed ? true : { name: 'hq' }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'QG')} — Dash4 QG`
  // Les lecteurs d'écran annoncent la nouvelle page : on place le focus sur le contenu
  requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
})

onUnauthorized(() => {
  session.user = null
  void router.push({ name: 'login' })
})
