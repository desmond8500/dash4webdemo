import { describe, expect, it } from 'vitest'
import { visibleNav } from '../src/navigation'

describe('navigation', () => {
  it('montre seulement les écrans que le compte peut lire', () => {
    expect(visibleNav(() => false).map((n) => n.name)).toEqual(['hq'])
    expect(visibleNav((p) => p.includes('stock.view')).map((n) => n.name)).toEqual(['hq', 'inventory'])
    expect(visibleNav(() => true)).toHaveLength(6)
  })
})
