import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ColumnMeta } from '@/domain'
import { getDataWorker } from '@/workers/workerClient'
import { TypeBadge } from './TypeBadge'

const PAGE = 100
const ROW_H = 32
const COL_W = 168

interface Props {
  columns: ColumnMeta[]
  rowCount: number
}

/** Only the visible rows are drawn, and rows are fetched from the worker in pages. Give it a key per dataset. */
export function DataGrid({ columns, rowCount }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const cache = useRef(new Map<number, string[][]>())
  const inflight = useRef(new Set<number>())
  const [, setVersion] = useState(0)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
  })
  const items = virtualizer.getVirtualItems()

  useEffect(() => {
    const needed = new Set(items.map((v) => Math.floor(v.index / PAGE)))
    for (const p of needed) {
      if (cache.current.has(p) || inflight.current.has(p)) continue
      inflight.current.add(p)
      getDataWorker()
        .getRows(p * PAGE, PAGE)
        .then((rows) => {
          cache.current.set(p, rows)
          inflight.current.delete(p)
          setVersion((v) => v + 1)
        })
        .catch(() => inflight.current.delete(p))
    }
  }, [items])

  const template = `repeat(${columns.length}, ${COL_W}px)`
  const minWidth = columns.length * COL_W

  return (
    <div
      ref={parentRef}
      role="table"
      aria-label="Data preview"
      aria-rowcount={rowCount + 1}
      tabIndex={0}
      className="h-[420px] overflow-auto rounded-lg border border-line bg-surface"
    >
      <div style={{ minWidth, width: '100%' }}>
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-10 grid border-b border-line bg-paper"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((c) => (
            <div key={c.id} role="columnheader" className="flex flex-col gap-1 px-3 py-2">
              <span className="truncate text-sm font-medium" title={c.name}>
                {c.name}
              </span>
              <TypeBadge column={c} />
            </div>
          ))}
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((v) => {
            const row = cache.current.get(Math.floor(v.index / PAGE))?.[v.index % PAGE]
            return (
              <div
                key={v.key}
                role="row"
                aria-rowindex={v.index + 2}
                className="grid border-b border-line font-mono text-xs"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: v.size,
                  transform: `translateY(${v.start}px)`,
                  gridTemplateColumns: template,
                }}
              >
                {columns.map((c, ci) => (
                  <div
                    key={c.id}
                    role="cell"
                    className={`truncate px-3 py-2 ${c.type === 'number' ? 'text-right' : ''}`}
                  >
                    {row ? (row[ci] ?? '') : <span className="text-line">···</span>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}