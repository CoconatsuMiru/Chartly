export type Stage = 'import' | 'explore' | 'compose' | 'export'

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'import', label: 'Import', hint: 'Bring in your data' },
  { id: 'explore', label: 'Explore', hint: 'Findings and charts' },
  { id: 'compose', label: 'Compose', hint: 'Shape the report' },
  { id: 'export', label: 'Export', hint: 'PDF and PowerPoint' },
]