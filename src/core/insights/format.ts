import type { ColumnMeta, DateGrain } from '@/domain'

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const trimNum = (n: number, digits: number) => String(Number(n.toFixed(digits)))

/** Compact, unit-aware number: 1,200 -> "1,200", 2,845,920 -> "$2.85M". */
export function fmtNum(v: number, meta?: Pick<ColumnMeta, 'format'>): string {
  const f = meta?.format
  const abs = Math.abs(v)
  let body: string
  if (abs >= 1e9) body = `${trimNum(abs / 1e9, 2)}B`
  else if (abs >= 1e6) body = `${trimNum(abs / 1e6, 2)}M`
  else if (abs >= 1e4) body = `${trimNum(abs / 1e3, 1)}k`
  else body = abs.toLocaleString('en-US', { maximumFractionDigits: abs >= 100 ? 0 : 2 })
  const prefix = f?.unit === 'currency' ? (f.currencySymbol ?? '') : ''
  const suffix = f?.unit === 'percent' ? '%' : ''
  return `${v < 0 ? '-' : ''}${prefix}${body}${suffix}`
}

/** Ratio to percent text: 0.488 -> "49%", 0.048 -> "4.8%". */
export function fmtPct(ratio: number): string {
  const v = ratio * 100
  return v < 10 ? `${trimNum(v, 1)}%` : `${Math.round(v)}%`
}

export function signedPct(ratio: number): string {
  return `${ratio >= 0 ? '+' : '-'}${fmtPct(Math.abs(ratio))}`
}

export const GRAIN_ADJ: Record<DateGrain, string> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  quarter: 'quarterly',
  year: 'yearly',
}

/** withYear is false for month-name columns, where no real year exists. */
export function fmtPeriod(ts: number, grain: DateGrain, withYear = true): string {
  const d = new Date(ts)
  switch (grain) {
    case 'year':
      return String(d.getUTCFullYear())
    case 'quarter':
      return withYear
        ? `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`
        : `Q${Math.floor(d.getUTCMonth() / 3) + 1}`
    case 'month':
      return d.toLocaleDateString(
        'en-US',
        withYear ? { month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', timeZone: 'UTC' },
      )
    default:
      return d.toLocaleDateString(
        'en-US',
        withYear
          ? { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
          : { month: 'short', day: 'numeric', timeZone: 'UTC' },
      )
  }
}