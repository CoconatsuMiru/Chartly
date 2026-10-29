export interface NumericStats {
  min: number
  max: number
  mean: number
  median: number
  std: number
  q1: number
  q3: number
  sum: number
  skewness: number
  histogram: { binStart: number; binEnd: number; count: number }[]
  outlierCount: number
}

export interface CategoricalStats {
  distinct: number
  top: { value: string; count: number; share: number }[]
}

export interface DateStats {
  min: number
  max: number
  granularity: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'irregular'
}

export type QualityFlag =
  | 'high-missing'
  | 'constant'
  | 'mixed-types'
  | 'possible-total-row'
  | 'ambiguous-dates'

export interface ColumnProfile {
  columnId: string
  count: number
  missing: number
  missingRate: number
  distinct: number
  numeric?: NumericStats
  categorical?: CategoricalStats
  date?: DateStats
  qualityFlags: QualityFlag[]
}

export interface Correlation {
  a: string
  b: string
  r: number
  n: number
  method: 'pearson' | 'spearman'
}

export interface DatasetProfile {
  rowCount: number
  columnCount: number
  columns: ColumnProfile[]
  correlations: Correlation[]
  duplicateRowCount: number
}