import * as Comlink from 'comlink'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { DataWorkerApi, FileFormat, InspectResult } from './protocol'

const PREVIEW_ROWS = 20

function detectFormat(name: string): FileFormat {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'tsv') return ext
  throw new Error(`Unsupported file type: .${ext ?? ''}`)
}

const api: DataWorkerApi = {
  async inspectFile(file) {
    const started = performance.now()
    const format = detectFormat(file.name)
    let grid: string[][]
    let sheets: string[] = []

    if (format === 'csv' || format === 'tsv') {
      const text = await file.text()
      const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
      grid = result.data
    } else {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      sheets = wb.SheetNames
      const sheet = wb.Sheets[sheets[0]]
      grid = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: '',
      })
    }

    const out: InspectResult = {
      format,
      sheets,
      rowCount: grid.length,
      columnCount: Math.max(0, ...grid.slice(0, 100).map((r) => r.length)),
      preview: grid.slice(0, PREVIEW_ROWS),
      parseMs: Math.round(performance.now() - started),
    }
    return out
  },
}

Comlink.expose(api)