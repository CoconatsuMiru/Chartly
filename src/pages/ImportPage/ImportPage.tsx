import { DataGrid } from '@/components/data/DataGrid'
import { DataHealth } from '@/components/data/DataHealth'
import { DropZone } from '@/components/data/DropZone'
import { KpiTile } from '@/components/data/KpiTile'
import { MONTH_LABELS } from '@/core/parsing/dateParsing'
import { useSessionStore } from '@/state/sessionStore'
import { formatBytes } from '@/utils/format'
import { makeSampleFile } from '@/utils/sampleData'
import type { LoadResult } from '@/workers/protocol'

const iso = (ts: number) => new Date(ts).toISOString().slice(0, 10)

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

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl">Bring in your data</h2>
        <p className="mt-1 text-muted">
          Chartly reads your file right here in the browser, finds the story in it, and builds a report you can
          export.
        </p>
      </header>

      {loading && (
        <p role="status" className="rounded-lg bg-paper px-4 py-3 text-sm text-muted">
          Reading {file?.name ?? 'your file'}…
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!result && (
        <>
          <DropZone onFile={(f) => loadFile(f)} disabled={loading} />
          <p className="text-sm text-muted">
            No file handy?{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => loadFile(makeSampleFile())}
              className="text-primary underline underline-offset-2 disabled:opacity-50"
            >
              Try the sample data
            </button>
          </p>
        </>
      )}

      {result && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div>
              <p className="font-mono text-sm">{result.source.fileName}</p>
              <p className="text-xs text-muted">
                {formatBytes(result.source.fileSize)} · {result.source.format.toUpperCase()} · read in{' '}
                {result.parseMs} ms
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {result.sheets.length > 1 && file && (
                <label className="flex items-center gap-2 text-sm">
                  Sheet
                  <select
                    value={result.source.sheetName}
                    onChange={(e) => loadFile(file, e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1"
                  >
                    {result.sheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="w-64">
                <DropZone compact onFile={(f) => loadFile(f)} disabled={loading} />
              </div>
            </div>
          </section>

          <KpiRow result={result} />

          <DataHealth warnings={result.source.parseWarnings} duplicateRows={result.profile.duplicateRowCount} />

          <section>
            <h3 className="mb-2 font-serif text-xl">Data preview</h3>
            <DataGrid key={result.datasetId} columns={result.columns} rowCount={result.rowCount} />
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStage('explore')}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Continue to Explore
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function KpiRow({ result }: { result: LoadResult }) {
  const cells = result.rowCount * result.columns.length
  const missing = result.profile.columns.reduce((sum, c) => sum + c.missing, 0)
  const missingPct = cells > 0 ? (missing / cells) * 100 : 0
  const range = dateRange(result)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile label="Rows" value={result.rowCount.toLocaleString('en-US')} />
      <KpiTile label="Columns" value={String(result.columns.length)} />
      <KpiTile
        label="Empty cells"
        value={`${missingPct < 10 ? missingPct.toFixed(1) : Math.round(missingPct)}%`}
        hint={`${missing.toLocaleString('en-US')} of ${cells.toLocaleString('en-US')}`}
      />
      {range ? (
        <KpiTile label="Date range" value={range.value} hint={range.hint} />
      ) : (
        <KpiTile
          label="Duplicate rows"
          value={result.profile.duplicateRowCount.toLocaleString('en-US')}
          hint="Exact copies of another row"
        />
      )}
    </div>
  )
}