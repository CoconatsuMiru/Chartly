import type { ColumnMeta, Dataset, DatasetProfile, DateStats } from '@/domain'

export interface NumCol {
  index: number
  meta: ColumnMeta
  values: Float64Array
}

export interface TimeCol extends NumCol {
  stats: DateStats
}

export function getMeasures(ds: Dataset, max = 8): NumCol[] {
  const out: NumCol[] = []
  ds.columns.forEach((meta, index) => {
    const d = ds.data[index]
    if (meta.type === 'number' && meta.role === 'measure' && d.kind === 'f64') {
      out.push({ index, meta, values: d.values })
    }
  })
  return out.slice(0, max)
}

export function getTimeColumn(ds: Dataset, profile: DatasetProfile): TimeCol | null {
  for (let index = 0; index < ds.columns.length; index++) {
    const meta = ds.columns[index]
    const d = ds.data[index]
    if (meta.type !== 'date' || meta.role !== 'time' || d.kind !== 'f64') continue
    const stats = profile.columns.find((c) => c.columnId === meta.id)?.date
    if (stats) return { index, meta, values: d.values, stats }
  }
  return null
}

/** Percentages are averaged over a period; everything else is totalled. */
export function aggregationFor(meta: ColumnMeta): 'sum' | 'mean' {
  return meta.format?.unit === 'percent' ? 'mean' : 'sum'
}

export function columnProfile(profile: DatasetProfile, id: string) {
  return profile.columns.find((c) => c.columnId === id)
}

export function metaById(ds: Dataset, id: string): ColumnMeta | undefined {
  return ds.columns.find((c) => c.id === id)
}