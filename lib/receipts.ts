import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

let cachedSecret: string | null = null

function secret(): string {
  if (cachedSecret) return cachedSecret
  if (process.env.RECEIPT_SECRET) {
    cachedSecret = process.env.RECEIPT_SECRET
    return cachedSecret
  }
  const dir = path.join(process.cwd(), '.data')
  const file = path.join(dir, 'receipt-secret')
  try {
    cachedSecret = fs.readFileSync(file, 'utf8').trim()
  } catch {
    fs.mkdirSync(dir, { recursive: true })
    const fresh = randomBytes(32).toString('hex')
    fs.writeFileSync(file, fresh, { mode: 0o600 })
    cachedSecret = fresh
  }
  return cachedSecret
}

export type ReceiptPayload = {
  runId: string
  date: string
  promptId: string
  slot: number
  tier: string
  score: number
  ts: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function signature(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url')
}

export function makeReceipt(payload: ReceiptPayload): string {
  const body = b64url(JSON.stringify(payload))
  return `${body}.${signature(body)}`
}

export function readReceipt(receipt: string): ReceiptPayload | null {
  const dot = receipt.lastIndexOf('.')
  if (dot <= 0) return null
  const body = receipt.slice(0, dot)
  const sig = receipt.slice(dot + 1)
  const expected = signature(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (
      typeof parsed?.runId !== 'string' ||
      typeof parsed?.date !== 'string' ||
      typeof parsed?.promptId !== 'string' ||
      typeof parsed?.slot !== 'number' ||
      typeof parsed?.tier !== 'string' ||
      typeof parsed?.score !== 'number' ||
      typeof parsed?.ts !== 'number'
    ) {
      return null
    }
    return parsed as ReceiptPayload
  } catch {
    return null
  }
}
