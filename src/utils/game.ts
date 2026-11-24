import type { Article, Priority, Task, Tool, Vehicle } from '@dash4/shared'

/**
 * Règles « jeu » de la maquette, calculées à partir des vraies données de Dash4 (lecture seule) :
 * niveau et expérience, rareté des objets du stock, jauges. Rien n'est enregistré.
 */

export const XP_PER_TASK = 25
export const XP_PER_SUBTASK = 5

export interface PlayerLevel {
  level: number
  xp: number
  /** XP déjà gagnée dans le niveau en cours. */
  inLevel: number
  /** XP nécessaire pour passer le niveau en cours. */
  needed: number
  /** 0 à 1. */
  progress: number
  title: string
}

const TITLES = ['Recrue', 'Apprenti', 'Technicien', 'Expert', 'Chef d’équipe', 'Maître du terrain', 'Légende']

/** Niveau : il faut 100 XP pour le niveau 2, puis 100 de plus à chaque niveau (100, 200, 300…). */
export function playerLevel(xp: number): PlayerLevel {
  let level = 1
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= level * 100) {
    rest -= level * 100
    level++
  }
  const needed = level * 100
  return { level, xp: Math.max(0, Math.floor(xp)), inLevel: rest, needed, progress: rest / needed, title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))]! }
}

/** Expérience gagnée : tâches terminées et sous-tâches cochées. */
export function experience(doneTasks: number, doneSubtasks = 0): number {
  return doneTasks * XP_PER_TASK + doneSubtasks * XP_PER_SUBTASK
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'empty'

export const RARITY_LABELS: Record<Rarity, string> = {
  empty: 'Épuisé',
  common: 'En stock',
  rare: 'Stock bas',
  epic: 'Bien fourni',
  legendary: 'Réserve pleine',
}

/** « Rareté » d'un objet de l'inventaire, selon sa quantité par rapport à son seuil d'alerte. */
export function rarity(article: Pick<Article, 'quantity' | 'min_quantity' | 'is_low'>): Rarity {
  if (article.quantity <= 0) return 'empty'
  if (article.is_low) return 'rare'
  const min = article.min_quantity ?? 0
  if (min > 0 && article.quantity >= min * 4) return 'legendary'
  if (min > 0 && article.quantity >= min * 2) return 'epic'
  return 'common'
}

/** Couleur de quête selon la priorité de la tâche. */
export function questTier(priority: Priority): 'gold' | 'violet' | 'cyan' {
  return priority === 'high' ? 'gold' : priority === 'normal' ? 'violet' : 'cyan'
}

/** Avancement d'une quête (tâche) : sous-tâches cochées, ou 100 % une fois terminée. */
export function questProgress(task: Pick<Task, 'status' | 'subtasks_done' | 'subtasks_count'>): number {
  if (task.status.value === 'done') return 1
  if (!task.subtasks_count) return task.status.value === 'in_progress' ? 0.5 : 0
  return task.subtasks_done / task.subtasks_count
}

/** « Points de vie » d'un véhicule : 100 % sans alerte, moins 20 par alerte à prévoir et 40 par alerte dépassée. */
export function vehicleHealth(vehicle: Pick<Vehicle, 'alerts'>): number {
  const loss = (vehicle.alerts ?? []).reduce((sum, a) => sum + (a.state === 'expired' || a.state === 'late' ? 40 : 20), 0)
  return Math.max(0, 100 - loss) / 100
}

/** Couleur d'une jauge de 0 à 1. */
export function gaugeTone(value: number): 'danger' | 'warn' | 'ok' {
  return value < 0.34 ? 'danger' : value < 0.67 ? 'warn' : 'ok'
}

/** Salutation selon l'heure. */
export function greeting(date: Date = new Date()): string {
  const h = date.getHours()
  return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
}

/** Outils disponibles / prêtés / en retard, pour l'armurerie. */
export function armoryStats(tools: Array<Pick<Tool, 'status'>>): { available: number; lent: number; late: number; unavailable: number } {
  const count = (s: string) => tools.filter((t) => t.status.value === s).length
  return { available: count('available'), lent: count('lent') + count('late'), late: count('late'), unavailable: count('unavailable') }
}

/** Nombre lisible : « 1 250 », « 12,5 k », « 3,2 M ». */
export function compact(n: number): string {
  const abs = Math.abs(n)
  const f = (v: number, unit: string) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit}`
  if (abs >= 1_000_000) return f(n / 1_000_000, 'M')
  if (abs >= 10_000) return f(n / 1_000, 'k')
  return n.toLocaleString('fr-FR')
}
