import type { Theme } from '@/domain'

export const LINE_HEIGHT = 1.3
/** Text is measured 6% wider than it is, so a slightly different font in an export never overflows. */
export const WIDTH_SAFETY = 1.06
/** Plan units are points; the screen shows them as CSS pixels at 96 dpi. */
export const PX_PER_PT = 4 / 3

/** One font stack per role, shared by the measurer and the preview so they always agree. */
export function fontStack(theme: Theme, kind: 'heading' | 'body' | 'mono'): string {
  switch (kind) {
    case 'heading':
      return `"${theme.fonts.heading}", Georgia, "Times New Roman", serif`
    case 'mono':
      return `"${theme.fonts.mono}", "Courier New", monospace`
    default:
      return `"${theme.fonts.body}", Helvetica, Arial, sans-serif`
  }
}