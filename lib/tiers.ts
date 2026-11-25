export type TierId = 'duck' | 'legbye' | 'slog' | 'two' | 'four' | 'six'

export type Tier = {
  id: TierId
  name: string
  score: number
  mark: string
  blurb: string
  depth: number
  color: string
}

export const TIERS: Record<TierId, Tier> = {
  duck: {
    id: 'duck',
    name: 'Duck',
    score: 0,
    mark: 'D',
    blurb: 'Nobody gave an answer. Out first ball.',
    depth: 0.08,
    color: 'var(--tier-duck)',
  },
  legbye: {
    id: 'legbye',
    name: 'Leg Bye',
    score: 10,
    mark: 'L',
    blurb: 'A run nobody meant to score.',
    depth: 0.13,
    color: 'var(--tier-legbye)',
  },
  slog: {
    id: 'slog',
    name: 'Slog',
    score: 30,
    mark: 'S',
    blurb: 'A famously clever pick. Everyone swings at it.',
    depth: 0.18,
    color: 'var(--tier-slog)',
  },
  two: {
    id: 'two',
    name: 'Two',
    score: 60,
    mark: '2',
    blurb: 'Solid. Keeps the innings moving.',
    depth: 0.36,
    color: 'var(--tier-two)',
  },
  four: {
    id: 'four',
    name: 'Four',
    score: 85,
    mark: '4',
    blurb: 'Genuinely uncommon. Threaded the infield.',
    depth: 0.6,
    color: 'var(--tier-four)',
  },
  six: {
    id: 'six',
    name: 'Six',
    score: 100,
    mark: '6',
    blurb: 'The designated gem. One in a million.',
    depth: 0.97,
    color: 'var(--tier-six)',
  },
}

export const TIER_IDS = Object.keys(TIERS) as TierId[]
export const TIERS_BY_DEPTH = [...TIER_IDS]
  .map((id) => TIERS[id])
  .sort((a, b) => b.score - a.score)

export const ROUNDS_PER_DAY = 7
export const MAX_DAY_SCORE = 700
export const ANSWER_MS = 25_000
export const MISS_MARK = '×'

export type Band = {
  min: number
  tier: TierId
  range: string
  verdict: string
}

export const SCORE_BANDS: Band[] = [
  { min: 0, tier: 'duck', range: '0–150', verdict: 'Duck. Back in the pavilion.' },
  { min: 151, tier: 'two', range: '151–250', verdict: 'Two. Rotating the strike.' },
  { min: 251, tier: 'four', range: '251–350', verdict: 'Four. Threaded the infield. Nice.' },
  { min: 351, tier: 'six', range: '351–700', verdict: 'Six. Into the stands. Absurd.' },
]

export function bandFor(score: number): Band {
  return [...SCORE_BANDS].reverse().find((b) => score >= b.min) ?? SCORE_BANDS[0]
}

export function tierScore(tier: TierId): number {
  return TIERS[tier].score
}

export function isTierId(value: unknown): value is TierId {
  return typeof value === 'string' && value in TIERS
}
