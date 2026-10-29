import type { ChartRecommendation, ChartType, Insight } from '@/domain'
import { categoricalRule } from './rules/categorical'
import { histogramRule } from './rules/histogram'
import { lineRule } from './rules/line'
import { scatterRule } from './rules/scatter'
import type { RecommendationContext, RecommendationRule } from './types'

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  lineRule,
  categoricalRule,
  scatterRule,
  histogramRule,
]

const FAMILY_CAPS: Partial<Record<string, number>> = {
  line: 3,
  bar: 3,
  donut: 1,
  scatter: 2,
  histogram: 2,
}
const TOTAL_CAP = 10

const family = (t: ChartType) => (t === 'barHorizontal' ? 'bar' : t)

/** Findings that point at a chart make that chart more valuable. */
function boost(recs: ChartRecommendation[], insights: Insight[]): void {
  const best = new Map<string, Insight>()
  for (const ins of insights) {
    if (!ins.suggestedChartId) continue
    const prev = best.get(ins.suggestedChartId)
    if (!prev || ins.importance > prev.importance) best.set(ins.suggestedChartId, ins)
  }
  for (const rec of recs) {
    const ins = best.get(rec.id)
    if (!ins) continue
    rec.score = Math.min(1, rec.score + 0.25 * ins.importance)
    rec.reason = `${rec.reason} Supports the finding "${ins.title}".`
  }
}

export function recommendCharts(ctx: RecommendationContext): ChartRecommendation[] {
  const all: ChartRecommendation[] = []
  for (const rule of RECOMMENDATION_RULES) {
    try {
      all.push(...rule.run(ctx))
    } catch (e) {
      // One broken rule must never take down the rest.
      console.warn(`Recommendation rule "${rule.id}" failed`, e)
    }
  }

  boost(all, ctx.insights)

  const sorted = all.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const perFamily = new Map<string, number>()
  const out: ChartRecommendation[] = []

  for (const rec of sorted) {
    if (seen.has(rec.id)) continue
    const fam = family(rec.spec.type)
    const used = perFamily.get(fam) ?? 0
    if (used >= (FAMILY_CAPS[fam] ?? 2)) continue
    seen.add(rec.id)
    perFamily.set(fam, used + 1)
    out.push(rec)
    if (out.length >= TOTAL_CAP) break
  }
  return out
}