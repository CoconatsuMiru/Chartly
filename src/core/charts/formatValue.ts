import { fmtNum } from '@/core/insights/format'
import type { NumberFormatHint } from '@/domain'

/** Compact text for axis labels: 12,500 -> "12.5k", $2,845,920 -> "$2.85M". */
export function formatValue(v: number | null | undefined, hint?: NumberFormatHint): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '–'
  return fmtNum(v, { format: hint })
}

/** Fuller text for tooltips and tables: $2,845,920.5. */
export function formatFull(v: number | null | undefined, hint?: NumberFormatHint): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '–'
  const body = Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 })
  const prefix = hint?.unit === 'currency' ? (hint.currencySymbol ?? '') : ''
  const suffix = hint?.unit === 'percent' ? '%' : ''
  return `${v < 0 ? '-' : ''}${prefix}${body}${suffix}`
}