import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** A smaller header for editor-style pages. */
  compact?: boolean
}

/** The opening of every stage, so the four pages feel like one product. */
export function PageHeader({ eyebrow, title, description, actions, compact }: Props) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-x-10 gap-y-5 ${compact ? 'mb-6' : 'mb-10'}`}>
      <div className="max-w-xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className={`t-title mt-3 ${compact ? 'text-[1.875rem]' : ''}`}>{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}