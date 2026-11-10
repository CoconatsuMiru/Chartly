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
      className={`group relative block cursor-pointer rounded-[22px] p-px transition-transform duration-200 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary ${
        dragging ? 'scale-[1.01]' : ''
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {input}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,#1aa7a0,#e0951a)] transition-opacity duration-300 ${
          dragging ? 'opacity-100' : 'opacity-20 group-hover:opacity-90'
        }`}
      />
      <span
        className={`relative flex flex-col items-center overflow-hidden rounded-[21px] px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10 sm:py-12 ${
          dragging ? 'bg-primary-soft' : 'bg-surface'
        }`}
      >
        <span
          aria-hidden="true"
          className="dots pointer-events-none absolute inset-x-0 top-0 h-1/2 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <span
          aria-hidden="true"
          className="bg-brand-grad relative grid size-[68px] place-items-center rounded-[20px] text-white shadow-[0_12px_24px_-12px_rgb(8_74_77/0.7)]"
        >
          <Icon name="sheet" size={30} />
          <span className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-accent text-night ring-4 ring-surface transition-transform duration-200 group-hover:-translate-y-0.5">
            <Icon name="upload" size={14} />
          </span>
        </span>

        <span className="display relative mt-7 block text-[1.6rem]">
          {dragging ? 'Release to analyse it' : 'Drop a spreadsheet here'}
        </span>
        <span className="relative mt-2 block max-w-sm text-sm leading-relaxed text-ink-soft">
          or click to browse. Merged titles, total rows and mixed date formats are fine.
        </span>

        <span className="btn btn-primary relative mt-6">Browse files</span>

        <span className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
          {FORMATS.map((f) => (
            <span key={f.ext} className="file-tag">
              <span className="size-1.5 rounded-full" style={{ background: f.dot }} />
              {f.ext}
            </span>
          ))}
        </span>
        <span className="relative mt-4 flex items-center gap-2 text-xs text-muted">
          <Icon name="lock" size={13} />
          Read in this tab, never uploaded · up to 50 MB and 500,000 rows
        </span>
      </span>
    </label>
  )
}