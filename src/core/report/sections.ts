import type { ChartSpec, SectionBlock } from '@/domain'

export function sectionLabel(block: SectionBlock, charts: Record<string, ChartSpec>): string {
  switch (block.kind) {
    case 'cover':
      return 'Cover'
    case 'kpis':
      return 'Key numbers'
    case 'text':
      return block.heading?.trim() || 'Text'
    case 'chart':
      return charts[block.chartId]?.title ?? 'Chart'
    case 'table':
      return 'Data table'
    case 'insights':
      return 'Key findings'
  }
}