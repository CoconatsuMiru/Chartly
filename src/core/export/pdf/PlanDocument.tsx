import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { LINE_HEIGHT } from '@/core/report/layout/constants'
import type { PositionedElement, RenderPlan } from '@/domain'
import type { ChartAssets } from '../types'
import { pdfFont } from './fonts'

function PdfElement({ el, plan, assets }: { el: PositionedElement; plan: RenderPlan; assets: ChartAssets }) {
  const box = { position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h } as const

  switch (el.kind) {
    case 'shape':
      return (
        <View
          style={{
            ...box,
            backgroundColor: el.fill,
            borderRadius: el.radius,
            ...(el.stroke ? { borderWidth: 0.75, borderColor: el.stroke, borderStyle: 'solid' as const } : {}),
          }}
        />
      )

    case 'text': {
      const lineHeight = el.style.fontSize * LINE_HEIGHT
      return (
        <View style={{ position: 'absolute', left: el.x, top: el.y, width: el.w }}>
          {el.text.split('\n').map((line, i) => (
            <Text
              key={i}
              style={{
                fontFamily: pdfFont(el.style),
                fontSize: el.style.fontSize,
                lineHeight: `${lineHeight}pt`,
                color: el.style.color ?? plan.theme.colors.ink,
                textAlign: el.style.align ?? 'left',
              }}
            >
              {line === '' ? '\u00A0' : line}
            </Text>
          ))}
        </View>
      )
    }

    case 'chart': {
      const dataUrl = assets.get(el.chartId)?.dataUrl
      return dataUrl ? <Image src={dataUrl} style={box} /> : null
    }

    case 'kpi':
    case 'table':
      return null
  }
}

interface Props {
  plan: RenderPlan
  title: string
  assets: ChartAssets
}

export function PlanDocument({ plan, title, assets }: Props) {
  return (
    <Document title={title} creator="Chartly" producer="Chartly">
      {plan.pages.map((page, pi) => (
        <Page
          key={pi}
          size={[plan.page.width, plan.page.height]}
          style={{ position: 'relative', backgroundColor: plan.theme.colors.paper }}
        >
          {page.elements.map((el, i) => (
            <PdfElement key={i} el={el} plan={plan} assets={assets} />
          ))}
        </Page>
      ))}
    </Document>
  )
}