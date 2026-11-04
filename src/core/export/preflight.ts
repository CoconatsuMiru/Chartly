import type { RenderPlan, ReportDocument } from '@/domain'
import type { ExportFormat } from './types'

export type CheckLevel = 'error' | 'warn' | 'info' | 'ok'

export interface Check {
  id: string
  level: CheckLevel
  message: string
}

const ORDER: Record<CheckLevel, number> = { error: 0, warn: 1, info: 2, ok: 3 }

/** Punctuation the built-in PDF fonts can draw, beyond Latin-1. */
const PDF_EXTRA = new Set([0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x20ac, 0x2122])

function unsupportedPdfChars(plan: RenderPlan): string[] {
  const found = new Set<string>()
  for (const page of plan.pages) {
    for (const el of page.elements) {
      if (el.kind !== 'text') continue
      for (const ch of el.text) {
        const cp = ch.codePointAt(0) ?? 0
        if (cp > 255 && !PDF_EXTRA.has(cp)) found.add(ch)
      }
    }
  }
  return [...found]
}

/** Checks the report and its layout before export. Pure, so it is easy to test. */
export function runPreflight(report: ReportDocument, plan: RenderPlan, format: ExportFormat): Check[] {
  const checks: Check[] = []
  const add = (id: string, level: CheckLevel, message: string) => checks.push({ id, level, message })
  const unit = plan.format === 'deck' ? 'Slide' : 'Page'

  const visible = report.sections.filter((s) => !s.hidden)
  if (visible.length === 0) {
    add('empty', 'error', 'Every section is hidden, so there is nothing to export. Show a section in Compose.')
  }

  if (!report.title.trim()) {
    add('title', 'warn', 'The report has no title. The file will be named "report".')
  }

  plan.warnings.forEach((w, i) => {
    if (w.message.startsWith('Nothing to export')) return
    add(`plan-${i}`, 'warn', `${unit} ${w.pageIndex + 1}: ${w.message}`)
  })

  if (format === 'pptx' && plan.format === 'document') {
    add(
      'portrait',
      'warn',
      'This layout uses portrait A4 pages, so the PowerPoint slides will be portrait. Choose "Slides (16:9)" in Compose for a presentation.',
    )
  }

  if (format === 'pdf') {
    const chars = unsupportedPdfChars(plan)
    if (chars.length > 0) {
      add(
        'fonts',
        'warn',
        `Some characters (${chars.slice(0, 5).join(' ')}) are not available in the PDF's built-in fonts and may appear blank.`,
      )
    }
  }

  const uncaptioned = visible.filter(
    (s) => s.block.kind === 'chart' && !(s.block.caption ?? '').trim() && report.charts[s.block.chartId],
  ).length
  if (uncaptioned > 0) {
    add('captions', 'info', `${uncaptioned} chart${uncaptioned === 1 ? ' has' : 's have'} no caption.`)
  }

  const hidden = report.sections.length - visible.length
  if (hidden > 0 && visible.length > 0) {
    add('hidden', 'info', `${hidden} hidden section${hidden === 1 ? ' is' : 's are'} left out of the file.`)
  }

  if (!checks.some((c) => c.level === 'error')) {
    const n = plan.pages.length
    add('summary', 'ok', `${n} ${unit.toLowerCase()}${n === 1 ? '' : 's'} laid out and ready.`)
  }

  return checks.sort((a, b) => ORDER[a.level] - ORDER[b.level])
}