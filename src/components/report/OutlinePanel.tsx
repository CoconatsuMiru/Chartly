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
import type { ReportDocument, SectionBlock } from '@/domain'
import { useReportStore } from '@/state/reportStore'
import { useSessionStore } from '@/state/sessionStore'
import { newId } from '@/utils/ids'
import { Icon, type IconName } from '../ui/Icon'

const KIND_ICON: Record<SectionBlock['kind'], IconName> = {
  cover: 'cover',
  kpis: 'kpi',
  text: 'text',
  chart: 'bars',
  insights: 'spark',
  table: 'table',
}

interface RowProps {
  id: string
  label: string
  kind: SectionBlock['kind']
  hidden: boolean
  selected: boolean
  onSelect: () => void
}

const tool = 'rounded-md p-1 text-muted transition-colors hover:bg-black/8 hover:text-ink'

function Row({ id, label, kind, hidden, selected, onSelect }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const moveBy = useReportStore((s) => s.moveBy)
  const toggleHidden = useReportStore((s) => s.toggleHidden)
  const remove = useReportStore((s) => s.removeSection)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-0.5 rounded-lg px-1 py-1 transition-colors ${
        selected ? 'bg-primary-soft' : 'hover:bg-paper'
      } ${isDragging ? 'bg-white opacity-70 shadow-lift' : ''}`}
    >
      <button
        type="button"
        aria-label={`Reorder ${label}`}
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-muted hover:text-ink"
      >
        <Icon name="grip" size={16} />
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left text-[13px]">
        <Icon name={KIND_ICON[kind]} size={15} className="shrink-0 text-primary" />
        <span className={`truncate ${hidden ? 'text-muted line-through' : 'font-medium'}`}>{label}</span>
      </button>
      <span
        className={`flex items-center ${
          selected ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
        }`}
      >
        <button type="button" aria-label={`Move ${label} up`} onClick={() => moveBy(id, -1)} className={tool}>
          <Icon name="up" size={14} />
        </button>
        <button type="button" aria-label={`Move ${label} down`} onClick={() => moveBy(id, 1)} className={tool}>
          <Icon name="down" size={14} />
        </button>
        <button
          type="button"
          aria-label={`${hidden ? 'Show' : 'Hide'} ${label}`}
          onClick={() => toggleHidden(id)}
          className={tool}
        >
          <Icon name={hidden ? 'eyeOff' : 'eye'} size={14} />
        </button>
        <button type="button" aria-label={`Remove ${label}`} onClick={() => remove(id)} className={tool}>
          <Icon name="close" size={14} />
        </button>
      </span>
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
      <h3 className="eyebrow-muted px-1">Outline</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-0.5">
            {report.sections.map(({ block, hidden }) => (
              <Row
                key={block.id}
                id={block.id}
                label={sectionLabel(block, report.charts)}
                kind={block.kind}
                hidden={!!hidden}
                selected={selectedId === block.id}
                onSelect={() => scrollTo(block.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="space-y-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() =>
            addSection({ id: newId('sec'), kind: 'text', heading: 'New section', body: 'Write something here.' })
          }
          className="btn btn-secondary btn-sm w-full"
        >
          <Icon name="plus" size={15} />
          Add text section
        </button>
        {unused.length > 0 && (
          <label className="block">
            <span className="sr-only">Add a chart</span>
            <select
              value=""
              onChange={(e) => {
                const rec = unused.find((r) => r.id === e.target.value)
                if (rec) addChart(rec.spec)
              }}
              className="input w-full"
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