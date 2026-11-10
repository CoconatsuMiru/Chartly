import { useMemo, useState } from 'react'
import { PlanPage } from '@/components/report/PlanPage'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { exportReport } from '@/core/export/exportService'
import { runPreflight, type CheckLevel } from '@/core/export/preflight'
import type { ChartMode, ExportFormat } from '@/core/export/types'
import { PX_PER_PT } from '@/core/report/layout/constants'
import { getTemplate } from '@/core/report/layout/templates'
import { ChartlyError, type Progress } from '@/domain'
import { useReportPlan } from '@/hooks/useReportPlan'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { getTheme } from '@/themes/builtin'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format'
import { getDataWorker } from '@/workers/workerClient'

const THUMB_HEIGHT = 240

const FORMATS: { id: ExportFormat; name: string; blurb: string; icon: IconName }[] = [
  { id: 'pdf', name: 'PDF document', blurb: 'Selectable text and sharp charts. Best for sharing and printing.', icon: 'file' },
  { id: 'pptx', name: 'PowerPoint', blurb: 'Editable slides, with real PowerPoint charts where possible.', icon: 'slides' },
]

const LEVEL: Record<CheckLevel, { label: string; icon: IconName; cls: string }> = {
  error: { label: 'Problem', icon: 'close', cls: 'bg-danger text-white' },
  warn: { label: 'Check', icon: 'alert', cls: 'bg-accent-soft text-accent-ink ring-1 ring-accent/40' },
  info: { label: 'Note', icon: 'info', cls: 'bg-black/8 text-ink-soft' },
  ok: { label: 'Ready', icon: 'check', cls: 'bg-primary text-white' },
}

type Message = { kind: 'ok' | 'error'; text: string }

const optionCls = (on: boolean) =>
  `relative rounded-2xl border p-4 text-left transition-colors ${
    on
      ? 'border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]'
      : 'border-line bg-surface hover:border-primary/40 hover:shadow-lift'
  }`

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
      <div className="card max-w-xl space-y-4 p-8">
        <p className="font-serif text-xl">There is no report to export yet.</p>
        <button type="button" onClick={() => setStage('compose')} className="btn btn-secondary">
          Go to Compose
        </button>
      </div>
    )
  }

  const template = getTemplate(report.layoutTemplateId)
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
    <div>
      <PageHeader
        eyebrow="Stage 4 · Export"
        title={
          <>
            Export your <em>report</em>
          </>
        }
        description="Check the pages, pick a format and download. Everything is built in this browser tab."
        actions={
          <button type="button" onClick={() => setStage('compose')} className="btn btn-secondary">
            <Icon name="arrowLeft" size={16} />
            Back to Compose
          </button>
        }
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section aria-labelledby="pages-heading" className="desk min-w-0 rounded-[22px] p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 id="pages-heading" className="font-serif text-2xl">
              {plan?.format === 'deck' ? 'Slides' : 'Pages'}
            </h3>
            <p className="text-sm text-ink-soft">
              {plan ? `${plan.pages.length} · ` : ''}
              {template.name} · {getTheme(report.themeId).name} theme
            </p>
          </div>

          {plan ? (
            <ol
              aria-label={plan.format === 'deck' ? 'Slides' : 'Pages'}
              tabIndex={0}
              className="flex gap-6 overflow-x-auto pb-4"
            >
              {plan.pages.map((_, i) => (
                <li key={i} className="shrink-0 space-y-2.5">
                  <PlanPage plan={plan} index={i} report={report} scale={THUMB_HEIGHT / (plan.page.height * PX_PER_PT)} />
                  <p className="text-center font-mono text-xs text-ink-soft">{i + 1}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p role="status" className="text-sm text-ink-soft">
              Laying out pages…
            </p>
          )}
        </section>

        <aside className="card space-y-7 p-6" aria-label="Export settings">
          <section>
            <h3 className="mb-3 font-serif text-xl">Format</h3>
            <div role="radiogroup" aria-label="File format" className="grid grid-cols-2 gap-3">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={format === f.id}
                  disabled={busy}
                  onClick={() => setFormat(f.id)}
                  className={`flex flex-col gap-3 ${optionCls(format === f.id)}`}
                >
                  <span className="bg-brand-grad grid size-10 place-items-center rounded-xl text-white">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{f.name}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{f.blurb}</span>
                  </span>
                  {format === f.id && (
                    <span
                      aria-hidden="true"
                      className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-white"
                    >
                      <Icon name="check" size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {format === 'pptx' && (
            <section className="border-t border-line pt-6">
              <h3 className="mb-3 font-serif text-xl">Charts in PowerPoint</h3>
              <div role="radiogroup" aria-label="Chart type in PowerPoint" className="space-y-3">
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
                    className={`block w-full ${optionCls(chartMode === id)}`}
                  >
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{blurb}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="preflight-heading" className="border-t border-line pt-6">
            <h3 id="preflight-heading" className="mb-3 font-serif text-xl">
              Before you export
            </h3>
            {plan ? (
              <ul className="space-y-3">
                {checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${LEVEL[c.level].cls}`}
                    >
                      <Icon name={LEVEL[c.level].icon} size={11} />
                      {LEVEL[c.level].label}
                    </span>
                    <span className="leading-snug">{c.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Checking…</p>
            )}
          </section>

          <section className="space-y-4 border-t border-line pt-6">
            <button
              type="button"
              onClick={run}
              disabled={!plan || busy || blocked}
              className="btn btn-primary w-full py-3.5 text-[15px]"
            >
              <Icon name="download" size={18} />
              {busy ? `Creating ${label}…` : `Download ${label}`}
            </button>

            {busy && progress && (
              <div role="status" className="space-y-2">
                <p className="text-sm text-ink-soft">{progress.stage}</p>
                <progress className="block w-full" max={1} value={progress.fraction} aria-label="Export progress" />
              </div>
            )}

            {message && (
              <p
                role={message.kind === 'error' ? 'alert' : 'status'}
                className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                  message.kind === 'error' ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary-strong'
                }`}
              >
                <Icon name={message.kind === 'error' ? 'alert' : 'check'} size={16} className="mt-0.5 shrink-0" />
                {message.text}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}