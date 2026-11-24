import { readReceipt, makeReceipt } from '@/lib/receipts'
import { GET as todayGet } from '@/app/api/today/route'
import { POST as submitPost } from '@/app/api/submit/route'
import { POST as completePost } from '@/app/api/today/complete/route'
import { GET as statusGet } from '@/app/api/status/route'
import { GET as revealGet } from '@/app/api/reveal/route'
import { GET as popularityGet } from '@/app/api/answer-popularity/route'

let failures = 0
function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures++
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function json(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}))
}

function req(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  } as RequestInit)
}

async function main(): Promise<void> {
  const playerId = crypto.randomUUID()
  const runId = crypto.randomUUID()
  const date = '2026-11-24'

  console.log('=== /api/today ===')
  let todayRes = await todayGet(req('GET', `http://localhost/api/today?date=${date}`))
  check('today 200', todayRes.status === 200, `got ${todayRes.status}`)
  const todayData = (await json(todayRes)) as { prompts: { id: string; text: string }[] }
  check('exactly 7 prompts', todayData.prompts.length === 7)
  const ids = todayData.prompts.map((p) => p.id)
  check('ids p1..p7', ids.join(',') === 'p1,p2,p3,p4,p5,p6,p7', ids.join(','))

  console.log('=== /api/reveal ===')
  let revealRes = await revealGet(req('GET', `http://localhost/api/reveal?date=${date}`))
  check('reveal 200', revealRes.status === 200, `got ${revealRes.status}`)
  const revealData = (await json(revealRes)) as {
    prompts: { answers: { tier: string; quip?: string }[] }[]
  }
  check(
    'each prompt has exactly one superover',
    revealData.prompts.every((p) => p.answers.filter((a) => a.tier === 'superover').length === 1),
  )

  // Pick answers from the reveal for the ordered submission
  const answers: { promptId: string; answer: string; tier: string; score: number }[] = []
  let gemPicked = false
  for (const prompt of revealData.prompts) {
    const superover = prompt.answers.find((a) => a.tier === 'superover')
    if (superover && !gemPicked) {
      answers.push({ promptId: `p${prompt.slot}`, answer: superover.answer, tier: 'superover', score: 100 })
      gemPicked = true
    } else {
      const normal = prompt.answers.find((a) => a.tier !== 'superover')!
      answers.push({ promptId: `p${prompt.slot}`, answer: normal.answer, tier: normal.tier, score: normal.score ?? 0 })
    }
  }
  check('picked one answer per prompt', answers.length === 7)

  console.log('=== /api/submit: out of order ===')
  let bad = await submitPost(req('POST', 'http://localhost/api/submit', {
    date, promptId: 'p2', answer: 'anything', playerId, runId,
  }))
  check('p2 first rejected 409', bad.status === 409, `got ${bad.status}`)

  console.log('=== /api/submit: ordered ===')
  let expectedScore = 0
  for (const a of answers) {
    const res = await submitPost(req('POST', 'http://localhost/api/submit', {
      date, promptId: a.promptId, answer: a.answer, playerId, runId,
    }))
    const body = (await json(res)) as { receipt?: string; tier?: string; score?: number; accepted?: boolean }
    check(`${a.promptId} 200 + receipt`, res.status === 200 && typeof body.receipt === 'string' && typeof body.score === 'number', `got ${res.status}`)
    check(`${a.promptId} tier matches`, body.tier === a.tier, `got ${body.tier} expected ${a.tier}`)
    expectedScore += typeof body.score === 'number' ? body.score : 0
  }

  // Deliberate miss still issues a receipt (fresh run)
  const missRun = crypto.randomUUID()
  let missRes = await submitPost(req('POST', 'http://localhost/api/submit', {
    date, promptId: 'p1', answer: 'zzz nonsense zzz', playerId, runId: missRun,
  }))
  const missBody = (await json(missRes)) as { tier?: string | null; score?: number; receipt?: string }
  check('miss still issues receipt', typeof missBody.receipt === 'string' && missBody.tier === null && missBody.score === 0, JSON.stringify(missBody))

  console.log('=== /api/today/complete ===')
  let completeRes = await completePost(req('POST', 'http://localhost/api/today/complete', {
    date, playerId, runId,
  }))
  check('complete 200', completeRes.status === 200, `got ${completeRes.status}`)
  const completeBody = (await json(completeRes)) as { score?: number; results?: unknown[]; band?: unknown; streak?: number }
  check('score equals sum', typeof completeBody.score === 'number' && completeBody.score === expectedScore, `got ${completeBody.score} expected ${expectedScore}`)
  check('7 results', Array.isArray(completeBody.results) && completeBody.results.length === 7)
  check('band present', typeof completeBody.band === 'object' && completeBody.band !== null)
  check('streak number', typeof completeBody.streak === 'number')

  // Idempotent re-complete
  let completeRes2 = await completePost(req('POST', 'http://localhost/api/today/complete', {
    date, playerId, runId,
  }))
  check('re-complete does not crash', completeRes2.status === 200 || completeRes2.status === 409, `got ${completeRes2.status}`)

  console.log('=== /api/status ===')
  let statusRes = await statusGet(req('GET', `http://localhost/api/status?date=${date}&playerId=${encodeURIComponent(playerId)}`))
  check('status 200', statusRes.status === 200, `got ${statusRes.status}`)
  const statusBody = (await json(statusRes)) as { completed?: boolean; score?: number }
  check('status completed true', statusBody.completed === true)
  check('status score matches', typeof statusBody.score === 'number' && statusBody.score === expectedScore, `got ${statusBody.score}`)

  // 8th answer after completion
  let eighth = await submitPost(req('POST', 'http://localhost/api/submit', {
    date, promptId: 'p1', answer: 'anything', playerId, runId,
  }))
  check('8th answer rejected 409', eighth.status === 409, `got ${eighth.status}`)

  console.log('=== receipt tamper ===')
  const good = makeReceipt({ runId, date, promptId: 'p1', slot: 1, tier: 'duck', score: 10, ts: Date.now() })
  const tampered = good.slice(0, -1) + (good.endsWith('=') ? 'A' : '=')
  check('readReceipt null on tampered', readReceipt(tampered) === null)

  console.log('=== wrong player ===')
  const wrongRun = crypto.randomUUID()
  await submitPost(req('POST', 'http://localhost/api/submit', {
    date, promptId: 'p1', answer: answers[0].answer, playerId, runId: wrongRun,
  }))
  let wrong = await submitPost(req('POST', 'http://localhost/api/submit', {
    date, promptId: 'p1', answer: answers[0].answer, playerId: 'someone-else', runId: wrongRun,
  }))
  check('wrong player 403', wrong.status === 403, `got ${wrong.status}`)

  console.log('=== past / future date ===')
  let pastRes = await todayGet(req('GET', 'http://localhost/api/today?date=2026-01-01'))
  check('past date 200', pastRes.status === 200, `got ${pastRes.status}`)
  let futureRes = await todayGet(req('GET', 'http://localhost/api/today?date=2999-01-01'))
  check('future date 400', futureRes.status === 400, `got ${futureRes.status}`)

  console.log('=== /api/answer-popularity ===')
  let popRes = await popularityGet(req('GET', `http://localhost/api/answer-popularity?date=${date}`))
  check('popularity 200', popRes.status === 200, `got ${popRes.status}`)

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\nall api checks passed')
}

void main()
