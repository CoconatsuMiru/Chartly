import type { ColumnMeta, ColumnType } from '@/domain'

const STYLE: Record<ColumnType, string> = {
  number: 'bg-[#d9ecea] text-[#084a4d]',
  date: 'bg-[#fbefd5] text-[#8a5a00]',
  category: 'bg-[#e9e6dd] text-[#3d4753]',
  boolean: 'bg-[#e9e6dd] text-[#3d4753]',
  identifier: 'text-muted ring-1 ring-line',
  text: 'text-muted ring-1 ring-line',
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
    <span className={`w-fit rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${STYLE[column.type]}`}>
      {label}
    </span>
  )
}