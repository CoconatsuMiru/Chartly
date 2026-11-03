import { getTemplate } from '@/core/report/layout/templates'
import { useReportStore } from './reportStore'

/** Switches the layout and keeps the output format (document or deck) in step with it. */
export function setLayoutTemplate(id: string): void {
  const tpl = getTemplate(id)
  useReportStore.setState((s) => {
    if (!s.report) return
    s.report.layoutTemplateId = tpl.id
    s.report.outputFormat = tpl.format
  })
}