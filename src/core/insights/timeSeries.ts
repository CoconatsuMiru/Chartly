import type { DateGrain, DateStats } from '@/domain'

const DAY = 86_400_000

export interface SeriesPoint {
  t: number
  value: number
}

/** Native granularity wins; daily or irregular data is rolled up to months when it spans long enough. */
export function chooseGrain(stats: DateStats): DateGrain {
  const span = (stats.max - stats.min) / DAY
  if (stats.granularity === 'day') return span > 120 ? 'month' : 'day'
  if (stats.granularity === 'irregular') return span > 90 ? 'month' : 'day'
  return stats.granularity
}

export function bucketStart(ts: number, grain: DateGrain): number {
  const d = new Date(ts)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  switch (grain) {
    case 'day':
      return Date.UTC(y, m, day)
    case 'week':
      return Date.UTC(y, m, day - ((d.getUTCDay() + 6) % 7))
    case 'month':
      return Date.UTC(y, m, 1)
    case 'quarter':
      return Date.UTC(y, Math.floor(m / 3) * 3, 1)
    case 'year':
      return Date.UTC(y, 0, 1)
  }
}

function isLastBucketPartial(maxTs: number, grain: DateGrain): boolean {
  return bucketStart(maxTs + DAY, grain) === bucketStart(maxTs, grain)
}

export function buildMeasureSeries(
  dates: Float64Array,
  values: Float64Array,
  stats: DateStats,
  agg: 'sum' | 'mean',
): { points: SeriesPoint[]; grain: DateGrain } {
  const grain = chooseGrain(stats)
  const map = new Map<number, { sum: number; n: number }>()
  const len = Math.min(dates.length, values.length)

  for (let i = 0; i < len; i++) {
    const t = dates[i]
    const v = values[i]
    if (Number.isNaN(t) || Number.isNaN(v)) continue
    const key = bucketStart(t, grain)
    const acc = map.get(key)
    if (acc) {
      acc.sum += v
      acc.n++
    } else {
      map.set(key, { sum: v, n: 1 })
    }
  }

  const points = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, a]) => ({ t, value: agg === 'sum' ? a.sum : a.sum / a.n }))

  // When rolling daily data up, a half-finished last period would look like a fake drop.
  const rolledUp = (stats.granularity === 'day' || stats.granularity === 'irregular') && grain !== 'day'
  if (rolledUp && points.length > 0 && isLastBucketPartial(stats.max, grain)) points.pop()

  return { points, grain }
}

export function linearFit(ys: number[]): { slope: number; r2: number } {
  const n = ys.length
  const mx = (n - 1) / 2
  const my = ys.reduce((s, v) => s + v, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    const dx = i - mx
    const dy = ys[i] - my
    sxy += dx * dy
    sxx += dx * dx
    syy += dy * dy
  }
  if (sxx === 0) return { slope: 0, r2: 0 }
  return { slope: sxy / sxx, r2: syy === 0 ? 0 : (sxy * sxy) / (sxx * syy) }
}