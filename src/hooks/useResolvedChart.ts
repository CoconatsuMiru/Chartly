import { useEffect, useState } from 'react'
import type { ChartSpec, ResolvedChart } from '@/domain'
import { getDataWorker } from '@/workers/workerClient'

interface State {
  key: string
  data: ResolvedChart | null
  error: string | null
}

/** Asks the worker for a chart's data. Keeps the previous chart on screen while the next one loads. */
export function useResolvedChart(spec: ChartSpec) {
  const key = JSON.stringify(spec)
  const [state, setState] = useState<State>({ key: '', data: null, error: null })

  useEffect(() => {
    let cancelled = false
    getDataWorker()
      .resolveChart(JSON.parse(key) as ChartSpec)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            key,
            data: null,
            error: e instanceof Error ? e.message : 'Could not build this chart.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    loading: state.key !== key,
  }
}