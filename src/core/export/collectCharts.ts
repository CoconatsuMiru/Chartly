import type { ChartSpec, Progress, RenderPlan, ReportDocument, ResolvedChart } from '@/domain'
import { renderChartPng } from './chartImages'
import type { ChartAssets } from './types'

interface Args {
  plan: RenderPlan
  report: ReportDocument
  resolve: (spec: ChartSpec) => Promise<ResolvedChart>
  textScale: number
  /** Decides per chart whether a PNG is needed (false when a native PowerPoint chart will be used). */
  wantImage: (rc: ResolvedChart) => boolean
  onProgress: (p: Progress) => void
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0))

/** Resolves every chart the plan uses and, where needed, renders it to an image. */
export async function collectChartAssets({
  plan,
  report,
  resolve,
  textScale,
  wantImage,
  onProgress,
}: Args): Promise<ChartAssets> {
  const elements = plan.pages
    .flatMap((p) => p.elements)
    .flatMap((e) => (e.kind === 'chart' ? [e] : []))
  const assets: ChartAssets = new Map()

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const spec = report.charts[el.chartId]
    if (!spec || assets.has(el.chartId)) continue

    onProgress({ stage: `Rendering chart ${i + 1} of ${elements.length}`, fraction: i / elements.length })
    await nextFrame()

    const resolved = await resolve(spec)
    const dataUrl = wantImage(resolved)
      ? renderChartPng(resolved, plan.theme, { w: el.w, h: el.h }, textScale)
      : undefined
    assets.set(el.chartId, { resolved, dataUrl })
  }
  return assets
}