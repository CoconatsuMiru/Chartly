import type { ParseWarning } from '@/domain'
import { parseNumber } from './numberParsing'

export interface NormalisedGrid {
  headers: string[]
  rows: string[][]
  headerRow: number
  warnings: ParseWarning[]
}

const TOTAL = /^(grand\s+)?(sub)?totals?$/i

/** First row (within the top 10) that is mostly filled and mostly text. */
export function detectHeaderRow(rows: string[][], width: number): number {
  const limit = Math.min(rows.length - 1, 10)
  for (let i = 0; i < limit; i++) {
    const filled = rows[i].filter((c) => c !== '')
    if (filled.length < width * 0.6) continue
    const textual = filled.filter((c) => parseNumber(c) === null).length
    if (textual / filled.length >= 0.6) return i
  }
  return 0
}

export function normaliseGrid(grid: string[][], headerRowOverride?: number): NormalisedGrid {
  const warnings: ParseWarning[] = []
  const cleaned = grid.map((r) => r.map((c) => String(c ?? '').trim()))
  const nonEmpty = cleaned.filter((r) => r.some((c) => c !== ''))

  let width = 0
  for (const r of nonEmpty) if (r.length > width) width = r.length
  const padded = nonEmpty.map((r) =>
    r.length === width ? r : [...r, ...Array<string>(width - r.length).fill('')],
  )

  const keep: number[] = []
  for (let c = 0; c < width; c++) {
    if (padded.some((r) => r[c] !== '')) keep.push(c)
  }
  const trimmed = padded.map((r) => keep.map((c) => r[c]))

  if (trimmed.length === 0) return { headers: [], rows: [], headerRow: 0, warnings }

  const headerRow = headerRowOverride ?? detectHeaderRow(trimmed, keep.length)
  if (headerRow > 0) {
    warnings.push({
      code: 'skipped-rows',
      message: `Skipped ${headerRow} row(s) above the header row.`,
    })
  }

  const rawHeaders = trimmed[headerRow]
  let body = trimmed.slice(headerRow + 1)

  const last = body[body.length - 1]
  if (last && TOTAL.test(last[0])) {
    body = body.slice(0, -1)
    warnings.push({
      code: 'total-row-removed',
      message: `Removed a "${last[0]}" row at the bottom so it doesn't distort sums.`,
    })
  }

  const seen = new Map<string, number>()
  const headers = rawHeaders.map((h, i) => {
    const base = h || `Column ${i + 1}`
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base} (${count})`
  })

  return { headers, rows: body, headerRow, warnings }
}