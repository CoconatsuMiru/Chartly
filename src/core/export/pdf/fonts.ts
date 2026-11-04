import type { TextStyle } from '@/domain'

/** The built-in PDF fonts closest to the theme's heading, body and mono roles. */
export function pdfFont(style: Pick<TextStyle, 'font' | 'bold' | 'italic'>): string {
  const bold = !!style.bold
  const italic = !!style.italic
  switch (style.font ?? 'body') {
    case 'heading':
      return bold && italic ? 'Times-BoldItalic' : bold ? 'Times-Bold' : italic ? 'Times-Italic' : 'Times-Roman'
    case 'mono':
      return bold && italic
        ? 'Courier-BoldOblique'
        : bold
          ? 'Courier-Bold'
          : italic
            ? 'Courier-Oblique'
            : 'Courier'
    default:
      return bold && italic
        ? 'Helvetica-BoldOblique'
        : bold
          ? 'Helvetica-Bold'
          : italic
            ? 'Helvetica-Oblique'
            : 'Helvetica'
  }
}