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

function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Shuffle the bank and deal it into groups of seven. Each slot takes the
 * category with the largest share of its prompts still unserved, and a group
 * draws at most two from any one category, so seven questions stay mixed
 * instead of stacking one kind of question ("name a cricketer who played for X"
 * four times over). Every prompt is used exactly once per deck.
 */
function buildDeck(prompts: BuiltPrompt[], seed: number): BuiltPrompt[] {
  const groups = new Map<string, BuiltPrompt[]>()
  const totals = new Map<string, number>()
  for (const prompt of prompts) {
    const list = groups.get(prompt.category)
    if (list) list.push(prompt)
    else groups.set(prompt.category, [prompt])
  }
  for (const [key, list] of groups) {
    totals.set(key, list.length)
    groups.set(key, shuffled(list, seed + hashString(key)))
  }

  const cap = 2
  const deck: BuiltPrompt[] = []
  let used = new Map<string, number>()
  for (;;) {
    const live = [...groups.keys()].filter((key) => groups.get(key)!.length > 0)
    if (!live.length) break
    const fresh = live.filter((key) => (used.get(key) ?? 0) < cap)
    const pool = fresh.length ? fresh : live
    let best = pool[0]
    let bestShare = -1
    for (const key of pool) {
      const share = groups.get(key)!.length / totals.get(key)!
      if (share > bestShare) {
        bestShare = share
        best = key
      }
    }
    deck.push(groups.get(best)!.shift()!)
    used.set(best, (used.get(best) ?? 0) + 1)
    // Seven prompts to a group: start a fresh tally each boundary.
    if (deck.length % ROUNDS === 0) used = new Map()
  }
  return deck
}

/**
 * Draw a fresh set of prompts for a session. The bank is reshuffled with a new
 * random seed and a group of `count` mixed-category prompts is picked, so any
 * session can get any questions and two sessions in a row look different.
 */
export function drawPrompts(
  prompts: BuiltPrompt[],
  count: number = ROUNDS,
  rand: () => number = Math.random,
): BuiltPrompt[] {
  if (prompts.length < count) {
    throw new Error(`Need at least ${count} prompts, have ${prompts.length}`)
  }
  const seed = Math.floor(rand() * 0xffffffff) >>> 0
  const deck = buildDeck(prompts, seed)
  const groups = Math.max(1, Math.floor(deck.length / count))
  const start = Math.floor(rand() * groups) * count
  return deck.slice(start, start + count)
}
