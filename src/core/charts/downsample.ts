/** Evenly spaced sample, deterministic so the same data always draws the same chart. */
export function downsample<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  const step = items.length / max
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step)])
}