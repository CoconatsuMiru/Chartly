import PptxGenJS from 'pptxgenjs'
import { renderChartPng, SAMPLE } from './chartImage'

export async function makePptx(): Promise<Blob> {
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_16x9' // 10in x 5.625in

  const s1 = pres.addSlide()
  s1.addText('Native chart (editable in PowerPoint)', {
    x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true,
  })
  s1.addChart(
    pres.ChartType.bar,
    [{ name: 'Revenue ($M)', labels: SAMPLE.labels, values: SAMPLE.values }],
    { x: 0.5, y: 1.1, w: 9, h: 4, chartColors: ['0F5B5C'], showTitle: false },
  )

  const s2 = pres.addSlide()
  s2.addText('Image chart (fallback)', {
    x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true,
  })
  s2.addImage({ data: renderChartPng(), x: 1.5, y: 1.1, w: 7, h: 3.94 })

  return (await pres.write({ outputType: 'blob' })) as Blob
}