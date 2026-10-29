import type { Insight } from '@/domain'
import { columnProfile, getMeasures } from './columns'
import { fmtPct } from './format'
import type { InsightRule } from './types'

export const concentrationRule: InsightRule = {
  id: 'concentration.share',
  run({ dataset, profile }) {
    const measures = getMeasures(dataset)
      .filter((m) => m.meta.format?.unit !== 'percent')
      .slice(0, 3)
    if (measures.length === 0) return []

    const out: Insight[] = []
    dataset.columns.forEach((dim, di) => {
      const d = dataset.data[di]
      if (dim.role !== 'dimension' || d.kind !== 'dict') return
      const distinct = columnProfile(profile, dim.id)?.distinct ?? 0
      if (distinct < 3 || distinct > 50) return

      for (const m of measures) {
        const stats = columnProfile(profile, m.meta.id)?.numeric
        // Shares only make sense for non-negative totals.
        if (!stats || stats.min < 0 || stats.sum <= 0) continue

        const sums = new Float64Array(d.dictionary.length)
        let total = 0
        for (let r = 0; r < d.codes.length; r++) {
          const code = d.codes[r]
          const v = m.values[r]
          if (code < 0 || Number.isNaN(v)) continue
          sums[code] += v
          total += v
        }
        if (total <= 0) continue

        const order = Array.from(sums.keys()).sort((a, b) => sums[b] - sums[a])
        const top1 = sums[order[0]] / total
        const top3 = order.slice(0, 3).reduce((s, i) => s + sums[i], 0) / total
        const leader = d.dictionary[order[0]]
        const strongLeader = top1 >= 0.4
        if (!strongLeader && !(distinct >= 6 && top3 >= 0.7)) continue

        const measure = m.meta.name
        out.push({
          id: `concentration.share:${dim.id}+${m.meta.id}`,
          ruleId: 'concentration.share',
          kind: 'concentration',
          importance: Math.min(1, 0.3 + 0.5 * top1),
          confidence: dataset.rowCount >= 100 ? 'high' : dataset.rowCount >= 30 ? 'medium' : 'low',
          title: strongLeader
            ? `${measure} is concentrated in ${leader}`
            : `${measure} is concentrated in a few ${dim.name} values`,
          narrative: strongLeader
            ? `${leader} accounts for ${fmtPct(top1)} of total ${measure}${distinct > 3 ? `; the top 3 of ${distinct} ${dim.name} values make up ${fmtPct(top3)}` : ''}.`
            : `The top 3 of ${distinct} ${dim.name} values account for ${fmtPct(top3)} of total ${measure}.`,
          evidence: [
            { label: 'Top value', value: leader },
            { label: 'Top value share', value: fmtPct(top1) },
            { label: 'Top 3 share', value: fmtPct(top3) },
            { label: `Distinct ${dim.name} values`, value: distinct },
          ],
          columnIds: [dim.id, m.meta.id],
          suggestedChartId: `bar:${dim.id}:${m.meta.id}`,
        })
      }
    })
    return out
  },
}