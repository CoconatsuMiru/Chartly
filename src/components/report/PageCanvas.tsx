import type { ReportDocument, Theme } from '@/domain'
import { BlockView, pt } from './ReportBlocks'

interface Props {
  report: ReportDocument
  theme: Theme
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PageCanvas({ report, theme, selectedId, onSelect }: Props) {
  const visible = report.sections.filter((s) => !s.hidden)
  const hiddenCount = report.sections.length - visible.length

  return (
    <div
      className="mx-auto max-w-[820px] space-y-9 rounded-md border p-8 shadow-[0_1px_2px_rgb(18_32_42/0.08),0_24px_48px_-24px_rgb(18_32_42/0.3)] sm:p-14"
      style={{
        background: theme.colors.paper,
        color: theme.colors.ink,
        borderColor: theme.colors.line,
        fontFamily: `"${theme.fonts.body}", system-ui, sans-serif`,
        fontSize: pt(theme.type.body),
        lineHeight: 1.55,
      }}
    >
      {visible.map(({ block }) => (
        <section
          key={block.id}
          id={`sec-${block.id}`}
          onClick={() => onSelect(block.id)}
          className={`-m-3 rounded-lg p-3 ring-1 transition-shadow ${
            selectedId === block.id ? 'ring-2 ring-[var(--color-primary)]' : 'ring-transparent hover:ring-black/10'
          }`}
        >
          <BlockView block={block} report={report} theme={theme} />
        </section>
      ))}
      {visible.length === 0 && <p className="opacity-60">Every section is hidden. Show one from the outline.</p>}
      {hiddenCount > 0 && (
        <p className="text-center text-xs opacity-60">
          {hiddenCount} hidden section(s) are not shown here or in exports.
        </p>
      )}
    </div>
  )
}