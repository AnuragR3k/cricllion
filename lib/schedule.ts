import type { BuiltPrompt } from './content'

export const SEASON_START = '2026-11-24'
export const ROUNDS = 7

const IST = 'Asia/Kolkata'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's puzzle date in IST, as YYYY-MM-DD. */
export function puzzleDate(now: Date = new Date()): string {
  const parts = dateFormatter.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  if (!year || !month || !day) throw new Error('Could not resolve IST date')
  return `${year}-${month}-${day}`
}

export function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** Days are midnight-to-midnight IST; the reset is shown in UTC. */
export function resetsAt(date: string): string {
  const next = addDays(date, 1)
  return new Date(`${next}T00:00:00+05:30`).toISOString()
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + days))
  return next.toISOString().slice(0, 10)
}

export function dayNumberFor(date: string): number {
  const [y1, m1, d1] = SEASON_START.split('-').map(Number)
  const [y2, m2, d2] = date.split('-').map(Number)
  const start = Date.UTC(y1, m1 - 1, d1)
  const current = Date.UTC(y2, m2 - 1, d2)
  return Math.floor((current - start) / 86400000) + 1
}

/** Deterministic PRNG so every process shuffles the deck identically. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A deck walked seven prompts at a time, reshuffled every cycle. Within a cycle
 * no prompt repeats, and each cycle starts from a different order so a prompt
 * that sat out comes back in.
 */
export function promptsForDay(prompts: BuiltPrompt[], dayNumber: number): BuiltPrompt[] {
  if (prompts.length < ROUNDS) {
    throw new Error(`Need at least ${ROUNDS} prompts, have ${prompts.length}`)
  }
  const daysPerCycle = Math.max(1, Math.floor(prompts.length / ROUNDS))
  const cycle = Math.floor((Math.max(1, dayNumber) - 1) / daysPerCycle)
  const position = ((Math.max(1, dayNumber) - 1) % daysPerCycle) * ROUNDS
  const deck = shuffled(prompts, 0x5eed + cycle * 104729)
  const picked: BuiltPrompt[] = []
  for (let i = 0; i < ROUNDS; i++) {
    picked.push(deck[(position + i) % deck.length])
  }
  return picked
}
