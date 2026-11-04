import * as Comlink from 'comlink'
import { create } from 'zustand'
import type { Progress, Stage } from '@/domain'
import type { LoadResult } from '@/workers/protocol'
import { disposeDataWorker, getDataWorker, watchWorkerCrash } from '@/workers/workerClient'
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
  progress: Progress | null
  /** Recommendation ids the user wants in the report. */
  selectedChartIds: string[]
  setStage: (stage: Stage) => void
  loadFile: (file: File, sheet?: string) => Promise<void>
  /** Stops a slow load. Terminating the worker also stops its work. */
  cancelLoad: () => void
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
  progress: null,
  selectedChartIds: [] as string[],
}

export const useSessionStore = create<SessionState>()((set) => ({
  ...empty,

  setStage: (stage) => set({ stage }),

  async loadFile(file, sheet) {
    const token = ++loadToken
    set({ status: 'loading', error: null, file, result: null, progress: { stage: 'Starting' }, selectedChartIds: [] })
    try {
      const api = getDataWorker()
      const onProgress = Comlink.proxy((p: Progress) => {
        if (token === loadToken) set({ progress: p })
      })
      const result = await Promise.race([
        api.loadDataset(file, sheet ? { sheet } : undefined, onProgress),
        watchWorkerCrash(),
      ])
      if (token !== loadToken) return
      set({
        status: 'ready',
        result,
        progress: null,
        selectedChartIds: result.recommendations.slice(0, DEFAULT_SELECTION).map((r) => r.id),
      })
    } catch (e) {
      if (token !== loadToken) return
      set({
        status: 'error',
        result: null,
        progress: null,
        selectedChartIds: [],
        error: e instanceof Error ? e.message : 'Could not read this file.',
      })
    }
  },

  cancelLoad() {
    loadToken++
    disposeDataWorker()
    set({ status: 'idle', file: null, progress: null, error: null })
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