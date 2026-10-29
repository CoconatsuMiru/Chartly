import type { ChartRecommendation, Dataset, DatasetProfile, Insight } from '@/domain'

export interface RecommendationContext {
  dataset: Dataset
  profile: DatasetProfile
  insights: Insight[]
}

export interface RecommendationRule {
  id: string
  run(ctx: RecommendationContext): ChartRecommendation[]
}