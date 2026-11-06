import { TEMPLATES, getTemplate } from '@/core/report/layout/templates'
import { Icon } from '../ui/Icon'

interface Props {
  value: string
  onChange: (id: string) => void
}

/** Tiny drawings of each layout, so the choice is visual. */
function Glyph({ id }: { id: string }) {
  const ink = 'currentColor'
  return (
    <svg aria-hidden="true" width="36" height="28" viewBox="0 0 36 28" className="shrink-0 text-primary">
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
  const current = getTemplate(value).id
  return (
    <div role="radiogroup" aria-label="Report layout" className="space-y-2">
      {TEMPLATES.map((t) => {
        const on = t.id === current
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
              on ? 'border-primary bg-primary-soft ring-1 ring-primary/30' : 'border-line hover:border-primary/40 hover:bg-paper'
            }`}
          >
            <Glyph id={t.id} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t.name}</span>
              <span className="block text-xs text-ink-soft">{t.description}</span>
            </span>
            {on && <Icon name="check" size={16} className="shrink-0 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}