import type { Theme } from '@/domain'

const fonts = {
  heading: 'Source Serif 4',
  body: 'Instrument Sans',
  mono: 'Courier',
}

export const THEMES: Theme[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    colors: {
      paper: '#F7F5F0',
      surface: '#FFFFFF',
      ink: '#1B2430',
      muted: '#6B7482',
      line: '#E4E0D6',
      primary: '#0F5B5C',
      accent: '#D98E04',
    },
    dataPalette: ['#0F5B5C', '#D98E04', '#4A6FA5', '#B5546B', '#7A8450', '#7B5A8C'],
    fonts,
    type: { h1: 28, h2: 18, body: 11, caption: 9 },
  },
  {
    id: 'boardroom',
    name: 'Boardroom',
    colors: {
      paper: '#0F1B2D',
      surface: '#16263D',
      ink: '#F2F4F8',
      muted: '#9FB0C8',
      line: '#2A3D5A',
      primary: '#5BC0BE',
      accent: '#F4B942',
      },
    dataPalette: ['#5BC0BE', '#F4B942', '#8FA8E0', '#E58CA0', '#A9C47F', '#B79BD0'],
    fonts,
    type: { h1: 30, h2: 20, body: 12, caption: 10 },
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      paper: '#FFFFFF',
      surface: '#F3F4F6',
      ink: '#111827',
      muted: '#6B7280',
      line: '#D1D5DB',
      primary: '#334155',
      accent: '#2563EB',
    },
    dataPalette: ['#334155', '#2563EB', '#D97706', '#BE185D', '#15803D', '#7C3AED'],
    fonts,
    type: { h1: 26, h2: 17, body: 11, caption: 9 },
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}