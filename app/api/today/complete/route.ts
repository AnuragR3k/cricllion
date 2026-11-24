import { completeRun, ensureDay, getRun, getSubmissions } from '@/lib/db'
import { fail, isPlayerId, isRunId, json } from '@/lib/api'
import { readReceipt } from '@/lib/receipts'
import { SLOTS } from '@/lib/constants'
import { summariseRun } from '@/lib/summary'

export const dynamic = 'force-dynamic'

type Body = { date?: unknown; playerId?: unknown; runId?: unknown }

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return fail(400, 'Bad request.')

  const { date, playerId, runId } = body
  if (typeof date !== 'string') return fail(400, 'Missing date.')
  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')
  if (!isRunId(runId)) return fail(400, 'Missing run.')

  const run = getRun(runId)
  if (!run) return fail(404, 'No such innings.')
  if (run.date !== date || run.playerId !== playerId) return fail(403, 'Wrong player or day.')

  const submissions = getSubmissions(runId)
  if (submissions.length !== SLOTS) {
    return fail(409, `Six balls is not an innings. ${submissions.length}/${SLOTS} answered.`)
  }
  for (let index = 0; index < submissions.length; index++) {
    const submission = submissions[index]
    if (submission.slot !== index + 1) return fail(409, 'Innings is out of order.')
    const payload = readReceipt(submission.receipt)
    if (
      !payload ||
      payload.runId !== runId ||
      payload.date !== date ||
      payload.promptId !== submission.promptId ||
      payload.slot !== submission.slot
    ) {
      return fail(409, 'A receipt did not check out.')
    }
  }

  ensureDay(date)
  if (!run.completedAt) completeRun(runId)
  const finished = getRun(runId) ?? run
  return json({ completed: true, ...summariseRun(finished) })
}
