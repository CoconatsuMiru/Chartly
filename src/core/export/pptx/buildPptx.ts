import PptxGenJS from 'pptxgenjs'
import { LINE_HEIGHT } from '@/core/report/layout/constants'
import type { PositionedElement, RenderPlan } from '@/domain'
import type { ChartAssets } from '../types'
import { hex, nativeChart, type NativeKind } from './nativeChart'

const PT_PER_INCH = 72
const FONT = { heading: 'Georgia', body: 'Arial', mono: 'Courier New' } as const

/** The library's chart type names. Used directly because its typings do not expose `pres.charts`. */
const CHART_TYPE: Record<NativeKind, string> = {
  BAR: 'bar',
  LINE: 'line',
  AREA: 'area',
  DOUGHNUT: 'doughnut',
  SCATTER: 'scatter',
}

interface Opts {
  native: boolean
  textScale: number
}

export async function buildPptx(plan: RenderPlan, title: string, assets: ChartAssets, opts: Opts): Promise<Blob> {
  const pres = new PptxGenJS()
  pres.defineLayout({
    name: 'CHARTLY',
    width: plan.page.width / PT_PER_INCH,
    height: plan.page.height / PT_PER_INCH,
  })
  pres.layout = 'CHARTLY'
  pres.title = title
  pres.author = 'Chartly'

  const inch = (pt: number) => pt / PT_PER_INCH
  const box = (el: PositionedElement) => ({ x: inch(el.x), y: inch(el.y), w: inch(el.w), h: inch(el.h) })

  for (const page of plan.pages) {
    const slide = pres.addSlide()

    const draw = (el: PositionedElement) => {
      switch (el.kind) {
        case 'shape': {
          // The full-page shape is the page background.
          if (el.x === 0 && el.y === 0 && el.w === plan.page.width && el.h === plan.page.height) {
            if (el.fill) slide.background = { color: hex(el.fill) }
            return
          }
          slide.addShape(el.radius ? pres.ShapeType.roundRect : pres.ShapeType.rect, {
            ...box(el),
            fill: el.fill ? { color: hex(el.fill) } : undefined,
            line: el.stroke ? { color: hex(el.stroke), width: 0.75 } : { type: 'none' },
            rectRadius: el.radius ? inch(el.radius) : undefined,
          })
          return
        }

        case 'text':
          slide.addText(el.text, {
            ...box(el),
            fontFace: FONT[el.style.font ?? 'body'],
            fontSize: el.style.fontSize,
            bold: el.style.bold,
            italic: el.style.italic,
            color: hex(el.style.color ?? plan.theme.colors.ink),
            align: el.style.align ?? 'left',
            valign: 'top',
            margin: 0,
            lineSpacing: el.style.fontSize * LINE_HEIGHT,
            paraSpaceAfter: 0,
          })
          return

        case 'chart': {
          const asset = assets.get(el.chartId)
          if (!asset) return
          if (opts.native) {
            const native = nativeChart(asset.resolved, plan.theme, opts.textScale)
            if (native) {
              slide.addChart(
                CHART_TYPE[native.kind] as never,
                native.data as never,
                { ...box(el), ...native.options } as never,
              )
              return
            }
          }
          if (asset.dataUrl) slide.addImage({ data: asset.dataUrl, ...box(el) })
          return
        }

        case 'kpi':
        case 'table':
          return
      }
    }

    page.elements.forEach(draw)
    if (page.notes) slide.addNotes(page.notes)
  }

  return (await pres.write({ outputType: 'blob' })) as Blob
}