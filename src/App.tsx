import { useState } from 'react'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { STAGES, type ColumnMeta, type Stage } from '@/domain'
import { getDataWorker } from '@/workers/workerClient'
import type { LoadResult } from '@/workers/protocol'

const BADGE: Record<string, string> = {
  number: 'bg-primary-soft text-primary',
  date: 'bg-accent-soft text-accent',
  category: 'bg-paper text-ink',
  boolean: 'bg-paper text-ink',
  identifier: 'bg-paper text-muted',
  text: 'bg-paper text-muted',
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

function summary(result: LoadResult, col: ColumnMeta): string {
  const p = result.profile.columns.find((c) => c.columnId === col.id)
  if (!p) return ''
  if (p.numeric) {
    const n = p.numeric
    return `min ${fmt(n.min)} · mean ${fmt(n.mean)} · median ${fmt(n.median)} · max ${fmt(n.max)} · outliers ${n.outlierCount}`
  }
  if (p.date) {
    const d = p.date
    return `${new Date(d.min).toISOString().slice(0, 10)} → ${new Date(d.max).toISOString().slice(0, 10)} · ${d.granularity}`
  }
  if (p.categorical) {
    return p.categorical.top
      .slice(0, 3)
      .map((t) => `${t.value} ${Math.round(t.share * 100)}%`)
      .join(' · ')
  }
  return ''
}

export default function App() {
  const [stage, setStage] = useState<Stage>('import')
  const [result, setResult] = useState<LoadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await getDataWorker().loadDataset(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
    } finally {
      setBusy(false)
    }
  }

  const nameOf = (id: string) => result?.columns.find((c) => c.id === id)?.name ?? id

  return (
    <div className="flex h-full">
      <nav
        aria-label="Workflow stages"
        className="flex w-56 flex-col gap-1 border-r border-line bg-surface p-4"
      >
        <h1 className="mb-6 font-serif text-2xl text-primary">Chartly</h1>
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStage(s.id)}
            aria-current={stage === s.id ? 'step' : undefined}
            className={`rounded-lg px-3 py-2 text-left transition-colors ${
              stage === s.id
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-paper'
            }`}
          >
            <span className="font-mono text-xs">0{i + 1}</span>
            <span className="block text-sm font-medium">{s.label}</span>
            <span className="block text-xs">{s.hint}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 space-y-6 overflow-auto p-8">
        <section className="rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-3xl">Insights check</h2>
          <p className="mt-2 text-muted">
            Pick an .xlsx, .xls, .csv or .tsv file. It is parsed, profiled and analysed in a Web Worker.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.tsv"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="mt-4 block text-sm"
          />
          {busy && <p className="mt-4 text-muted">Analysing…</p>}
          {error && (
            <p role="alert" className="mt-4 text-danger">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-6 space-y-6">
              <p className="font-mono text-sm">
                {result.source.format.toUpperCase()} · {result.rowCount} rows ·{' '}
                {result.columns.length} cols · {result.parseMs} ms · duplicate rows:{' '}
                {result.profile.duplicateRowCount}
                {result.source.sheetName && ` · sheet: ${result.source.sheetName}`}
              </p>

              {result.source.parseWarnings.length > 0 && (
                <ul className="space-y-1 rounded-lg bg-accent-soft p-3 text-sm">
                  {result.source.parseWarnings.map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              )}

              <div>
                <h3 className="font-serif text-xl">Findings</h3>
                <div className="mt-2">
                  <InsightFeed insights={result.insights} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-line text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-paper">
                      {result.columns.map((c) => (
                        <th key={c.id} className="whitespace-nowrap px-3 py-2 align-top font-medium">
                          {c.name}
                          <span
                            className={`mt-1 block w-fit rounded px-1.5 py-0.5 font-mono text-xs ${BADGE[c.type]}`}
                          >
                            {c.type} · {c.role} · {Math.round(c.typeConfidence * 100)}%
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {result.preview.map((row, r) => (
                      <tr key={r} className="border-b border-line">
                        {row.map((cell, c) => (
                          <td key={c} className="whitespace-nowrap px-3 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-serif text-xl">Column profile</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {result.columns.map((c) => {
                    const p = result.profile.columns.find((x) => x.columnId === c.id)
                    return (
                      <li key={c.id} className="rounded-lg border border-line p-3">
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted">
                          {p?.count} filled · {Math.round((p?.missingRate ?? 0) * 100)}% missing ·{' '}
                          {p?.distinct} distinct
                          {p && p.qualityFlags.length > 0 && ` · ⚑ ${p.qualityFlags.join(', ')}`}
                        </span>
                        <div className="mt-1 font-mono text-xs">{summary(result, c)}</div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {result.profile.correlations.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl">Strongest correlations</h3>
                  <ul className="mt-2 space-y-1 font-mono text-xs">
                    {result.profile.correlations.slice(0, 5).map((c, i) => (
                      <li key={i}>
                        {nameOf(c.a)} ↔ {nameOf(c.b)}: r = {c.r.toFixed(3)} (n = {c.n})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}