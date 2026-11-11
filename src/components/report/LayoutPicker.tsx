import { TEMPLATES, getTemplate } from '@/core/report/layout/templates'

interface Props {
  value: string
  onChange: (id: string) => void
}

const SHORT: Record<string, string> = { executive: 'Executive', grid: 'Grid', slides: 'Slides' }

/** Tiny drawings of each layout, so the choice is visual. */
function Glyph({ id }: { id: string }) {
  const ink = 'currentColor'
  return (
    <svg aria-hidden="true" width="36" height="28" viewBox="0 0 36 28" className="text-primary">
      {id === 'slides' ? (
        <>
          <rect x="2" y="4" width="32" height="20" rx="3" fill="none" stroke={ink} strokeWidth="1.5" />
          <rect x="6" y="8" width="14" height="12" rx="1.5" fill={ink} opacity="0.35" />
          <path d="M23 9h7M23 13h7M23 17h5" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="8" y="1.5" width="20" height="25" rx="2.5" fill="none" stroke={ink} strokeWidth="1.5" />
          {id === 'grid' ? (
            <>
              <rect x="11" y="12" width="6" height="6" rx="1" fill={ink} opacity="0.35" />
              <rect x="19" y="12" width="6" height="6" rx="1" fill={ink} opacity="0.35" />
              <path d="M11 6h14M11 21h14" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M11 6h14" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
              <rect x="11" y="10" width="14" height="7" rx="1" fill={ink} opacity="0.35" />
              <path d="M11 21h14" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </svg>
  )
}

export function LayoutPicker({ value, onChange }: Props) {
  const current = getTemplate(value)
  return (
    <div>
      <div role="radiogroup" aria-label="Report layout" className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => {
          const on = t.id === current.id
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${t.name}. ${t.description}`}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition-colors ${
                on ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
              }`}
            >
              <Glyph id={t.id} />
              <span className="text-xs font-semibold">{SHORT[t.id] ?? t.name}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {current.name}: {current.description}
      </p>
    </div>
  )
}