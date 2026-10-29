import { useId, useState } from 'react'

const ACCEPT = '.xlsx,.xls,.csv,.tsv'
const FORMATS = ['.xlsx', '.xls', '.csv', '.tsv']

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

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        pick(e.dataTransfer.files)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
        compact ? 'gap-1 px-4 py-3' : 'gap-3 px-6 py-14'
      } ${dragging ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:border-primary'} ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
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
      {compact ? (
        <span className="text-sm text-primary">Choose another file, or drop it here</span>
      ) : (
        <>
          <span className="font-serif text-2xl">Drop a spreadsheet here</span>
          <span className="text-sm text-muted">or click to browse your computer</span>
          <span className="mt-2 flex flex-wrap justify-center gap-2" aria-label="Supported formats">
            {FORMATS.map((f) => (
              <span key={f} className="rounded bg-paper px-2 py-0.5 font-mono text-xs text-muted ring-1 ring-line">
                {f}
              </span>
            ))}
          </span>
          <span className="text-xs text-muted">Up to 50 MB</span>
        </>
      )}
    </label>
  )
}