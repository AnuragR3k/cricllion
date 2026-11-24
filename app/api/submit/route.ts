import {
  createRun,
  ensureDay,
  getRun,
  getSubmissions,
  matchAnswer,
  recordSubmission,
} from '@/lib/db'
import { fail, isPlayerId, isRunId, json } from '@/lib/api'
import { makeReceipt } from '@/lib/receipts'
import { puzzleDate } from '@/lib/schedule'
import { MAX_ANSWER_LENGTH, RUN_TTL_MS, SLOTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Body = {
  date?: unknown
  promptId?: unknown
  answer?: unknown
  playerId?: unknown
  runId?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return fail(400, 'Bad request.')

  const { date, promptId, playerId, runId } = body
  const answer = typeof body.answer === 'string' ? body.answer : ''

  if (typeof date !== 'string' || date !== puzzleDate()) {
    return fail(410, 'That dive has ended. A new one starts at midnight IST.')
  }
  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')
  if (!isRunId(runId)) return fail(400, 'Missing run.')
  if (typeof promptId !== 'string') return fail(400, 'Missing prompt.')
  if (answer.length > MAX_ANSWER_LENGTH) return fail(400, 'That answer is too long.')

  const day = ensureDay(date)
  const prompt = day.prompts.find((item) => `p${item.slot}` === promptId)
  if (!prompt) return fail(400, 'Unknown prompt.')

  let run = getRun(runId)

  if (!run) {
    if (prompt.slot !== 1) return fail(409, 'Start with the first ball.')
    run = createRun(runId, date, playerId)
  } else {
    if (run.date !== date || run.playerId !== playerId) return fail(403, 'Wrong player for this run.')
    if (run.completedAt) return fail(409, 'This innings is already closed.')
    if (Date.now() > run.startedAt + RUN_TTL_MS) {
      return fail(410, 'Innings timed out. Start again.')
    }
  }

  const previous = getSubmissions(runId)
  const expectedSlot = previous.length + 1
  if (prompt.slot !== expectedSlot) {
    return fail(409, prompt.slot < expectedSlot ? 'Already answered.' : 'Answer them in order.')
  }
  if (previous.length >= SLOTS) return fail(409, 'All seven already answered.')

  const matched = matchAnswer(prompt.id, answer)
  const tier = matched?.tier ?? 'miss'
  const score = matched?.score ?? 0
  const receipt = makeReceipt({
    runId,
    date,
    promptId,
    slot: prompt.slot,
    tier,
    score,
    ts: Date.now(),
  })

  recordSubmission({
    receipt,
    runId,
    date,
    promptId,
    slot: prompt.slot,
    rawAnswer: answer,
    matched,
    tier,
    score,
  })

  return json({
    accepted: true,
    slot: prompt.slot,
    tier: matched?.tier ?? null,
    answer: matched?.answer ?? null,
    displayAnswer: matched?.answer ?? answer,
    score,
    quip: matched?.quip ?? null,
    receipt,
    nextPromptId: prompt.slot < SLOTS ? `p${prompt.slot + 1}` : null,
  })
}
