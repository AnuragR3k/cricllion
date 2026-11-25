import { completeRun, getRun, getSubmissions } from '@/lib/db'
import { fail, isPlayerId, isRunId, json } from '@/lib/api'
import { readReceipt } from '@/lib/receipts'
import { SLOTS } from '@/lib/constants'
import { summariseRun } from '@/lib/summary'

export const dynamic = 'force-dynamic'

type Body = { playerId?: unknown; runId?: unknown }

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return fail(400, 'Bad request.')

  const { playerId, runId } = body
  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')
  if (!isRunId(runId)) return fail(400, 'Missing run.')

  const run = await getRun(runId)
  if (!run) return fail(404, 'No such innings.')
  if (run.playerId !== playerId) return fail(403, 'Wrong player.')

  const submissions = await getSubmissions(runId)
  if (submissions.length !== SLOTS) {
    return fail(409, `Not an innings yet. ${submissions.length}/${SLOTS} answered.`)
  }
  for (let index = 0; index < submissions.length; index++) {
    const submission = submissions[index]
    if (submission.slot !== index + 1) return fail(409, 'Innings is out of order.')
    const payload = readReceipt(submission.receipt)
    if (
      !payload ||
      payload.runId !== runId ||
      payload.promptId !== submission.promptId ||
      payload.slot !== submission.slot
    ) {
      return fail(409, 'A receipt did not check out.')
    }
  }

  if (!run.completedAt) await completeRun(runId)
  const finished = (await getRun(runId)) ?? run
  return json({ completed: true, ...(await summariseRun(finished)) })
}
