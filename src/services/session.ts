import { computed, reactive, watch } from 'vue'
import { can, canAny, type CurrentUser } from '@dash4/shared'
import { api, tokenStorage } from './api'

/** Joueur connecté (compte Dash4) et réglages d'affichage de la maquette (gardés dans le navigateur). */

export interface DisplaySettings {
  /** Animations et effets (coupés d'office si l'appareil demande moins de mouvement). */
  motion: boolean
  highContrast: boolean
  /** 0,9 à 1,4. */
  textScale: number
  /** Petits sons d'interface. */
  sound: boolean
}

const SETTINGS_KEY = 'dash4demo.settings'
const defaults: DisplaySettings = { motion: true, highContrast: false, textScale: 1, sound: false }

function readSettings(): DisplaySettings {
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<DisplaySettings>) }
  } catch {
    return { ...defaults }
  }
}

export const session = reactive({
  user: null as CurrentUser | null,
  ready: false,
  settings: readSettings(),
})

export const isLoggedIn = computed(() => !!session.user)
export const userCan = (permission: string) => can(session.user, permission)
export const userCanAny = (permissions: string[]) => canAny(session.user, permissions)

/** Applique les réglages à la page : classes sur <html> et taille du texte. */
export function applySettings(s: DisplaySettings = session.settings): void {
  const root = document.documentElement
  root.classList.toggle('no-motion', !s.motion)
  root.classList.toggle('high-contrast', s.highContrast)
  root.style.setProperty('--text-scale', String(Math.min(1.4, Math.max(0.9, s.textScale))))
}

watch(
  () => ({ ...session.settings }),
  (s) => {
    applySettings(s)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
    } catch {
      // navigation privée : réglages pour la session
    }
  },
  { deep: true },
)

export async function restore(): Promise<void> {
  try {
    if (await tokenStorage.get()) session.user = await api.auth.me()
  } catch {
    await tokenStorage.set(null)
    session.user = null
  } finally {
    session.ready = true
  }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await api.auth.login({ email, password, device_name: 'Dash4 démo' })
  session.user = res.user
}

export async function logout(): Promise<void> {
  await api.auth.logout().catch(() => undefined)
  await tokenStorage.set(null)
  session.user = null
}
