import type {
  ColumnMeta,
  ColumnProfile,
  Dataset,
  DatasetProfile,
  QualityFlag,
} from '@/domain'
import { categoricalFromBool, categoricalFromCodes } from './categorical'
import { computeCorrelations } from './correlation'
import { numericStats } from './descriptive'
import { dateStats } from './dateStats'

const HIGH_MISSING = 0.3
const DUPLICATE_ROW_LIMIT = 200_000

function profileColumn(ds: Dataset, meta: ColumnMeta, index: number): ColumnProfile {
  const d = ds.data[index]
  const flags: QualityFlag[] = []
  const profile: ColumnProfile = {
    columnId: meta.id,
    count: 0,
    missing: 0,
    missingRate: 0,
    distinct: 0,
    qualityFlags: flags,
  }

  if (d.kind === 'f64') {
    const seen = new Set<number>()
    for (let i = 0; i < d.values.length; i++) {
      if (!Number.isNaN(d.values[i])) {
        profile.count++
        seen.add(d.values[i])
      }
    }
    profile.distinct = seen.size
    if (meta.type === 'number') profile.numeric = numericStats(d.values) ?? undefined
    if (meta.type === 'date') profile.date = dateStats(d.values) ?? undefined
  } else if (d.kind === 'dict') {
    const res = categoricalFromCodes(d.codes, d.dictionary)
    profile.count = res.count
    profile.distinct = res.stats.distinct
    profile.categorical = res.stats
  } else {
    const res = categoricalFromBool(d.values)
    profile.count = res.count
    profile.distinct = res.stats.distinct
    profile.categorical = res.stats
  }

  profile.missing = ds.rowCount - profile.count
  profile.missingRate = ds.rowCount > 0 ? profile.missing / ds.rowCount : 0

  if (profile.missingRate >= HIGH_MISSING) flags.push('high-missing')
  if (profile.count > 0 && profile.distinct <= 1) flags.push('constant')
  if (ds.source.parseWarnings.some((w) => w.code === 'ambiguous-dates' && w.columnId === meta.id)) {
    flags.push('ambiguous-dates')
  }
  return profile
}

function countDuplicateRows(ds: Dataset): number {
  if (ds.rowCount > DUPLICATE_ROW_LIMIT) return 0
  const seen = new Set<string>()
  let dupes = 0
  for (let r = 0; r < ds.rowCount; r++) {
    let key = ''
    for (const d of ds.data) {
      const v = d.kind === 'dict' ? d.codes[r] : d.values[r]
      key += `${v}\u0001`
    }
    if (seen.has(key)) dupes++
    else seen.add(key)
  }
  return dupes
}

export function buildProfile(ds: Dataset): DatasetProfile {
  const columns = ds.columns.map((meta, i) => profileColumn(ds, meta, i))

  const measures: { id: string; values: Float64Array }[] = []
  ds.columns.forEach((meta, i) => {
    const d = ds.data[i]
    if (meta.type === 'number' && meta.role === 'measure' && d.kind === 'f64') {
      measures.push({ id: meta.id, values: d.values })
    }
  })

  return {
    rowCount: ds.rowCount,
    columnCount: ds.columns.length,
    columns,
    correlations: computeCorrelations(measures),
    duplicateRowCount: countDuplicateRows(ds),
  }
}