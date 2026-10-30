import { THEMES } from '@/themes/builtin'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function ThemePicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Report theme" className="space-y-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === value}
          onClick={() => onChange(t.id)}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            t.id === value ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
          }`}
        >
          <span className="font-medium">{t.name}</span>
          <span className="flex gap-1" aria-hidden="true">
            {[t.colors.paper, t.colors.primary, t.colors.accent, ...t.dataPalette.slice(2, 4)].map((c, i) => (
              <span key={i} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}