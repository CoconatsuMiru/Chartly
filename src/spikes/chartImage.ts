import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, TitleComponent, CanvasRenderer])

export const SAMPLE = {
  title: 'Revenue by region',
  labels: ['North America', 'EMEA', 'APAC', 'LATAM'],
  values: [7.7, 4.0, 2.6, 1.1],
}

/** Renders the sample chart off-screen and returns a PNG data URL. */
export function renderChartPng(width = 640, height = 360): string {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;left:-9999px;width:${width}px;height:${height}px`
  document.body.appendChild(el)

  const chart = echarts.init(el, null, { renderer: 'canvas', width, height })
  chart.setOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: { text: SAMPLE.title, left: 12, top: 8 },
    grid: { left: 48, right: 24, top: 56, bottom: 36 },
    xAxis: { type: 'category', data: SAMPLE.labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: SAMPLE.values, itemStyle: { color: '#0f5b5c' } }],
  })

  const png = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  chart.dispose()
  el.remove()
  return png
}