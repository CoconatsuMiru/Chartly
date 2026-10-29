import { fmtPeriod } from '@/core/insights/format'
import { bucketStart } from '@/core/insights/timeSeries'
import type {
  Aggregation,
  ChartSpec,
  ColumnMeta,
  Dataset,
  DateGrain,
  FilterSpec,
  ResolvedChart,
} from '@/domain'
import { addToAcc, createAcc, finalizeAcc, mergeAcc, type Acc } from './aggregate'
import { downsample } from './downsample'
import { formatValue } from './formatValue'

const MAX_SCATTER_POINTS = 5000
const MAX_SERIES = 8
const AUTO_TOP_N = 30
const MAX_BUCKETS = 5000

type Reader = (row: number) => number | null
type RowTest = (row: number) => boolean
type ColumnIndex = Map<string, number>

interface Group {
  key: string
  label: string
  sortKey: number
  accs: Map<number, Acc>
}

interface Measure {
  name: string
  agg: Aggregation
  read: Reader
  meta: ColumnMeta
}

function makeReader(ds: Dataset, col: number): Reader {
  const d = ds.data[col]
  if (d.kind === 'f64') return (r) => (Number.isNaN(d.values[r]) ? null : d.values[r])
  if (d.kind === 'dict') return (r) => (d.codes[r] < 0 ? null : d.codes[r])
  return (r) => (d.values[r] < 0 ? null : d.values[r])
}

function buildFilter(ds: Dataset, filters: FilterSpec[], idx: ColumnIndex): RowTest {
  const tests: RowTest[] = []
  for (const f of filters) {
    const i = idx.get(f.columnId)
    if (i === undefined) continue
    const d = ds.data[i]

    if (d.kind === 'dict') {
      const list = Array.isArray(f.value) ? f.value : [String(f.value)]
      const label = (r: number) => (d.codes[r] < 0 ? null : d.dictionary[d.codes[r]])
      if (f.op === 'eq' || f.op === 'in') {
        tests.push((r) => {
          const l = label(r)
          return l !== null && list.includes(l)
        })
      } else if (f.op === 'neq') {
        tests.push((r) => {
          const l = label(r)
          return l === null || !list.includes(l)
        })
      }
    } else if (d.kind === 'f64' && !Array.isArray(f.value)) {
      const n = Number(f.value)
      const v = d.values
      if (f.op === 'eq') tests.push((r) => v[r] === n)
      else if (f.op === 'neq') tests.push((r) => v[r] !== n)
      else if (f.op === 'gt') tests.push((r) => v[r] > n)
      else if (f.op === 'gte') tests.push((r) => v[r] >= n)
      else if (f.op === 'lt') tests.push((r) => v[r] < n)
      else if (f.op === 'lte') tests.push((r) => v[r] <= n)
    }
  }
  return (r) => tests.every((t) => t(r))
}

function emptyChart(spec: ChartSpec, warnings: string[]): ResolvedChart {
  return {
    spec,
    categories: [],
    series: [],
    stats: { sourceRows: 0, plottedPoints: 0, downsampled: false },
    warnings,
  }
}

function nextBucket(ts: number, grain: DateGrain): number {
  const d = new Date(ts)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  switch (grain) {
    case 'day':
      return Date.UTC(y, m, day + 1)
    case 'week':
      return Date.UTC(y, m, day + 7)
    case 'month':
      return Date.UTC(y, m + 1, 1)
    case 'quarter':
      return Date.UTC(y, m + 3, 1)
    case 'year':
      return Date.UTC(y + 1, 0, 1)
  }
}

