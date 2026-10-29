import type { ColumnRole, ColumnType, NumberFormatHint } from '@/domain'
import { isMissing } from './cells'
import { detectDateOrder, parseDate, parseMonthName, type DateOrder } from './dateParsing'
import { parseNumber, type ParsedNumber } from './numberParsing'

export interface InferredColumn {
  type: ColumnType
  role: ColumnRole
  confidence: number
  format?: NumberFormatHint
  dateOrder?: DateOrder
  ambiguousDates?: boolean
  /** The column holds bare month names, not full dates. */
  monthNames?: boolean
}

const BOOL = new Set(['true', 'false', 'yes', 'no'])
const ID_NAME = /(^|[\s_-])(id|uuid|sku|code|ref)($|[\s_-])/i
const YEAR_NAME = /year|yr/i
const SAMPLE_SIZE = 1000

function sample(values: string[]): string[] {
  const present = values.filter((v) => !isMissing(v)).map((v) => v.trim())
  if (present.length <= SAMPLE_SIZE) return present
  const step = present.length / SAMPLE_SIZE
  return Array.from({ length: SAMPLE_SIZE }, (_, i) => present[Math.floor(i * step)])
}

export function inferColumn(values: string[], name = ''): InferredColumn {
  const s = sample(values)
  if (s.length === 0) return { type: 'text', role: 'ignored', confidence: 1 }
  const n = s.length

  if (s.every((v) => BOOL.has(v.toLowerCase()))) {
    return { type: 'boolean', role: 'dimension', confidence: 1 }
  }

  // Month names: tolerant of a few typos, but needs several different months.
  const monthHits = s.map(parseMonthName).filter((m): m is number => m !== null)
  if (monthHits.length / n >= 0.8 && new Set(monthHits).size >= 3) {
    return { type: 'date', role: 'time', confidence: monthHits.length / n, monthNames: true }
  }

  const { order, ambiguous } = detectDateOrder(s)
  const dateRate = s.filter((v) => parseDate(v, order) !== null).length / n
  if (dateRate >= 0.95) {
    return { type: 'date', role: 'time', confidence: dateRate, dateOrder: order, ambiguousDates: ambiguous }
  }

  const leadingZero = s.some((v) => /^0\d+$/.test(v))
  const parsed = s.map(parseNumber)
  const nums = parsed.filter((p): p is ParsedNumber => p !== null)
  const numRate = nums.length / n

  if (!leadingZero && numRate >= 0.95) {
    const currency = nums.filter((p) => p.unit === 'currency')
    const percent = nums.filter((p) => p.unit === 'percent')
    const unit =
      currency.length / nums.length > 0.5
        ? 'currency'
        : percent.length / nums.length > 0.5
          ? 'percent'
          : undefined
    const decimals = Math.min(4, Math.max(...nums.map((p) => p.decimals)))
    const format: NumberFormatHint = {
      unit,
      currencySymbol: currency[0]?.currencySymbol,
      integer: decimals === 0,
      decimals,
    }
    if (ID_NAME.test(name)) return { type: 'identifier', role: 'identifier', confidence: numRate }
    const yearLike =
      YEAR_NAME.test(name) && nums.every((p) => Number.isInteger(p.value) && p.value >= 1900 && p.value <= 2100)
    return { type: 'number', role: yearLike ? 'dimension' : 'measure', confidence: numRate, format }
  }

  const distinct = new Set(s).size
  const ratio = distinct / n
  const spaced = s.some((v) => /\s/.test(v))
  if (ratio > 0.98 && n >= 20 && (ID_NAME.test(name) || !spaced)) {
    return { type: 'identifier', role: 'identifier', confidence: 0.8 }
  }
  if (distinct <= 50 || ratio <= 0.5) {
    return { type: 'category', role: 'dimension', confidence: 0.9 }
  }
  return { type: 'text', role: 'ignored', confidence: 0.8 }
}