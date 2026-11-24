import { describe, expect, it } from 'vitest'
import type { Article, Task, Vehicle } from '@dash4/shared'
import { armoryStats, compact, experience, gaugeTone, greeting, playerLevel, questProgress, questTier, rarity, vehicleHealth } from '../src/utils/game'

describe('règles du jeu', () => {
  it('calcule le niveau à partir de l’expérience', () => {
    expect(playerLevel(0)).toMatchObject({ level: 1, inLevel: 0, needed: 100, title: 'Recrue' })
    expect(playerLevel(99).level).toBe(1)
    expect(playerLevel(100)).toMatchObject({ level: 2, inLevel: 0, needed: 200 })
    expect(playerLevel(350)).toMatchObject({ level: 3, inLevel: 50, needed: 300 })
    expect(playerLevel(350).progress).toBeCloseTo(1 / 6)
    expect(experience(4, 3)).toBe(115)
  })

  it('donne une rareté aux objets du stock', () => {
    const a = (quantity: number, min: number | null, low = false) => ({ quantity, min_quantity: min, is_low: low }) as Pick<Article, 'quantity' | 'min_quantity' | 'is_low'>
    expect(rarity(a(0, 5))).toBe('empty')
    expect(rarity(a(3, 5, true))).toBe('rare')
    expect(rarity(a(8, 5))).toBe('common')
    expect(rarity(a(10, 5))).toBe('epic')
    expect(rarity(a(20, 5))).toBe('legendary')
    expect(rarity(a(50, null))).toBe('common')
  })

  it('mesure les quêtes, les véhicules et les jauges', () => {
    const t = (status: string, done: number, count: number) => ({ status: { value: status, label: '' }, subtasks_done: done, subtasks_count: count }) as unknown as Task
    expect(questProgress(t('done', 0, 0))).toBe(1)
    expect(questProgress(t('in_progress', 1, 4))).toBe(0.25)
    expect(questProgress(t('in_progress', 0, 0))).toBe(0.5)
    expect(questTier('high')).toBe('gold')
    const v = (states: string[]) => ({ alerts: states.map((state) => ({ kind: 'paper', state, label: '', date: null })) }) as unknown as Vehicle
    expect(vehicleHealth(v([]))).toBe(1)
    expect(vehicleHealth(v(['soon', 'expired']))).toBeCloseTo(0.4)
    expect(gaugeTone(0.2)).toBe('danger')
    expect(gaugeTone(0.9)).toBe('ok')
  })

  it('compte l’armurerie et formate les nombres', () => {
    const s = (v: string) => ({ status: { value: v, label: '' } }) as never
    expect(armoryStats([s('available'), s('lent'), s('late'), s('unavailable')])).toEqual({ available: 1, lent: 2, late: 1, unavailable: 1 })
    expect(compact(12_500)).toBe('12,5 k')
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Bonjour')
  })
})
