import { useEffect, useRef, useState } from 'react'
import { PX_PER_PT } from '@/core/report/layout/constants'
import type { RenderPlan, ReportDocument } from '@/domain'
import { Icon } from '../ui/Icon'
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
    <div ref={ref} className="space-y-5">
      <p className="text-center text-sm text-ink-soft">
        {plan.pages.length} {unit}
        {plan.pages.length === 1 ? '' : 's'} · {plan.format === 'deck' ? '16:9' : 'A4'}. This is exactly what the PDF
        and PowerPoint will use.
      </p>

      {plan.warnings.length > 0 && (
        <ul role="status" className="space-y-1 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          {plan.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2">
              <Icon name="alert" size={15} className="mt-0.5 shrink-0 text-accent-ink" />
              <span>
                {unit === 'slide' ? 'Slide' : 'Page'} {w.pageIndex + 1}: {w.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-7">
        {plan.pages.map((_, i) => (
          <PlanPage key={i} plan={plan} index={i} report={report} scale={scale} />
        ))}
      </div>
    </div>
  )
}