import type { ColumnMeta, DatasetProfile, Insight, SourceInfo } from '@/domain'

export interface LoadOptions {
  sheet?: string
}

export interface LoadResult {
  datasetId: string
  source: SourceInfo
  columns: ColumnMeta[]
  profile: DatasetProfile
  insights: Insight[]
  rowCount: number
  sheets: string[]
  preview: string[][]
  parseMs: number
}

export interface DataWorkerApi {
  loadDataset(file: File, opts?: LoadOptions): Promise<LoadResult>
  getRows(offset: number, limit: number): Promise<string[][]>
  dispose(): void
}