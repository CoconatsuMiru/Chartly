import { useState } from 'react'
import { STAGES, type Stage } from '@/domain'
import { getDataWorker } from '@/workers/workerClient'
import type { InspectResult } from '@/workers/protocol'

export default function App() {
  const [stage, setStage] = useState<Stage>('import')
  const [result, setResult] = useState<InspectResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await getDataWorker().inspectFile(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
    } finally {
      setBusy(false)
    }
  }

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

      <main className="flex-1 overflow-auto p-8">
        <div className="rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-3xl">Worker spike</h2>
          <p className="mt-2 text-muted">
            Pick an .xlsx, .xls, .csv or .tsv file. It is parsed in a Web Worker.
          </p>

          <input
            type="file"
            accept=".xlsx,.xls,.csv,.tsv"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="mt-4 block text-sm"
          />

          {busy && <p className="mt-4 text-muted">Parsing…</p>}
          {error && (
            <p role="alert" className="mt-4 text-danger">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-6">
              <p className="font-mono text-sm">
                {result.format.toUpperCase()} · {result.rowCount} rows ·{' '}
                {result.columnCount} cols · {result.parseMs} ms
                {result.sheets.length > 0 && ` · sheets: ${result.sheets.join(', ')}`}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border border-line text-left font-mono text-xs">
                  <tbody>
                    {result.preview.map((row, r) => (
                      <tr key={r} className="border-b border-line">
                        {row.map((cell, c) => (
                          <td key={c} className="whitespace-nowrap px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}