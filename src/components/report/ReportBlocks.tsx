import { fmtNum } from '@/core/insights/format'
import type { ReportDocument, SectionBlock, Theme } from '@/domain'
import { useKpiValues } from '@/hooks/useKpiValues'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { EditableText } from './EditableText'
import { ReportChart } from './ReportChart'

/** Theme sizes are in points; the canvas shows them as CSS pixels at 96 dpi. */
export const pt = (n: number) => `${(n * 4) / 3}px`

const headingFont = (t: Theme) => ({ fontFamily: `"${t.fonts.heading}", Georgia, serif` })

type Of<K extends SectionBlock['kind']> = Extract<SectionBlock, { kind: K }>

function Cover({ block, theme }: { block: Of<'cover'>; theme: Theme }) {
  const update = useReportStore((s) => s.updateBlock)
  return (
    <div className="space-y-2 border-b pb-6" style={{ borderColor: theme.colors.line }}>
      <div style={{ ...headingFont(theme), fontSize: pt(theme.type.h1), lineHeight: 1.15, color: theme.colors.primary }}>
        <EditableText label="report title" value={block.title} placeholder="Report title" onCommit={(v) => update(block.id, { title: v })} />
      </div>
      <div style={{ color: theme.colors.muted }}>
        <EditableText label="subtitle" value={block.subtitle ?? ''} placeholder="Add a subtitle" onCommit={(v) => update(block.id, { subtitle: v })} />
      </div>
      <div style={{ color: theme.colors.muted, fontSize: pt(theme.type.caption) }}>
        <EditableText label="date" value={block.date ?? ''} placeholder="Add a date" onCommit={(v) => update(block.id, { date: v })} />
      </div>
    </div>
  )
}

function Kpis({ block, theme }: { block: Of<'kpis'>; theme: Theme }) {
  const update = useReportStore((s) => s.updateBlock)
  const columns = useSessionStore((s) => s.result?.columns)
  const values = useKpiValues(block.items)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {block.items.map((item, i) => {
        const countLike = item.aggregation === 'count' || item.aggregation === 'countDistinct'
        const meta = countLike ? undefined : columns?.find((c) => c.id === item.columnId)
        const v = values?.[i]
        return (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.line}` }}
          >
            <div className="uppercase tracking-wide" style={{ color: theme.colors.muted, fontSize: pt(theme.type.caption) }}>
              <EditableText
                label={`KPI label ${i + 1}`}
                value={item.label}
                onCommit={(label) =>
                  update(block.id, { items: block.items.map((x, j) => (j === i ? { ...x, label } : x)) })
                }
              />
            </div>
            <p className="mt-1" style={{ ...headingFont(theme), fontSize: pt(theme.type.h2 + 4) }}>
              {v === null || v === undefined ? '–' : fmtNum(v, meta)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function TextSection({ block, theme }: { block: Of<'text'>; theme: Theme }) {
  const update = useReportStore((s) => s.updateBlock)
  return (
    <div className="space-y-2">
      <div style={{ ...headingFont(theme), fontSize: pt(theme.type.h2), color: theme.colors.primary }}>
        <EditableText label="section heading" value={block.heading ?? ''} placeholder="Add a heading" onCommit={(v) => update(block.id, { heading: v })} />
      </div>
      <EditableText multiline rich label="section text" value={block.body} placeholder="Write something…" onCommit={(v) => update(block.id, { body: v })} />
    </div>
  )
}

function ChartSection({ block, report, theme }: { block: Of<'chart'>; report: ReportDocument; theme: Theme }) {
  const update = useReportStore((s) => s.updateBlock)
  const patchChart = useReportStore((s) => s.patchChart)
  const spec = report.charts[block.chartId]
  if (!spec) return <p className="text-sm opacity-60">This chart is no longer available.</p>

  return (
    <figure className="space-y-2">
      <div style={{ ...headingFont(theme), fontSize: pt(theme.type.h2), color: theme.colors.primary }}>
        <EditableText label="chart title" value={spec.title} onCommit={(v) => patchChart(spec.id, { title: v })} />
      </div>
      {spec.subtitle && <p style={{ color: theme.colors.muted, fontSize: pt(theme.type.caption) }}>{spec.subtitle}</p>}
      <ReportChart spec={spec} theme={theme} />
      <figcaption style={{ color: theme.colors.muted, fontSize: pt(theme.type.caption + 1) }}>
        <EditableText multiline label="chart caption" value={block.caption ?? ''} placeholder="Add a caption" onCommit={(v) => update(block.id, { caption: v })} />
      </figcaption>
    </figure>
  )
}

function InsightsSection({ block, report, theme }: { block: Of<'insights'>; report: ReportDocument; theme: Theme }) {
  const insights = useSessionStore((s) => s.result?.insights)
  const setEdit = useReportStore((s) => s.setInsightEdit)
  const items = block.insightIds
    .map((id) => insights?.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i)

  return (
    <div className="space-y-3">
      <h3 style={{ ...headingFont(theme), fontSize: pt(theme.type.h2), color: theme.colors.primary }}>Key findings</h3>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id}>
            <p className="font-semibold">{i.title}</p>
            <EditableText
              multiline
              label={`finding: ${i.title}`}
              value={report.insightEdits[i.id] ?? i.narrative}
              onCommit={(v) => setEdit(i.id, v === i.narrative ? null : v)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BlockView({ block, report, theme }: { block: SectionBlock; report: ReportDocument; theme: Theme }) {
  switch (block.kind) {
    case 'cover':
      return <Cover block={block} theme={theme} />
    case 'kpis':
      return <Kpis block={block} theme={theme} />
    case 'text':
      return <TextSection block={block} theme={theme} />
    case 'chart':
      return <ChartSection block={block} report={report} theme={theme} />
    case 'insights':
      return <InsightsSection block={block} report={report} theme={theme} />
    case 'table':
      return <p className="text-sm opacity-60">Data tables are coming in a later step.</p>
  }
}