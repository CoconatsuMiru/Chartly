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

/** Grid columns for each combination of open panels (o = open, c = closed). Written out in full so Tailwind can see them. */
const COLUMNS: Record<string, string> = {
  oo: 'lg:grid-cols-[232px_minmax(0,1fr)_288px]',
  oc: 'lg:grid-cols-[232px_minmax(0,1fr)]',
  co: 'lg:grid-cols-[minmax(0,1fr)_288px]',
  cc: 'lg:grid-cols-[minmax(0,1fr)]',
}

const panel =
  'panel p-4 lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto'
const divider = <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line sm:block" />

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
  const [outlineOpen, setOutlineOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const [settingsOpen, setSettingsOpen] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
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
  const columns = COLUMNS[`${outlineOpen ? 'o' : 'c'}${settingsOpen ? 'o' : 'c'}`]

  return (
    <div>
      <PageHeader
        compact
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
      />

      <div
        role="group"
        aria-label="Editor tools"
        className="sticky top-3 z-20 mb-5 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-line bg-surface/95 px-3 py-2 backdrop-blur"
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={outlineOpen}
          aria-controls="outline-panel"
          onClick={() => setOutlineOpen((v) => !v)}
        >
          <Icon name="rows" size={16} />
          Outline
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={settingsOpen}
          aria-controls="settings-panel"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <Icon name="columns" size={16} />
          Settings
        </button>
        {divider}
        <div role="group" aria-label="View" className="seg">
          <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
            Edit
          </button>
          <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
            Preview
          </button>
        </div>
        {divider}
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
          className="btn btn-ghost btn-sm"
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

        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStage('explore')}>
            <Icon name="arrowLeft" size={15} />
            Back to Explore
          </button>
          <button type="button" onClick={() => setStage('export')} className="btn btn-primary btn-sm">
            Continue to Export
            <Icon name="arrowRight" size={15} />
          </button>
        </div>
      </div>

      <div className={`grid items-start gap-5 ${columns}`}>
        {outlineOpen && (
          <aside id="outline-panel" aria-label="Report outline" className={panel}>
            <OutlinePanel report={report} selectedId={selectedId} onSelect={setSelectedId} />
          </aside>
        )}

        <div className="desk min-w-0 rounded-2xl px-4 py-8 sm:px-8 sm:py-10">
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

        {settingsOpen && (
          <aside id="settings-panel" aria-label="Report settings" className={`${panel} p-5`}>
            <Inspector report={report} selectedId={selectedId} />
          </aside>
        )}
      </div>
    </div>
  )
}