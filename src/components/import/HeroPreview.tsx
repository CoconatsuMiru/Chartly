import { stagger } from '@/utils/stagger'

const BARS = [34, 46, 41, 58, 66, 62, 78, 92]
const W = 400
const H = 140
const BW = 28
const GAP = (W - BARS.length * BW) / (BARS.length - 1)

/** A decorative, layered "finished report" that shows what the app produces. */
export function HeroPreview() {
  const tops = BARS.map((v, i) => ({ x: i * (BW + GAP) + BW / 2, y: H - (v / 100) * (H - 18) - 12 }))
  const line = tops.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = tops[tops.length - 1]

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[540px] select-none px-3 py-8">
      <div className="absolute inset-x-8 inset-y-8 -rotate-[5deg] rounded-[22px] border border-black/5 bg-[#e3ddcd]" />
      <div className="absolute inset-x-5 inset-y-6 rotate-[2.5deg] rounded-[22px] border border-black/5 bg-[#efeadf] shadow-[0_18px_40px_-20px_rgb(18_32_42/0.35)]" />

      <div className="card rise relative p-6" style={stagger(2)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Q3 performance</p>
            <p className="mt-1 font-serif text-[1.6rem] leading-tight">Revenue is on the rise</p>
          </div>
          <span className="rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent-ink">+24.6%</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ['Revenue', '$2.84M'],
            ['Units', '9.2k'],
            ['Churn', '1.4%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#faf8f2] p-3 ring-1 ring-black/5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-1 font-serif text-xl tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[#faf8f2] p-3 ring-1 ring-black/5">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
            <defs>
              <linearGradient id="hero-bars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1aa7a0" stopOpacity="0.55" />
                <stop offset="1" stopColor="#1aa7a0" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e3ded2" strokeWidth="1" />
            ))}
            {BARS.map((v, i) => {
              const h = (v / 100) * (H - 18)
              return (
                <rect key={i} x={i * (BW + GAP)} y={H - h} width={BW} height={h} rx="5" fill="url(#hero-bars)" />
              )
            })}
            <path d={line} fill="none" stroke="#0b6064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={last.x} cy={last.y} r="5.5" fill="#e0951a" stroke="#fff" strokeWidth="2.5" />
          </svg>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary-soft p-3.5">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
          <p className="text-[13px] leading-snug">
            Revenue rose 24% over 12 months, a steady upward trend.
            <span className="mt-1 block font-mono text-[11px] text-primary-strong">R² 0.97 · Why this?</span>
          </p>
        </div>
      </div>

      <span
        className="rise absolute right-0 top-2 rotate-6 rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-lift ring-1 ring-black/5"
        style={stagger(4)}
      >
        <span className="mr-1.5 inline-block size-2 rounded-full bg-[#c4473b]" />
        PDF
      </span>
      <span
        className="rise absolute bottom-3 left-0 -rotate-6 rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-lift ring-1 ring-black/5"
        style={stagger(5)}
      >
        <span className="mr-1.5 inline-block size-2 rounded-full bg-[#d97a1a]" />
        PowerPoint
      </span>
    </div>
  )
}