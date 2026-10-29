export interface ParsedNumber {
  value: number
  unit?: 'currency' | 'percent'
  currencySymbol?: string
  decimals: number
}

/**
 * Parses "1,234.56", "1.234,56", "(1,200)", "$5", "-$5", "12.5%".
 * Percent values keep their displayed number (12% -> 12).
 */
export function parseNumber(raw: string): ParsedNumber | null {
  let s = raw.trim()
  if (s === '') return null

  let negative = false
  let unit: ParsedNumber['unit']
  let currencySymbol: string | undefined

  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1).trim()
  }

  const takeSign = () => {
    if (s.startsWith('-')) {
      negative = !negative
      s = s.slice(1).trim()
    } else if (s.startsWith('+')) {
      s = s.slice(1).trim()
    }
  }

  takeSign()
  const pre = /^([$€£¥₱₹])\s*/.exec(s)
  if (pre) {
    unit = 'currency'
    currencySymbol = pre[1]
    s = s.slice(pre[0].length)
  }
  takeSign()
  const post = /\s*([$€£¥₱₹])$/.exec(s)
  if (post) {
    unit = 'currency'
    currencySymbol = post[1]
    s = s.slice(0, post.index)
  }
  if (s.endsWith('%')) {
    unit = 'percent'
    s = s.slice(0, -1).trim()
  }

  if (!/^(\d[\d.,' ]*|\.\d+)$/.test(s)) return null
  s = s.replace(/[' ]/g, '')

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    const decimalSep = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.'
    const thousandSep = decimalSep === ',' ? '.' : ','
    s = s.split(thousandSep).join('').replace(decimalSep, '.')
  } else if (hasComma) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (hasDot && /^\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, '')
  }

  const value = Number(s)
  if (!Number.isFinite(value)) return null
  const decimals = s.includes('.') ? s.length - s.indexOf('.') - 1 : 0
  return { value: negative ? -value : value, unit, currencySymbol, decimals }
}