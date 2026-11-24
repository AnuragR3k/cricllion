import type { Band, TierId } from './tiers'

export type Prompt = { id: string; text: string }

export type Session = {
  runId: string
  date: string
  prompts: Prompt[]
}

export type ResultItem = {
  promptId: string
  slot: number
  answer: string
  tier: TierId | null
  score: number
  quip: string | null
  miss: boolean
  matchType?: 'exact' | 'alias' | 'fuzzy' | 'miss'
  autocorrected?: boolean
}

export type Summary = {
  runId: string
  date: string
  score: number
  results: ResultItem[]
  band: Band
  completedAt: number | null
}

export type RevealedAnswer = {
  answer: string
  tier: TierId
  score: number
  quip?: string
  aliases: string[]
  count?: number
}

export type RevealedPrompt = {
  id: string
  slot: number
  text: string
  answers: RevealedAnswer[]
}

export type Reveal = {
  prompts: RevealedPrompt[]
}
