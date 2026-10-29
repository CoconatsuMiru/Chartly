import type { Insight, InsightKind } from '@/domain'

const CAPS: Partial<Record<InsightKind, number>> = {
  trend: 6,
  change: 3,
  correlation: 4,
  outlier: 3,
  concentration: 4,
  'data-quality': 3,
}
const DEFAULT_CAP = 3
const TOTAL_CAP = 20

export function rankInsights(list: Insight[]): Insight[] {
  const sorted = [...list].sort((a, b) => b.importance - a.importance)
  const seen = new Set<string>()
  const perKind = new Map<InsightKind, number>()
  const out: Insight[] = []

  for (const ins of sorted) {
    if (seen.has(ins.id)) continue
    const used = perKind.get(ins.kind) ?? 0
    if (used >= (CAPS[ins.kind] ?? DEFAULT_CAP)) continue
    seen.add(ins.id)
    perKind.set(ins.kind, used + 1)
    out.push(ins)
    if (out.length >= TOTAL_CAP) break
  }
  return out
}