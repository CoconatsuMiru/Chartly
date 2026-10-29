import { formatFull } from '@/core/charts/formatValue'
import type { ResolvedChart } from '@/domain'

const MAX_POINT_ROWS = 50

export function ChartDataTable({ chart }: { chart: ResolvedChart }) {
  const fmt = chart.format

  if (chart.spec.type === 'scatter') {
    const pts = (chart.points ?? []).slice(0, MAX_POINT_ROWS)
    const grouped = pts.some((p) => p.group !== undefined)
    return (
      <div className="max-h-[280px] overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-line">
              <th className="px-2 py-1 font-medium">{chart.spec.options.axisTitles.x ?? 'X'}</th>
              <th className="px-2 py-1 font-medium">{chart.spec.options.axisTitles.y ?? 'Y'}</th>
              {grouped && <th className="px-2 py-1 font-medium">Group</th>}
            </tr>
          </thead>
          <tbody className="font-mono">
            {pts.map((p, i) => (
              <tr key={i} className="border-b border-line">
                <td className="px-2 py-1">{formatFull(p.x, fmt?.x)}</td>
                <td className="px-2 py-1">{formatFull(p.y, fmt?.y)}</td>
                {grouped && <td className="px-2 py-1">{p.group}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {(chart.points?.length ?? 0) > MAX_POINT_ROWS && (
          <p className="px-2 py-1 text-xs text-muted">First {MAX_POINT_ROWS} points shown.</p>
        )}
      </div>
    )
  }

  return (
    <div className="max-h-[280px] overflow-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line">
            <th className="px-2 py-1 font-medium">{chart.spec.options.axisTitles.x ?? 'Category'}</th>
            {chart.series.map((s) => (
              <th key={s.name} className="px-2 py-1 font-medium">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {chart.categories.map((cat, i) => (
            <tr key={`${cat}-${i}`} className="border-b border-line">
              <td className="px-2 py-1">{cat}</td>
              {chart.series.map((s) => (
                <td key={s.name} className="px-2 py-1">
                  {formatFull(s.values[i], fmt?.y)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}