/**
 * Small synthesized sound effects. No audio files and no network: an
 * oscillator plus a short volume envelope is enough for arcade-style beeps.
 */
let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function blip(from: number, to: number, duration: number, type: OscillatorType, volume: number): void {
  if (muted) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Rejected answer: a short descending buzz. */
export function playWrong(): void {
  blip(200, 90, 0.22, 'square', 0.045)
}

/** An autocorrect is waiting for confirmation. */
export function playConfirm(): void {
  blip(620, 760, 0.09, 'sine', 0.03)
}

/** Accepted answer: brighter as the tier gets rarer. */
export function playCorrect(tier: string | null): void {
  const base = tier === 'six' ? 700 : tier === 'four' ? 610 : 520
  blip(base, base * 1.4, 0.16, 'triangle', 0.05)
}

export function setMuted(value: boolean): void {
  muted = value
}
