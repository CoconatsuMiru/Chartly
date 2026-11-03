import { LINE_HEIGHT, PX_PER_PT, fontStack } from '@/core/report/layout/constants'
import type { PositionedElement, RenderPlan, ReportDocument } from '@/domain'
import { ReportChart } from './ReportChart'

const PX = PX_PER_PT

function PlanElement({ el, plan, report }: { el: PositionedElement; plan: RenderPlan; report: ReportDocument }) {
  const base = {
    position: 'absolute',
    left: el.x * PX,
    top: el.y * PX,
    width: el.w * PX,
    height: el.h * PX,
  } as const

  switch (el.kind) {
    case 'shape':
      return (
        <div
          style={{
            ...base,
            boxSizing: 'border-box',
            background: el.fill,
            borderRadius: (el.radius ?? 0) * PX,
            border: el.stroke ? `${PX}px solid ${el.stroke}` : undefined,
          }}
        />
      )
    case 'text':
      return (
        <div
          style={{
            ...base,
            whiteSpace: 'pre',
            fontFamily: fontStack(plan.theme, el.style.font ?? 'body'),
            fontSize: el.style.fontSize * PX,
            fontWeight: el.style.bold ? 700 : 400,
            fontStyle: el.style.italic ? 'italic' : 'normal',
            color: el.style.color ?? plan.theme.colors.ink,
            textAlign: el.style.align ?? 'left',
            lineHeight: LINE_HEIGHT,
          }}
        >
          {el.text}
        </div>
      )
    case 'chart': {
      const spec = report.charts[el.chartId]
      return spec ? (
        <div style={base}>
          <ReportChart spec={spec} theme={plan.theme} height={el.h * PX} />
        </div>
      ) : null
    }
    case 'kpi':
    case 'table':
      return null
  }
}

interface Props {
  plan: RenderPlan
  index: number
  report: ReportDocument
  /** Shrinks the page to fit the screen. */
  scale: number
}

export function PlanPage({ plan, index, report, scale }: Props) {
  const w = plan.page.width * PX
  const h = plan.page.height * PX

  return (
    <div
      role="group"
      aria-label={`${plan.format === 'deck' ? 'Slide' : 'Page'} ${index + 1} of ${plan.pages.length}`}
      className="shrink-0 overflow-hidden rounded shadow-[var(--shadow-card)] ring-1 ring-black/10"
      style={{ width: w * scale, height: h * scale }}
    >
      <div style={{ width: w, height: h, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {plan.pages[index].elements.map((el, i) => (
          <PlanElement key={i} el={el} plan={plan} report={report} />
        ))}
      </div>
    </div>
  )
}