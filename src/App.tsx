import { useState } from 'react'
import { STAGES, type Stage } from '@/domain'
import { getDataWorker } from '@/workers/workerClient'
import type { InspectResult } from '@/workers/protocol'
import { downloadBlob } from '@/spikes/download'

export default function App() {
  const [stage, setStage] = useState<Stage>('import')
  const [result, setResult] = useState<InspectResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [exportMsg, setExportMsg] = useState<string | null>(null)

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

  async function exportSpike(kind: 'pdf' | 'pptx') {
    setExportMsg(`Building ${kind.toUpperCase()}…`)
    try {
      const t0 = performance.now()
      const blob =
        kind === 'pdf'
          ? await (await import('@/spikes/pdfSpike')).makePdf()
          : await (await import('@/spikes/pptxSpike')).makePptx()
      downloadBlob(blob, `chartly-spike.${kind}`)
      setExportMsg(
        `${kind.toUpperCase()} done in ${Math.round(performance.now() - t0)} ms (${Math.round(blob.size / 1024)} KB)`,
      )
    } catch (e) {
      setExportMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`)
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

      <main className="flex-1 space-y-6 overflow-auto p-8">
        <section className="rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
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
        </section>

        <section className="rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-3xl">Export spike</h2>
          <p className="mt-2 text-muted">
            Builds a sample chart and exports it. Open the files to check them.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => exportSpike('pdf')}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              Export PDF
            </button>
            <button
              onClick={() => exportSpike('pptx')}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              Export PPTX
            </button>
          </div>
          {exportMsg && <p className="mt-3 font-mono text-sm">{exportMsg}</p>}
        </section>
      </main>
    </div>
  )
}