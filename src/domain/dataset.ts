export type ColumnType =
  | 'number'
  | 'date'
  | 'boolean'
  | 'category'
  | 'text'
  | 'identifier'

export type ColumnRole = 'measure' | 'dimension' | 'time' | 'identifier' | 'ignored'

export interface NumberFormatHint {
  unit?: 'currency' | 'percent'
  currencySymbol?: string
  integer: boolean
  decimals: number
}

export interface ParseWarning {
  code: string
  message: string
  row?: number
  columnId?: string
}

export interface ColumnMeta {
  id: string
  name: string
  index: number
  type: ColumnType
  role: ColumnRole
  format?: NumberFormatHint
  typeConfidence: number
}

export interface SourceInfo {
  fileName: string
  fileSize: number
  format: 'xlsx' | 'xls' | 'csv' | 'tsv'
  sheetName?: string
  delimiter?: string
  encoding?: string
  parseWarnings: ParseWarning[]
}

/** Columnar storage, lives only inside the worker. */
export type ColumnData =
  | { kind: 'f64'; values: Float64Array }
  | { kind: 'dict'; codes: Int32Array; dictionary: string[] }
  | { kind: 'bool'; values: Int8Array }

export interface Dataset {
  id: string
  source: SourceInfo
  columns: ColumnMeta[]
  data: ColumnData[]
  rowCount: number
}