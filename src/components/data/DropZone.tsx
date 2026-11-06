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
      className={`group relative block cursor-pointer rounded-[24px] p-px transition-transform duration-200 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary ${
        dragging ? 'scale-[1.012]' : ''
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {input}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,#1aa7a0,#e0951a)] transition-opacity duration-300 ${
          dragging ? 'opacity-100' : 'opacity-25 group-hover:opacity-100'
        }`}
      />
      <span
        className={`relative flex flex-col gap-6 overflow-hidden rounded-[23px] px-6 py-7 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:px-8 sm:py-8 ${
          dragging ? 'bg-primary-soft' : 'bg-surface'
        }`}
      >
        <span
          aria-hidden="true"
          className="dots pointer-events-none absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_left,black,transparent)]"
        />

        <span
          aria-hidden="true"
          className="bg-brand-grad relative grid size-[76px] shrink-0 place-items-center rounded-[22px] text-white shadow-[0_12px_24px_-10px_rgb(8_74_77/0.7)]"
        >
          <Icon name="sheet" size={34} />
          <span className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full bg-accent text-night ring-4 ring-surface transition-transform duration-200 group-hover:-translate-y-1">
            <Icon name="upload" size={16} />
          </span>
        </span>

        <span className="relative block min-w-0 flex-1">
          <span className="display block text-[1.75rem]">
            {dragging ? 'Release to analyse it' : 'Drop a spreadsheet here'}
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
            or click to browse. Merged titles, total rows and mixed date formats are fine.
          </span>
          <span className="mt-4 flex flex-wrap items-center gap-2">
            <span className="btn btn-primary">Browse files</span>
            {FORMATS.map((f) => (
              <span key={f.ext} className="file-tag">
                <span className="size-1.5 rounded-full" style={{ background: f.dot }} />
                {f.ext}
              </span>
            ))}
          </span>
          <span className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Icon name="lock" size={13} />
            Read in this tab, never uploaded · up to 50 MB and 500,000 rows
          </span>
        </span>
      </span>
    </label>
  )
}