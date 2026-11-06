import type { SVGProps } from 'react'

const PATHS = {
  upload: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15',
  sheet: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6M9 8h2',
  lock: 'M7 10.5V8a5 5 0 0 1 10 0v2.5M5.5 10.5h13V20h-13zM12 14.5v2.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  undo: 'M4 9h10a5.5 5.5 0 0 1 0 11H9M8 5 4 9l4 4',
  redo: 'M20 9H10a5.5 5.5 0 0 0 0 11h5M16 5l4 4-4 4',
  bars: 'M5 20V11M12 20V4M19 20v-6M3 20h18',
  spark:
    'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  doc: 'M7 3h10v18H7zM10 8h4M10 12h4M10 16h2',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  slides: 'M3 5h18v11H3zM8 20h8M12 16v4',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  eyeOff:
    'M4 4l16 16M9.9 6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.2-.6',
  close: 'M6 6l12 12M18 6 6 18',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  table: 'M4 5h16v14H4zM4 10h16M10 10v9',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5v.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01',
  text: 'M5 6h14M5 11h14M5 16h9',
  kpi: 'M4 6h16v5H4zM4 14h7v5H4zM13 14h7v5h-7z',
  cover: 'M5 3h14v18H5zM8.5 8h7M8.5 11.5h4',
  rows: 'M4 6h16M4 12h16M4 18h16',
  columns: 'M7 4v16M12 4v16M17 4v16',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z',
  chevron: 'M6 9l6 6 6-6',
  trend: 'M3 17l6-6 4 4 8-9M15 6h6v6',
  scatter: 'M5 18h.01M9 13h.01M13 15h.01M16 9h.01M19 6h.01M3 3v18h18',
  pie: 'M12 3v9h9a9 9 0 1 1-9-9z',
} as const

export type IconName = keyof typeof PATHS | 'grip'

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, ...rest }: Props) {
  if (name === 'grip') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
        {[8, 16].flatMap((x) => [6, 12, 18].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
      </svg>
    )
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}