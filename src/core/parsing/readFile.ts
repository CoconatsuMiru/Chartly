import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { ChartlyError, type SourceInfo } from '@/domain'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const MAX_ROWS = 500_000

export interface RawGrid {
  grid: string[][]
  format: SourceInfo['format']
  sheets: string[]
  sheetName?: string
  delimiter?: string
}

function detectFormat(name: string): SourceInfo['format'] {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'tsv') return ext
  throw new ChartlyError(
    'UNSUPPORTED_FORMAT',
    `Unsupported file type ".${ext ?? ''}". Use .xlsx, .xls, .csv or .tsv.`,
  )
}

function tooManyRows(rows: number, max: number): ChartlyError {
  return new ChartlyError(
    'FILE_TOO_LARGE',
    `This file has about ${rows.toLocaleString('en-US')} rows. Chartly handles up to ${max.toLocaleString('en-US')} rows.`,
    true,
    'Try exporting a smaller date range, or a sample of the rows.',
  )
}

export async function readGrid(
  file: File,
  opts: { sheet?: string; maxRows?: number } = {},
): Promise<RawGrid> {
  const maxRows = opts.maxRows ?? MAX_ROWS
  if (file.size === 0) throw new ChartlyError('EMPTY_SHEET', 'This file is empty.')
  if (file.size > MAX_FILE_BYTES) {
    throw new ChartlyError(
      'FILE_TOO_LARGE',
      `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 50 MB.`,
      true,
      'Try exporting fewer rows or columns.',
    )
  }
  const format = detectFormat(file.name)

  try {
    if (format === 'csv' || format === 'tsv') {
      const text = await file.text()
      const res = Papa.parse<string[]>(text, {
        skipEmptyLines: 'greedy',
        delimiter: format === 'tsv' ? '\t' : '',
      })
      if (res.data.length - 1 > maxRows) throw tooManyRows(res.data.length - 1, maxRows)
      return { grid: res.data, format, sheets: [], delimiter: res.meta.delimiter }
    }

    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    const sheets = wb.SheetNames
    const sheetName =
      opts.sheet && sheets.includes(opts.sheet)
        ? opts.sheet
        : (sheets.find((n) => wb.Sheets[n]['!ref']) ?? sheets[0])
    if (!sheetName) throw new ChartlyError('EMPTY_SHEET', 'This workbook has no sheets.')

    // Check the size from the sheet's range, before converting every cell.
    const ref = wb.Sheets[sheetName]['!ref']
    if (ref) {
      const range = XLSX.utils.decode_range(ref)
      const rows = range.e.r - range.s.r
      if (rows > maxRows) throw tooManyRows(rows, maxRows)
    }

    const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
      dateNF: 'yyyy-mm-dd',
    })
    return { grid, format, sheets, sheetName }
  } catch (e) {
    if (e instanceof ChartlyError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    if (/password|encrypt/i.test(msg)) {
      throw new ChartlyError(
        'PASSWORD_PROTECTED',
        'This file is password-protected. Remove the password and try again.',
      )
    }
    throw new ChartlyError(
      'PARSE_FAILED',
      "We couldn't read this file. It may be damaged or in an unexpected format.",
      true,
      msg,
    )
  }
}