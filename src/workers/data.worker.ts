import * as Comlink from 'comlink'
import { buildProfile } from '@/core/analysis/profile'
import { computeKpi } from '@/core/charts/kpi'
import { resolveChart } from '@/core/charts/resolveChart'
import { generateInsights } from '@/core/insights/generateInsights'
import { buildDataset } from '@/core/parsing/buildDataset'
import { getRowsAsText } from '@/core/parsing/datasetAccess'
import { readGrid } from '@/core/parsing/readFile'
import { recommendCharts } from '@/core/recommendations/recommend'
import type { Dataset, ResolvedChart } from '@/domain'
import type { DataWorkerApi } from './protocol'

const PREVIEW_ROWS = 25
let current: Dataset | null = null
const chartCache = new Map<string, ResolvedChart>()

const api: DataWorkerApi = {
  async loadDataset(file, opts) {
    const started = performance.now()
    const raw = await readGrid(file, opts)
    const ds = buildDataset(raw.grid, {
      fileName: file.name,
      fileSize: file.size,
      format: raw.format,
      sheetName: raw.sheetName,
      delimiter: raw.delimiter,
    })
    current = ds
    chartCache.clear()
    const profile = buildProfile(ds)
    const insights = generateInsights({ dataset: ds, profile })
    const recommendations = recommendCharts({ dataset: ds, profile, insights })
    return {
      datasetId: ds.id,
      source: ds.source,
      columns: ds.columns,
      profile,
      insights,
      recommendations,
      rowCount: ds.rowCount,
      sheets: raw.sheets,
      preview: getRowsAsText(ds, 0, PREVIEW_ROWS),
      parseMs: Math.round(performance.now() - started),
    }
  },

  async getRows(offset, limit) {
    return current ? getRowsAsText(current, offset, limit) : []
  },

  async resolveChart(spec) {
    if (!current) throw new Error('No data is loaded yet.')
    const key = JSON.stringify(spec)
    const hit = chartCache.get(key)
    if (hit) return hit
    const result = resolveChart(spec, current)
    chartCache.set(key, result)
    return result
  },

  async computeKpis(items) {
    const ds = current
    if (!ds) throw new Error('No data is loaded yet.')
    return items.map((item) => computeKpi(ds, item))
  },

  dispose() {
    current = null
    chartCache.clear()
  },
}

Comlink.expose(api)