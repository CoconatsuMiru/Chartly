import { aggregationFor, columnProfile, getMeasures } from '@/core/insights/columns'
import type { ChartRecommendation } from '@/domain'
import { getDimensions } from '../helpers'
import { makeSpec } from '../specs'
import type { RecommendationRule } from '../types'

export const categoricalRule: RecommendationRule = {
  id: 'chart.categorical',
  run({ dataset, profile }) {
    const dims = getDimensions(dataset, profile)
    const measures = getMeasures(dataset, 3)
    const out: ChartRecommendation[] = []

    // No numeric column at all: count rows per category instead.
    if (measures.length === 0) {
      dims.slice(0, 2).forEach((dim, i) => {
        const id = `bar:${dim.meta.id}:count`
        out.push({
          id,
          ruleId: 'chart.categorical',
          score: 0.55 - i * 0.03,
          reason: `${dim.meta.name} has ${dim.distinct} categories; shows how many rows fall in each.`,
          spec: makeSpec({
            id,
            type: dim.distinct > 8 ? 'barHorizontal' : 'bar',
            title: `Rows by ${dim.meta.name}`,
            x: { columnId: dim.meta.id },
            y: [{ columnId: dim.meta.id, aggregation: 'count', label: 'Rows' }],
            transforms: {
              sort: 'desc',
              topN: dim.distinct > 10 ? 10 : undefined,
              groupRestAsOther: dim.distinct > 10 ? true : undefined,
            },
            options: { axisTitles: { x: dim.meta.name, y: 'Rows' } },
          }),
        })
      })
      return out
    }

    let pair = 0
    for (const dim of dims) {
      const maxLabel = Math.max(...dim.labels.map((l) => l.length))
      const many = dim.distinct > 10

      for (const m of measures) {
        const stats = columnProfile(profile, m.meta.id)?.numeric
        if (!stats) continue
        const agg = aggregationFor(m.meta)
        const order = pair++
        const horizontal = dim.distinct > 8 || maxLabel > 14

        const barId = `bar:${dim.meta.id}:${m.meta.id}`
        out.push({
          id: barId,
          ruleId: 'chart.categorical',
          score: 0.6 - order * 0.02,
          reason: `${dim.meta.name} has ${dim.distinct} categories; compares ${m.meta.name} across them.`,
          spec: makeSpec({
            id: barId,
            type: horizontal ? 'barHorizontal' : 'bar',
            title: `${m.meta.name} by ${dim.meta.name}`,
            subtitle: many
              ? `Top 10 of ${dim.distinct}, the rest grouped as Other`
              : agg === 'sum'
                ? 'Total'
                : 'Average',
            x: { columnId: dim.meta.id },
            y: [{ columnId: m.meta.id, aggregation: agg, label: m.meta.name }],
            transforms: {
              sort: 'desc',
              topN: many ? 10 : undefined,
              groupRestAsOther: many ? true : undefined,
            },
            options: { axisTitles: { x: dim.meta.name, y: m.meta.name } },
          }),
        })

        // Shares only make sense for non-negative totals across a handful of slices.
        if (agg === 'sum' && stats.min >= 0 && stats.sum > 0 && dim.distinct <= 6) {
          const donutId = `donut:${dim.meta.id}:${m.meta.id}`
          out.push({
            id: donutId,
            ruleId: 'chart.categorical',
            score: 0.5 - order * 0.02,
            reason: `Only ${dim.distinct} categories, so each one's share of ${m.meta.name} is easy to read.`,
            spec: makeSpec({
              id: donutId,
              type: 'donut',
              title: `Share of ${m.meta.name} by ${dim.meta.name}`,
              x: { columnId: dim.meta.id },
              y: [{ columnId: m.meta.id, aggregation: 'sum', label: m.meta.name }],
              transforms: { sort: 'desc' },
              options: { legend: true },
            }),
          })
        }
      }
    }
    return out
  },
}