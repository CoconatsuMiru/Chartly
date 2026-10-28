import { useState } from 'react'
import { STAGES, type Stage } from '@/domain'

export default function App() {
  const [stage, setStage] = useState<Stage>('import')

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
          <h2 className="font-serif text-3xl">Stage: {stage}</h2>
          <p className="mt-2 text-muted">Foundations are working.</p>
        </div>
      </main>
    </div>
  )
}