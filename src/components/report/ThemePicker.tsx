import { THEMES } from '@/themes/builtin'
import { Icon } from '../ui/Icon'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function ThemePicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Report theme" className="space-y-2">
      {THEMES.map((t) => {
        const on = t.id === value
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
            <span aria-hidden="true" className="flex h-9 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10">
              <span className="flex-1" style={{ background: t.colors.paper }} />
              <span className="w-3" style={{ background: t.colors.primary }} />
              <span className="w-3" style={{ background: t.dataPalette[1] }} />
              <span className="w-3" style={{ background: t.dataPalette[2] }} />
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold">{t.name}</span>
            {on && <Icon name="check" size={16} className="text-primary" />}
          </button>
        )
      })}
    </div>
  )
}