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
    blurb: 'The answer everyone gives.',
    depth: 0.08,
    color: 'var(--tier-duck)',
  },
  legbye: {
    id: 'legbye',
    name: 'Leg Bye',
    score: 10,
    mark: 'L',
    blurb: 'A run nobody meant to score.',
    depth: 0.18,
    color: 'var(--tier-legbye)',
  },
  slog: {
    id: 'slog',
    name: 'Slog',
    score: 50,
    mark: 'S',
    blurb: 'A famously clever pick. Everyone swings at it.',
    depth: 0.36,
    color: 'var(--tier-slog)',
  },
  two: {
    id: 'two',
    name: 'Two',
    score: 100,
    mark: '2',
    blurb: 'Solid. Keeps the innings moving.',
    depth: 0.6,
    color: 'var(--tier-two)',
  },
  four: {
    id: 'four',
    name: 'Four',
    score: 200,
    mark: '4',
    blurb: 'Genuinely uncommon. Threaded the infield.',
    depth: 0.8,
    color: 'var(--tier-four)',
  },
  six: {
    id: 'six',
    name: 'Six',
    score: 500,
    mark: '6',
    blurb: 'The rare gem. One in a million.',
    depth: 0.97,
    color: 'var(--tier-six)',
  },
}

export const TIER_IDS = Object.keys(TIERS) as TierId[]
export const TIERS_BY_DEPTH = [...TIER_IDS]
  .map((id) => TIERS[id])
  .sort((a, b) => b.score - a.score)

export const ROUNDS_PER_DAY = 7
export const MAX_DAY_SCORE = 3500
export const ANSWER_MS = 20_000
export const MISS_MARK = '×'

export type Band = {
  min: number
  tier: TierId
  range: string
  verdict: string
}

export const SCORE_BANDS: Band[] = [
  { min: 0, tier: 'duck', range: '0–700', verdict: 'Duck. Back in the pavilion.' },
  { min: 701, tier: 'slog', range: '701–1400', verdict: 'Slog. Finding the range.' },
  { min: 1401, tier: 'four', range: '1401–2100', verdict: 'Four. Threaded the infield. Nice.' },
  { min: 2101, tier: 'six', range: '2101–3500', verdict: 'Six. Into the stands. Absurd.' },
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
