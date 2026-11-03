import { describe, expect, it } from 'vitest'
import { WIDTH_SAFETY } from './constants'
import { approxMeasure, wrapText, type FontSpec } from './measure'

const font: FontSpec = { family: 'x', size: 10, bold: false, italic: false }
const wrap = (text: string, w: number) => wrapText(text, w, font, approxMeasure)

describe('wrapText', () => {
  it('keeps short text on one line', () => {
    expect(wrap('hello world', 1000)).toEqual(['hello world'])
  })

  it('wraps long text so every line fits', () => {
    const lines = wrap('word '.repeat(40), 100)
    expect(lines.length).toBeGreaterThan(5)
    for (const l of lines) expect(approxMeasure(l, font) * WIDTH_SAFETY).toBeLessThanOrEqual(100)
  })

  it('keeps explicit newlines and blank lines', () => {
    expect(wrap('a\n\nb', 1000)).toEqual(['a', '', 'b'])
  })

  it('splits a single word that is wider than the box', () => {
    const word = 'x'.repeat(100)
    const lines = wrap(word, 100)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join('')).toBe(word)
    for (const l of lines) expect(approxMeasure(l, font) * WIDTH_SAFETY).toBeLessThanOrEqual(100)
  })
})