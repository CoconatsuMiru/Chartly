import { Icon, type IconName } from '../ui/Icon'

interface Props {
  label: string
  value: string
  hint?: string
  icon?: IconName
}

export function KpiTile({ label, value, hint, icon }: Props) {
  return (
    <div className="card relative overflow-hidden p-5">
      <span aria-hidden="true" className="bg-brand-bar absolute inset-x-0 top-0 h-[3px]" />
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow-muted">{label}</p>
        {icon && (
          <span className="bg-brand-soft grid size-8 shrink-0 place-items-center rounded-lg text-primary">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 break-words font-serif text-[1.9rem] leading-none tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  )
}