function resolveGrouped(
  spec: ChartSpec,
  ds: Dataset,
  idx: ColumnIndex,
  pass: RowTest,
  warnings: string[],
): ResolvedChart {
  const enc = spec.encoding
  const xCol = enc.x ? idx.get(enc.x.columnId) : undefined
  const xMeta = xCol !== undefined ? ds.columns[xCol] : undefined
  const xData = xCol !== undefined ? ds.data[xCol] : undefined
  const xRead = xCol !== undefined ? makeReader(ds, xCol) : null
  const isDate = xMeta?.type === 'date' && xData?.kind === 'f64'
  const grain: DateGrain = enc.x?.dateGrain ?? 'month'
  const withYear = xMeta?.dateFormat !== 'month-name'

  const sCol = enc.series ? idx.get(enc.series.columnId) : undefined
  const sData = sCol !== undefined ? ds.data[sCol] : undefined
  const split = sCol !== undefined && sData?.kind === 'dict'
  const sRead = split ? makeReader(ds, sCol) : null

  const measures: Measure[] = []
  for (const y of split ? enc.y.slice(0, 1) : enc.y) {
    const col = idx.get(y.columnId)
    if (col === undefined) {
      warnings.push('A column used by this chart is no longer in the data.')
      continue
    }
    const meta = ds.columns[col]
    let agg = y.aggregation
    if (ds.data[col].kind !== 'f64' && agg !== 'count' && agg !== 'countDistinct') {
      warnings.push(`"${meta.name}" is not numeric, so its rows are counted instead.`)
      agg = 'count'
    }
    measures.push({ name: y.label ?? meta.name, agg, read: makeReader(ds, col), meta })
  }
  if (measures.length === 0) return emptyChart(spec, warnings)

  const aggFor = (si: number): Aggregation => (split ? measures[0].agg : measures[si].agg)

  const groups = new Map<string, Group>()
  let rows = 0

  for (let r = 0; r < ds.rowCount; r++) {
    if (!pass(r)) continue

    let key = 'all'
    let label = 'Total'
    let sortKey: number | undefined = 0
    if (xRead && xData) {
      const v = xRead(r)
      if (v === null) continue
      if (isDate) {
        const b = bucketStart(v, grain)
        key = String(b)
        label = ''
        sortKey = b
      } else if (xData.kind === 'dict') {
        key = String(v)
        label = xData.dictionary[v]
        sortKey = undefined
      } else if (xData.kind === 'bool') {
        key = String(v)
        label = v === 1 ? 'true' : 'false'
        sortKey = undefined
      } else {
        key = String(v)
        label = String(v)
        sortKey = v
      }
    }

    let sc = -1
    if (sRead) {
      const s = sRead(r)
      if (s === null) continue
      sc = s
    }

    rows++
    let g = groups.get(key)
    if (!g) {
      g = { key, label, sortKey: sortKey ?? groups.size, accs: new Map() }
      groups.set(key, g)
    }

    for (let mi = 0; mi < measures.length; mi++) {
      const val = measures[mi].read(r)
      if (val === null) continue
      const si = split ? sc : mi
      let acc = g.accs.get(si)
      if (!acc) {
        acc = createAcc(aggFor(si))
        g.accs.set(si, acc)
      }
      addToAcc(acc, val)
    }
  }

  // Show empty periods as gaps so the time axis stays proportional.
  if (isDate && groups.size > 1) {
    let lo = Infinity
    let hi = -Infinity
    for (const g of groups.values()) {
      if (g.sortKey < lo) lo = g.sortKey
      if (g.sortKey > hi) hi = g.sortKey
    }
    const slots: number[] = []
    for (let t = lo; t <= hi && slots.length <= MAX_BUCKETS; t = nextBucket(t, grain)) slots.push(t)
    if (slots.length <= MAX_BUCKETS) {
      for (const t of slots) {
        const k = String(t)
        if (!groups.has(k)) groups.set(k, { key: k, label: '', sortKey: t, accs: new Map() })
      }
    }
    for (const g of groups.values()) g.label = fmtPeriod(g.sortKey, grain, withYear)
  }

  let cats = [...groups.values()]
  if (xData?.kind === 'f64') cats.sort((a, b) => a.sortKey - b.sortKey)

  const total = (g: Group): number => {
    let s = 0
    for (const [si, a] of g.accs) s += finalizeAcc(a, aggFor(si)) ?? 0
    return s
  }

  let topN = isDate ? undefined : spec.transforms.topN
  if (!topN && !isDate && cats.length > 100) {
    topN = AUTO_TOP_N
    warnings.push(`This column has ${cats.length} categories, so only the top ${AUTO_TOP_N} are shown.`)
  }

  let other: Group | null = null
  if (topN && cats.length > topN) {
    const keep = new Set([...cats].sort((a, b) => total(b) - total(a)).slice(0, topN))
    const rest = cats.filter((g) => !keep.has(g))
    cats = cats.filter((g) => keep.has(g))
    if (spec.transforms.groupRestAsOther) {
      const merged: Group = { key: '__other', label: 'Other', sortKey: 0, accs: new Map() }
      for (const g of rest) {
        for (const [si, a] of g.accs) {
          let t = merged.accs.get(si)
          if (!t) {
            t = createAcc(aggFor(si))
            merged.accs.set(si, t)
          }
          mergeAcc(t, a)
        }
      }
      other = merged
    }
  }

  const sort = spec.transforms.sort ?? 'none'
  if (sort === 'desc') cats.sort((a, b) => total(b) - total(a))
  else if (sort === 'asc') cats.sort((a, b) => total(a) - total(b))
  if (other) cats.push(other)

  let seriesDefs: { name: string; index: number }[]
  if (split && sData?.kind === 'dict') {
    const totals = new Map<number, number>()
    for (const g of cats) {
      for (const [si, a] of g.accs) {
        totals.set(si, (totals.get(si) ?? 0) + (finalizeAcc(a, aggFor(si)) ?? 0))
      }
    }
    let codes = [...totals.keys()].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0))
    if (codes.length > MAX_SERIES) {
      warnings.push(`Only the ${MAX_SERIES} largest groups are shown.`)
      codes = codes.slice(0, MAX_SERIES)
    }
    seriesDefs = codes.map((c) => ({ name: sData.dictionary[c], index: c }))
  } else {
    seriesDefs = measures.map((m, i) => ({ name: m.name, index: i }))
  }

  const series = seriesDefs.map((sd) => ({
    name: sd.name,
    values: cats.map((g) => {
      const a = g.accs.get(sd.index)
      return a ? finalizeAcc(a, aggFor(sd.index)) : null
    }),
  }))

  const first = measures[0]
  const countLike = first.agg === 'count' || first.agg === 'countDistinct'
  return {
    spec,
    categories: cats.map((g) => g.label),
    series,
    stats: { sourceRows: rows, plottedPoints: cats.length * series.length, downsampled: false },
    format: { y: countLike ? undefined : first.meta.format },
    warnings,
  }
}

