import { createHash } from 'node:crypto'
import { normalizeAnswer, variantsOf } from './normalize'
import { CURATED_PROMPTS } from '@/content/prompts'
import type { CuratedPrompt, SeedAnswer } from '@/content/prompts'
import { PLAYERS, TEAM_NAMES } from '@/content/players'
import type { Player, TeamId } from '@/content/players'
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
  slog: 2,
  two: 3,
  four: 4,
  six: 5,
}

const COUNTRY_ADJECTIVE: Record<string, string> = {
  India: 'Indian',
  Australia: 'Australian',
  England: 'English',
  'South Africa': 'South African',
  'West Indies': 'West Indian',
  'Sri Lanka': 'Sri Lankan',
  'New Zealand': 'New Zealand',
  Bangladesh: 'Bangladeshi',
}

function fameToTier(fame: Player['fame']): TierId {
  switch (fame) {
    case 5:
      return 'duck'
    case 4:
      return 'slog'
    case 3:
      return 'two'
    default:
      return 'four'
  }
}

function playerAliases(player: Player, pool: Player[]): string[] {
  const out = new Set<string>(player.aliases ?? [])
  const words = player.name.split(/\s+/)
  const first = words[0]
  const last = words[words.length - 1]

  const firstCount = pool.filter((p) => p.name.split(/\s+/)[0] === first).length
  if (first.length >= 3 && firstCount === 1) out.add(first)

  const lastCount = pool.filter((p) => p.name.split(/\s+/).slice(-1)[0] === last).length
  if (last.length >= 4 && lastCount === 1) out.add(last)

  return [...out]
}

function generatedPrompt(
  id: string,
  text: string,
  category: string,
  pool: Player[],
): BuiltPrompt | null {
  if (pool.length < 14) return null

  const gem =
    pool.find((p) => p.fame === 1 && p.note) ??
    pool.find((p) => p.fame === 1) ??
    [...pool].sort((a, b) => a.fame - b.fame)[0]

  const answers: BuiltAnswer[] = pool.map((player) => ({
    answer: player.name,
    tier: player === gem ? 'six' : fameToTier(player.fame),
    aliases: playerAliases(player, pool),
    ...(player === gem && player.note ? { quip: player.note } : {}),
  }))

  return { id, text, category, answers }
}

function byCountry(country: string): BuiltPrompt | null {
  const pool = PLAYERS.filter((p) => p.country === country)
  const adjective = COUNTRY_ADJECTIVE[country]
  if (!adjective) return null
  const article = /^[AEIOU]/.test(adjective) ? 'an' : 'a'
  return generatedPrompt(
    `country-${country.toLowerCase().replace(/\s+/g, '-')}`,
    `Name ${article} ${adjective} cricketer`,
    'players',
    pool,
  )
}

function byTeam(team: TeamId): BuiltPrompt | null {
  const pool = PLAYERS.filter((p) => p.teams.includes(team))
  return generatedPrompt(
    `team-${team.toLowerCase()}`,
    `Name a cricketer who has played for ${TEAM_NAMES[team]}`,
    'ipl',
    pool,
  )
}

const ROLE_PROMPTS: Array<{ id: string; text: string; test: (p: Player) => boolean }> = [
  { id: 'role-batter', text: 'Name a batter', test: (p) => p.role === 'batter' },
  { id: 'role-bowler', text: 'Name a bowler', test: (p) => p.role === 'bowler' },
  { id: 'role-allrounder', text: 'Name an all-rounder', test: (p) => p.role === 'allrounder' },
  { id: 'role-keeper', text: 'Name a wicketkeeper', test: (p) => p.role === 'keeper' },
  { id: 'role-legspin', text: 'Name a leg-spinner', test: (p) => p.style === 'leg spin' },
  { id: 'role-leftfast', text: 'Name a left-arm fast bowler', test: (p) => p.style === 'left-arm fast' },
  {
    id: 'role-lefthand',
    text: 'Name a left-handed batter',
    test: (p) => p.bat === 'left' && p.role !== 'bowler',
  },
]

