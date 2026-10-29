import type { Aggregation } from '@/domain'

export interface Acc {
  n: number
  sum: number
  min: number
  max: number
  vals?: number[]
  set?: Set<number>
}

export function createAcc(agg: Aggregation): Acc {
  return {
    n: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    vals: agg === 'median' ? [] : undefined,
    set: agg === 'countDistinct' ? new Set<number>() : undefined,
  }
}

export function addToAcc(acc: Acc, v: number): void {
  acc.n++
  acc.sum += v
  if (v < acc.min) acc.min = v
  if (v > acc.max) acc.max = v
  acc.vals?.push(v)
  acc.set?.add(v)
}

export function mergeAcc(into: Acc, from: Acc): void {
  into.n += from.n
  into.sum += from.sum
  if (from.min < into.min) into.min = from.min
  if (from.max > into.max) into.max = from.max
  if (into.vals && from.vals) for (const v of from.vals) into.vals.push(v)
  if (into.set && from.set) for (const v of from.set) into.set.add(v)
}

export function finalizeAcc(acc: Acc, agg: Aggregation): number | null {
  if (acc.n === 0) return agg === 'count' || agg === 'countDistinct' ? 0 : null
  switch (agg) {
    case 'sum':
      return acc.sum
    case 'mean':
      return acc.sum / acc.n
    case 'count':
      return acc.n
    case 'countDistinct':
      return acc.set?.size ?? 0
    case 'min':
      return acc.min
    case 'max':
      return acc.max
    case 'median': {
      const sorted = Float64Array.from(acc.vals ?? []).sort()
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    }
  }
}