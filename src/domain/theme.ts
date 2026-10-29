export interface Theme {
  id: string
  name: string
  colors: {
    paper: string
    surface: string
    ink: string
    muted: string
    line: string
    primary: string
    accent: string
  }
  /** Colour-blind-safe categorical palette. */
  dataPalette: string[]
  fonts: { heading: string; body: string; mono: string }
  /** Sizes in points. */
  type: { h1: number; h2: number; body: number; caption: number }
}