import type { ResolvedChart } from '@/domain'

export type ExportFormat = 'pdf' | 'pptx'
export type ChartMode = 'native' | 'image'

export interface ExportOptions {
  /** PowerPoint only. */
  chartMode: ChartMode
}

export interface ChartAsset {
  resolved: ResolvedChart
  /** PNG data URL. Missing when a native PowerPoint chart is used instead. */
  dataUrl?: string
}

export type ChartAssets = Map<string, ChartAsset>