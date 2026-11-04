import type { NumberFormatHint, ResolvedChart, Theme } from '@/domain'

export type NativeKind = 'BAR' | 'LINE' | 'AREA' | 'DOUGHNUT' | 'SCATTER'

export interface NativeChart {
  kind: NativeKind
  data: unknown[]
  options: Record<string, unknown>
}

export const hex = (c: string) => c.replace('#', '').toUpperCase()

/** Excel-style number format for chart axes and labels. */
export function numberFormatCode(hint?: NumberFormatHint): string {
  const digits = hint && hint.decimals > 0 ? `.${'0'.repeat(Math.min(4, hint.decimals))}` : ''
  if (hint?.unit === 'currency') return `"${hint.currencySymbol ?? '$'}"#,##0${digits}`
  if (hint?.unit === 'percent') return `#,##0${digits}"%"`
  return `#,##0${digits}`
}

const MAX_NATIVE_POINTS = 1500

/**
 * Describes a chart as a native, editable PowerPoint chart. Returns null when a native chart
 * would not show the data faithfully (gaps, trend lines, grouped points), so an image is used.
 */
export function nativeChart(rc: ResolvedChart, theme: Theme, textScale: number): NativeChart | null {
  const { spec } = rc
  const o = spec.options
  const c = theme.colors
  const fontSize = Math.round(9 * textScale)
  const fmtY = numberFormatCode(rc.format?.y)
  const labels = rc.categories.map(String)
  const hasGaps = rc.series.some((s) => s.values.some((v) => v === null))
  const colors = (n: number) => theme.dataPalette.slice(0, Math.max(1, n)).map(hex)
  const series = () => rc.series.map((s) => ({ name: s.name, labels, values: s.values as number[] }))

  const base: Record<string, unknown> = {
    showTitle: false,
    showLegend: o.legend,
    legendPos: 'b',
    legendFontSize: fontSize,
    legendColor: hex(c.muted),
    catAxisLabelFontSize: fontSize,
    valAxisLabelFontSize: fontSize,
    catAxisLabelColor: hex(c.muted),
    valAxisLabelColor: hex(c.muted),
    valGridLine: o.gridlines ? { color: hex(c.line), size: 0.5, style: 'solid' } : { style: 'none' },
    catGridLine: { style: 'none' },
    showValue: o.dataLabels,
    dataLabelFontSize: fontSize,
    dataLabelColor: hex(c.ink),
    dataLabelFormatCode: fmtY,
    valAxisLabelFormatCode: fmtY,
  }
  if (o.axisTitles.x) {
    Object.assign(base, {
      showCatAxisTitle: true,
      catAxisTitle: o.axisTitles.x,
      catAxisTitleFontSize: fontSize,
      catAxisTitleColor: hex(c.muted),
    })
  }
  if (o.axisTitles.y) {
    Object.assign(base, {
      showValAxisTitle: true,
      valAxisTitle: o.axisTitles.y,
      valAxisTitleFontSize: fontSize,
      valAxisTitleColor: hex(c.muted),
    })
  }

  switch (spec.type) {
    case 'bar':
    case 'barHorizontal':
    case 'stackedBar':
    case 'histogram': {
      if (rc.series.length === 0 || hasGaps) return null
      const horizontal = spec.type === 'barHorizontal'
      return {
        kind: 'BAR',
        data: series(),
        options: {
          ...base,
          chartColors: colors(rc.series.length),
          barDir: horizontal ? 'bar' : 'col',
          barGrouping: spec.type === 'stackedBar' ? 'stacked' : 'clustered',
          barGapWidthPct: spec.type === 'histogram' ? 5 : 50,
          catAxisOrientation: horizontal ? 'maxMin' : 'minMax',
        },
      }
    }

    case 'line':
    case 'area': {
      if (rc.series.length === 0 || hasGaps) return null
      return {
        kind: spec.type === 'line' ? 'LINE' : 'AREA',
        data: series(),
        options: { ...base, chartColors: colors(rc.series.length), lineSize: 2, lineDataSymbolSize: 6 },
      }
    }

    case 'donut': {
      if (rc.series.length === 0 || hasGaps) return null
      return {
        kind: 'DOUGHNUT',
        data: [series()[0]],
        options: {
          ...base,
          chartColors: colors(labels.length),
          holeSize: 55,
          showPercent: true,
          showValue: false,
          showLegend: true,
          dataBorder: { pt: 2, color: hex(c.paper) },
        },
      }
    }

    case 'scatter': {
      const pts = rc.points ?? []
      if (o.trendline || pts.length === 0 || pts.length > MAX_NATIVE_POINTS) return null
      if (pts.some((p) => p.group !== undefined)) return null
      return {
        kind: 'SCATTER',
        data: [
          { name: 'X', values: pts.map((p) => p.x) },
          { name: spec.encoding.y[0]?.label ?? 'Y', values: pts.map((p) => p.y) },
        ],
        options: {
          ...base,
          chartColors: colors(1),
          lineSize: 0,
          lineDataSymbolSize: 7,
          showLegend: false,
          catAxisLabelFormatCode: numberFormatCode(rc.format?.x),
        },
      }
    }

    default:
      return null
  }
}