import { describe, expect, it } from 'vitest'
import { NAV, navTarget, visibleNav } from '../src/navigation'

describe('navigation', () => {
  it('reprend les entrées et les permissions de dash4-web', () => {
    expect(NAV).toHaveLength(24)
    expect(visibleNav(() => false).map((n) => n.name)).toEqual(['messages'])
    expect(visibleNav((p) => p.includes('stock.view')).map((n) => n.name)).toEqual(['messages', 'inventory'])
    // Les exports demandent aussi les prix
    expect(visibleNav((p) => p.includes('exports.run')).map((n) => n.name)).not.toContain('exports')
    expect(visibleNav((p) => p.includes('exports.run') || p.includes('prices.view')).map((n) => n.name)).toContain('exports')
  })

  it('envoie vers l’écran refait ou vers la page d’attente', () => {
    expect(navTarget(NAV.find((n) => n.name === 'inventory')!)).toEqual({ name: 'inventory' })
    expect(navTarget(NAV.find((n) => n.name === 'quotes')!)).toEqual({ name: 'module', params: { screen: 'quotes' } })
  })
})
