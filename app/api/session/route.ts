import { createRun, getBank } from '@/lib/db'
import { drawPrompts, puzzleDate } from '@/lib/schedule'
import { fail, isPlayerId, json } from '@/lib/api'
import { SLOTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Body = { playerId?: unknown }

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return fail(400, 'Bad request.')

  const { playerId } = body
  if (!isPlayerId(playerId)) return fail(400, 'Missing player.')

  // Every session gets its own draw: any seven questions from the whole bank.
  const drawn = drawPrompts(await getBank(), SLOTS)
  const runId = crypto.randomUUID()
  const run = await createRun(
    runId,
    puzzleDate(),
    playerId,
    drawn.map((prompt) => ({ id: prompt.id, text: prompt.text })),
  )

  return json({
    runId: run.runId,
    date: run.date,
    prompts: drawn.map((prompt, index) => ({ id: `p${index + 1}`, text: prompt.text })),
  })
}
