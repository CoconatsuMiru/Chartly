import type { Insight } from '@/domain'
import { aggregationFor, getMeasures, getTimeColumn } from './columns'
import { clamp01, fmtNum, fmtPct, fmtPeriod, GRAIN_ADJ, signedPct } from './format'
import { buildMeasureSeries, linearFit } from './timeSeries'
import type { InsightContext, InsightRule } from './types'

const MIN_POINTS = 6

function seriesPerMeasure(ctx: InsightContext) {
  const time = getTimeColumn(ctx.dataset, ctx.profile)
  if (!time) return []
  return getMeasures(ctx.dataset).map((m) => {
    const agg = aggregationFor(m.meta)
    const { points, grain } = buildMeasureSeries(time.values, m.values, time.stats, agg)
    return { m, agg, points, grain, timeId: time.meta.id }
  })
}

export const trendRule: InsightRule = {
  id: 'trend.linear',
  run(ctx) {
    const out: Insight[] = []
    for (const { m, agg, points, grain, timeId } of seriesPerMeasure(ctx)) {
      if (points.length < MIN_POINTS) continue
      const ys = points.map((p) => p.value)
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length
      const { slope, r2 } = linearFit(ys)
      if (mean === 0) continue

      const rel = (slope * (ys.length - 1)) / Math.abs(mean)
      const first = ys[0]
      const last = ys[ys.length - 1]
      if (r2 < 0.5 || Math.abs(rel) < 0.1 || first === 0) continue

      const change = (last - first) / Math.abs(first)
      if (Math.sign(change) !== Math.sign(slope)) continue

      const up = slope > 0
      const name = m.meta.name
      out.push({
        id: `trend.linear:${m.meta.id}`,
        ruleId: 'trend.linear',
        kind: 'trend',
        importance: clamp01(0.3 + 0.4 * r2 + 0.3 * Math.min(1, Math.abs(rel))),
        confidence:
          ys.length >= 12 && r2 >= 0.8 ? 'high' : ys.length >= 8 && r2 >= 0.6 ? 'medium' : 'low',
        title: `${name} is trending ${up ? 'up' : 'down'}`,
        narrative: `${name} ${change >= 0 ? 'rose' : 'fell'} ${fmtPct(Math.abs(change))} from ${fmtPeriod(points[0].t, grain)} to ${fmtPeriod(points[points.length - 1].t, grain)}, a ${r2 >= 0.8 ? 'steady' : 'general'} ${up ? 'upward' : 'downward'} trend (R² = ${r2.toFixed(2)}).`,
        evidence: [
          { label: 'Measured as', value: `${GRAIN_ADJ[grain]} ${agg === 'sum' ? 'total' : 'average'}` },
          { label: 'Periods', value: ys.length },
          { label: 'First period', value: fmtNum(first, m.meta) },
          { label: 'Last period', value: fmtNum(last, m.meta) },
          { label: 'Change', value: signedPct(change) },
          { label: 'Slope per period', value: fmtNum(slope, m.meta) },
          { label: 'R²', value: r2.toFixed(2) },
        ],
        columnIds: [m.meta.id, timeId],
        suggestedChartId: `line:${timeId}:${m.meta.id}`,
      })
    }
    return out
  },
}

export const changeRule: InsightRule = {
  id: 'change.latest',
  run(ctx) {
    const out: Insight[] = []
    for (const { m, agg, points, grain, timeId } of seriesPerMeasure(ctx)) {
      if (points.length < 4) continue
      const prev = points[points.length - 2]
      const last = points[points.length - 1]
      if (prev.value === 0) continue

      const pct = (last.value - prev.value) / Math.abs(prev.value)
      if (Math.abs(pct) < 0.25) continue

      const name = m.meta.name
      out.push({
        id: `change.latest:${m.meta.id}`,
        ruleId: 'change.latest',
        kind: 'change',
        importance: clamp01(0.4 + Math.min(0.3, Math.abs(pct) * 0.3)),
        confidence: points.length >= 8 ? 'medium' : 'low',
        title: `${name} ${pct > 0 ? 'jumped' : 'dropped'} in the latest period`,
        narrative: `${name} ${pct > 0 ? 'increased' : 'decreased'} ${fmtPct(Math.abs(pct))} in ${fmtPeriod(last.t, grain)} compared with ${fmtPeriod(prev.t, grain)} (${fmtNum(prev.value, m.meta)} to ${fmtNum(last.value, m.meta)}).`,
        evidence: [
          { label: 'Measured as', value: `${GRAIN_ADJ[grain]} ${agg === 'sum' ? 'total' : 'average'}` },
          { label: 'Previous period', value: fmtNum(prev.value, m.meta) },
          { label: 'Latest period', value: fmtNum(last.value, m.meta) },
          { label: 'Change', value: signedPct(pct) },
        ],
        columnIds: [m.meta.id, timeId],
        suggestedChartId: `line:${timeId}:${m.meta.id}`,
      })
    }
    return out
  },
}