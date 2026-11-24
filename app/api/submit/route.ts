import {
  getRun,
  getRunPrompts,
  getSubmissions,
  matchAnswer,
  recordSubmission,
} from '@/lib/db'
import { fail, isPlayerId, isRunId, json } from '@/lib/api'
import { makeReceipt } from '@/lib/receipts'
import { MAX_ANSWER_LENGTH, RUN_TTL_MS, SLOTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Body = {
  promptId?: unknown
  answer?: unknown
  playerId?: unknown
  runId?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return fail(400, 'Bad request.')

  const { promptId, playerId, runId } = body
  const answer = typeof body.answer === 'string' ? body.answer : ''

  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')
  if (!isRunId(runId)) return fail(400, 'Missing run.')
  if (typeof promptId !== 'string') return fail(400, 'Missing prompt.')
  if (answer.length > MAX_ANSWER_LENGTH) return fail(400, 'That answer is too long.')

  const run = getRun(runId)
  if (!run) return fail(404, 'No such innings.')
  if (run.playerId !== playerId) return fail(403, 'Wrong player for this innings.')
  if (run.completedAt) return fail(409, 'This innings is already closed.')
  if (Date.now() > run.startedAt + RUN_TTL_MS) {
    return fail(410, 'Innings timed out. Start again.')
  }

  const prompts = getRunPrompts(runId)
  const prompt = prompts.find((item) => `p${item.slot}` === promptId)
  if (!prompt) return fail(400, 'Unknown prompt.')

  const previous = getSubmissions(runId)
  const expectedSlot = previous.length + 1
  if (prompt.slot !== expectedSlot) {
    return fail(409, prompt.slot < expectedSlot ? 'Already answered.' : 'Answer them in order.')
  }
  if (previous.length >= SLOTS) return fail(409, 'All seven already answered.')

  const matched = matchAnswer(prompt.id, answer)
  const tier = matched?.tier ?? 'miss'
  const score = matched?.score ?? 0
  const matchType = matched?.matchType ?? (matched ? 'exact' : 'miss')

  // Wrong answer: don't record it, let the player try again on the same ball.
  // A blank answer (time-out) still counts as a miss and moves on.
  if (!matched && answer.trim().length > 0) {
    return json({
      accepted: true,
      correct: false,
      retry: true,
      slot: prompt.slot,
      message: 'Not in the book. Try again.',
    })
  }

  const autocorrected = matchType === 'fuzzy' || matchType === 'alias'

  // Close or alternate spelling: show the correction and let the player confirm
  // (submit the corrected text again) or edit before anything is recorded.
  if (autocorrected && answer.trim().length > 0) {
    return json({
      accepted: true,
      correct: false,
      confirm: true,
      slot: prompt.slot,
      raw: answer.trim(),
      correction: matched ? matched.answer : answer,
      matchType,
      message: 'Submit again to confirm.',
    })
  }

  const receipt = makeReceipt({
    runId,
    date: run.date,
    promptId,
    slot: prompt.slot,
    tier,
    score,
    ts: Date.now(),
  })

  recordSubmission({
    receipt,
    runId,
    date: run.date,
    promptId,
    slot: prompt.slot,
    rawAnswer: answer,
    matched,
    tier,
    score,
    matchType,
  })

  return json({
    accepted: true,
    slot: prompt.slot,
    tier: matched?.tier ?? null,
    answer: matched?.answer ?? null,
    displayAnswer: matched?.answer ?? answer,
    matchType,
    autocorrected,
    score,
    quip: matched?.quip ?? null,
    receipt,
    nextPromptId: prompt.slot < SLOTS ? `p${prompt.slot + 1}` : null,
  })
}
