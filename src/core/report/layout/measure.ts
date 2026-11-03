import { WIDTH_SAFETY } from './constants'

export interface FontSpec {
  family: string
  size: number
  bold: boolean
  italic: boolean
}

/** Width of one line of text, in the same units as the font size. */
export type MeasureText = (text: string, font: FontSpec) => number

/** Rough, deterministic measurer for tests and for places without a canvas. */
export const approxMeasure: MeasureText = (text, font) =>
  text.length * font.size * 0.5 * (font.bold ? 1.05 : 1)

let ctx: CanvasRenderingContext2D | null = null

/** Real measurer: asks the browser, using exactly the font stack the preview uses. */
export const canvasMeasure: MeasureText = (text, font) => {
  ctx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return approxMeasure(text, font)
  ctx.font = `${font.italic ? 'italic ' : ''}${font.bold ? '700' : '400'} ${font.size}px ${font.family}`
  return ctx.measureText(text).width
}

/** Greedy word wrap. Explicit newlines are kept, and a word wider than the box is split. */
export function wrapText(text: string, maxWidth: number, font: FontSpec, measure: MeasureText): string[] {
  const fits = (s: string) => measure(s, font) * WIDTH_SAFETY <= maxWidth
  const out: string[] = []

  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      out.push('')
      continue
    }

    let line = ''
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word
      if (fits(trial)) {
        line = trial
        continue
      }
      if (line) {
        out.push(line)
        line = ''
      }
      let rest = word
      while (rest && !fits(rest)) {
        let n = rest.length - 1
        while (n > 1 && !fits(rest.slice(0, n))) n--
        out.push(rest.slice(0, n))
        rest = rest.slice(n)
      }
      line = rest
    }
    out.push(line)
  }
  return out
}