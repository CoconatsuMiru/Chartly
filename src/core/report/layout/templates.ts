export interface LayoutTemplate {
  id: string
  name: string
  description: string
  format: 'document' | 'deck'
  /** Points. */
  page: { width: number; height: number }
  margin: number
  /** Multiplies the theme's type sizes (slides need bigger text). */
  scale: number
  chartColumns: 1 | 2
  /** "stacked": title, chart, caption. "side": chart on the left, caption on the right. */
  chartLayout: 'stacked' | 'side'
  pagePerSection: boolean
  footerOnFirst: boolean
}

export const TEMPLATES: LayoutTemplate[] = [
  {
    id: 'executive',
    name: 'Executive document',
    description: 'A4 pages, one chart per row',
    format: 'document',
    page: { width: 595, height: 842 },
    margin: 48,
    scale: 1,
    chartColumns: 1,
    chartLayout: 'stacked',
    pagePerSection: false,
    footerOnFirst: true,
  },
  {
    id: 'grid',
    name: 'Grid document',
    description: 'A4 pages, two charts per row',
    format: 'document',
    page: { width: 595, height: 842 },
    margin: 48,
    scale: 1,
    chartColumns: 2,
    chartLayout: 'stacked',
    pagePerSection: false,
    footerOnFirst: true,
  },
  {
    id: 'slides',
    name: 'Slides (16:9)',
    description: 'One section per slide',
    format: 'deck',
    page: { width: 960, height: 540 },
    margin: 52,
    scale: 1.55,
    chartColumns: 1,
    chartLayout: 'side',
    pagePerSection: true,
    footerOnFirst: false,
  },
]

/** Unknown ids (for example from an older report) fall back to the first template. */
export function getTemplate(id: string): LayoutTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}