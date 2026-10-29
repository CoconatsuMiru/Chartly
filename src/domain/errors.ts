export type ChartlyErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'EMPTY_SHEET'
  | 'PASSWORD_PROTECTED'
  | 'PARSE_FAILED'
  | 'NO_NUMERIC_COLUMNS'
  | 'EXPORT_FAILED'

export class ChartlyError extends Error {
  readonly code: ChartlyErrorCode
  readonly recoverable: boolean
  readonly hint?: string

  constructor(code: ChartlyErrorCode, message: string, recoverable = true, hint?: string) {
    super(message)
    this.name = 'ChartlyError'
    this.code = code
    this.recoverable = recoverable
    this.hint = hint
  }
}

export interface Progress {
  stage: string
  /** 0 to 1, or undefined when unknown. */
  fraction?: number
}