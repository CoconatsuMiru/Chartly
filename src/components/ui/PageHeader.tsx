import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

/** The opening of every stage, so the four pages feel like one product. */
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
      <div className="max-w-xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-3 text-[2.2rem] sm:text-[2.7rem]">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}