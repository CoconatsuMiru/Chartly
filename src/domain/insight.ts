export type InsightKind =
  | 'trend'
  | 'change'
  | 'correlation'
  | 'outlier'
  | 'concentration'
  | 'distribution'
  | 'data-quality'
  | 'extreme'
  | 'seasonality'

export interface Insight {
  id: string
  kind: InsightKind
  importance: number
  confidence: 'low' | 'medium' | 'high'
  title: string
  narrative: string
  /** Numbers behind the sentence, shown in the "Why this?" popover. */
  evidence: { label: string; value: string | number }[]
  columnIds: string[]
  suggestedChartId?: string
  ruleId: string
}