import type { DateStats } from '@/domain'
import { validSorted, quantile } from './descriptive'

const DAY = 86_400_000

export function dateStats(values: Float64Array): DateStats | null {
  const sorted = validSorted(values)
  if (sorted.length === 0) return null

  const unique: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] !== sorted[i - 1]) unique.push(sorted[i])
  }

  let granularity: DateStats['granularity'] = 'irregular'
  if (unique.length >= 3) {
    const gaps = new Float64Array(unique.length - 1)
    for (let i = 1; i < unique.length; i++) gaps[i - 1] = (unique[i] - unique[i - 1]) / DAY
    const g = quantile(gaps.sort(), 0.5)
    if (g <= 1.5) granularity = 'day'
    else if (g >= 5 && g <= 9) granularity = 'week'
    else if (g >= 25 && g <= 35) granularity = 'month'
    else if (g >= 80 && g <= 100) granularity = 'quarter'
    else if (g >= 350 && g <= 380) granularity = 'year'
  }

  return { min: sorted[0], max: sorted[sorted.length - 1], granularity }
}