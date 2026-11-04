import type { ExportFormat } from './types'

export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug || 'report'
}

export function exportFileName(title: string, format: ExportFormat): string {
  return `${slugify(title)}.${format}`
}