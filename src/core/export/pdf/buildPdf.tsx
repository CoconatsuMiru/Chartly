import { pdf } from '@react-pdf/renderer'
import type { RenderPlan } from '@/domain'
import type { ChartAssets } from '../types'
import { PlanDocument } from './PlanDocument'

export async function buildPdf(plan: RenderPlan, title: string, assets: ChartAssets): Promise<Blob> {
  return pdf(<PlanDocument plan={plan} title={title} assets={assets} />).toBlob()
}