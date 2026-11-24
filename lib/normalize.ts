/**
 * Answer normalisation. Deliberately aggressive: punctuation, accents, articles
 * and whitespace should never decide whether an answer scores.
 */
export function normalizeAnswer(raw: string): string {
  if (typeof raw !== 'string') return ''
  let s = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  s = s.toLowerCase()
  s = s.replace(/&/g, ' and ')
  s = s.replace(/['’`]/g, '')
  s = s.replace(/[^a-z0-9]+/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/^the /, '')
  s = s.replace(/^a /, '')
  s = s.replace(/^an /, '')
  return s
}

/** Optimal string alignment distance (Levenshtein + adjacent transpositions). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[m][n]
}

/** How much typo tolerance an answer of this length earns. */
export function fuzzyBudget(key: string): number {
  const len = key.length
  if (len >= 12) return 2
  if (len >= 6) return 1
  return 0
}

/** Common hand-written variants, folded at seed time. */
export function variantsOf(answer: string): string[] {
  const base = normalizeAnswer(answer)
  const out = new Set<string>([base])
  if (base.endsWith('s')) out.add(base.slice(0, -1))
  if (base.startsWith('the ')) out.add(base.slice(4))
  return [...out].filter(Boolean)
}
