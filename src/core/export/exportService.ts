import { getTemplate } from '@/core/report/layout/templates'
import {
  ChartlyError,
  type ChartSpec,
  type Progress,
  type RenderPlan,
  type ReportDocument,
  type ResolvedChart,
} from '@/domain'
import { collectChartAssets } from './collectCharts'
import { exportFileName } from './filenames'
import { nativeChart } from './pptx/nativeChart'
import type { ExportFormat, ExportOptions } from './types'

export interface ExportResult {
  blob: Blob
  fileName: string
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0))

/** Resolves charts, builds the file and returns it. The PDF and PPTX libraries are loaded only here. */
export async function exportReport(
  format: ExportFormat,
  report: ReportDocument,
  plan: RenderPlan,
  resolve: (spec: ChartSpec) => Promise<ResolvedChart>,
  opts: ExportOptions,
  onProgress: (p: Progress) => void,
): Promise<ExportResult> {
  try {
    const textScale = getTemplate(report.layoutTemplateId).scale
    const native = format === 'pptx' && opts.chartMode === 'native'

    const assets = await collectChartAssets({
      plan,
      report,
      resolve,
      textScale,
      // A picture is only needed when no native PowerPoint chart can be used.
      wantImage: (rc) => !(native && nativeChart(rc, plan.theme, textScale)),
      onProgress,
    })

    onProgress({ stage: 'Building the file' })
    await nextFrame()

    const blob =
      format === 'pdf'
        ? await (await import('./pdf/buildPdf')).buildPdf(plan, report.title, assets)
        : await (await import('./pptx/buildPptx')).buildPptx(plan, report.title, assets, { native, textScale })

    onProgress({ stage: 'Done', fraction: 1 })
    return { blob, fileName: exportFileName(report.title, format) }
  } catch (e) {
    if (e instanceof ChartlyError) throw e
    throw new ChartlyError(
      'EXPORT_FAILED',
      `The ${format === 'pdf' ? 'PDF' : 'PowerPoint file'} could not be created.`,
      true,
      e instanceof Error ? e.message : String(e),
    )
  }
}