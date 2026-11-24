import { createRouter, createWebHistory } from 'vue-router'
import { onUnauthorized } from '@/services/api'
import { isLoggedIn, restore, session, userCanAny } from '@/services/session'
import { NAV } from '@/navigation'

const permissionsOf = (name: string) => NAV.find((n) => n.name === name)?.permissions ?? []

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/connexion', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: 'Connexion' } },
    {
      path: '/',
      component: () => import('@/components/GameShell.vue'),
      children: [
        { path: '', name: 'hq', component: () => import('@/views/HqView.vue'), meta: { title: 'QG' } },
        { path: 'missions', name: 'missions', component: () => import('@/views/MissionsView.vue'), meta: { title: 'Missions' } },
        { path: 'chantiers', name: 'sites', component: () => import('@/views/SitesView.vue'), meta: { title: 'Chantiers' } },
        { path: 'inventaire', name: 'inventory', component: () => import('@/views/InventoryView.vue'), meta: { title: 'Inventaire' } },
        { path: 'armurerie', name: 'armory', component: () => import('@/views/ArmoryView.vue'), meta: { title: 'Armurerie' } },
        { path: 'garage', name: 'garage', component: () => import('@/views/GarageView.vue'), meta: { title: 'Garage' } },
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
  const needed = permissionsOf(String(to.name))
  return !needed.length || userCanAny(needed) ? true : { name: 'hq' }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'QG')} — Dash4 démo`
  // Les lecteurs d'écran annoncent la nouvelle page : on place le focus sur le contenu
  requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
})

onUnauthorized(() => {
  session.user = null
  void router.push({ name: 'login' })
})