function resolveScatter(
  spec: ChartSpec,
  ds: Dataset,
  idx: ColumnIndex,
  pass: RowTest,
  warnings: string[],
): ResolvedChart {
  const xi = spec.encoding.x ? idx.get(spec.encoding.x.columnId) : undefined
  const yi = spec.encoding.y[0] ? idx.get(spec.encoding.y[0].columnId) : undefined
  const xd = xi !== undefined ? ds.data[xi] : undefined
  const yd = yi !== undefined ? ds.data[yi] : undefined
  if (xi === undefined || yi === undefined || xd?.kind !== 'f64' || yd?.kind !== 'f64') {
    warnings.push('A scatter chart needs two numeric columns.')
    return emptyChart(spec, warnings)
  }

  const sCol = spec.encoding.series ? idx.get(spec.encoding.series.columnId) : undefined
  let sd = sCol !== undefined && ds.data[sCol].kind === 'dict' ? ds.data[sCol] : undefined
  if (sd?.kind === 'dict' && sd.dictionary.length > MAX_SERIES) {
    warnings.push(`Too many groups to colour (more than ${MAX_SERIES}), so points are not split.`)
    sd = undefined
  }

  const pts: { x: number; y: number; group?: string }[] = []
  for (let r = 0; r < ds.rowCount; r++) {
    if (!pass(r)) continue
    const x = xd.values[r]
    const y = yd.values[r]
    if (Number.isNaN(x) || Number.isNaN(y)) continue
    if (sd?.kind === 'dict') {
      const c = sd.codes[r]
      if (c < 0) continue
      pts.push({ x, y, group: sd.dictionary[c] })
    } else {
      pts.push({ x, y })
    }
  }

  const sampled = downsample(pts, MAX_SCATTER_POINTS)
  return {
    spec,
    categories: [],
    series: [],
    points: sampled,
    stats: {
      sourceRows: pts.length,
      plottedPoints: sampled.length,
      downsampled: sampled.length < pts.length,
    },
    format: { x: ds.columns[xi].format, y: ds.columns[yi].format },
    warnings,
  }
}

