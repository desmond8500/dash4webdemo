import { session } from '@/services/session'

/** Petits sons d'interface (bip de sélection, validation), produits sans fichier audio. Désactivés par défaut. */
let ctx: AudioContext | null = null

export function blip(kind: 'select' | 'open' | 'error' = 'select'): void {
  if (!session.settings.sound || typeof AudioContext === 'undefined') return
  try {
    ctx ??= new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const [from, to] = kind === 'open' ? [440, 880] : kind === 'error' ? [220, 140] : [660, 720]
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(from, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
  } catch {
    // son indisponible
  }
}
