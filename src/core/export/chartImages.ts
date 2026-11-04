import { echarts } from '@/core/charts/echartsSetup'
import { toEChartsOption } from '@/core/charts/toEChartsOption'
import { PX_PER_PT } from '@/core/report/layout/constants'
import type { ResolvedChart, Theme } from '@/domain'

/**
 * Draws a chart off-screen and returns a PNG.
 * textScale makes the chart's text look bigger on slides: it is drawn on a smaller canvas
 * (so fonts take more room) at a higher pixel ratio (so it stays sharp).
 */
export function renderChartPng(
  rc: ResolvedChart,
  theme: Theme,
  sizePt: { w: number; h: number },
  textScale = 1,
): string {
  const width = Math.max(60, Math.round((sizePt.w * PX_PER_PT) / textScale))
  const height = Math.max(60, Math.round((sizePt.h * PX_PER_PT) / textScale))

  const el = document.createElement('div')
  el.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px`
  document.body.appendChild(el)
  const chart = echarts.init(el, null, { renderer: 'canvas', width, height })
  try {
    chart.setOption({ ...toEChartsOption(rc, theme), animation: false })
    return chart.getDataURL({
      type: 'png',
      pixelRatio: 3 * textScale,
      backgroundColor: theme.colors.paper,
    })
  } finally {
    chart.dispose()
    el.remove()
  }
}