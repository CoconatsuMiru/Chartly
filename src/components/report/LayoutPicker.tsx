import { TEMPLATES, getTemplate } from '@/core/report/layout/templates'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function LayoutPicker({ value, onChange }: Props) {
  const current = getTemplate(value).id
  return (
    <div role="radiogroup" aria-label="Report layout" className="space-y-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === current}
          onClick={() => onChange(t.id)}
          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
            t.id === current ? 'border-primary bg-primary-soft' : 'border-line hover:bg-paper'
          }`}
        >
          <span className="block text-sm font-medium">{t.name}</span>
          <span className="block text-xs text-muted">{t.description}</span>
        </button>
      ))}
    </div>
  )
}