function resolveHistogram(
  spec: ChartSpec,
  ds: Dataset,
  idx: ColumnIndex,
  pass: RowTest,
  warnings: string[],
): ResolvedChart {
  const colId = spec.encoding.x?.columnId ?? spec.encoding.y[0]?.columnId
  const ci = colId ? idx.get(colId) : undefined
  const d = ci !== undefined ? ds.data[ci] : undefined
  if (ci === undefined || d?.kind !== 'f64') {
    warnings.push('A histogram needs a numeric column.')
    return emptyChart(spec, warnings)
  }

  const vals: number[] = []
  let min = Infinity
  let max = -Infinity
  for (let r = 0; r < ds.rowCount; r++) {
    if (!pass(r)) continue
    const v = d.values[r]
    if (Number.isNaN(v)) continue
    vals.push(v)
    if (v < min) min = v
    if (v > max) max = v
  }
  if (vals.length === 0) return emptyChart(spec, warnings)

  const meta = ds.columns[ci]
  const single = min === max
  const bins = single ? 1 : Math.max(2, Math.min(60, spec.encoding.x?.bins ?? 10))
  const width = (max - min) / bins
  const counts = new Array<number>(bins).fill(0)
  for (const v of vals) counts[single ? 0 : Math.min(bins - 1, Math.floor((v - min) / width))]++

  const categories = counts.map((_, b) =>
    single
      ? formatValue(min, meta.format)
      : `${formatValue(min + b * width, meta.format)} – ${formatValue(min + (b + 1) * width, meta.format)}`,
  )

  return {
    spec,
    categories,
    series: [{ name: spec.encoding.y[0]?.label ?? 'Rows', values: counts }],
    stats: { sourceRows: vals.length, plottedPoints: bins, downsampled: false },
    format: { x: meta.format },
    warnings,
  }
}

/** Turns a chart description into small, aggregated, ready-to-draw data. */
export function resolveChart(spec: ChartSpec, ds: Dataset): ResolvedChart {
  const warnings: string[] = []
  if (spec.type === 'kpi' || spec.type === 'table') {
    warnings.push(`${spec.type === 'kpi' ? 'KPI tiles' : 'Tables'} are not drawn as charts.`)
    return emptyChart(spec, warnings)
  }
  if (spec.encoding.y.length === 0) {
    warnings.push('This chart has no value column.')
    return emptyChart(spec, warnings)
  }

  const idx: ColumnIndex = new Map(ds.columns.map((c, i) => [c.id, i]))
  const pass = buildFilter(ds, spec.transforms.filter ?? [], idx)

  if (spec.type === 'scatter') return resolveScatter(spec, ds, idx, pass, warnings)
  if (spec.type === 'histogram') return resolveHistogram(spec, ds, idx, pass, warnings)
  return resolveGrouped(spec, ds, idx, pass, warnings)
}