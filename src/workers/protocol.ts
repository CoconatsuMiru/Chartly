import type { KpiRequest } from '@/core/charts/kpi'
import type {
  ChartRecommendation,
  ChartSpec,
  ColumnMeta,
  DatasetProfile,
  Insight,
  Progress,
  ResolvedChart,
  SourceInfo,
} from '@/domain'

export interface LoadOptions {
  sheet?: string
}

export interface LoadResult {
  datasetId: string
  source: SourceInfo
  columns: ColumnMeta[]
  profile: DatasetProfile
  insights: Insight[]
  recommendations: ChartRecommendation[]
  rowCount: number
  sheets: string[]
  preview: string[][]
  parseMs: number
}

export interface DataWorkerApi {
  loadDataset(file: File, opts?: LoadOptions, onProgress?: (p: Progress) => void): Promise<LoadResult>
  getRows(offset: number, limit: number): Promise<string[][]>
  resolveChart(spec: ChartSpec): Promise<ResolvedChart>
  computeKpis(items: KpiRequest[]): Promise<(number | null)[]>
  dispose(): void
}