export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="chartly-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2cc2b8" />
          <stop offset="1" stopColor="#0b6064" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#chartly-logo)" />
      <rect x="9" y="22" width="5" height="9" rx="1.6" fill="#fff" opacity="0.9" />
      <rect x="17.5" y="15" width="5" height="16" rx="1.6" fill="#fff" />
      <rect x="26" y="11" width="5" height="20" rx="1.6" fill="#fff" opacity="0.9" />
      <circle cx="31.5" cy="8" r="3.4" fill="#f2a93b" stroke="#0b6064" strokeWidth="1.6" />
    </svg>
  )
}