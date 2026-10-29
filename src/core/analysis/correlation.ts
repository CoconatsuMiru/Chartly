import type { Correlation } from '@/domain'

/** Pearson correlation over rows where both values exist. */
export function pearson(a: Float64Array, b: Float64Array): { r: number; n: number } | null {
  let n = 0
  let sa = 0
  let sb = 0
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(a[i]) || Number.isNaN(b[i])) continue
    n++
    sa += a[i]
    sb += b[i]
  }
  if (n < 2) return null
  const ma = sa / n
  const mb = sb / n

  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(a[i]) || Number.isNaN(b[i])) continue
    const da = a[i] - ma
    const db = b[i] - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  if (va === 0 || vb === 0) return null
  return { r: cov / Math.sqrt(va * vb), n }
}

export function computeCorrelations(
  columns: { id: string; values: Float64Array }[],
  opts: { minN?: number; maxColumns?: number; maxResults?: number } = {},
): Correlation[] {
  const { minN = 10, maxColumns = 20, maxResults = 50 } = opts
  const cols = columns.slice(0, maxColumns)
  const out: Correlation[] = []

  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const res = pearson(cols[i].values, cols[j].values)
      if (res && res.n >= minN) {
        out.push({ a: cols[i].id, b: cols[j].id, r: res.r, n: res.n, method: 'pearson' })
      }
    }
  }
  return out.sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, maxResults)
}