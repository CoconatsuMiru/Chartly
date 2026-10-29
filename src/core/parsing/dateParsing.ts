export type DateOrder = 'dmy' | 'mdy'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Placeholder year for columns that only contain month names. It is never shown to the user. */
export const MONTH_ANCHOR_YEAR = 2000

const MONTH_NAME_LOOKUP = new Map<string, number>()
MONTH_LABELS.forEach((full, i) => {
  MONTH_NAME_LOOKUP.set(full.toLowerCase(), i + 1)
  MONTH_NAME_LOOKUP.set(full.slice(0, 3).toLowerCase(), i + 1)
})
MONTH_NAME_LOOKUP.set('sept', 9)

const ISO = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?)?$/
const NUMERIC = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/
const DAY_MONTH_NAME = /^(\d{1,2})[ -]([A-Za-z]{3,9}),?[ -](\d{4})$/
const MONTH_NAME_DAY = /^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/

function utc(y: number, m: number, d: number, hh = 0, mm = 0, ss = 0): number | null {
  const t = Date.UTC(y, m - 1, d, hh, mm, ss)
  const dt = new Date(t)
  const ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  return ok ? t : null
}

function monthNumber(name: string): number | null {
  const i = MONTHS.indexOf(name.slice(0, 3).toLowerCase())
  return i < 0 ? null : i + 1
}

function fullYear(y: string): number {
  const n = Number(y)
  return y.length === 2 ? (n < 70 ? 2000 + n : 1900 + n) : n
}

/** "January", "jan", "Sept." -> 1..12, or null when the text is not a month name. */
export function parseMonthName(raw: string): number | null {
  const key = raw.trim().toLowerCase().replace(/\.$/, '')
  return MONTH_NAME_LOOKUP.get(key) ?? null
}

/** A bare month name as a timestamp in the placeholder year. */
export function parseMonthNameDate(raw: string): number | null {
  const m = parseMonthName(raw)
  return m === null ? null : Date.UTC(MONTH_ANCHOR_YEAR, m - 1, 1)
}

/** Returns UTC epoch milliseconds, or null if the text is not a valid date. */
export function parseDate(raw: string, order: DateOrder = 'mdy'): number | null {
  const s = raw.trim()
  let m = ISO.exec(s)
  if (m) return utc(+m[1], +m[2], +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))

  m = NUMERIC.exec(s)
  if (m) {
    const a = +m[1]
    const b = +m[2]
    const y = fullYear(m[3])
    return order === 'dmy' ? utc(y, b, a) : utc(y, a, b)
  }

  m = DAY_MONTH_NAME.exec(s)
  if (m) {
    const mo = monthNumber(m[2])
    return mo ? utc(+m[3], mo, +m[1]) : null
  }

  m = MONTH_NAME_DAY.exec(s)
  if (m) {
    const mo = monthNumber(m[1])
    return mo ? utc(+m[3], mo, +m[2]) : null
  }
  return null
}

/** Decides day-first vs month-first from samples like 13/01/2024. */
export function detectDateOrder(samples: string[]): { order: DateOrder; ambiguous: boolean } {
  let dmy = false
  let mdy = false
  let seenNumeric = false
  for (const s of samples) {
    const m = NUMERIC.exec(s.trim())
    if (!m) continue
    seenNumeric = true
    if (+m[1] > 12) dmy = true
    if (+m[2] > 12) mdy = true
  }
  if (dmy && !mdy) return { order: 'dmy', ambiguous: false }
  if (mdy && !dmy) return { order: 'mdy', ambiguous: false }
  return { order: 'mdy', ambiguous: seenNumeric }
}