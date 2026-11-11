import { useEffect, useMemo, useRef, useState } from 'react'
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

const THUMB_WIDTH = 84
const PREVIEW_MAX = { document: 680, deck: 980 }

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
  `relative flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
    on ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
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
  const [active, setActive] = useState(0)
  const [width, setWidth] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const hasPlan = plan !== null

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasPlan])

  const checks = useMemo(() => (report && plan ? runPreflight(report, plan, format) : []), [report, plan, format])
  const blocked = checks.some((c) => c.level === 'error')

  if (!report) {
    return (
      <div className="panel max-w-xl space-y-4 p-8">
        <p className="h-card">There is no report to export yet.</p>
        <button type="button" onClick={() => setStage('compose')} className="btn btn-secondary">
          Go to Compose
        </button>
      </div>
    )
  }

  const template = getTemplate(report.layoutTemplateId)
  const label = format === 'pdf' ? 'PDF' : 'PowerPoint'
  const unit = plan?.format === 'deck' ? 'Slide' : 'Page'
  const index = plan ? Math.min(active, plan.pages.length - 1) : 0
  const pagePx = plan ? plan.page.width * PX_PER_PT : 1
  const maxWidth = plan?.format === 'deck' ? PREVIEW_MAX.deck : PREVIEW_MAX.document
  const scale = width > 0 ? Math.min(1, Math.min(width, maxWidth) / pagePx) : 1

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

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_368px]">
        <section aria-labelledby="pages-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 id="pages-heading" className="h-section">
              {plan?.format === 'deck' ? 'Slides' : 'Pages'}
            </h3>
            <p className="text-[13px] text-ink-soft">
              {template.name} · {getTheme(report.themeId).name} theme
              {plan ? ` · ${plan.pages.length} ${unit.toLowerCase()}${plan.pages.length === 1 ? '' : 's'}` : ''}
            </p>
          </div>

          <div className="desk rounded-2xl p-5 sm:p-8">
            {plan ? (
              <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                <ol
                  aria-label={plan.format === 'deck' ? 'Slides' : 'Pages'}
                  className="order-2 flex shrink-0 gap-3 overflow-x-auto pb-1 md:order-1 md:w-[84px] md:flex-col md:overflow-visible"
                >
                  {plan.pages.map((_, i) => (
                    <li key={i} className="shrink-0">
                      <button
                        type="button"
                        aria-label={`Show ${unit.toLowerCase()} ${i + 1}`}
                        aria-current={i === index ? 'page' : undefined}
                        onClick={() => setActive(i)}
                        className={`block rounded-md ring-2 ring-offset-2 ring-offset-[#ebe7dc] transition-shadow ${
                          i === index ? 'ring-primary' : 'ring-transparent hover:ring-black/20'
                        }`}
                      >
                        <span aria-hidden="true" className="pointer-events-none block">
                          <PlanPage plan={plan} index={i} report={report} scale={THUMB_WIDTH / pagePx} />
                        </span>
                      </button>
                      <p className="mt-1.5 text-center text-xs tabular-nums text-ink-soft">{i + 1}</p>
                    </li>
                  ))}
                </ol>

                <div ref={stageRef} className="order-1 flex min-w-0 flex-1 justify-center md:order-2">
                  <PlanPage plan={plan} index={index} report={report} scale={scale} />
                </div>
              </div>
            ) : (
              <p role="status" className="py-10 text-center text-sm text-ink-soft">
                Laying out pages…
              </p>
            )}
          </div>
        </section>

        <aside
          className="panel divide-y divide-line xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto"
          aria-label="Export settings"
        >
          <section className="space-y-3 p-6">
            <h3 className="eyebrow-muted">Format</h3>
            <div role="radiogroup" aria-label="File format" className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={format === f.id}
                  disabled={busy}
                  onClick={() => setFormat(f.id)}
                  className={optionCls(format === f.id)}
                >
                  <span className="bg-brand-grad grid size-9 shrink-0 place-items-center rounded-lg text-white">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{f.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{f.blurb}</span>
                  </span>
                  {format === f.id && <Icon name="check" size={16} className="mt-1 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          {format === 'pptx' && (
            <section className="space-y-3 p-6">
              <h3 className="eyebrow-muted">Charts in PowerPoint</h3>
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
                    className={optionCls(chartMode === id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{name}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{blurb}</span>
                    </span>
                    {chartMode === id && <Icon name="check" size={16} className="mt-1 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="preflight-heading" className="space-y-3 p-6">
            <h3 id="preflight-heading" className="eyebrow-muted">
              Before you export
            </h3>
            {plan ? (
              <ul className="space-y-3">
                {checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 text-[13px]">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL[c.level].cls}`}
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

          <section className="space-y-4 p-6">
            <button
              type="button"
              onClick={run}
              disabled={!plan || busy || blocked}
              className="btn btn-primary w-full py-3 text-sm"
            >
              <Icon name="download" size={17} />
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