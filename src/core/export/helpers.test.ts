import { describe, expect, it } from 'vitest'
import { exportFileName, slugify } from './filenames'
import { pdfFont } from './pdf/fonts'

describe('file names', () => {
  it('makes safe, readable names', () => {
    expect(slugify('Q3 Report: Café!')).toBe('q3-report-cafe')
    expect(slugify('  ***  ')).toBe('report')
    expect(slugify('a'.repeat(100)).length).toBeLessThanOrEqual(60)
    expect(exportFileName('Sample saas sales', 'pptx')).toBe('sample-saas-sales.pptx')
  })
})

describe('pdfFont', () => {
  it('maps roles and styles to built-in PDF fonts', () => {
    expect(pdfFont({})).toBe('Helvetica')
    expect(pdfFont({ bold: true })).toBe('Helvetica-Bold')
    expect(pdfFont({ font: 'heading' })).toBe('Times-Roman')
    expect(pdfFont({ font: 'heading', bold: true, italic: true })).toBe('Times-BoldItalic')
    expect(pdfFont({ font: 'mono', italic: true })).toBe('Courier-Oblique')
  })
})