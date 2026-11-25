import { buildPromptBank } from './content'
import type { BuiltPrompt } from './content'
import { answerSimilarity, FUZZY_THRESHOLD, normalizeAnswer } from './normalize'
import { createStore } from './store'
import type { Store } from './store'
import { TIERS, tierScore } from './tiers'
import type { TierId } from './tiers'

export type AnswerRow = {
  id: number
  answer: string
  tier: TierId
  quip: string | null
}

export type MatchType = 'exact' | 'alias' | 'fuzzy'

export type MatchedAnswer = AnswerRow & { score: number; matchType: MatchType }

export type RunPrompt = { id: string; slot: number; text: string }

export type RunRow = {
  runId: string
  date: string
  playerId: string
  startedAt: number
  completedAt: number | null
  score: number
  dayNumber: number
}

export type SubmissionRow = {
  receipt: string
  runId: string
  date: string
  promptId: string
  slot: number
  rawAnswer: string
  answer: string | null
  tier: string
  score: number
  quip: string | null
  matchType: string | null
  createdAt: number
}

type Db = {
  store: Store
  bank: BuiltPrompt[]
  bankById: Map<string, BuiltPrompt>
  keyCache: Map<string, Map<string, { row: AnswerRow; canonical: boolean }>>
}

const globalForDb = globalThis as unknown as { __cricllionDb?: Promise<Db> }

async function createDb(): Promise<Db> {
  const store = await createStore()

  const { prompts, version, warnings } = buildPromptBank()
  for (const warning of warnings) console.warn('[content]', warning)

  const current = await store.one<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    'content_version',
  )

  if (!current || current.value !== version) {
    await store.transaction(async (tx) => {
      await tx.exec('DELETE FROM answer_keys; DELETE FROM answers; DELETE FROM prompts; DELETE FROM popularity;')
      for (const prompt of prompts) {
        await tx.run('INSERT INTO prompts (id, text, category) VALUES (?, ?, ?)', prompt.id, prompt.text, prompt.category)
        for (const answer of prompt.answers) {
          const answerId = await tx.insertId(
            'INSERT INTO answers (prompt_id, answer, tier, quip) VALUES (?, ?, ?, ?)',
            prompt.id,
            answer.answer,
            answer.tier,
            answer.quip ?? null,
          )
          for (const key of new Set([normalizeAnswer(answer.answer), ...answer.aliases])) {
            if (!key) continue
            await tx.run('INSERT INTO answer_keys (prompt_id, key, answer_id) VALUES (?, ?, ?)', prompt.id, key, answerId)
          }
        }
      }
      await tx.run(
        'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        'content_version',
        version,
      )
    })
    console.log(`[content] seeded ${prompts.length} prompts (version ${version})`)
  }

  return {
    store,
    bank: prompts,
    bankById: new Map(prompts.map((p) => [p.id, p])),
    keyCache: new Map(),
  }
}

export async function getDb(): Promise<Db> {
  if (!globalForDb.__cricllionDb) globalForDb.__cricllionDb = createDb()
  return globalForDb.__cricllionDb
}

export async function getBank(): Promise<BuiltPrompt[]> {
  return (await getDb()).bank
}

export async function getBankVersion(): Promise<string> {
  const db = await getDb()
  const row = await db.store.one<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    'content_version',
  )
  return row?.value ?? 'unknown'
}

/** The seven prompts a session was dealt, in order. */
export async function getRunPrompts(runId: string): Promise<RunPrompt[]> {
  const db = await getDb()
  const rows = await db.store.query<{ prompt_id: string; slot: number; text: string }>(
    'SELECT prompt_id, slot, text FROM run_prompts WHERE run_id = ? ORDER BY slot',
    runId,
  )
  return rows.map((row) => ({ id: row.prompt_id, slot: Number(row.slot), text: row.text }))
}

async function promptIndex(promptId: string): Promise<Map<string, { row: AnswerRow; canonical: boolean }>> {
  const db = await getDb()
  const cached = db.keyCache.get(promptId)
  if (cached) return cached
  const rows = await db.store.query<{
    key: string
    id: number
    answer: string
    tier: string
    quip: string | null
  }>(
    `SELECT k.key AS key, a.id AS id, a.answer AS answer, a.tier AS tier, a.quip AS quip
     FROM answer_keys k JOIN answers a ON a.id = k.answer_id
     WHERE k.prompt_id = ?`,
    promptId,
  )

  const index = new Map<string, { row: AnswerRow; canonical: boolean }>()
  for (const row of rows) {
    index.set(row.key, {
      row: {
        id: Number(row.id),
        answer: row.answer,
        tier: row.tier as TierId,
        quip: row.quip,
      },
      canonical: normalizeAnswer(row.answer) === row.key,
    })
  }
  db.keyCache.set(promptId, index)
  return index
}

export async function matchAnswer(promptId: string, raw: string): Promise<MatchedAnswer | null> {
  const key = normalizeAnswer(raw)
  if (!key) return null
  const index = await promptIndex(promptId)
  const entry = index.get(key)
  if (entry) {
    return {
      ...entry.row,
      score: tierScore(entry.row.tier),
      matchType: entry.canonical ? 'exact' : 'alias',
    }
  }

  const candidates: Array<{ similarity: number; key: string; row: AnswerRow }> = []
  for (const [candidateKey, value] of index) {
    if (candidateKey[0] !== key[0]) continue
    const shorter = Math.min(key.length, candidateKey.length)
    const longer = Math.max(key.length, candidateKey.length)
    if (shorter / longer < FUZZY_THRESHOLD) continue
    const similarity = answerSimilarity(key, candidateKey)
    if (similarity >= FUZZY_THRESHOLD) {
      candidates.push({ similarity, key: candidateKey, row: value.row })
    }
  }
  if (!candidates.length) return null

  candidates.sort((a, b) => b.similarity - a.similarity || b.key.length - a.key.length)
  const best = candidates[0]
  const ambiguous = candidates.some(
    (candidate) => candidate.similarity === best.similarity && candidate.row.id !== best.row.id,
  )
  if (ambiguous) return null
  return { ...best.row, score: tierScore(best.row.tier), matchType: 'fuzzy' }
}

