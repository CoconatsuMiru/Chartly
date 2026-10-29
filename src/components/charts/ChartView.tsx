import { useEffect, useRef } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import { echarts } from '@/core/charts/echartsSetup'

interface Props {
  option: EChartsCoreOption
  ariaLabel: string
  height?: number
}

export function ChartView({ option, ariaLabel, height = 280 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const chart = echarts.init(el, null, { renderer: 'canvas' })
    chartRef.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(el)
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={ref} role="img" aria-label={ariaLabel} style={{ height }} className="w-full" />
}