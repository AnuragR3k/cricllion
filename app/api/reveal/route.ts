import { getRun, revealRun } from '@/lib/db'
import { fail, isRunId, json } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const runId = new URL(request.url).searchParams.get('runId')
  if (!isRunId(runId)) return fail(400, 'Missing innings.')
  const run = await getRun(runId)
  if (!run) return fail(404, 'No such innings.')
  return json(await revealRun(runId))
}
