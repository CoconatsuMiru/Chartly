import { useEffect, useRef, useState } from 'react'
import { RichText } from './RichText'

interface Props {
  value: string
  onCommit: (value: string) => void
  /** Used for screen readers: "Edit {label}". */
  label: string
  placeholder?: string
  multiline?: boolean
  rich?: boolean
}

const fieldStyle = { font: 'inherit', color: 'inherit', background: 'transparent' } as const

/** Click to edit. The change is saved when you click away (Ctrl+Enter also saves, Esc cancels), so one edit is one undo step. */
export function EditableText({ value, onCommit, label, placeholder, multiline, rich }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  const start = () => {
    setDraft(value)
    setEditing(true)
  }
  const save = () => {
    setEditing(false)
    if (draft !== value) onCommit(draft)
  }

  if (editing) {
    const common = {
      ref,
      value: draft,
      'aria-label': label,
      placeholder,
      style: fieldStyle,
      className: 'w-full rounded border border-current p-1.5',
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: () => {
        if (cancelled.current) {
          cancelled.current = false
          return
        }
        save()
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelled.current = true
          setEditing(false)
        } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          save()
        }
      },
    }
    return multiline ? (
      <textarea {...common} rows={Math.max(3, draft.split('\n').length + 1)} />
    ) : (
      <input {...common} type="text" />
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label}`}
      onClick={start}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          start()
        }
      }}
      className="cursor-text rounded outline-offset-2 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
    >
      {value ? rich ? <RichText text={value} /> : value : <span className="opacity-50">{placeholder ?? 'Click to edit'}</span>}
    </div>
  )
}