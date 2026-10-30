import type { Aggregation, Dataset } from '@/domain'
import { addToAcc, createAcc, finalizeAcc } from './aggregate'

export interface KpiRequest {
  columnId: string
  aggregation: Aggregation
}

/** One headline number for a KPI tile. Text columns can only be counted. */
export function computeKpi(ds: Dataset, req: KpiRequest): number | null {
  const col = ds.columns.findIndex((c) => c.id === req.columnId)
  if (col < 0) return null

  const d = ds.data[col]
  const countLike = req.aggregation === 'count' || req.aggregation === 'countDistinct'
  if (d.kind !== 'f64' && !countLike) return null

  const read = (r: number): number => {
    if (d.kind === 'f64') return d.values[r]
    if (d.kind === 'dict') return d.codes[r] < 0 ? NaN : d.codes[r]
    return d.values[r] < 0 ? NaN : d.values[r]
  }

  const acc = createAcc(req.aggregation)
  for (let r = 0; r < ds.rowCount; r++) {
    const v = read(r)
    if (!Number.isNaN(v)) addToAcc(acc, v)
  }
  return finalizeAcc(acc, req.aggregation)
}