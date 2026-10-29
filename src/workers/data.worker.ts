import * as Comlink from 'comlink'
import { buildProfile } from '@/core/analysis/profile'
import { buildDataset } from '@/core/parsing/buildDataset'
import { getRowsAsText } from '@/core/parsing/datasetAccess'
import { readGrid } from '@/core/parsing/readFile'
import type { Dataset } from '@/domain'
import type { DataWorkerApi } from './protocol'

const PREVIEW_ROWS = 25
let current: Dataset | null = null

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
    const profile = buildProfile(ds)
    return {
      datasetId: ds.id,
      source: ds.source,
      columns: ds.columns,
      profile,
      rowCount: ds.rowCount,
      sheets: raw.sheets,
      preview: getRowsAsText(ds, 0, PREVIEW_ROWS),
      parseMs: Math.round(performance.now() - started),
    }
  },

  async getRows(offset, limit) {
    return current ? getRowsAsText(current, offset, limit) : []
  },

  dispose() {
    current = null
  },
}

Comlink.expose(api)