export async function createRun(
  runId: string,
  date: string,
  playerId: string,
  prompts: Array<{ id: string; text: string }>,
): Promise<RunRow> {
  const db = await getDb()
  await db.store.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO runs (run_id, date, player_id, day_number, started_at, completed_at, score)
       VALUES (?, ?, ?, ?, ?, NULL, 0) ON CONFLICT (run_id) DO NOTHING`,
      runId,
      date,
      playerId,
      1,
      Date.now(),
    )
    for (let index = 0; index < prompts.length; index++) {
      const prompt = prompts[index]
      await tx.run(
        `INSERT INTO run_prompts (run_id, slot, prompt_id, text) VALUES (?, ?, ?, ?)
         ON CONFLICT (run_id, slot) DO NOTHING`,
        runId,
        index + 1,
        prompt.id,
        prompt.text,
      )
    }
  })
  const run = await getRun(runId)
  if (!run) throw new Error('Run could not be created')
  return run
}

export async function getRun(runId: string): Promise<RunRow | null> {
  const db = await getDb()
  const row = await db.store.one<{
    run_id: string
    date: string
    player_id: string
    day_number: number
    started_at: number
    completed_at: number | null
    score: number
  }>('SELECT * FROM runs WHERE run_id = ?', runId)
  if (!row) return null
  return {
    runId: row.run_id,
    date: row.date,
    playerId: row.player_id,
    dayNumber: Number(row.day_number),
    startedAt: Number(row.started_at),
    completedAt: row.completed_at == null ? null : Number(row.completed_at),
    score: Number(row.score),
  }
}

export async function getSubmissions(runId: string): Promise<SubmissionRow[]> {
  const db = await getDb()
  const rows = await db.store.query<{
    receipt: string
    run_id: string
    date: string
    prompt_id: string
    slot: number
    raw_answer: string
    answer: string | null
    tier: string
    score: number
    quip: string | null
    match_type: string | null
    created_at: number
  }>('SELECT * FROM submissions WHERE run_id = ? ORDER BY slot', runId)
  return rows.map((row) => ({
    receipt: row.receipt,
    runId: row.run_id,
    date: row.date,
    promptId: row.prompt_id,
    slot: Number(row.slot),
    rawAnswer: row.raw_answer,
    answer: row.answer,
    tier: row.tier,
    score: Number(row.score),
    quip: row.quip,
    matchType: row.match_type,
    createdAt: Number(row.created_at),
  }))
}

export async function recordSubmission(params: {
  receipt: string
  runId: string
  date: string
  promptId: string
  slot: number
  rawAnswer: string
  matched: AnswerRow | null
  tier: string
  score: number
  matchType: string | null
}): Promise<SubmissionRow> {
  const db = await getDb()
  const createdAt = Date.now()
  await db.store.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO submissions
        (receipt, run_id, date, prompt_id, slot, raw_answer, answer, tier, score, quip, match_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params.receipt,
      params.runId,
      params.date,
      params.promptId,
      params.slot,
      params.rawAnswer,
      params.matched?.answer ?? null,
      params.tier,
      params.score,
      params.matched?.quip ?? null,
      params.matchType,
      createdAt,
    )
    await tx.run('UPDATE runs SET score = score + ? WHERE run_id = ?', params.score, params.runId)
    if (params.matched) {
      await tx.run(
        `INSERT INTO popularity (date, prompt_id, answer_id, count) VALUES (?, ?, ?, 1)
         ON CONFLICT(date, prompt_id, answer_id) DO UPDATE SET count = count + 1`,
        params.date,
        params.promptId,
        params.matched.id,
      )
    }
  })

  return {
    receipt: params.receipt,
    runId: params.runId,
    date: params.date,
    promptId: params.promptId,
    slot: params.slot,
    rawAnswer: params.rawAnswer,
    answer: params.matched?.answer ?? null,
    tier: params.tier,
    score: params.score,
    quip: params.matched?.quip ?? null,
    matchType: params.matchType,
    createdAt,
  }
}

export async function completeRun(runId: string): Promise<RunRow | null> {
  const db = await getDb()
  await db.store.run(
    'UPDATE runs SET completed_at = ? WHERE run_id = ? AND completed_at IS NULL',
    Date.now(),
    runId,
  )
  return getRun(runId)
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

export async function revealRun(runId: string): Promise<{ prompts: RevealedPrompt[] }> {
  const db = await getDb()
  const runPrompts = await getRunPrompts(runId)
  const prompts: RevealedPrompt[] = []
  for (const prompt of runPrompts) {
    const rows = await db.store.query<{ answer: string; tier: TierId; quip: string | null }>(
      'SELECT a.answer AS answer, a.tier AS tier, a.quip AS quip FROM answers a WHERE a.prompt_id = ?',
      prompt.id,
    )
    prompts.push({
      id: prompt.id,
      slot: prompt.slot,
      text: prompt.text,
      answers: rows
        .map((row) => ({
          answer: row.answer,
          tier: TIERS[row.tier] ? row.tier : ('duck' as TierId),
          score: tierScore(TIERS[row.tier] ? row.tier : 'duck'),
          ...(row.quip ? { quip: row.quip } : {}),
          aliases: [],
        }))
        .sort((a, b) => b.score - a.score || a.answer.localeCompare(b.answer)),
    })
  }
  return { prompts }
}
