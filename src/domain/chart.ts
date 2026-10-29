import { z } from 'zod'
import type { NumberFormatHint } from './dataset'

export const chartTypeSchema = z.enum([
  'bar',
  'barHorizontal',
  'stackedBar',
  'line',
  'area',
  'scatter',
  'donut',
  'histogram',
  'kpi',
  'table',
])

export const aggregationSchema = z.enum([
  'sum',
  'mean',
  'median',
  'count',
  'countDistinct',
  'min',
  'max',
])

export const dateGrainSchema = z.enum(['day', 'week', 'month', 'quarter', 'year'])

export const filterSpecSchema = z.object({
  columnId: z.string(),
  op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
})

export const chartSpecSchema = z.object({
  id: z.string(),
  type: chartTypeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  encoding: z.object({
    x: z
      .object({
        columnId: z.string(),
        dateGrain: dateGrainSchema.optional(),
        bins: z.number().int().positive().optional(),
      })
      .optional(),
    y: z.array(
      z.object({
        columnId: z.string(),
        aggregation: aggregationSchema,
        label: z.string().optional(),
      }),
    ),
    series: z.object({ columnId: z.string() }).optional(),
  }),
  transforms: z.object({
    topN: z.number().int().positive().optional(),
    groupRestAsOther: z.boolean().optional(),
    sort: z.enum(['asc', 'desc', 'none']).optional(),
    filter: z.array(filterSpecSchema).optional(),
  }),
  options: z.object({
    legend: z.boolean(),
    dataLabels: z.boolean(),
    gridlines: z.boolean(),
    axisTitles: z.object({ x: z.string().optional(), y: z.string().optional() }),
    numberFormat: z.string().optional(),
    paletteId: z.string().optional(),
    trendline: z.boolean().optional(),
  }),
})

export type ChartType = z.infer<typeof chartTypeSchema>
export type Aggregation = z.infer<typeof aggregationSchema>
export type DateGrain = z.infer<typeof dateGrainSchema>
export type FilterSpec = z.infer<typeof filterSpecSchema>
export type ChartSpec = z.infer<typeof chartSpecSchema>

/** Small, aggregated data ready to draw. Every output renders from this. */
export interface ResolvedChart {
  spec: ChartSpec
  categories: (string | number)[]
  series: { name: string; values: (number | null)[]; color?: string }[]
  points?: { x: number; y: number; group?: string }[]
  stats: { sourceRows: number; plottedPoints: number; downsampled: boolean }
  /** Number formats for the value axes, so every output formats numbers the same way. */
  format?: { x?: NumberFormatHint; y?: NumberFormatHint }
  warnings: string[]
}

export interface ChartRecommendation {
  id: string
  spec: ChartSpec
  score: number
  reason: string
  ruleId: string
}