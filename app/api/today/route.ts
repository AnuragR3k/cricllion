import { ensureDay } from '@/lib/db'
import { fail, isFuture, json, resolveDate } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const date = resolveDate(new URL(request.url))
  if (!date) return fail(400, 'Bad date.')
  if (isFuture(date)) return fail(400, 'That day has not started yet.')

  const day = ensureDay(date)
  return json({
    date: day.date,
    dayNumber: day.dayNumber,
    resetsAt: day.resetsAt,
    prompts: day.prompts.map((prompt) => ({ id: `p${prompt.slot}`, text: prompt.text })),
  })
}
