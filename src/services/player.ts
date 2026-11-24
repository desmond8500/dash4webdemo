import { reactive } from 'vue'
import { api } from './api'
import { session, userCanAny } from './session'
import { experience, playerLevel, type PlayerLevel } from '@/utils/game'

/** Expérience du joueur : ses tâches terminées dans Dash4 (lecture seule, rien n'est enregistré). */
export const player = reactive({
  loaded: false,
  doneTasks: 0,
  level: playerLevel(0) as PlayerLevel,
})

export async function loadPlayer(): Promise<void> {
  if (!session.user || !userCanAny(['tasks.view', 'tasks.view.own'])) return
  try {
    const page = await api.tasks.list({ assigned_to: 'me', status: 'done', per_page: 1 })
    player.doneTasks = page.meta.total
    player.level = playerLevel(experience(page.meta.total))
  } catch {
    // pas de tâches lisibles : niveau 1
  } finally {
    player.loaded = true
  }
}
