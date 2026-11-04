import { THEMES } from '@/themes/builtin'

/** Loads the report fonts, so text is measured with the same fonts it is drawn in. */
export async function loadReportFonts(): Promise<void> {
  if (!('fonts' in document)) return
  const families = new Set(THEMES.flatMap((t) => [t.fonts.heading, t.fonts.body]))
  const loads = [...families].flatMap((family) =>
    [`400 16px "${family}"`, `700 16px "${family}"`].map((spec) => document.fonts.load(spec, 'Aa0 –•')),
  )
  await Promise.allSettled(loads)
  await document.fonts.ready
}