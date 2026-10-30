import { useEffect, useState } from 'react'
import type { KpiRequest } from '@/core/charts/kpi'
import { getDataWorker } from '@/workers/workerClient'

/** Headline numbers for KPI tiles, computed in the worker. Null until they arrive. */
export function useKpiValues(items: KpiRequest[]) {
  const key = JSON.stringify(items.map(({ columnId, aggregation }) => ({ columnId, aggregation })))
  const [state, setState] = useState<{ key: string; values: (number | null)[] }>({ key: '', values: [] })

  useEffect(() => {
    let cancelled = false
    getDataWorker()
      .computeKpis(JSON.parse(key) as KpiRequest[])
      .then((values) => {
        if (!cancelled) setState({ key, values })
      })
      .catch(() => {
        if (!cancelled) setState({ key, values: [] })
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return state.key === key ? state.values : null
}