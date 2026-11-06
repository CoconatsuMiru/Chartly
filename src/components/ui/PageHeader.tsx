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
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-2.5 text-[2.3rem] sm:text-[2.9rem]">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}