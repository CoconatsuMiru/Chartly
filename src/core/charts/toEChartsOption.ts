import type { EChartsCoreOption } from 'echarts/core'
import type { NumberFormatHint, ResolvedChart, Theme } from '@/domain'
import { formatFull, formatValue } from './formatValue'

function regression(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return null
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  const mx = sx / n
  const my = sy / n
  let sxy = 0
  let sxx = 0
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) * (p.x - mx)
  }
  if (sxx === 0) return null
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx }
}

/** Pure function: the same resolved data and theme always give the same chart. */
export function toEChartsOption(rc: ResolvedChart, theme: Theme): EChartsCoreOption {
  const { spec } = rc
  const o = spec.options
  const c = theme.colors
  const yFmt = rc.format?.y
  const xFmt = rc.format?.x
  const axisText = { color: c.muted, fontSize: 11 }

  const base = {
    color: theme.dataPalette,
    backgroundColor: 'transparent',
    animationDuration: 300,
    textStyle: { fontFamily: theme.fonts.body, color: c.ink },
    aria: { enabled: true },
  }

  const valueAxis = (fmt: NumberFormatHint | undefined, name?: string) => ({
    type: 'value' as const,
    name,
    nameTextStyle: { color: c.muted, fontSize: 11 },
    axisLabel: { ...axisText, formatter: (v: number) => formatValue(v, fmt) },
    splitLine: { show: o.gridlines, lineStyle: { color: c.line } },
  })

  const categoryAxis = (name?: string) => ({
    type: 'category' as const,
    data: rc.categories,
    name,
    nameLocation: 'middle' as const,
    nameGap: 30,
    axisLabel: { ...axisText, hideOverlap: true },
    axisLine: { lineStyle: { color: c.line } },
    axisTick: { show: false },
  })

  const legend = (show: boolean) => ({
    show,
    top: 0,
    icon: 'roundRect',
    textStyle: { color: c.muted },
  })

  if (spec.type === 'donut') {
    const s = rc.series[0]
    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}: ${formatFull(p.value, yFmt)} (${p.percent}%)`,
      },
      legend: {
        show: rc.categories.length > 1,
        bottom: 0,
        icon: 'circle',
        textStyle: { color: c.muted },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: c.surface, borderWidth: 2 },
          label: { show: rc.categories.length <= 8, formatter: '{d}%', color: c.ink, fontSize: 11 },
          data: rc.categories.map((name, i) => ({ name, value: s?.values[i] ?? 0 })),
        },
      ],
    } as EChartsCoreOption
  }

  if (spec.type === 'scatter') {
    const groups = new Map<string, { x: number; y: number }[]>()
    for (const p of rc.points ?? []) {
      const k = p.group ?? 'Points'
      const list = groups.get(k)
      if (list) list.push(p)
      else groups.set(k, [p])
    }

    const series: Record<string, unknown>[] = [...groups].map(([name, pts]) => ({
      name,
      type: 'scatter',
      data: pts.map((p) => [p.x, p.y]),
      symbolSize: 7,
      itemStyle: { opacity: 0.75 },
    }))

    const all = rc.points ?? []
    const fit = o.trendline ? regression(all) : null
    if (fit && all.length > 0) {
      let lo = Infinity
      let hi = -Infinity
      for (const p of all) {
        if (p.x < lo) lo = p.x
        if (p.x > hi) hi = p.x
      }
      series.push({
        name: 'Trend',
        type: 'line',
        data: [
          [lo, fit.intercept + fit.slope * lo],
          [hi, fit.intercept + fit.slope * hi],
        ],
        showSymbol: false,
        silent: true,
        tooltip: { show: false },
        lineStyle: { type: 'dashed', width: 2, color: c.muted },
      })
    }

    return {
      ...base,
      grid: { left: 8, right: 20, top: groups.size > 1 ? 48 : 28, bottom: 28, containLabel: true },
      legend: legend(groups.size > 1),
      tooltip: {
        trigger: 'item',
        formatter: (p: { value: number[] }) =>
          `${formatFull(p.value[0], xFmt)}, ${formatFull(p.value[1], yFmt)}`,
      },
      xAxis: { ...valueAxis(xFmt, o.axisTitles.x), scale: true },
      yAxis: { ...valueAxis(yFmt, o.axisTitles.y), scale: true },
      series,
    } as EChartsCoreOption
  }

  // Bar family, histogram, line and area share axes and tooltips.
  const horizontal = spec.type === 'barHorizontal'
  const isLine = spec.type === 'line' || spec.type === 'area'
  const isHistogram = spec.type === 'histogram'
  const stacked = spec.type === 'stackedBar'

  const label = {
    show: o.dataLabels,
    position: horizontal ? 'right' : stacked ? 'inside' : 'top',
    color: c.ink,
    fontSize: 11,
    formatter: (p: { value: number | null }) => formatValue(p.value, yFmt),
  }

  const series = rc.series.map((s) =>
    isLine
      ? {
          name: s.name,
          type: 'line',
          data: s.values,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: rc.categories.length <= 36,
          lineStyle: { width: 2 },
          areaStyle: spec.type === 'area' ? { opacity: 0.15 } : undefined,
          emphasis: { focus: 'series' },
          label,
        }
      : {
          name: s.name,
          type: 'bar',
          data: s.values,
          stack: stacked ? 'total' : undefined,
          barMaxWidth: isHistogram ? undefined : 48,
          barCategoryGap: isHistogram ? '6%' : undefined,
          itemStyle: stacked ? undefined : { borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] },
          label,
        },
  )

  const showXName = !horizontal && !!o.axisTitles.x
  return {
    ...base,
    grid: {
      left: 8,
      right: 20,
      top: o.legend ? 48 : 28,
      bottom: showXName ? 30 : 8,
      containLabel: true,
    },
    legend: legend(o.legend),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: isLine ? 'line' : 'shadow' },
      valueFormatter: (v: number | null) => formatFull(v, yFmt),
    },
    xAxis: horizontal ? valueAxis(yFmt, o.axisTitles.y) : categoryAxis(o.axisTitles.x),
    yAxis: horizontal ? { ...categoryAxis(), inverse: true } : valueAxis(yFmt, o.axisTitles.y),
    series,
  } as EChartsCoreOption
}