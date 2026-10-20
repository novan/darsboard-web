import type { ColumnKey } from '../lib/api'
import { columnMeta } from '../lib/labels'

export type BarMonth = { label: string; counts: Record<ColumnKey, number> }

const ORDER: ColumnKey[] = ['program', 'guru', 'murid', 'tinjau']
// Warna hanya pembeda tambahan; jumlah selalu tertulis di dalam batang dan di tabel.
const FILL: Record<ColumnKey, string> = { program: '#1c3f8f', guru: '#dd9b27', murid: '#3f8f7f', tinjau: '#7d869b' }
const W = 360
const H = 190
const PAD = { l: 28, r: 8, t: 12, b: 26 }

// Batang bertumpuk jumlah temuan per bulan menurut jenis.
export function StackedBars({ months, title }: { months: BarMonth[]; title: string }) {
  const max = Math.max(1, ...months.map((m) => ORDER.reduce((n, k) => n + m.counts[k], 0)))
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const slot = innerW / Math.max(1, months.length)
  const barW = Math.min(44, slot * 0.6)
  const yv = (v: number) => PAD.t + innerH - (v / max) * innerH

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        {[0, max].map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yv(g)} y2={yv(g)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.l - 6} y={yv(g) + 4} textAnchor="end" className="fill-muted" fontSize={10}>
              {g}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = PAD.l + slot * i + slot / 2
          let acc = 0
          return (
            <g key={m.label}>
              {ORDER.map((k) => {
                const v = m.counts[k]
                if (v === 0) return null
                const top = yv(acc + v)
                const h = yv(acc) - top
                acc += v
                return (
                  <g key={k}>
                    <rect x={cx - barW / 2} y={top} width={barW} height={h} fill={FILL[k]} />
                    {h >= 14 && (
                      <text x={cx} y={top + h / 2 + 4} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700}>
                        {v}
                      </text>
                    )}
                  </g>
                )
              })}
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={10}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {ORDER.map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: FILL[k] }} aria-hidden /> {columnMeta[k].title}
          </li>
        ))}
      </ul>
    </div>
  )
}
