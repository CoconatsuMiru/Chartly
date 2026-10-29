import type { Dataset } from '@/domain'

export function formatCell(ds: Dataset, col: number, row: number): string {
  const meta = ds.columns[col]
  const d = ds.data[col]

  switch (d.kind) {
    case 'f64': {
      const v = d.values[row]
      if (Number.isNaN(v)) return ''
      if (meta.type === 'date') return new Date(v).toISOString().slice(0, 10)
      const f = meta.format
      const text = Math.abs(v).toLocaleString('en-US', {
        minimumFractionDigits: f?.decimals ?? 0,
        maximumFractionDigits: f?.decimals ?? 4,
      })
      const prefix = f?.unit === 'currency' ? (f.currencySymbol ?? '') : ''
      const suffix = f?.unit === 'percent' ? '%' : ''
      return `${v < 0 ? '-' : ''}${prefix}${text}${suffix}`
    }
    case 'dict': {
      const code = d.codes[row]
      return code < 0 ? '' : d.dictionary[code]
    }
    case 'bool': {
      const v = d.values[row]
      return v < 0 ? '' : v === 1 ? 'true' : 'false'
    }
  }
}

export function getRowsAsText(ds: Dataset, offset: number, limit: number): string[][] {
  const end = Math.min(ds.rowCount, offset + limit)
  const rows: string[][] = []
  for (let r = offset; r < end; r++) {
    rows.push(ds.columns.map((_, c) => formatCell(ds, c, r)))
  }
  return rows
}