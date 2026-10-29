import type { Insight } from '@/domain'
import { concentrationRule } from './concentration'
import { correlationRule } from './correlation'
import { outlierRule } from './outliers'
import { qualityRule } from './quality'
import { rankInsights } from './rank'
import { changeRule, trendRule } from './trend'
import type { InsightContext, InsightRule } from './types'

export const RULES: InsightRule[] = [
  trendRule,
  changeRule,
  correlationRule,
  outlierRule,
  concentrationRule,
  qualityRule,
]

export function generateInsights(ctx: InsightContext): Insight[] {
  const all: Insight[] = []
  for (const rule of RULES) {
    try {
      all.push(...rule.run(ctx))
    } catch (e) {
      // One broken rule must never take down the rest.
      console.warn(`Insight rule "${rule.id}" failed`, e)
    }
  }
  return rankInsights(all)
}