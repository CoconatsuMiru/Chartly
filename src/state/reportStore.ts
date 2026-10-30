import { arrayMove } from '@dnd-kit/sortable'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ChartSpec, ReportDocument, SectionBlock } from '@/domain'
import { newId } from '@/utils/ids'

interface ReportState {
  report: ReportDocument | null
  sourceDatasetId: string | null
  start: (report: ReportDocument, datasetId: string) => void
  clear: () => void
  updateBlock: (blockId: string, patch: Record<string, unknown>) => void
  moveSection: (from: number, to: number) => void
  moveBy: (blockId: string, delta: number) => void
  toggleHidden: (blockId: string) => void
  removeSection: (blockId: string) => void
  addSection: (block: SectionBlock) => void
  addChart: (spec: ChartSpec) => void
  patchChart: (
    chartId: string,
    patch: Partial<Pick<ChartSpec, 'type' | 'title' | 'subtitle'>>,
    options?: Partial<ChartSpec['options']>,
  ) => void
  setTheme: (themeId: string) => void
  setInsightEdit: (insightId: string, text: string | null) => void
}

export const useReportStore = create<ReportState>()(
  temporal(
    immer((set) => ({
      report: null,
      sourceDatasetId: null,

      start(report, datasetId) {
        set((s) => {
          s.report = report
          s.sourceDatasetId = datasetId
        })
        // A new report starts with a clean undo history.
        useReportStore.temporal.getState().clear()
      },

      clear() {
        set((s) => {
          s.report = null
          s.sourceDatasetId = null
        })
        useReportStore.temporal.getState().clear()
      },

      updateBlock(blockId, patch) {
        set((s) => {
          const sec = s.report?.sections.find((x) => x.block.id === blockId)
          if (!s.report || !sec) return
          Object.assign(sec.block, patch)
          if (sec.block.kind === 'cover' && typeof patch.title === 'string') s.report.title = patch.title
        })
      },

      moveSection(from, to) {
        set((s) => {
          if (!s.report) return
          const n = s.report.sections.length
          if (from === to || from < 0 || to < 0 || from >= n || to >= n) return
          s.report.sections = arrayMove(s.report.sections, from, to)
        })
      },

      moveBy(blockId, delta) {
        set((s) => {
          if (!s.report) return
          const from = s.report.sections.findIndex((x) => x.block.id === blockId)
          const to = from + delta
          if (from < 0 || to < 0 || to >= s.report.sections.length) return
          s.report.sections = arrayMove(s.report.sections, from, to)
        })
      },

      toggleHidden(blockId) {
        set((s) => {
          const sec = s.report?.sections.find((x) => x.block.id === blockId)
          if (sec) sec.hidden = !sec.hidden
        })
      },

      removeSection(blockId) {
        set((s) => {
          const r = s.report
          if (!r) return
          const sec = r.sections.find((x) => x.block.id === blockId)
          r.sections = r.sections.filter((x) => x.block.id !== blockId)
          if (sec?.block.kind === 'chart') {
            const id = sec.block.chartId
            const stillUsed = r.sections.some((x) => x.block.kind === 'chart' && x.block.chartId === id)
            if (!stillUsed) delete r.charts[id]
          }
        })
      },

      addSection(block) {
        set((s) => {
          s.report?.sections.push({ block })
        })
      },

      addChart(spec) {
        set((s) => {
          if (!s.report || s.report.charts[spec.id]) return
          s.report.charts[spec.id] = structuredClone(spec)
          s.report.sections.push({
            block: { id: newId('sec'), kind: 'chart', chartId: spec.id, caption: '' },
          })
        })
      },

      patchChart(chartId, patch, options) {
        set((s) => {
          const c = s.report?.charts[chartId]
          if (!c) return
          Object.assign(c, patch)
          if (options) Object.assign(c.options, options)
        })
      },

      setTheme(themeId) {
        set((s) => {
          if (s.report) s.report.themeId = themeId
        })
      },

      setInsightEdit(insightId, text) {
        set((s) => {
          if (!s.report) return
          if (text === null) delete s.report.insightEdits[insightId]
          else s.report.insightEdits[insightId] = text
        })
      },
    })),
    {
      limit: 100,
      partialize: (s) => ({ report: s.report }),
      equality: (a, b) => a.report === b.report,
    },
  ),
)