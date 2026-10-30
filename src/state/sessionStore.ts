import { create } from 'zustand'
import type { Stage } from '@/domain'
import type { LoadResult } from '@/workers/protocol'
import { disposeDataWorker, getDataWorker } from '@/workers/workerClient'
import { useReportStore } from './reportStore'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

const DEFAULT_SELECTION = 4
let loadToken = 0

interface SessionState {
  stage: Stage
  status: LoadStatus
  file: File | null
  result: LoadResult | null
  error: string | null
  /** Recommendation ids the user wants in the report. */
  selectedChartIds: string[]
  setStage: (stage: Stage) => void
  loadFile: (file: File, sheet?: string) => Promise<void>
  toggleChart: (id: string) => void
  /** Terminates the worker, which drops the dataset from memory. */
  reset: () => void
}

const empty = {
  stage: 'import' as Stage,
  status: 'idle' as LoadStatus,
  file: null,
  result: null,
  error: null,
  selectedChartIds: [] as string[],
}

export const useSessionStore = create<SessionState>()((set) => ({
  ...empty,

  setStage: (stage) => set({ stage }),

  async loadFile(file, sheet) {
    const token = ++loadToken
    set({ status: 'loading', error: null, file, result: null, selectedChartIds: [] })
    try {
      const result = await getDataWorker().loadDataset(file, sheet ? { sheet } : undefined)
      if (token !== loadToken) return
      set({
        status: 'ready',
        result,
        selectedChartIds: result.recommendations.slice(0, DEFAULT_SELECTION).map((r) => r.id),
      })
    } catch (e) {
      if (token !== loadToken) return
      set({
        status: 'error',
        result: null,
        selectedChartIds: [],
        error: e instanceof Error ? e.message : 'Could not read this file.',
      })
    }
  },

  toggleChart: (id) =>
    set((s) => ({
      selectedChartIds: s.selectedChartIds.includes(id)
        ? s.selectedChartIds.filter((x) => x !== id)
        : [...s.selectedChartIds, id],
    })),

  reset() {
    loadToken++
    disposeDataWorker()
    useReportStore.getState().clear()
    set({ ...empty })
  },
}))