import { useId, useState, type DragEvent } from 'react'
import { Icon } from '../ui/Icon'

const ACCEPT = '.xlsx,.xls,.csv,.tsv'
const FORMATS = [
  { ext: '.xlsx', dot: '#1d8a4f' },
  { ext: '.xls', dot: '#5a9a3c' },
  { ext: '.csv', dot: '#1aa7a0' },
  { ext: '.tsv', dot: '#e0951a' },
]

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
  compact?: boolean
}

export function DropZone({ onFile, disabled, compact }: Props) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (file && !disabled) onFile(file)
  }
  const handlers = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      pick(e.dataTransfer.files)
    },
  }

  const input = (
    <input
      id={inputId}
      type="file"
      accept={ACCEPT}
      disabled={disabled}
      className="sr-only"
      onChange={(e) => {
        pick(e.target.files)
        e.target.value = ''
      }}
    />
  )

  if (compact) {
    return (
      <label
        htmlFor={inputId}
        {...handlers}
        className={`btn btn-secondary btn-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
          dragging ? 'border-primary bg-primary-soft' : ''
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        {input}
        <Icon name="upload" size={15} />
        Replace file
      </label>
    )
  }

  return (
    <label
      htmlFor={inputId}
      {...handlers}
      className={`group relative block cursor-pointer rounded-2xl p-px focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {input}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,#1aa7a0,#e0951a)] transition-opacity duration-200 ${
          dragging ? 'opacity-100' : 'opacity-20 group-hover:opacity-70'
        }`}
      />
      <span
        className={`relative block rounded-[15px] px-7 py-8 shadow-[var(--shadow-card)] sm:px-9 sm:py-9 ${
          dragging ? 'bg-primary-soft' : 'bg-surface'
        }`}
      >
        <span className="flex items-start gap-5">
          <span
            aria-hidden="true"
            className="bg-brand-grad grid size-14 shrink-0 place-items-center rounded-2xl text-white"
          >
            <Icon name="sheet" size={26} />
          </span>
          <span className="block min-w-0">
            <span className="h-section block">{dragging ? 'Release to analyse it' : 'Drop a spreadsheet here'}</span>
            <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
              or click to browse. Merged titles, total rows and mixed date formats are fine.
            </span>
          </span>
        </span>

        <span className="mt-7 flex flex-wrap items-center gap-3">
          <span className="btn btn-primary">Browse files</span>
          <span className="flex flex-wrap items-center gap-1.5">
            {FORMATS.map((f) => (
              <span key={f.ext} className="file-tag">
                <span className="size-1.5 rounded-full" style={{ background: f.dot }} />
                {f.ext}
              </span>
            ))}
          </span>
        </span>

        <span className="mt-7 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
          <Icon name="lock" size={13} />
          Read in this tab, never uploaded · up to 50 MB and 500,000 rows
        </span>
      </span>
    </label>
  )
}