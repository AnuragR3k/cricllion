import { findCompletedRun } from '@/lib/db'
import { fail, isPlayerId, isFuture, json, resolveDate } from '@/lib/api'
import { summariseRun } from '@/lib/summary'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = resolveDate(url)
  const playerId = url.searchParams.get('playerId')

  if (!date) return fail(400, 'Bad date.')
  if (isFuture(date)) return fail(400, 'That day has not started yet.')
  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')

  const run = findCompletedRun(playerId, date)
  if (!run) return json({ completed: false })
  return json({ completed: true, ...summariseRun(run) })
}
