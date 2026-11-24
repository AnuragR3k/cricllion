import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { buildPromptBank } from './content'
import type { BuiltPrompt } from './content'
import { editDistance, fuzzyBudget, normalizeAnswer } from './normalize'
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
  sqlite: DatabaseSync
  bank: BuiltPrompt[]
  bankById: Map<string, BuiltPrompt>
  keyCache: Map<string, Map<string, { row: AnswerRow; canonical: boolean }>>
}

const globalForDb = globalThis as unknown as { __deepMidwicket?: Db }

function createDb(): Db {
  const dir = path.join(process.cwd(), '.data')
  fs.mkdirSync(dir, { recursive: true })
  const sqlite = new DatabaseSync(path.join(dir, 'cricllion.db'))
  sqlite.exec('PRAGMA journal_mode = WAL;')
  sqlite.exec('PRAGMA foreign_keys = ON;')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      category TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      tier TEXT NOT NULL,
      quip TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_answers_prompt ON answers(prompt_id);
    CREATE TABLE IF NOT EXISTS answer_keys (
      prompt_id TEXT NOT NULL,
      key TEXT NOT NULL,
      answer_id INTEGER NOT NULL,
      PRIMARY KEY (prompt_id, key)
    );
    CREATE TABLE IF NOT EXISTS run_prompts (
      run_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      prompt_id TEXT NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (run_id, slot)
    );
    CREATE INDEX IF NOT EXISTS idx_run_prompts_run ON run_prompts(run_id);
    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      player_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      score INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_runs_player_date ON runs(player_id, date);
    CREATE TABLE IF NOT EXISTS submissions (
      receipt TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      date TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      raw_answer TEXT NOT NULL,
      answer TEXT,
      tier TEXT NOT NULL,
      score INTEGER NOT NULL,
      quip TEXT,
      match_type TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE (run_id, slot)
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_run ON submissions(run_id);
    CREATE TABLE IF NOT EXISTS popularity (
      date TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      answer_id INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, prompt_id, answer_id)
    );
  `)

  const { prompts, version, warnings } = buildPromptBank()
  for (const warning of warnings) console.warn('[content]', warning)

  const current = sqlite.prepare('SELECT value FROM meta WHERE key = ?').get('content_version') as
    | { value: string }
    | undefined

  if (!current || current.value !== version) {
    sqlite.exec('BEGIN')
    try {
      sqlite.exec('DELETE FROM answer_keys; DELETE FROM answers; DELETE FROM prompts; DELETE FROM popularity;')
      const insertPrompt = sqlite.prepare('INSERT INTO prompts (id, text, category) VALUES (?, ?, ?)')
      const insertAnswer = sqlite.prepare(
        'INSERT INTO answers (prompt_id, answer, tier, quip) VALUES (?, ?, ?, ?)',
      )
      const insertKey = sqlite.prepare(
        'INSERT INTO answer_keys (prompt_id, key, answer_id) VALUES (?, ?, ?)',
      )
      for (const prompt of prompts) {
        insertPrompt.run(prompt.id, prompt.text, prompt.category)
        for (const answer of prompt.answers) {
          const result = insertAnswer.run(
            prompt.id,
            answer.answer,
            answer.tier,
            answer.quip ?? null,
          )
          const answerId = Number(result.lastInsertRowid)
          for (const key of new Set([
            normalizeAnswer(answer.answer),
            ...answer.aliases,
          ])) {
            if (!key) continue
            insertKey.run(prompt.id, key, answerId)
          }
        }
      }
      sqlite
        .prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .run('content_version', version)
      sqlite.exec('COMMIT')
      console.log(`[content] seeded ${prompts.length} prompts (version ${version})`)
    } catch (error) {
      sqlite.exec('ROLLBACK')
      throw error
    }
  }

  return {
    sqlite,
    bank: prompts,
    bankById: new Map(prompts.map((p) => [p.id, p])),
    keyCache: new Map(),
  }
}

export function getDb(): Db {
  if (!globalForDb.__deepMidwicket) globalForDb.__deepMidwicket = createDb()
  return globalForDb.__deepMidwicket
}

export function getBank(): BuiltPrompt[] {
  return getDb().bank
}

export function getBankVersion(): string {
  const db = getDb()
  const row = db.sqlite.prepare('SELECT value FROM meta WHERE key = ?').get('content_version') as
    | { value: string }
    | undefined
  return row?.value ?? 'unknown'
}

/** The seven prompts a session was dealt, in order. */
export function getRunPrompts(runId: string): RunPrompt[] {
  const db = getDb()
  const rows = db.sqlite
    .prepare('SELECT prompt_id, slot, text FROM run_prompts WHERE run_id = ? ORDER BY slot')
    .all(runId) as Array<{ prompt_id: string; slot: number; text: string }>
  return rows.map((row) => ({ id: row.prompt_id, slot: row.slot, text: row.text }))
}

function promptIndex(promptId: string): Map<string, { row: AnswerRow; canonical: boolean }> {
  const db = getDb()
  const cached = db.keyCache.get(promptId)
  if (cached) return cached
  const rows = db.sqlite
    .prepare(
      `SELECT k.key AS key, a.id AS id, a.answer AS answer, a.tier AS tier, a.quip AS quip
       FROM answer_keys k JOIN answers a ON a.id = k.answer_id
       WHERE k.prompt_id = ?`,
    )
    .all(promptId) as Array<{ key: string; id: number; answer: string; tier: string; quip: string | null }>

  const index = new Map<string, { row: AnswerRow; canonical: boolean }>()
  for (const row of rows) {
    index.set(row.key, {
      row: {
        id: row.id,
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

export function matchAnswer(promptId: string, raw: string): MatchedAnswer | null {
  const key = normalizeAnswer(raw)
  if (!key) return null
  const index = promptIndex(promptId)
  const entry = index.get(key)
  if (entry) {
    return {
      ...entry.row,
      score: tierScore(entry.row.tier),
      matchType: entry.canonical ? 'exact' : 'alias',
    }
  }

  const budget = fuzzyBudget(key)
  if (!budget) return null

  const candidates: Array<{ distance: number; key: string; row: AnswerRow }> = []
  for (const [candidateKey, value] of index) {
    if (candidateKey[0] !== key[0]) continue
    if (Math.abs(candidateKey.length - key.length) > budget) continue
    const distance = editDistance(key, candidateKey)
    if (distance <= budget) candidates.push({ distance, key: candidateKey, row: value.row })
  }
  if (!candidates.length) return null

  candidates.sort((a, b) => a.distance - b.distance || b.key.length - a.key.length)
  const best = candidates[0]
  const ambiguous = candidates.some(
    (candidate) => candidate.distance === best.distance && candidate.row.id !== best.row.id,
  )
  if (ambiguous) return null
  return { ...best.row, score: tierScore(best.row.tier), matchType: 'fuzzy' }
}

export function createRun(
  runId: string,
  date: string,
  playerId: string,
  prompts: Array<{ id: string; text: string }>,
): RunRow {
  const db = getDb()
  db.sqlite.exec('BEGIN')
  try {
    db.sqlite
      .prepare(
        `INSERT OR IGNORE INTO runs (run_id, date, player_id, day_number, started_at, completed_at, score)
         VALUES (?, ?, ?, ?, ?, NULL, 0)`,
      )
      .run(runId, date, playerId, 1, Date.now())
    const insertPrompt = db.sqlite.prepare(
      'INSERT OR IGNORE INTO run_prompts (run_id, slot, prompt_id, text) VALUES (?, ?, ?, ?)',
    )
    prompts.forEach((prompt, index) => insertPrompt.run(runId, index + 1, prompt.id, prompt.text))
    db.sqlite.exec('COMMIT')
  } catch (error) {
    db.sqlite.exec('ROLLBACK')
    throw error
  }
  const run = getRun(runId)
  if (!run) throw new Error('Run could not be created')
  return run
}

export function getRun(runId: string): RunRow | null {
  const db = getDb()
  const row = db.sqlite
    .prepare('SELECT * FROM runs WHERE run_id = ?')
    .get(runId) as
    | {
        run_id: string
        date: string
        player_id: string
        day_number: number
        started_at: number
        completed_at: number | null
        score: number
      }
    | undefined
  if (!row) return null
  return {
    runId: row.run_id,
    date: row.date,
    playerId: row.player_id,
    dayNumber: row.day_number,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
  }
}

export function getSubmissions(runId: string): SubmissionRow[] {
  const db = getDb()
  const rows = db.sqlite
    .prepare('SELECT * FROM submissions WHERE run_id = ? ORDER BY slot')
    .all(runId) as Array<{
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
  }>
  return rows.map((row) => ({
    receipt: row.receipt,
    runId: row.run_id,
    date: row.date,
    promptId: row.prompt_id,
    slot: row.slot,
    rawAnswer: row.raw_answer,
    answer: row.answer,
    tier: row.tier,
    score: row.score,
    quip: row.quip,
    matchType: row.match_type,
    createdAt: row.created_at,
  }))
}

export function recordSubmission(params: {
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
}): SubmissionRow {
  const db = getDb()
  const createdAt = Date.now()
  db.sqlite
    .prepare(
      `INSERT INTO submissions
        (receipt, run_id, date, prompt_id, slot, raw_answer, answer, tier, score, quip, match_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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

  db.sqlite
    .prepare('UPDATE runs SET score = score + ? WHERE run_id = ?')
    .run(params.score, params.runId)

  if (params.matched) {
    db.sqlite
      .prepare(
        `INSERT INTO popularity (date, prompt_id, answer_id, count) VALUES (?, ?, ?, 1)
         ON CONFLICT(date, prompt_id, answer_id) DO UPDATE SET count = count + 1`,
      )
      .run(params.date, params.promptId, params.matched.id)
  }

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

export function completeRun(runId: string): RunRow | null {
  const db = getDb()
  db.sqlite
    .prepare('UPDATE runs SET completed_at = ? WHERE run_id = ? AND completed_at IS NULL')
    .run(Date.now(), runId)
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

export function revealRun(runId: string): { prompts: RevealedPrompt[] } {
  const db = getDb()
  const prompts: RevealedPrompt[] = getRunPrompts(runId).map((prompt) => {
    const rows = db.sqlite
      .prepare(
        `SELECT a.answer AS answer, a.tier AS tier, a.quip AS quip
         FROM answers a WHERE a.prompt_id = ?`,
      )
      .all(prompt.id) as Array<{
      answer: string
      tier: TierId
      quip: string | null
    }>
    return {
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
    }
  })
  return { prompts }
}
