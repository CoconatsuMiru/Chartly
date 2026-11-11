export interface Stat {
  label: string
  value: string
  hint?: string
  /** Use a smaller figure for long values such as date ranges. */
  long?: boolean
}

/** Key figures in a row, separated by hairlines instead of boxed in cards. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 sm:gap-x-0">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`min-w-0 sm:px-7 ${i === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-line'}`}
        >
          <dt className="eyebrow-muted">{s.label}</dt>
          <dd className={`mt-2.5 break-words ${s.long ? 'stat-sm' : 'stat'}`}>{s.value}</dd>
          {s.hint && <dd className="mt-1.5 text-xs text-muted">{s.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}