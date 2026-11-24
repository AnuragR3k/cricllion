import { getBank, getDb, getBankVersion } from '../lib/db'
import { drawPrompts } from '../lib/schedule'

getDb()
console.log(`content version: ${getBankVersion()}`)

const bank = getBank()
console.log(`\nBank holds ${bank.length} prompts.`)

for (let session = 1; session <= 3; session++) {
  const drawn = drawPrompts(bank, 7)
  console.log(`\nSample session ${session}:`)
  drawn.forEach((prompt, index) => console.log(`  ${index + 1}. [${prompt.category}] ${prompt.text}`))
}
