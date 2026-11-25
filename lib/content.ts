import { createHash } from 'node:crypto'
import { normalizeAnswer, variantsOf } from './normalize'
import { CURATED_PROMPTS } from '@/content/prompts'
import type { CuratedPrompt, SeedAnswer } from '@/content/prompts'
import bank from '@/content/bank-50.json'
import type { TierId } from './tiers'

export type BuiltAnswer = {
  answer: string
  tier: TierId
  aliases: string[]
  quip?: string
}

export type BuiltPrompt = {
  id: string
  text: string
  category: string
  answers: BuiltAnswer[]
}

const TIER_VALUE: Record<TierId, number> = {
  duck: 1,
  legbye: 2,
  slog: 3,
  two: 4,
  four: 5,
  six: 6,
}

/** Prompts whose answers are people — a first or last name can stand in. */
function isPersonPrompt(text: string): boolean {
  return /cricketer|player|captain|bowler|batter|wicketkeeper|all-rounder|coach|commentator|woman|women/i.test(
    text,
  )
}

/** Pull the first and last name out of a person's full name. */
function nameParts(answer: string): string[] {
  const words = answer.trim().split(/\s+/)
  if (words.length < 2 || words.length > 3) return []
  if (!words.every((word) => /^[A-Z]/.test(word))) return []
  return [words[0], words[words.length - 1]]
}

/**
 * Turns a prompt's answer list into a normalised, conflict-free bank.
 * Canonical answers win over aliases; a duplicate canonical with a higher
 * tier replaces the lower one so no answer is ever under-scored.
 */
function finaliseAnswers(
  promptId: string,
  entries: SeedAnswer[],
  warnings: string[],
  personNames = false,
): BuiltAnswer[] {
  const canonical = new Map<string, BuiltAnswer>()

  // A first or last name only stands in when it belongs to one answer here —
  // two "Shanes" would otherwise make the hint ambiguous.
  const partCounts = new Map<string, number>()
  if (personNames) {
    for (const entry of entries) {
      for (const part of nameParts(entry.answer)) {
        const key = normalizeAnswer(part)
        if (key.length >= 3) partCounts.set(key, (partCounts.get(key) ?? 0) + 1)
      }
    }
  }
  const nameAliases = (answer: string): string[] =>
    personNames
      ? nameParts(answer)
          .map(normalizeAnswer)
          .filter((key) => key.length >= 3 && partCounts.get(key) === 1)
      : []

  for (const entry of entries) {
    const key = normalizeAnswer(entry.answer)
    if (!key) continue
    const existing = canonical.get(key)
    if (existing) {
      warnings.push(`${promptId}: duplicate answer "${entry.answer}"`)
      if (TIER_VALUE[entry.tier] > TIER_VALUE[existing.tier]) {
        canonical.set(key, {
          answer: entry.answer,
          tier: entry.tier,
          aliases: [...new Set([...existing.aliases, ...(entry.aliases ?? []), ...nameAliases(entry.answer)])],
          quip: entry.quip ?? existing.quip,
        })
      }
      continue
    }
    canonical.set(key, {
      answer: entry.answer,
      tier: entry.tier,
      aliases: [...new Set([...(entry.aliases ?? []), ...nameAliases(entry.answer)])],
      quip: entry.quip,
    })
  }

  // Index every canonical key first so aliases cannot steal a real answer.
  const result = [...canonical.values()]
  const taken = new Set(canonical.keys())

  for (const answer of result) {
    const kept: string[] = []
    for (const alias of answer.aliases) {
      for (const variant of variantsOf(alias)) {
        if (!variant || taken.has(variant)) continue
        taken.add(variant)
        kept.push(variant)
      }
    }
    // Also index plural/definite-article variants of the canonical answer.
    for (const variant of variantsOf(answer.answer)) {
      if (variant !== normalizeAnswer(answer.answer) && !taken.has(variant)) {
        taken.add(variant)
        kept.push(variant)
      }
    }
    answer.aliases = [...new Set(kept)]
  }

  return result
}

function curatedToBuilt(prompt: CuratedPrompt, warnings: string[]): BuiltPrompt {
  return {
    id: prompt.id,
    text: prompt.text,
    category: prompt.category,
    answers: finaliseAnswers(prompt.id, prompt.answers, warnings, isPersonPrompt(prompt.text)),
  }
}

const TIER_BY_NUMBER: Record<number, TierId> = {
  1: 'duck',
  2: 'legbye',
  3: 'slog',
  4: 'two',
  5: 'four',
  6: 'six',
}

function jsonPrompts(): CuratedPrompt[] {
  return bank.map((item) => ({
    id: item.id,
    text: item.prompt,
    category: item.category,
    answers: item.answers.map((answer) => ({
      answer: answer.answer,
      tier: TIER_BY_NUMBER[answer.tier],
    })),
  }))
}

export function buildPromptBank(): {
  prompts: BuiltPrompt[]
  version: string
  warnings: string[]
} {
  const warnings: string[] = []
  const prompts = [...CURATED_PROMPTS, ...jsonPrompts()].map((prompt) =>
    curatedToBuilt(prompt, warnings),
  )

  const version = createHash('sha256')
    .update(JSON.stringify(prompts))
    .digest('hex')
    .slice(0, 16)

  return { prompts, version, warnings }
}
