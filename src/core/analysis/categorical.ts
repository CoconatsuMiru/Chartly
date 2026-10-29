import type { CategoricalStats } from '@/domain'

function summarise(
  counts: ArrayLike<number>,
  labels: string[],
  topN: number,
): { count: number; stats: CategoricalStats } {
  let total = 0
  let distinct = 0
  for (let i = 0; i < counts.length; i++) {
    total += counts[i]
    if (counts[i] > 0) distinct++
  }
  const top = labels
    .map((value, i) => ({ value, count: counts[i], share: total > 0 ? counts[i] / total : 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
  return { count: total, stats: { distinct, top } }
}

export function categoricalFromCodes(codes: Int32Array, dictionary: string[], topN = 10) {
  const counts = new Int32Array(dictionary.length)
  for (let i = 0; i < codes.length; i++) if (codes[i] >= 0) counts[codes[i]]++
  return summarise(counts, dictionary, topN)
}

export function categoricalFromBool(values: Int8Array) {
  const counts = [0, 0]
  for (let i = 0; i < values.length; i++) if (values[i] >= 0) counts[values[i]]++
  return summarise(counts, ['false', 'true'], 2)
}