import { readReceipt, makeReceipt } from '@/lib/receipts'
import { POST as sessionPost } from '@/app/api/session/route'
import { POST as submitPost } from '@/app/api/submit/route'
import { POST as completePost } from '@/app/api/session/complete/route'
import { GET as revealGet } from '@/app/api/reveal/route'

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

type SessionBody = { runId: string; date: string; prompts: { id: string; text: string }[] }
type RevealBody = { prompts: { slot: number; answers: { answer: string; tier: string; score: number; quip?: string }[] }[] }

async function main(): Promise<void> {
  const playerId = crypto.randomUUID()

  console.log('=== /api/session ===')
  const sessionRes = await sessionPost(req('POST', 'http://localhost/api/session', { playerId }))
  check('session 200', sessionRes.status === 200, `got ${sessionRes.status}`)
  const session = (await json(sessionRes)) as SessionBody
  check('runId present', typeof session.runId === 'string' && session.runId.length > 0)
  check('exactly 7 prompts', session.prompts.length === 7)
  const ids = session.prompts.map((p) => p.id)
  check('ids p1..p7', ids.join(',') === 'p1,p2,p3,p4,p5,p6,p7', ids.join(','))
  check('prompts are unique', new Set(session.prompts.map((p) => p.text)).size === 7)
  const runId = session.runId

  console.log('=== /api/session: a second draw differs ===')
  const session2Res = await sessionPost(req('POST', 'http://localhost/api/session', { playerId }))
  const session2 = (await json(session2Res)) as SessionBody
  check('second session has its own runId', session2.runId !== runId)
  check('second session has 7 prompts', session2.prompts.length === 7)

  console.log('=== /api/reveal ===')
  const revealRes = await revealGet(req('GET', `http://localhost/api/reveal?runId=${runId}`))
  check('reveal 200', revealRes.status === 200, `got ${revealRes.status}`)
  const reveal = (await json(revealRes)) as RevealBody
  check(
    'each prompt has exactly one six',
    reveal.prompts.every((p) => p.answers.filter((a) => a.tier === 'six').length === 1),
  )

  // Pick answers from the reveal for the ordered submission
  const answers: { promptId: string; answer: string; tier: string; score: number }[] = []
  let gemPicked = false
  for (const prompt of reveal.prompts) {
    const six = prompt.answers.find((a) => a.tier === 'six')
    if (six && !gemPicked) {
      answers.push({ promptId: `p${prompt.slot}`, answer: six.answer, tier: 'six', score: 100 })
      gemPicked = true
    } else {
      const normal = prompt.answers.find((a) => a.tier !== 'six')!
      answers.push({ promptId: `p${prompt.slot}`, answer: normal.answer, tier: normal.tier, score: normal.score ?? 0 })
    }
  }
  check('picked one answer per prompt', answers.length === 7)

  console.log('=== /api/submit: out of order ===')
  const bad = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p2', answer: 'anything', playerId, runId,
  }))
  check('p2 first rejected 409', bad.status === 409, `got ${bad.status}`)

  console.log('=== /api/submit: ordered ===')
  let expectedScore = 0
  for (const a of answers) {
    const res = await submitPost(req('POST', 'http://localhost/api/submit', {
      promptId: a.promptId, answer: a.answer, playerId, runId,
    }))
    const body = (await json(res)) as { receipt?: string; tier?: string; score?: number; accepted?: boolean }
    check(`${a.promptId} 200 + receipt`, res.status === 200 && typeof body.receipt === 'string' && typeof body.score === 'number', `got ${res.status}`)
    check(`${a.promptId} tier matches`, body.tier === a.tier, `got ${body.tier} expected ${a.tier}`)
    expectedScore += typeof body.score === 'number' ? body.score : 0
  }

  // A wrong answer is not recorded: the player is told to try again.
  const missRunRes = await sessionPost(req('POST', 'http://localhost/api/session', { playerId }))
  const missRun = ((await json(missRunRes)) as SessionBody).runId
  const missRes = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p1', answer: 'zzz nonsense zzz', playerId, runId: missRun,
  }))
  const missBody = (await json(missRes)) as { retry?: boolean; tier?: string | null; score?: number; receipt?: string }
  check(
    'wrong answer asks to retry, no receipt',
    missRes.status === 200 && missBody.retry === true && missBody.receipt === undefined,
    JSON.stringify(missBody),
  )

  // A blank answer (time-out) still counts as a miss and moves the ball on.
  const blankRes = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p1', answer: '', playerId, runId: missRun,
  }))
  const blankBody = (await json(blankRes)) as { tier?: string | null; score?: number; receipt?: string }
  check('time-out still issues receipt', typeof blankBody.receipt === 'string' && blankBody.tier === null && blankBody.score === 0, JSON.stringify(blankBody))

  console.log('=== /api/submit: near miss asks to confirm ===')
  const cRes = await sessionPost(req('POST', 'http://localhost/api/session', { playerId }))
  const cRun = ((await json(cRes)) as SessionBody).runId
  const cRevealRes = await revealGet(req('GET', `http://localhost/api/reveal?runId=${cRun}`))
  const cReveal = (await json(cRevealRes)) as RevealBody
  const gem = cReveal.prompts[0].answers.find((a) => a.tier === 'six')!.answer
  const lastChar = gem.slice(-1)
  const misspellings = [
    gem.slice(0, -1),
    gem.slice(0, -2) + lastChar + gem.slice(-2, -1),
  ]
  let confirmBody: { confirm?: boolean; correction?: string; receipt?: string } | null = null
  for (const answer of misspellings) {
    const res = await submitPost(req('POST', 'http://localhost/api/submit', {
      promptId: 'p1', answer, playerId, runId: cRun,
    }))
    const body = (await json(res)) as { confirm?: boolean; correction?: string; receipt?: string; retry?: boolean }
    if (body.confirm) {
      confirmBody = body
      break
    }
    if (body.receipt) break
  }
  check(
    'close spelling is not recorded, it asks to confirm',
    confirmBody?.confirm === true && confirmBody?.correction === gem,
    JSON.stringify(confirmBody),
  )
  if (confirmBody?.confirm) {
    const confirmed = await submitPost(req('POST', 'http://localhost/api/submit', {
      promptId: 'p1', answer: confirmBody.correction, playerId, runId: cRun,
    }))
    const body = (await json(confirmed)) as { receipt?: string; tier?: string }
    check('confirming the correction records it', typeof body.receipt === 'string', JSON.stringify(body))
  }

  console.log('=== /api/session/complete ===')
  const completeRes = await completePost(req('POST', 'http://localhost/api/session/complete', {
    playerId, runId,
  }))
  check('complete 200', completeRes.status === 200, `got ${completeRes.status}`)
  const completeBody = (await json(completeRes)) as { score?: number; results?: unknown[]; band?: unknown }
  check('score equals sum', typeof completeBody.score === 'number' && completeBody.score === expectedScore, `got ${completeBody.score} expected ${expectedScore}`)
  check('7 results', Array.isArray(completeBody.results) && completeBody.results.length === 7)
  check('band present', typeof completeBody.band === 'object' && completeBody.band !== null)

  // Idempotent re-complete
  const completeRes2 = await completePost(req('POST', 'http://localhost/api/session/complete', {
    playerId, runId,
  }))
  check('re-complete is fine', completeRes2.status === 200, `got ${completeRes2.status}`)

  // 8th answer after completion
  const eighth = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p1', answer: 'anything', playerId, runId,
  }))
  check('8th answer rejected 409', eighth.status === 409, `got ${eighth.status}`)

  console.log('=== unknown run ===')
  const ghost = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p1', answer: answers[0].answer, playerId, runId: crypto.randomUUID(),
  }))
  check('submit to unknown run 404', ghost.status === 404, `got ${ghost.status}`)

  console.log('=== receipt tamper ===')
  const good = makeReceipt({ runId, date: session.date, promptId: 'p1', slot: 1, tier: 'legbye', score: 10, ts: Date.now() })
  const tampered = good.slice(0, -1) + (good.endsWith('=') ? 'A' : '=')
  check('readReceipt null on tampered', readReceipt(tampered) === null)

  console.log('=== wrong player ===')
  const otherRunRes = await sessionPost(req('POST', 'http://localhost/api/session', { playerId }))
  const otherRun = ((await json(otherRunRes)) as SessionBody).runId
  const wrong = await submitPost(req('POST', 'http://localhost/api/submit', {
    promptId: 'p1', answer: answers[0].answer, playerId: 'someone-else', runId: otherRun,
  }))
  check('wrong player 403', wrong.status === 403, `got ${wrong.status}`)

  console.log('=== bad session request ===')
  const noPlayer = await sessionPost(req('POST', 'http://localhost/api/session', {}))
  check('session without player 400', noPlayer.status === 400, `got ${noPlayer.status}`)

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\nall api checks passed')
}

void main()
