import type { Dataset, DatasetProfile, Insight } from '@/domain'

export interface InsightContext {
  dataset: Dataset
  profile: DatasetProfile
}

export interface InsightRule {
  id: string
  run(ctx: InsightContext): Insight[]
}