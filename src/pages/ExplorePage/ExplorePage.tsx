import { RecommendationList } from '@/components/charts/RecommendationList'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatStrip } from '@/components/ui/StatStrip'
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
        description={`Review what Chartly found in ${result.source.fileName}, and switch on the charts you want in your report.`}
      />

      <div className="mb-10 border-y border-line py-7">
        <StatStrip
          stats={[
            { label: 'Rows', value: result.rowCount.toLocaleString('en-US') },
            { label: 'Columns', value: String(result.columns.length) },
            { label: 'Findings', value: String(result.insights.length) },
            {
              label: 'Charts in report',
              value: `${selected.length} of ${result.recommendations.length}`,
              hint: 'Switched on below',
            },
          ]}
        />
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start xl:gap-12">
        <section aria-labelledby="charts-heading">
          <h3 id="charts-heading" className="h-section mb-5">
            Chart workbench
          </h3>
          <RecommendationList
            items={result.recommendations}
            columns={result.columns}
            selectedIds={selected}
            onToggle={toggleChart}
          />
        </section>

        <aside aria-labelledby="findings-heading">
          <h3 id="findings-heading" className="h-section mb-5">
            Findings
          </h3>
          <InsightFeed insights={result.insights} chartIds={chartIds} onShowChart={showChart} />
        </aside>
      </div>

      <div className="glass sticky bottom-5 z-10 mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-3.5">
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{selected.length}</span>{' '}
          <span className="font-semibold">chart{selected.length === 1 ? '' : 's'} selected</span>{' '}
          <span className="text-ink-soft">for the report</span>
        </p>
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