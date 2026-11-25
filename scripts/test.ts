import { buildPromptBank } from '../lib/content'
import { getBank, getDb, matchAnswer } from '../lib/db'
import { normalizeAnswer } from '../lib/normalize'
import { drawPrompts } from '../lib/schedule'
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

async function main(): Promise<void> {
console.log('=== content ===')
const { prompts, version, warnings } = buildPromptBank()
const totalAnswers = prompts.reduce((total, prompt) => total + prompt.answers.length, 0)
console.log(`prompts: ${prompts.length} · answers: ${totalAnswers} · version: ${version}`)
console.log(`warnings: ${warnings.length}`)
for (const warning of warnings) console.log(`  - ${warning}`)

check('all 55 prompts present', prompts.length === 55, `got ${prompts.length}`)

const ids = new Set<string>()
let bankProblems = 0
for (const prompt of prompts) {
  if (ids.has(prompt.id)) {
    console.log(`  duplicate id: ${prompt.id}`)
    bankProblems++
  }
  ids.add(prompt.id)
  if (prompt.answers.length < 5) {
    console.log(`  ${prompt.id}: only ${prompt.answers.length} answers`)
    bankProblems++
  }
}
check('every prompt has at least five answers', bankProblems === 0)

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
await getDb()
check('db seeded', prompts.length > 0)

const grounds = prompts.find((prompt) => prompt.id === 'test-grounds')
if (!grounds) {
  check('test-grounds prompt exists', false)
} else {
  const exact = await matchAnswer('test-grounds', "Lord's")
  check('exact match', exact?.tier === 'duck' && exact?.score === 10, JSON.stringify(exact))
  const article = await matchAnswer('test-grounds', 'The Oval!')
  check('punctuation tolerant', article?.tier === 'legbye' && article?.score === 25, JSON.stringify(article))
  const alias = await matchAnswer('test-grounds', 'Eden Garden')
  check('alias hits a tier', alias?.answer === 'Eden Gardens' && alias.score === 10, JSON.stringify(alias))
  const typo = await matchAnswer('test-grounds', 'Wankde')
  check('one-character typo forgiven', typo?.tier === 'legbye', JSON.stringify(typo))
  const miss = await matchAnswer('test-grounds', 'quantum physics')
  check('nonsense misses', miss === null, JSON.stringify(miss))
  const six = await matchAnswer('test-grounds', 'Bourda')
  check('top tier is 500', six?.tier === 'six' && six?.score === 500, JSON.stringify(six))
}

console.log('\n=== 70% autocorrect ===')
const nations = prompts.find((prompt) => prompt.id === 'test-nations')
if (!nations) {
  check('test-nations prompt exists', false)
} else {
  // "Zimbabw" is 7 of Zimbabwe's 8 letters (87.5%) and should be corrected.
  const near = await matchAnswer(nations.id, 'Zimbabw')
  check('near match autocorrects', near?.answer === 'Zimbabwe' && near.matchType === 'fuzzy', JSON.stringify(near))
  // "zim" is 3 of 8 (37.5%) — below the threshold.
  const tooFar = await matchAnswer(nations.id, 'zim')
  check('below 70% is rejected', tooFar === null, JSON.stringify(tooFar))
}

console.log('\n=== partial player names ===')
check('first name resolves to full name', (await matchAnswer('ipl-centurions', 'virat'))?.answer === 'Virat Kohli')
check('last name resolves to full name', (await matchAnswer('ipl-centurions', 'kohli'))?.answer === 'Virat Kohli')
check('player last name', (await matchAnswer('odi-double-century', 'gayle'))?.answer === 'Chris Gayle')

const playersPrompt = prompts.find((prompt) => prompt.id === 'india-captains')
if (playersPrompt) {
  const sachin = await matchAnswer(playersPrompt.id, 'sachin')
  check('surname alias', sachin?.answer === 'Sachin Tendulkar', JSON.stringify(sachin))
  const kohli = await matchAnswer(playersPrompt.id, 'Virat Kholi')
  check('player typo forgiven', kohli?.answer === 'Virat Kohli', JSON.stringify(kohli))
}

console.log('\n=== session draw ===')
const draws: string[][] = []
for (let attempt = 0; attempt < 5; attempt++) {
  const drawn = drawPrompts(await getBank(), 7)
  const texts = drawn.map((prompt) => prompt.text)
  draws.push(texts)
  const tally = new Map<string, number>()
  for (const prompt of drawn) tally.set(prompt.category, (tally.get(prompt.category) ?? 0) + 1)
  const most = Math.max(...tally.values())
  console.log(`  draw ${attempt + 1}: ${texts.join(' | ')}`)
  check(`draw ${attempt + 1} has 7 prompts`, drawn.length === 7)
  check(`draw ${attempt + 1} has no repeats`, new Set(texts).size === 7)
  check(`draw ${attempt + 1} spreads categories (max 2)`, most <= 2, `most ${most}`)
}
check(
  'consecutive draws differ',
  draws.some((texts, index) => index > 0 && texts.join('|') !== draws[index - 1].join('|')),
)

console.log(`\ntiers: ${Object.values(TIERS).map((tier) => `${tier.name}=${tier.score}`).join(', ')}`)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nall checks passed')
}

void main()
