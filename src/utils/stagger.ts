import type { CSSProperties } from 'react'

/** Delays an entrance animation a little more for each item, up to a limit. */
export const stagger = (i: number): CSSProperties => ({ '--i': Math.min(i, 8) }) as CSSProperties