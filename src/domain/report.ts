import { z } from 'zod'
import { aggregationSchema, chartSpecSchema } from './chart'

export const REPORT_SCHEMA_VERSION = 1

export const sectionBlockSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string(),
    kind: z.literal('cover'),
    title: z.string(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    date: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal('kpis'),
    items: z.array(
      z.object({
        label: z.string(),
        columnId: z.string(),
        aggregation: aggregationSchema,
      }),
    ),
  }),
  z.object({
    id: z.string(),
    kind: z.literal('chart'),
    chartId: z.string(),
    caption: z.string().optional(),
    narrativeId: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal('text'),
    heading: z.string().optional(),
    body: z.string(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal('table'),
    columnIds: z.array(z.string()),
    maxRows: z.number().int().positive(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal('insights'),
    insightIds: z.array(z.string()),
  }),
])

export const reportDocumentSchema = z.object({
  schemaVersion: z.number().int(),
  id: z.string(),
  title: z.string(),
  themeId: z.string(),
  layoutTemplateId: z.string(),
  outputFormat: z.enum(['document', 'deck']),
  sections: z.array(
    z.object({
      block: sectionBlockSchema,
      layoutHint: z.string().optional(),
      hidden: z.boolean().optional(),
    }),
  ),
  charts: z.record(z.string(), chartSpecSchema),
  insightEdits: z.record(z.string(), z.string()),
})

export type SectionBlock = z.infer<typeof sectionBlockSchema>
export type ReportDocument = z.infer<typeof reportDocumentSchema>