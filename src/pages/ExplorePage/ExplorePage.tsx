import { RecommendationList } from '@/components/charts/RecommendationList'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
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
    document.getElementById(`chart-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Stage 2 · Explore"
        title={
          <>
            Explore the <em>story</em>
          </>
        }
        description={`Chartly found ${result.insights.length} finding(s) and ${result.recommendations.length} chart suggestion(s) in ${result.source.fileName}. Switch on the charts you want in your report.`}
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="charts-heading">
          <h3 id="charts-heading" className="mb-5 font-serif text-2xl">
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
          className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-9rem)] xl:self-start xl:overflow-auto xl:pr-1"
        >
          <h3 id="findings-heading" className="mb-5 font-serif text-2xl">
            Findings
          </h3>
          <InsightFeed insights={result.insights} chartIds={chartIds} onShowChart={showChart} />
        </aside>
      </div>

      <div className="glass sticky bottom-5 z-10 mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-brand-grad grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums text-white">
            {selected.length}
          </span>
          <p className="text-sm">
            <span className="font-semibold">chart{selected.length === 1 ? '' : 's'} selected</span>{' '}
            <span className="text-ink-soft">for the report</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setStage('import')} className="btn btn-secondary">
            <Icon name="arrowLeft" size={16} />
            Back to data
          </button>
          <button type="button" onClick={() => setStage('compose')} className="btn btn-primary">
            Continue to Compose
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}