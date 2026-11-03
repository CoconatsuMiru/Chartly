import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Inspector } from '@/components/report/Inspector'
import { OutlinePanel } from '@/components/report/OutlinePanel'
import { PageCanvas } from '@/components/report/PageCanvas'
import { PreviewPane } from '@/components/report/PreviewPane'
import { composeDraft } from '@/core/report/composeDraft'
import { useReportPlan } from '@/hooks/useReportPlan'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { getTheme } from '@/themes/builtin'
import { newId } from '@/utils/ids'

type View = 'edit' | 'preview'

export default function ComposePage() {
  const result = useSessionStore((s) => s.result)
  const selectedChartIds = useSessionStore((s) => s.selectedChartIds)
  const setStage = useSessionStore((s) => s.setStage)
  const report = useReportStore((s) => s.report)
  const sourceId = useReportStore((s) => s.sourceDatasetId)
  const start = useReportStore((s) => s.start)
  const canUndo = useStore(useReportStore.temporal, (t) => t.pastStates.length > 0)
  const canRedo = useStore(useReportStore.temporal, (t) => t.futureStates.length > 0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('edit')
  const plan = useReportPlan(report, view === 'preview')

  const build = useCallback(() => {
    if (!result) return
    start(
      composeDraft({
        id: newId('report'),
        fileName: result.source.fileName,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        rowCount: result.rowCount,
        columns: result.columns,
        insights: result.insights,
        recommendations: result.recommendations,
        selectedChartIds,
      }),
      result.datasetId,
    )
    setSelectedId(null)
  }, [result, selectedChartIds, start])

  // First visit for this file: build the draft. Later visits keep the user's edits.
  useEffect(() => {
    if (result && sourceId !== result.datasetId) build()
  }, [result, sourceId, build])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      e.preventDefault()
      const history = useReportStore.temporal.getState()
      if (e.shiftKey) history.redo()
      else history.undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!result || !report) return null

  const theme = getTheme(report.themeId)
  const history = useReportStore.temporal.getState()
  const btn =
    'rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-paper disabled:opacity-40 disabled:hover:bg-transparent'
  const tab = (v: View) =>
    `rounded-md px-3 py-1 text-sm transition-colors ${view === v ? 'bg-primary text-white' : 'text-muted hover:bg-paper'}`

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl">Compose</h2>
          <p className="mt-1 text-muted">
            {view === 'edit'
              ? 'Click any text to edit it. Drag sections in the outline to reorder them.'
              : 'A paginated preview of your report with the chosen layout.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="flex rounded-lg border border-line p-0.5">
            <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')} className={tab('edit')}>
              Edit
            </button>
            <button
              type="button"
              aria-pressed={view === 'preview'}
              onClick={() => setView('preview')}
              className={tab('preview')}
            >
              Preview
            </button>
          </div>
          <button type="button" className={btn} disabled={!canUndo} onClick={() => history.undo()}>
            Undo
          </button>
          <button type="button" className={btn} disabled={!canRedo} onClick={() => history.redo()}>
            Redo
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              if (
                window.confirm(
                  'Rebuild the report from your current chart selections? Your edits will be replaced (you can undo).',
                )
              ) {
                build()
              }
            }}
          >
            Rebuild from selections
          </button>
          <button type="button" className={btn} onClick={() => setStage('explore')}>
            Back to Explore
          </button>
          <button
            type="button"
            onClick={() => setStage('export')}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Continue to Export
          </button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_270px]">
        <aside className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-auto">
          <OutlinePanel report={report} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>

        {view === 'edit' ? (
          <PageCanvas report={report} theme={theme} selectedId={selectedId} onSelect={setSelectedId} />
        ) : plan ? (
          <PreviewPane plan={plan} report={report} />
        ) : (
          <p role="status" className="text-sm text-muted">
            Laying out pages…
          </p>
        )}

        <aside className="lg:col-span-2 xl:sticky xl:top-8 xl:col-span-1 xl:max-h-[calc(100vh-4rem)] xl:overflow-auto">
          <Inspector report={report} selectedId={selectedId} />
        </aside>
      </div>
    </div>
  )
}