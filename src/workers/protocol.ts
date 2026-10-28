export type FileFormat = 'xlsx' | 'xls' | 'csv' | 'tsv'

export interface InspectResult {
  format: FileFormat
  sheets: string[]
  rowCount: number
  columnCount: number
  preview: string[][]
  parseMs: number
}

export interface DataWorkerApi {
  inspectFile(file: File): Promise<InspectResult>
}