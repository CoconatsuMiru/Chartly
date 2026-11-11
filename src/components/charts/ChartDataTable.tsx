import { formatFull } from '@/core/charts/formatValue'
import type { ResolvedChart } from '@/domain'

const MAX_POINT_ROWS = 50
/** Tables longer than this scroll in place. Shorter ones simply show every row. */
const SCROLL_AFTER = 14

const th = 'sticky top-0 bg-surface px-3 py-2.5 text-xs font-medium text-muted'
const td = 'border-t border-line/70 px-3 py-2.5'

export function ChartDataTable({ chart }: { chart: ResolvedChart }) {
  const fmt = chart.format
  const scatter = chart.spec.type === 'scatter'
  const points = (chart.points ?? []).slice(0, MAX_POINT_ROWS)
  const grouped = points.some((p) => p.group !== undefined)
  const rows = scatter ? points.length : chart.categories.length
  const scroll = rows > SCROLL_AFTER

  const wrap = scroll ? { role: 'region' as const, 'aria-label': 'Chart data', tabIndex: 0 } : {}

  return (
    <div {...wrap} className={scroll ? 'max-h-[360px] overflow-auto' : ''}>
      <table className="w-full text-left text-[13px] tabular-nums">
        <thead>
          {scatter ? (
            <tr>
              <th className={th}>{chart.spec.options.axisTitles.x ?? 'X'}</th>
              <th className={`${th} text-right`}>{chart.spec.options.axisTitles.y ?? 'Y'}</th>
              {grouped && <th className={th}>Group</th>}
            </tr>
          ) : (
            <tr>
              <th className={th}>{chart.spec.options.axisTitles.x ?? 'Category'}</th>
              {chart.series.map((s) => (
                <th key={s.name} className={`${th} text-right`}>
                  {s.name}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {scatter
            ? points.map((p, i) => (
                <tr key={i} className="hover:bg-[#f8f6f0]">
                  <td className={td}>{formatFull(p.x, fmt?.x)}</td>
                  <td className={`${td} text-right`}>{formatFull(p.y, fmt?.y)}</td>
                  {grouped && <td className={td}>{p.group}</td>}
                </tr>
              ))
            : chart.categories.map((cat, i) => (
                <tr key={`${cat}-${i}`} className="hover:bg-[#f8f6f0]">
                  <td className={td}>{cat}</td>
                  {chart.series.map((s) => (
                    <td key={s.name} className={`${td} text-right`}>
                      {formatFull(s.values[i], fmt?.y)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {scatter && (chart.points?.length ?? 0) > MAX_POINT_ROWS && (
        <p className="px-3 py-2 text-xs text-muted">First {MAX_POINT_ROWS} points shown.</p>
      )}
    </div>
  )
}