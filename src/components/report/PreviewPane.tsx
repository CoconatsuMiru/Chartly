import { useEffect, useRef, useState } from 'react'
import { PX_PER_PT } from '@/core/report/layout/constants'
import type { RenderPlan, ReportDocument } from '@/domain'
import { PlanPage } from './PlanPage'

export function PreviewPane({ plan, report }: { plan: RenderPlan; report: ReportDocument }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Never scale above 100%, so charts stay sharp.
  const scale = width > 0 ? Math.min(1, width / (plan.page.width * PX_PER_PT)) : 1
  const unit = plan.format === 'deck' ? 'slide' : 'page'

  return (
    <div ref={ref} className="space-y-4">
      <p className="text-sm text-muted">
        {plan.pages.length} {unit}
        {plan.pages.length === 1 ? '' : 's'} · {plan.format === 'deck' ? '16:9' : 'A4'}. This is exactly what the PDF and
        PowerPoint will use.
      </p>

      {plan.warnings.length > 0 && (
        <ul role="status" className="space-y-0.5 rounded-lg bg-accent-soft px-4 py-3 text-sm">
          {plan.warnings.map((w, i) => (
            <li key={i}>
              {unit === 'slide' ? 'Slide' : 'Page'} {w.pageIndex + 1}: {w.message}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-6">
        {plan.pages.map((_, i) => (
          <PlanPage key={i} plan={plan} index={i} report={report} scale={scale} />
        ))}
      </div>
    </div>
  )
}