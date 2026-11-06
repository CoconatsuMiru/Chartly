import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
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

  return (
    <div>
      <PageHeader
        eyebrow="Stage 3 · Compose"
        title={
          <>
            Compose your <em>report</em>
          </>
        }
        description={
          view === 'edit'
            ? 'Click any text to edit it. Drag sections in the outline to reorder them.'
            : 'A paginated preview of your report with the chosen layout.'
        }
        actions={
          <>
            <div role="group" aria-label="View" className="seg">
              <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
                Edit
              </button>
              <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
                Preview
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!canUndo} onClick={() => history.undo()}>
              <Icon name="undo" size={16} />
              Undo
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!canRedo} onClick={() => history.redo()}>
              <Icon name="redo" size={16} />
              Redo
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
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
            <button type="button" className="btn btn-secondary" onClick={() => setStage('explore')}>
              <Icon name="arrowLeft" size={16} />
              Back to Explore
            </button>
            <button type="button" onClick={() => setStage('export')} className="btn btn-primary">
              Continue to Export
              <Icon name="arrowRight" size={16} />
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)_300px]">
        <aside className="card p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
          <OutlinePanel report={report} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>

        <div className="desk min-w-0 rounded-[22px] p-4 sm:p-8">
          {view === 'edit' ? (
            <PageCanvas report={report} theme={theme} selectedId={selectedId} onSelect={setSelectedId} />
          ) : plan ? (
            <PreviewPane plan={plan} report={report} />
          ) : (
            <p role="status" className="text-center text-sm text-ink-soft">
              Laying out pages…
            </p>
          )}
        </div>

        <aside className="card p-5 lg:col-span-2 xl:sticky xl:top-6 xl:col-span-1 xl:max-h-[calc(100vh-3rem)] xl:overflow-auto">
          <Inspector report={report} selectedId={selectedId} />
        </aside>
      </div>
    </div>
  )
}