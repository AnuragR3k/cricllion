import { buildPromptBank } from '../lib/content'
import { getDb, ensureDay, matchAnswer } from '../lib/db'
import { normalizeAnswer } from '../lib/normalize'
import { addDays, dayNumberFor, puzzleDate } from '../lib/schedule'
import { TIERS } from '../lib/tiers'

let failures = 0

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures++
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('=== content ===')
const { prompts, version, warnings } = buildPromptBank()
const totalAnswers = prompts.reduce((total, prompt) => total + prompt.answers.length, 0)
console.log(`prompts: ${prompts.length} · answers: ${totalAnswers} · version: ${version}`)
console.log(`warnings: ${warnings.length}`)
for (const warning of warnings) console.log(`  - ${warning}`)

const ids = new Set<string>()
let bankProblems = 0
for (const prompt of prompts) {
  if (ids.has(prompt.id)) {
    console.log(`  duplicate id: ${prompt.id}`)
    bankProblems++
  }
  ids.add(prompt.id)
  const gems = prompt.answers.filter((answer) => answer.tier === 'six')
  if (gems.length !== 1) {
    console.log(`  ${prompt.id}: ${gems.length} sixes`)
    bankProblems++
  }
  if (prompt.answers.length < 8) {
    console.log(`  ${prompt.id}: only ${prompt.answers.length} answers`)
    bankProblems++
  }
}
check('every prompt has exactly one gem', bankProblems === 0)

const byCategory = new Map<string, number>()
for (const prompt of prompts) {
  byCategory.set(prompt.category, (byCategory.get(prompt.category) ?? 0) + 1)
}
console.log('categories:', Object.fromEntries(byCategory))

console.log('\n=== normalisation ===')
check('case folded', normalizeAnswer('  Sachin   TENDULKAR ') === 'sachin tendulkar')
check('accents stripped', normalizeAnswer('Moeen Alí') === 'moeen ali')
check('apostrophes dropped', normalizeAnswer("Kevin O'Brien") === 'kevin obrien')
check('leading article dropped', normalizeAnswer("The Oval") === 'oval')
check('punctuation flattened', normalizeAnswer('Jake Fraser-McGurk') === 'jake fraser mcgurk')

console.log('\n=== seed + matching ===')
getDb()
check('db seeded', prompts.length > 0)

const shots = prompts.find((prompt) => prompt.id === 'shots')
if (!shots) {
  check('shots prompt exists', false)
} else {
  const exact = matchAnswer('shots', 'cover drive')
  check('exact match', exact?.tier === 'duck' && exact?.score === 0, JSON.stringify(exact))
  const reverse = matchAnswer('shots', 'Reverse Sweep!')
  check('punctuation tolerant', reverse?.tier === 'four', JSON.stringify(reverse))
  const alias = matchAnswer('shots', 'chinese cut')
  check('alias hits the gem', alias?.tier === 'six' && alias?.score === 100, JSON.stringify(alias))
  const typo = matchAnswer('shots', 'french cutt')
  check('one-character typo forgiven', typo?.tier === 'six', JSON.stringify(typo))
  const miss = matchAnswer('shots', 'quantum physics')
  check('nonsense misses', miss === null, JSON.stringify(miss))
}

const playersPrompt = prompts.find((prompt) => prompt.id === 'country-india')
if (playersPrompt) {
  const sachin = matchAnswer(playersPrompt.id, 'sachin')
  check('surname alias', sachin?.answer === 'Sachin Tendulkar', JSON.stringify(sachin))
  const kohli = matchAnswer(playersPrompt.id, 'Virat Kholi')
  check('player typo forgiven', kohli?.answer === 'Virat Kohli', JSON.stringify(kohli))
}

console.log('\n=== schedule ===')
for (let offset = 0; offset < 7; offset++) {
  const date = addDays(puzzleDate(), offset)
  const day = ensureDay(date)
  const gems = day.prompts.length
  console.log(
    `  day ${String(day.dayNumber).padStart(3)} ${date} (${gems} prompts): ` +
      day.prompts.map((prompt) => prompt.text).join(' | '),
  )
  if (day.prompts.length !== 7) failures++
}

console.log(`\nday number check: ${puzzleDate()} -> ${dayNumberFor(puzzleDate())}`)
console.log(`tiers: ${Object.values(TIERS).map((tier) => `${tier.name}=${tier.score}`).join(', ')}`)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nall checks passed')
