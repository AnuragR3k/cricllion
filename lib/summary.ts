import { getSubmissions } from './db'
import type { RunRow } from './db'
import { bandFor } from './tiers'
import type { Band, TierId } from './tiers'

export type ResultItem = {
  promptId: string
  slot: number
  answer: string
  tier: TierId | null
  score: number
  quip: string | null
  miss: boolean
  matchType?: string | null
  autocorrected?: boolean
}

export type RunSummary = {
  runId: string
  date: string
  score: number
  results: ResultItem[]
  band: Band
  completedAt: number | null
}

export async function summariseRun(run: RunRow): Promise<RunSummary> {
  const submissions = await getSubmissions(run.runId)
  const results: ResultItem[] = submissions.map((submission) => ({
    promptId: `p${submission.slot}`,
    slot: submission.slot,
    answer: submission.answer ?? submission.rawAnswer,
    tier: submission.tier === 'miss' ? null : (submission.tier as TierId),
    score: submission.score,
    quip: submission.quip,
    miss: submission.tier === 'miss',
    matchType: submission.matchType ?? null,
    autocorrected: submission.matchType === 'fuzzy' || submission.matchType === 'alias',
  }))
  const score = results.reduce((total, result) => total + result.score, 0)
  return {
    runId: run.runId,
    date: run.date,
    score,
    results,
    band: bandFor(score),
    completedAt: run.completedAt,
  }
}
