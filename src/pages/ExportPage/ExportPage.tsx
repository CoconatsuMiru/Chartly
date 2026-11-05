import { useMemo, useState } from 'react'
import { PlanPage } from '@/components/report/PlanPage'
import { exportReport } from '@/core/export/exportService'
import { runPreflight, type CheckLevel } from '@/core/export/preflight'
import type { ChartMode, ExportFormat } from '@/core/export/types'
import { PX_PER_PT } from '@/core/report/layout/constants'
import { getTemplate } from '@/core/report/layout/templates'
import { ChartlyError, type Progress } from '@/domain'
import { useReportPlan } from '@/hooks/useReportPlan'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format'
import { getDataWorker } from '@/workers/workerClient'

const THUMB_HEIGHT = 200

const FORMATS: { id: ExportFormat; name: string; blurb: string }[] = [
  { id: 'pdf', name: 'PDF document', blurb: 'Selectable text and sharp charts. Best for sharing and printing.' },
  { id: 'pptx', name: 'PowerPoint', blurb: 'Editable slides, with real PowerPoint charts where possible.' },
]

const LEVEL: Record<CheckLevel, { label: string; cls: string }> = {
  error: { label: 'Problem', cls: 'bg-danger/10 text-danger' },
  warn: { label: 'Check', cls: 'bg-accent-soft text-accent-ink' },
  info: { label: 'Note', cls: 'bg-paper text-muted ring-1 ring-line' },
  ok: { label: 'Ready', cls: 'bg-primary-soft text-primary' },
}

type Message = { kind: 'ok' | 'error'; text: string }

export default function ExportPage() {
  const report = useReportStore((s) => s.report)
  const setStage = useSessionStore((s) => s.setStage)
  const plan = useReportPlan(report, true)

  const [format, setFormat] = useState<ExportFormat>(report?.outputFormat === 'deck' ? 'pptx' : 'pdf')
  const [chartMode, setChartMode] = useState<ChartMode>('native')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  const checks = useMemo(() => (report && plan ? runPreflight(report, plan, format) : []), [report, plan, format])
  const blocked = checks.some((c) => c.level === 'error')

  if (!report) {
    return (
      <div className="space-y-3">
        <p className="text-muted">There is no report to export yet.</p>
        <button type="button" onClick={() => setStage('compose')} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-paper">
          Go to Compose
        </button>
      </div>
    )
  }

  const layoutName = getTemplate(report.layoutTemplateId).name
  const label = format === 'pdf' ? 'PDF' : 'PowerPoint'

  async function run() {
    if (!report || !plan || busy || blocked) return
    setBusy(true)
    setMessage(null)
    setProgress({ stage: 'Preparing' })
    try {
      const { blob, fileName } = await exportReport(
        format,
        report,
        plan,
        (spec) => getDataWorker().resolveChart(spec),
        { chartMode },
        setProgress,
      )
      downloadBlob(blob, fileName)
      setMessage({ kind: 'ok', text: `Saved ${fileName} (${formatBytes(blob.size)}).` })
    } catch (e) {
      const detail = e instanceof ChartlyError ? `${e.message}${e.hint ? ` (${e.hint})` : ''}` : 'Export failed.'
      setMessage({ kind: 'error', text: detail })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl">Export</h2>
          <p className="mt-1 text-muted">
            {layoutName}. To change the layout or theme, go back to Compose.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStage('compose')}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-paper"
        >
          Back to Compose
        </button>
      </header>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="pages-heading" className="min-w-0">
          <h3 id="pages-heading" className="mb-3 font-serif text-xl">
            {plan?.format === 'deck' ? 'Slides' : 'Pages'}
          </h3>
          {plan ? (
            <ol
              aria-label={plan.format === 'deck' ? 'Slides' : 'Pages'}
              tabIndex={0}
              className="flex gap-4 overflow-x-auto pb-3"
            >
              {plan.pages.map((_, i) => (
                <li key={i} className="shrink-0 space-y-1">
                  <PlanPage plan={plan} index={i} report={report} scale={THUMB_HEIGHT / (plan.page.height * PX_PER_PT)} />
                  <p className="text-center text-xs text-muted">{i + 1}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p role="status" className="text-sm text-muted">
              Laying out pages…
            </p>
          )}
        </section>

        <aside className="space-y-6" aria-label="Export settings">
          <section>
            <h3 className="mb-2 font-serif text-xl">Format</h3>
            <div role="radiogroup" aria-label="File format" className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={format === f.id}
                  disabled={busy}
                  onClick={() => setFormat(f.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    format === f.id ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
                  }`}
                >
                  <span className="block text-sm font-medium">{f.name}</span>
                  <span className="block text-xs text-muted">{f.blurb}</span>
                </button>
              ))}
            </div>
          </section>

          {format === 'pptx' && (
            <section>
              <h3 className="mb-2 font-serif text-xl">Charts in PowerPoint</h3>
              <div role="radiogroup" aria-label="Chart type in PowerPoint" className="space-y-2">
                {(
                  [
                    ['native', 'Editable PowerPoint charts', 'Right-click a chart to edit its data. Charts with gaps, trend lines or grouped points use images instead.'],
                    ['image', 'Images', 'Every chart looks exactly like the preview, but cannot be edited.'],
                  ] as const
                ).map(([id, name, blurb]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={chartMode === id}
                    disabled={busy}
                    onClick={() => setChartMode(id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      chartMode === id ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
                    }`}
                  >
                    <span className="block text-sm font-medium">{name}</span>
                    <span className="block text-xs text-muted">{blurb}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="preflight-heading">
            <h3 id="preflight-heading" className="mb-2 font-serif text-xl">
              Before you export
            </h3>
            {plan ? (
              <ul className="space-y-2">
                {checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${LEVEL[c.level].cls}`}>
                      {LEVEL[c.level].label}
                    </span>
                    <span>{c.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Checking…</p>
            )}
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={run}
              disabled={!plan || busy || blocked}
              className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? `Creating ${label}…` : `Download ${label}`}
            </button>

            {busy && progress && (
              <div role="status" className="space-y-1">
                <p className="text-sm text-muted">{progress.stage}</p>
                <progress
                  className="h-2 w-full overflow-hidden rounded accent-[var(--color-primary)]"
                  max={1}
                  value={progress.fraction}
                  aria-label="Export progress"
                />
              </div>
            )}

            {message && (
              <p
                role={message.kind === 'error' ? 'alert' : 'status'}
                className={`rounded-lg px-4 py-3 text-sm ${
                  message.kind === 'error' ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary'
                }`}
              >
                {message.text}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}