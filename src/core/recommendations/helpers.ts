import { columnProfile } from '@/core/insights/columns'
import type { ColumnMeta, Dataset, DatasetProfile } from '@/domain'

export interface DimCol {
  index: number
  meta: ColumnMeta
  labels: string[]
  distinct: number
}

/** Category columns that are good chart axes: 2 to 50 distinct values. */
export function getDimensions(ds: Dataset, profile: DatasetProfile, max = 3): DimCol[] {
  const out: DimCol[] = []
  ds.columns.forEach((meta, index) => {
    const d = ds.data[index]
    if (meta.role !== 'dimension' || d.kind !== 'dict') return
    const distinct = columnProfile(profile, meta.id)?.distinct ?? 0
    if (distinct < 2 || distinct > 50) return
    out.push({ index, meta, labels: d.dictionary, distinct })
  })
  return out.slice(0, max)
}

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)