import { useEffect, useMemo, useState } from 'react'
import { fmtNum } from '@/core/insights/format'
import { canvasMeasure } from '@/core/report/layout/measure'
import { layoutReport } from '@/core/report/layout/layoutReport'
import type { Aggregation, RenderPlan, ReportDocument } from '@/domain'
import { useSessionStore } from '@/state/sessionStore'
import { getTheme } from '@/themes/builtin'
import { getDataWorker } from '@/workers/workerClient'

type KpiKey = [blockId: string, items: [columnId: string, aggregation: Aggregation][]][]

/** The laid-out pages of the report. Only works while `enabled`, so the editor stays light. */
export function useReportPlan(report: ReportDocument | null, enabled: boolean): RenderPlan | null {
  const insights = useSessionStore((s) => s.result?.insights)
  const columns = useSessionStore((s) => s.result?.columns)
  const [kpiText, setKpiText] = useState<Record<string, string[]>>({})
  const [fontsReady, setFontsReady] = useState(false)

  const key = JSON.stringify(
    (report?.sections ?? []).flatMap(({ block }) =>
      block.kind === 'kpis' ? [[block.id, block.items.map((i) => [i.columnId, i.aggregation])]] : [],
    ),
  )

  useEffect(() => {
    void document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    if (!enabled) return
    const blocks = JSON.parse(key) as KpiKey
    if (blocks.length === 0) {
      setKpiText({})
      return
    }
    let cancelled = false
    const flat = blocks.flatMap(([, items]) => items.map(([columnId, aggregation]) => ({ columnId, aggregation })))
    getDataWorker()
      .computeKpis(flat)
      .then((values) => {
        if (cancelled) return
        let k = 0
        const out: Record<string, string[]> = {}
        for (const [id, items] of blocks) {
          out[id] = items.map(([columnId, aggregation]) => {
            const v = values[k++]
            if (v === null || v === undefined) return '–'
            const countLike = aggregation === 'count' || aggregation === 'countDistinct'
            return fmtNum(v, countLike ? undefined : columns?.find((c) => c.id === columnId))
          })
        }
        setKpiText(out)
      })
      .catch(() => {
        if (!cancelled) setKpiText({})
      })
    return () => {
      cancelled = true
    }
  }, [key, enabled, columns])

  return useMemo(
    () =>
      enabled && report && fontsReady
        ? layoutReport(report, {
            theme: getTheme(report.themeId),
            insights: insights ?? [],
            kpiText,
            measure: canvasMeasure,
          })
        : null,
    [enabled, report, fontsReady, insights, kpiText],
  )
}