import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { sectionLabel } from '@/core/report/sections'
import type { ReportDocument } from '@/domain'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { newId } from '@/utils/ids'

interface RowProps {
  id: string
  label: string
  hidden: boolean
  selected: boolean
  onSelect: () => void
}

const iconBtn = 'rounded px-1.5 py-0.5 text-xs text-muted hover:bg-paper'

function Row({ id, label, hidden, selected, onSelect }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const moveBy = useReportStore((s) => s.moveBy)
  const toggleHidden = useReportStore((s) => s.toggleHidden)
  const remove = useReportStore((s) => s.removeSection)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-0.5 rounded-lg border px-1 py-1 ${
        selected ? 'border-primary bg-primary-soft' : 'border-line bg-surface'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <button type="button" aria-label={`Reorder ${label}`} {...attributes} {...listeners} className="cursor-grab px-1 text-muted">
        ⠿
      </button>
      <button
        type="button"
        onClick={onSelect}
        className={`min-w-0 flex-1 truncate text-left text-sm ${hidden ? 'text-muted line-through' : ''}`}
      >
        {label}
      </button>
      <button type="button" aria-label={`Move ${label} up`} onClick={() => moveBy(id, -1)} className={iconBtn}>
        ↑
      </button>
      <button type="button" aria-label={`Move ${label} down`} onClick={() => moveBy(id, 1)} className={iconBtn}>
        ↓
      </button>
      <button type="button" aria-label={`${hidden ? 'Show' : 'Hide'} ${label}`} onClick={() => toggleHidden(id)} className={iconBtn}>
        {hidden ? 'Show' : 'Hide'}
      </button>
      <button type="button" aria-label={`Remove ${label}`} onClick={() => remove(id)} className={iconBtn}>
        ✕
      </button>
    </li>
  )
}

interface Props {
  report: ReportDocument
  selectedId: string | null
  onSelect: (id: string) => void
}

export function OutlinePanel({ report, selectedId, onSelect }: Props) {
  const moveSection = useReportStore((s) => s.moveSection)
  const addSection = useReportStore((s) => s.addSection)
  const addChart = useReportStore((s) => s.addChart)
  const recommendations = useSessionStore((s) => s.result?.recommendations) ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = report.sections.map((s) => s.block.id)
  const unused = recommendations.filter((r) => !report.charts[r.id])

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from >= 0 && to >= 0) moveSection(from, to)
  }

  function scrollTo(id: string) {
    onSelect(id)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg">Outline</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5">
            {report.sections.map(({ block, hidden }) => (
              <Row
                key={block.id}
                id={block.id}
                label={sectionLabel(block, report.charts)}
                hidden={!!hidden}
                selected={selectedId === block.id}
                onSelect={() => scrollTo(block.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="space-y-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={() =>
            addSection({ id: newId('sec'), kind: 'text', heading: 'New section', body: 'Write something here.' })
          }
          className="w-full rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-paper"
        >
          + Add text section
        </button>
        {unused.length > 0 && (
          <label className="block text-sm">
            <span className="sr-only">Add a chart</span>
            <select
              value=""
              onChange={(e) => {
                const rec = unused.find((r) => r.id === e.target.value)
                if (rec) addChart(rec.spec)
              }}
              className="w-full rounded-lg border border-line bg-surface px-2 py-1.5"
            >
              <option value="">+ Add a chart…</option>
              {unused.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.spec.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  )
}