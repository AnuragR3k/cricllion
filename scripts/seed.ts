import { getBank, getDb, getBankVersion } from '../lib/db'
import { drawPrompts } from '../lib/schedule'

async function main(): Promise<void> {
  await getDb()
  console.log(`content version: ${await getBankVersion()}`)

  const bank = await getBank()
  console.log(`\nBank holds ${bank.length} prompts.`)

  for (let session = 1; session <= 3; session++) {
    const drawn = drawPrompts(bank, 7)
    console.log(`\nSample session ${session}:`)
    drawn.forEach((prompt, index) => console.log(`  ${index + 1}. [${prompt.category}] ${prompt.text}`))
  }
}

void main()
