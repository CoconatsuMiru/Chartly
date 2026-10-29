import type { NumericStats } from '@/domain'

/** Non-missing values, sorted ascending. */
export function validSorted(values: Float64Array): Float64Array {
  let n = 0
  for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i])) n++
  const out = new Float64Array(n)
  let j = 0
  for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i])) out[j++] = values[i]
  return out.sort()
}

/** Linear-interpolated quantile of a sorted array (p from 0 to 1). */
export function quantile(sorted: Float64Array, p: number): number {
  const n = sorted.length
  if (n === 0) return NaN
  const pos = (n - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function histogram(sorted: Float64Array, min: number, max: number) {
  const n = sorted.length
  if (min === max) return [{ binStart: min, binEnd: max, count: n }]

  const bins = Math.min(30, Math.max(5, Math.ceil(Math.log2(n)) + 1))
  const width = (max - min) / bins
  const counts = new Array<number>(bins).fill(0)
  for (let i = 0; i < n; i++) {
    counts[Math.min(bins - 1, Math.floor((sorted[i] - min) / width))]++
  }
  return counts.map((count, b) => ({
    binStart: min + b * width,
    binEnd: min + (b + 1) * width,
    count,
  }))
}

export function numericStats(values: Float64Array): NumericStats | null {
  const sorted = validSorted(values)
  const n = sorted.length
  if (n === 0) return null

  let sum = 0
  for (let i = 0; i < n; i++) sum += sorted[i]
  const mean = sum / n

  let m2 = 0
  let m3 = 0
  for (let i = 0; i < n; i++) {
    const d = sorted[i] - mean
    m2 += d * d
    m3 += d * d * d
  }
  const popVar = m2 / n
  const std = n > 1 ? Math.sqrt(m2 / (n - 1)) : 0
  const skewness = popVar > 0 ? m3 / n / Math.pow(popVar, 1.5) : 0

  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lo = q1 - 1.5 * iqr
  const hi = q3 + 1.5 * iqr
  let outlierCount = 0
  for (let i = 0; i < n; i++) if (sorted[i] < lo || sorted[i] > hi) outlierCount++

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median: quantile(sorted, 0.5),
    std,
    q1,
    q3,
    sum,
    skewness,
    histogram: histogram(sorted, sorted[0], sorted[n - 1]),
    outlierCount,
  }
}