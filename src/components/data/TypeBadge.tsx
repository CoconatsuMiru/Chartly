import type { ColumnMeta, ColumnType } from '@/domain'

const STYLE: Record<ColumnType, string> = {
  number: 'bg-primary-soft text-primary',
  date: 'bg-accent-soft text-accent',
  category: 'bg-paper text-ink ring-1 ring-line',
  boolean: 'bg-paper text-ink ring-1 ring-line',
  identifier: 'bg-paper text-muted ring-1 ring-line',
  text: 'bg-paper text-muted ring-1 ring-line',
}

const LABEL: Record<ColumnType, string> = {
  number: 'Number',
  date: 'Date',
  category: 'Category',
  boolean: 'Yes/No',
  identifier: 'ID',
  text: 'Text',
}

export function TypeBadge({ column }: { column: ColumnMeta }) {
  const unit = column.format?.unit
  const label =
    column.type === 'number' && unit ? (unit === 'currency' ? 'Currency' : 'Percent') : LABEL[column.type]
  return (
    <span className={`w-fit rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLE[column.type]}`}>
      {label}
    </span>
  )
}