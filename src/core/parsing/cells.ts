const MISSING = new Set(['', 'n/a', 'na', 'null', 'nan', 'none', '-', '--', '#n/a'])

export function isMissing(value: string): boolean {
  return MISSING.has(value.trim().toLowerCase())
}