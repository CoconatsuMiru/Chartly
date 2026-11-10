import { STAGES } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'
import { Icon } from '../ui/Icon'

/** Four connected steps. Completed steps are filled, the active step glows, upcoming steps are outlined. */
export function Stepper({ className = '' }: { className?: string }) {
  const stage = useSessionStore((s) => s.stage)
  const result = useSessionStore((s) => s.result)
  const setStage = useSessionStore((s) => s.setStage)
  const current = STAGES.findIndex((s) => s.id === stage)

  return (
    <nav aria-label="Workflow stages" className={className}>
      <ol className="flex items-center">
        {STAGES.map((s, i) => {
          const locked = s.id !== 'import' && !result
          const active = i === current
          const done = !!result && i < current
          const last = i === STAGES.length - 1

          const circle = active
            ? 'bg-brand-grad text-white shadow-[0_0_0_4px_rgb(11_96_100/0.14),0_6px_14px_-6px_rgb(8_74_77/0.6)]'
            : done
              ? 'bg-primary text-white'
              : 'bg-surface text-ink-soft ring-1 ring-[#cfc9bb] group-enabled:group-hover:text-primary group-enabled:group-hover:ring-primary'

          return (
            <li key={s.id} className={`flex items-center ${last ? '' : 'flex-1'}`}>
              <button
                type="button"
                disabled={locked}
                onClick={() => setStage(s.id)}
                aria-current={active ? 'step' : undefined}
                className="group flex items-center gap-3 rounded-xl py-1 pr-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums transition-all duration-200 ${circle}`}
                >
                  {done ? <Icon name="check" size={17} /> : `0${i + 1}`}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className={`block text-sm font-semibold leading-tight ${active || done ? 'text-ink' : 'text-ink-soft'}`}>
                    {s.label}
                  </span>
                  <span className="mt-0.5 hidden whitespace-nowrap text-xs text-muted lg:block">{s.hint}</span>
                </span>
                <span className="sr-only sm:hidden">{s.label}</span>
              </button>
              {!last && (
                <span
                  aria-hidden="true"
                  className={`mx-3 h-[2px] min-w-4 flex-1 rounded-full transition-colors duration-300 sm:mx-4 ${
                    done ? 'bg-primary' : 'bg-[#d9d4c7]'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}