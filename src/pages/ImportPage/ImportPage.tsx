import { DataGrid } from '@/components/data/DataGrid'
import { DataHealth } from '@/components/data/DataHealth'
import { DropZone } from '@/components/data/DropZone'
import { KpiTile } from '@/components/data/KpiTile'
import { LoadProgress } from '@/components/data/LoadProgress'
import { HeroPreview } from '@/components/import/HeroPreview'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { MONTH_LABELS } from '@/core/parsing/dateParsing'
import type { ColumnType } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'
import { formatBytes } from '@/utils/format'
import { makeSampleFile } from '@/utils/sampleData'
import { stagger } from '@/utils/stagger'
import type { LoadResult } from '@/workers/protocol'

const iso = (ts: number) => new Date(ts).toISOString().slice(0, 10)

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'sheet', title: 'Reads messy files', text: 'Finds the real header row, drops total rows, and understands currencies, percentages and dates.' },
  { icon: 'spark', title: 'Finds the story', text: 'Trends, changes, correlations and outliers, each with the numbers behind it. No guesswork.' },
  { icon: 'bars', title: 'Draws the charts', text: 'Picks chart types that fit your columns, and lets you switch or tweak any of them.' },
  { icon: 'download', title: 'Exports in one click', text: 'A paginated PDF or a PowerPoint with editable charts, checked before you download.' },
]

const TRUST: { icon: IconName; text: string }[] = [
  { icon: 'lock', text: 'Nothing leaves your browser' },
  { icon: 'bolt', text: 'Results in seconds' },
  { icon: 'check', text: 'No account needed' },
]

const TYPE_NAME: Record<ColumnType, string> = {
  number: 'numeric',
  date: 'date',
  category: 'category',
  boolean: 'yes/no',
  identifier: 'ID',
  text: 'text',
}

function dateRange(result: LoadResult): { value: string; hint: string } | null {
  for (const col of result.columns) {
    if (col.type !== 'date') continue
    const d = result.profile.columns.find((c) => c.columnId === col.id)?.date
    if (!d) continue
    const value =
      col.dateFormat === 'month-name'
        ? `${MONTH_LABELS[new Date(d.min).getUTCMonth()]} – ${MONTH_LABELS[new Date(d.max).getUTCMonth()]}`
        : `${iso(d.min)} – ${iso(d.max)}`
    return { value, hint: `${col.name}, ${d.granularity === 'irregular' ? 'irregular spacing' : d.granularity}` }
  }
  return null
}

export default function ImportPage() {
  const status = useSessionStore((s) => s.status)
  const result = useSessionStore((s) => s.result)
  const error = useSessionStore((s) => s.error)
  const file = useSessionStore((s) => s.file)
  const loadFile = useSessionStore((s) => s.loadFile)
  const setStage = useSessionStore((s) => s.setStage)

  const loading = status === 'loading'

  if (result) {
    const typeCounts = new Map<ColumnType, number>()
    for (const c of result.columns) typeCounts.set(c.type, (typeCounts.get(c.type) ?? 0) + 1)

    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Stage 1 · Import"
          title={
            <>
              Your data, <em>understood</em>
            </>
          }
          description="Here is how Chartly read your file. Check the column types and data notes, then move on to the findings."
          actions={
            <button type="button" onClick={() => setStage('explore')} className="btn btn-primary">
              Continue to Explore
              <Icon name="arrowRight" size={16} />
            </button>
          }
        />

        <LoadProgress />
        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <section className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:p-5">
          <span className="bg-brand-soft grid size-12 shrink-0 place-items-center rounded-2xl text-primary">
            <Icon name="sheet" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[15px] font-medium">{result.source.fileName}</p>
            <p className="mt-0.5 text-xs text-muted">
              {formatBytes(result.source.fileSize)} · {result.source.format.toUpperCase()} · read in {result.parseMs} ms
            </p>
          </div>
          {result.sheets.length > 1 && file && (
            <label className="flex items-center gap-2 text-sm">
              Sheet
              <select
                value={result.source.sheetName}
                onChange={(e) => loadFile(file, e.target.value)}
                className="input"
              >
                {result.sheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          <DropZone compact onFile={(f) => loadFile(f)} disabled={loading} />
        </section>

        <KpiRow result={result} />

        <DataHealth warnings={result.source.parseWarnings} duplicateRows={result.profile.duplicateRowCount} />

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-2xl">Data preview</h3>
            <p className="flex flex-wrap gap-1.5">
              {[...typeCounts].map(([type, n]) => (
                <span key={type} className="chip chip-neutral">
                  {n} {TYPE_NAME[type]}
                </span>
              ))}
            </p>
          </div>
          <DataGrid key={result.datasetId} columns={result.columns} rowCount={result.rowCount} />
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rise">
          <p className="chip">
            <Icon name="lock" size={13} />
            Private by design
          </p>
          <h2 className="display mt-5 text-[2.7rem] leading-[1.02] sm:text-[3.7rem]">
            Turn raw spreadsheets into <em className="mark-amber">finished reports.</em>
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Drop in an Excel or CSV file. Chartly cleans it up, finds what matters, and drafts a report you can edit,
            then export to PDF or PowerPoint.
          </p>

          <div className="mt-8 space-y-4">
            <LoadProgress />
            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
            <DropZone onFile={(f) => loadFile(f)} disabled={loading} />
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              No file handy?
              <button
                type="button"
                disabled={loading}
                onClick={() => loadFile(makeSampleFile())}
                className="btn btn-secondary btn-sm"
              >
                <Icon name="spark" size={15} />
                Try the sample data
              </button>
            </div>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {TRUST.map((t) => (
              <li key={t.text} className="flex items-center gap-2">
                <Icon name={t.icon} size={15} className="text-primary" />
                {t.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise" style={stagger(2)}>
          <HeroPreview />
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="eyebrow">
          What happens to your file
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((f, i) => (
            <li key={f.title} className="card card-hover rise relative p-5" style={stagger(i + 2)}>
              <span className="absolute right-5 top-5 font-mono text-xs text-muted">0{i + 1}</span>
              <span className="bg-brand-soft grid size-10 place-items-center rounded-xl text-primary">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="mt-4 font-serif text-lg">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function KpiRow({ result }: { result: LoadResult }) {
  const cells = result.rowCount * result.columns.length
  const missing = result.profile.columns.reduce((sum, c) => sum + c.missing, 0)
  const missingPct = cells > 0 ? (missing / cells) * 100 : 0
  const range = dateRange(result)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile icon="rows" label="Rows" value={result.rowCount.toLocaleString('en-US')} />
      <KpiTile icon="columns" label="Columns" value={String(result.columns.length)} />
      <KpiTile
        icon="info"
        label="Empty cells"
        value={`${missingPct < 10 ? missingPct.toFixed(1) : Math.round(missingPct)}%`}
        hint={`${missing.toLocaleString('en-US')} of ${cells.toLocaleString('en-US')}`}
      />
      {range ? (
        <KpiTile icon="calendar" label="Date range" value={range.value} hint={range.hint} />
      ) : (
        <KpiTile
          icon="copy"
          label="Duplicate rows"
          value={result.profile.duplicateRowCount.toLocaleString('en-US')}
          hint="Exact copies of another row"
        />
      )}
    </div>
  )
}