const ACHIEVEMENT_PROMPTS: Array<{ id: string; text: string; test: (p: Player) => boolean }> = [
  { id: 'achievement-wc', text: 'Name a cricketer who has won the ODI World Cup', test: (p) => !!p.flags.wc },
  { id: 'achievement-ipl', text: 'Name a cricketer who has won the IPL', test: (p) => !!p.flags.ipl },
  {
    id: 'achievement-testcap',
    text: 'Name a cricketer who has captained a Test team',
    test: (p) => !!p.flags.testcap,
  },
  {
    id: 'achievement-ipl-player',
    text: 'Name a cricketer who has played in the IPL',
    test: (p) => p.teams.length > 0,
  },
]

const TEAM_PROMPTS: TeamId[] = ['MI', 'CSK', 'RCB', 'KKR', 'SRH', 'DC', 'RR', 'PBKS']

const COUNTRIES = [
  'India',
  'Australia',
  'England',
  'South Africa',
  'West Indies',
  'Sri Lanka',
  'New Zealand',
  'Bangladesh',
]

/**
 * Turns a prompt's answer list into a normalised, conflict-free bank.
 * Canonical answers win over aliases; a duplicate canonical with a higher
 * tier replaces the lower one so no answer is ever under-scored.
 */
function finaliseAnswers(
  promptId: string,
  entries: SeedAnswer[],
  warnings: string[],
): BuiltAnswer[] {
  const canonical = new Map<string, BuiltAnswer>()

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
          aliases: [...new Set([...existing.aliases, ...(entry.aliases ?? [])])],
          quip: entry.quip ?? existing.quip,
        })
      }
      continue
    }
    canonical.set(key, {
      answer: entry.answer,
      tier: entry.tier,
      aliases: [...(entry.aliases ?? [])],
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
  const gems = prompt.answers.filter((answer) => answer.tier === 'six')
  if (gems.length !== 1) {
    warnings.push(`${prompt.id}: expected exactly one six, found ${gems.length}`)
  } else if (!gems[0]?.quip) {
    warnings.push(`${prompt.id}: six has no quip`)
  }
  return {
    id: prompt.id,
    text: prompt.text,
    category: prompt.category,
    answers: prompt.answers.map((answer) => ({
      ...answer,
      aliases: answer.aliases ?? [],
    })),
  }
}

export function buildPromptBank(): {
  prompts: BuiltPrompt[]
  version: string
  warnings: string[]
} {
  const warnings: string[] = []
  const prompts: BuiltPrompt[] = []

  for (const curated of CURATED_PROMPTS) {
    prompts.push(curatedToBuilt(curated, warnings))
  }

  for (const country of COUNTRIES) {
    const built = byCountry(country)
    if (built) prompts.push(built)
  }

  for (const team of TEAM_PROMPTS) {
    const built = byTeam(team)
    if (built) prompts.push(built)
  }

  for (const role of ROLE_PROMPTS) {
    const built = generatedPrompt(role.id, role.text, 'players', PLAYERS.filter(role.test))
    if (built) prompts.push(built)
  }

  for (const achievement of ACHIEVEMENT_PROMPTS) {
    const built = generatedPrompt(
      achievement.id,
      achievement.text,
      'records',
      PLAYERS.filter(achievement.test),
    )
    if (built) prompts.push(built)
  }

  const seen = new Set<string>()
  const unique = prompts
    .map((prompt) => ({
      ...prompt,
      answers: finaliseAnswers(prompt.id, prompt.answers, warnings),
    }))
    .filter((prompt) => {
      if (seen.has(prompt.id)) {
        warnings.push(`duplicate prompt id ${prompt.id}`)
        return false
      }
      seen.add(prompt.id)
      return true
    })

  for (const prompt of unique) {
    const gem = prompt.answers.find((answer) => answer.tier === 'six')
    if (gem && !gem.quip) {
      warnings.push(`${prompt.id}: six "${gem.answer}" has no quip`)
    }
  }

  const version = createHash('sha256')
    .update(JSON.stringify(unique))
    .digest('hex')
    .slice(0, 16)

  return { prompts: unique, version, warnings }
}
