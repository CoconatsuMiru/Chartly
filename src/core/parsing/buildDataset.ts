import type { ColumnData, ColumnMeta, Dataset, ParseWarning, SourceInfo } from '@/domain'
import { isMissing } from './cells'
import { parseDate } from './dateParsing'
import { normaliseGrid } from './headerDetection'
import { parseNumber } from './numberParsing'
import { inferColumn, type InferredColumn } from './typeInference'

function encodeColumn(
  values: string[],
  inf: InferredColumn,
  id: string,
  name: string,
  warnings: ParseWarning[],
): ColumnData {
  const n = values.length

  if (inf.type === 'number' || inf.type === 'date') {
    const out = new Float64Array(n)
    let bad = 0
    for (let i = 0; i < n; i++) {
      const v = values[i]
      if (isMissing(v)) {
        out[i] = NaN
        continue
      }
      const parsed =
        inf.type === 'number' ? (parseNumber(v)?.value ?? null) : parseDate(v, inf.dateOrder ?? 'mdy')
      if (parsed === null) {
        out[i] = NaN
        bad++
      } else {
        out[i] = parsed
      }
    }
    if (bad > 0) {
      warnings.push({
        code: inf.type === 'number' ? 'non-numeric-cells' : 'unparseable-dates',
        message: `${bad} cell(s) in "${name}" could not be read as ${inf.type === 'number' ? 'numbers' : 'dates'} and were treated as missing.`,
        columnId: id,
      })
    }
    if (inf.type === 'date' && inf.ambiguousDates) {
      warnings.push({
        code: 'ambiguous-dates',
        message: `Dates in "${name}" could be day-first or month-first. Month-first was assumed.`,
        columnId: id,
      })
    }
    return { kind: 'f64', values: out }
  }

  if (inf.type === 'boolean') {
    const out = new Int8Array(n)
    for (let i = 0; i < n; i++) {
      const v = values[i].toLowerCase()
      out[i] = v === 'true' || v === 'yes' ? 1 : v === 'false' || v === 'no' ? 0 : -1
    }
    return { kind: 'bool', values: out }
  }

  const map = new Map<string, number>()
  const dictionary: string[] = []
  const codes = new Int32Array(n)
  for (let i = 0; i < n; i++) {
    const v = values[i]
    if (isMissing(v)) {
      codes[i] = -1
      continue
    }
    let code = map.get(v)
    if (code === undefined) {
      code = dictionary.length
      dictionary.push(v)
      map.set(v, code)
    }
    codes[i] = code
  }
  return { kind: 'dict', codes, dictionary }
}

export function buildDataset(
  grid: string[][],
  source: Omit<SourceInfo, 'parseWarnings'>,
  opts: { headerRow?: number } = {},
): Dataset {
  const norm = normaliseGrid(grid, opts.headerRow)
  const warnings: ParseWarning[] = [...norm.warnings]
  const columns: ColumnMeta[] = []
  const data: ColumnData[] = []

  norm.headers.forEach((name, index) => {
    const id = `col_${index}`
    const values = norm.rows.map((r) => r[index] ?? '')
    const inf = inferColumn(values, name)
    columns.push({
      id,
      name,
      index,
      type: inf.type,
      role: inf.role,
      format: inf.format,
      typeConfidence: inf.confidence,
    })
    data.push(encodeColumn(values, inf, id, name, warnings))
  })

  return {
    id: `ds_${Date.now().toString(36)}`,
    source: { ...source, parseWarnings: warnings },
    columns,
    data,
    rowCount: norm.rows.length,
  }
}