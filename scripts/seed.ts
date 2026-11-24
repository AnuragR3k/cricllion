import { getDb, ensureDay, getBankVersion } from '../lib/db'
import { addDays, puzzleDate } from '../lib/schedule'

getDb()
console.log(`content version: ${getBankVersion()}`)

for (let offset = 0; offset < 7; offset++) {
  const date = addDays(puzzleDate(), offset)
  const day = ensureDay(date)
  console.log(`\nDay ${day.dayNumber} — ${day.date} (resets ${day.resetsAt})`)
  for (const prompt of day.prompts) {
    console.log(`  ${prompt.slot}. ${prompt.text}`)
  }
}

const today = ensureDay(puzzleDate())
console.log(`\nToday: day ${today.dayNumber}, ${today.prompts.length} prompts.`)
