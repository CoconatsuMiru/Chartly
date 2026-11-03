import type {
  Insight,
  PositionedElement,
  RenderPlan,
  ReportDocument,
  SectionBlock,
  TextStyle,
  Theme,
} from '@/domain'
import { LINE_HEIGHT, fontStack } from './constants'
import { PageFlow } from './flow'
import { wrapText, type MeasureText } from './measure'
import { getTemplate } from './templates'

type Of<K extends SectionBlock['kind']> = Extract<SectionBlock, { kind: K }>

export interface LayoutContext {
  theme: Theme
  insights: Insight[]
  /** Formatted KPI values per KPI block id, in item order. */
  kpiText: Record<string, string[]>
  measure: MeasureText
}

interface FlowOpts {
  x?: number
  w?: number
  gap?: number
  bullet?: boolean
}

const FOOTER_H = 26
const BULLET = /^\s*[-•]\s+/
const plain = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, '$1')

/** Pure: turns a report into pages of positioned elements. Every output draws this same plan. */
export function layoutReport(report: ReportDocument, ctx: LayoutContext): RenderPlan {
  const { theme, measure } = ctx
  const tpl = getTemplate(report.layoutTemplateId)
  const s = tpl.scale
  const { width: W, height: H } = tpl.page
  const m = tpl.margin
  const cw = W - 2 * m
  const c = theme.colors
  const gapSection = 14 * s

  const sz = {
    h1: theme.type.h1 * s,
    h2: theme.type.h2 * s,
    body: theme.type.body * s,
    cap: theme.type.caption * s,
  }
  const st = {
    title: { fontSize: sz.h1, font: 'heading', color: c.primary },
    h2: { fontSize: sz.h2, font: 'heading', color: c.primary },
    body: { fontSize: sz.body, color: c.ink },
    bold: { fontSize: sz.body, bold: true, color: c.ink },
    muted: { fontSize: sz.cap, color: c.muted },
    caption: { fontSize: sz.cap + 1, color: c.muted },
  } satisfies Record<string, TextStyle>

  const flow = new PageFlow(m, H - m - FOOTER_H)
  const warnings: RenderPlan['warnings'] = []
  const warn = (message: string) => warnings.push({ pageIndex: flow.pageIndex, message })

  const lh = (style: TextStyle) => style.fontSize * LINE_HEIGHT
  const wrap = (str: string, w: number, style: TextStyle) =>
    wrapText(
      str,
      w,
      {
        family: fontStack(theme, style.font ?? 'body'),
        size: style.fontSize,
        bold: !!style.bold,
        italic: !!style.italic,
      },
      measure,
    )
  const textEl = (x: number, y: number, w: number, lines: string[], style: TextStyle): PositionedElement => ({
    kind: 'text',
    x,
    y,
    w,
    h: lines.length * lh(style),
    text: lines.join('\n'),
    style,
  })

  /** Places wrapped text, continuing on the next page when needed (never leaving a single orphan line). */
  function flowText(str: string, style: TextStyle, opts: FlowOpts = {}) {
    const x = opts.x ?? m
    const w = opts.w ?? cw
    const lines = wrap(str, w, style)
    const h = lh(style)
    let i = 0

    while (i < lines.length) {
      const left = lines.length - i
      let fit = Math.floor((flow.remaining + 0.01) / h)
      if (fit < Math.min(2, left) && !flow.atTop) {
        flow.newPage()
        fit = Math.floor((flow.remaining + 0.01) / h)
      }
      if (fit < 1) {
        warn('Text is too large for the page.')
        fit = 1
      }
      const take = Math.min(fit, left)
      if (opts.bullet && i === 0) flow.add(textEl(x - 10 * s, flow.y, 10 * s, ['•'], style))
      flow.add(textEl(x, flow.y, w, lines.slice(i, i + take), style))
      flow.advance(take * h)
      i += take
      if (i < lines.length) flow.newPage()
    }
    flow.advance(opts.gap ?? 0)
  }

  function cover(b: Of<'cover'>) {
    if (!b.title.trim()) warn('The cover has no title.')
    if (tpl.pagePerSection) flow.advance(flow.contentHeight * 0.22)
    flowText(plain(b.title), st.title, { gap: 6 * s })
    if (b.subtitle?.trim()) {
      flowText(plain(b.subtitle), { fontSize: sz.body * 1.2, color: c.muted }, { gap: 4 * s })
    }
    if (b.date?.trim()) flowText(b.date, st.muted, { gap: 10 * s })
    flow.ensure(4)
    flow.add({ kind: 'shape', x: m, y: flow.y, w: cw, h: 1, fill: c.line })
    flow.advance(gapSection)
  }

  function textSection(b: Of<'text'>) {
    const heading = plain(b.heading?.trim() ?? '')
    if (!heading && !b.body.trim()) {
      warn('A text section is empty.')
      return
    }
    if (heading) {
      // Keep the heading together with at least two lines of what follows.
      flow.ensure(wrap(heading, cw, st.h2).length * lh(st.h2) + 2 * lh(st.body))
      flowText(heading, st.h2, { gap: 4 * s })
    }
    const indent = 14 * s
    for (const para of b.body.split(/\n{2,}/)) {
      const lines = para.split('\n').filter((l) => l.trim())
      if (lines.length === 0) continue
      if (lines.every((l) => BULLET.test(l))) {
        for (const l of lines) {
          flowText(plain(l.replace(BULLET, '')), st.body, { x: m + indent, w: cw - indent, bullet: true, gap: 3 * s })
        }
        flow.advance(3 * s)
      } else {
        flowText(plain(lines.join('\n')), st.body, { gap: 6 * s })
      }
    }
    flow.advance(gapSection)
  }

  function kpis(b: Of<'kpis'>) {
    const texts = ctx.kpiText[b.id] ?? []
    const gutter = 10 * s
    const pad = 9 * s
    const valueStyle: TextStyle = { fontSize: sz.h2 + 4 * s, font: 'heading', color: c.ink }

    for (let start = 0; start < b.items.length; start += 4) {
      const row = b.items.slice(start, start + 4)
      const tileW = (cw - gutter * (row.length - 1)) / row.length
      const tiles = row.map((item, j) => ({
        labelLines: wrap(plain(item.label), tileW - 2 * pad, st.muted),
        value: texts[start + j] ?? '–',
      }))
      const labelH = Math.max(...tiles.map((t) => t.labelLines.length)) * lh(st.muted)
      const tileH = pad * 2 + labelH + 4 * s + lh(valueStyle)

      flow.ensure(tileH)
      tiles.forEach((t, j) => {
        const x = m + j * (tileW + gutter)
        const y = flow.y
        flow.add({ kind: 'shape', x, y, w: tileW, h: tileH, fill: c.surface, stroke: c.line, radius: 6 })
        flow.add(textEl(x + pad, y + pad, tileW - 2 * pad, t.labelLines, st.muted))
        flow.add(textEl(x + pad, y + pad + labelH + 4 * s, tileW - 2 * pad, [t.value], valueStyle))
      })
      flow.advance(tileH + gutter)
    }
    flow.advance(gapSection - gutter)
  }

  /** One row of charts (one or two), each with its title above and caption below. */
  function chartRow(blocks: Of<'chart'>[], cols: 1 | 2) {
    const gutter = 16 * s
    const colW = cols === 1 ? cw : (cw - gutter) / 2
    const titleStyle: TextStyle = { ...st.h2, fontSize: sz.h2 * (cols === 2 ? 0.8 : 1) }

    const cells = blocks.flatMap((b) => {
      const spec = report.charts[b.chartId]
      if (!spec) {
        warn('A chart is no longer available and was left out.')
        return []
      }
      const titleLines = wrap(plain(spec.title), colW, titleStyle)
      const caption = plain(b.caption ?? '').trim()
      const capLines = caption ? wrap(caption, colW, st.caption) : []
      const chartH = colW * (cols === 1 ? 0.46 : 0.64)
      const h =
        titleLines.length * lh(titleStyle) +
        4 * s +
        chartH +
        (capLines.length ? 6 * s + capLines.length * lh(st.caption) : 0)
      return [{ id: spec.id, titleLines, capLines, chartH, h }]
    })
    if (cells.length === 0) return

    const rowH = Math.max(...cells.map((cell) => cell.h))
    if (rowH > flow.contentHeight) warn('A chart is taller than one page.')
    else flow.ensure(rowH)

    cells.forEach((cell, i) => {
      const x = m + i * (colW + gutter)
      let y = flow.y
      flow.add(textEl(x, y, colW, cell.titleLines, titleStyle))
      y += cell.titleLines.length * lh(titleStyle) + 4 * s
      flow.add({ kind: 'chart', x, y, w: colW, h: cell.chartH, chartId: cell.id })
      y += cell.chartH
      if (cell.capLines.length) flow.add(textEl(x, y + 6 * s, colW, cell.capLines, st.caption))
    })
    flow.advance(rowH + gapSection)
  }

  /** Slides: title on top, chart on the left filling the slide, caption on the right. */
  function slideChart(b: Of<'chart'>) {
    const spec = report.charts[b.chartId]
    if (!spec) {
      warn('A chart is no longer available and was left out.')
      return
    }
    flowText(plain(spec.title), st.h2, { gap: 8 * s })
    const avail = Math.max(120, flow.bottom - flow.y - 4)
    const caption = plain(b.caption ?? '').trim()
    const chartW = caption ? cw * 0.62 : cw
    flow.add({ kind: 'chart', x: m, y: flow.y, w: chartW, h: avail, chartId: spec.id })

    if (caption) {
      const gutter = 24 * s
      const capW = cw - chartW - gutter
      const lines = wrap(caption, capW, st.body)
      const fit = Math.max(1, Math.floor(avail / lh(st.body)))
      if (lines.length > fit) warn('The caption is too long for the slide and was cut.')
      flow.add(textEl(m + chartW + gutter, flow.y, capW, lines.slice(0, fit), st.body))
    }
    flow.advance(avail)
  }

  function insightsSection(b: Of<'insights'>) {
    const items = b.insightIds
      .map((id) => ctx.insights.find((i) => i.id === id))
      .filter((i): i is Insight => !!i)
    if (items.length === 0) {
      warn('The key findings section has no findings.')
      return
    }
    flow.ensure(lh(st.h2) + 2 * lh(st.body))
    flowText('Key findings', st.h2, { gap: 6 * s })
    for (const i of items) {
      flow.ensure(lh(st.bold) + 2 * lh(st.body))
      flowText(plain(i.title), st.bold, { gap: 1 })
      flowText(plain(report.insightEdits[i.id] ?? i.narrative), st.body, { gap: 8 * s })
    }
    flow.advance(gapSection)
  }

  const visible = report.sections.filter((x) => !x.hidden).map((x) => x.block)
  if (visible.length === 0) warn('Nothing to export: every section is hidden.')

  for (let i = 0, first = true; i < visible.length; first = false) {
    const b = visible[i]
    if (!first && tpl.pagePerSection) flow.newPage()

    if (b.kind === 'chart' && tpl.chartLayout === 'stacked' && tpl.chartColumns === 2) {
      const row: Of<'chart'>[] = [b]
      const next = visible[i + 1]
      if (next?.kind === 'chart') row.push(next)
      chartRow(row, 2)
      i += row.length
      continue
    }

    switch (b.kind) {
      case 'cover':
        cover(b)
        break
      case 'text':
        textSection(b)
        break
      case 'kpis':
        kpis(b)
        break
      case 'chart':
        if (tpl.chartLayout === 'side') slideChart(b)
        else chartRow([b], 1)
        break
      case 'insights':
        insightsSection(b)
        break
      case 'table':
        break
    }
    i++
  }

  const filled = flow.pages.filter((p) => p.length > 0)
  if (filled.length === 0) filled.push([])
  const total = filled.length

  const pages = filled.map((els, i) => {
    const elements: PositionedElement[] = [{ kind: 'shape', x: 0, y: 0, w: W, h: H, fill: c.paper }, ...els]
    if (i > 0 || tpl.footerOnFirst) {
      const y = H - m - lh(st.muted)
      elements.push(textEl(m, y, cw - 80, [report.title], st.muted))
      elements.push(textEl(W - m - 80, y, 80, [`${i + 1} / ${total}`], { ...st.muted, align: 'right' }))
    }
    return { elements }
  })

  return { format: tpl.format, page: tpl.page, theme, pages, warnings }
}