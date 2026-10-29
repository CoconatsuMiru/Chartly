import { RecommendationList } from '@/components/charts/RecommendationList'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { useSessionStore } from '@/state/sessionStore'

export default function ExplorePage() {
  const result = useSessionStore((s) => s.result)
  const selected = useSessionStore((s) => s.selectedChartIds)
  const toggleChart = useSessionStore((s) => s.toggleChart)
  const setStage = useSessionStore((s) => s.setStage)

  if (!result) return null

  const chartIds = new Set(result.recommendations.map((r) => r.id))
  const showChart = (id: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .getElementById(`chart-${id}`)
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl">Explore</h2>
        <p className="mt-1 text-muted">
          Chartly found {result.insights.length} finding(s) and {result.recommendations.length} chart
          suggestion(s) in {result.source.fileName}. Tick the charts you want in your report.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="charts-heading">
          <h3 id="charts-heading" className="mb-3 font-serif text-xl">
            Chart workbench
          </h3>
          <RecommendationList
            items={result.recommendations}
            columns={result.columns}
            selectedIds={selected}
            onToggle={toggleChart}
          />
        </section>

        <aside
          aria-labelledby="findings-heading"
          className="xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:self-start xl:overflow-auto"
        >
          <h3 id="findings-heading" className="mb-3 font-serif text-xl">
            Findings
          </h3>
          <InsightFeed insights={result.insights} chartIds={chartIds} onShowChart={showChart} />
        </aside>
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-3 shadow-[var(--shadow-card)]">
        <p className="text-sm">
          <span className="font-medium">{selected.length}</span> chart{selected.length === 1 ? '' : 's'} selected for
          the report
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStage('import')}
            className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-paper"
          >
            Back to data
          </button>
          <button
            type="button"
            onClick={() => setStage('compose')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue to Compose
          </button>
        </div>
      </div>
    </div>
  )
}