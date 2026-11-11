import { THEMES } from '@/themes/builtin'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function ThemePicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Report theme" className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.id)}
            className={`rounded-xl border p-2 text-left transition-colors ${
              on ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
            }`}
          >
            <span aria-hidden="true" className="flex h-8 overflow-hidden rounded-md ring-1 ring-black/10">
              <span className="flex-1" style={{ background: t.colors.paper }} />
              <span className="w-3" style={{ background: t.colors.primary }} />
              <span className="w-3" style={{ background: t.dataPalette[1] }} />
              <span className="w-3" style={{ background: t.dataPalette[2] }} />
            </span>
            <span className="mt-2 block text-xs font-semibold">{t.name}</span>
          </button>
        )
      })}
    </div>
  )
}