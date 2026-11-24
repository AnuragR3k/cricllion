import { isDateString, puzzleDate } from './schedule'

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) },
  })
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return json({ error, ...extra }, { status })
}

export function isPlayerId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value)
}

export function isRunId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value)
}

export function resolveDate(url: URL): string | null {
  const date = url.searchParams.get('date') ?? puzzleDate()
  return isDateString(date) ? date : null
}

export function isFuture(date: string): boolean {
  return date > puzzleDate()
}
