import type { Theme } from './theme'

export interface TextStyle {
  fontSize: number
  bold?: boolean
  italic?: boolean
  color?: string
  align?: 'left' | 'center' | 'right'
  font?: 'heading' | 'body' | 'mono'
}

export type PositionedElement =
  | { kind: 'text'; x: number; y: number; w: number; h: number; text: string; style: TextStyle }
  | { kind: 'chart'; x: number; y: number; w: number; h: number; chartId: string }
  | { kind: 'kpi'; x: number; y: number; w: number; h: number; label: string; value: string; delta?: string }
  | { kind: 'table'; x: number; y: number; w: number; h: number; header: string[]; rows: string[][] }
  | { kind: 'shape'; x: number; y: number; w: number; h: number; fill?: string; radius?: number }

/** Shared intermediate representation: preview, PDF and PPTX all draw this. */
export interface RenderPlan {
  format: 'document' | 'deck'
  /** Points. A4 = 595x842, 16:9 deck = 960x540. */
  page: { width: number; height: number }
  theme: Theme
  pages: { elements: PositionedElement[]; notes?: string }[]
  warnings: { pageIndex: number; message: string }[]
}