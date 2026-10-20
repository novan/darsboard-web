import { pct } from '../lib/labels'

export type ChartPoint = { label: string; value: number | null }

const W = 360
const H = 150
const PAD = { l: 34, r: 12, t: 18, b: 26 }

// Grafik garis sederhana (SVG) untuk persentase. Sumbu tegak menyesuaikan rentang data (minimal 20 poin) supaya
// perubahan kecil tetap terbaca; angka di sumbu dan di tiap titik menjaga ukurannya jujur. Titik tanpa data memutus garis.
// Arti grafik tidak bergantung pada warna, dan tabel di halaman yang sama memuat angka yang sama.
export function LineChart({ points, title }: { points: ChartPoint[]; title: string }) {
  const n = points.length
  const vals = points.flatMap((p) => (p.value == null ? [] : [p.value]))
  let lo = vals.length ? Math.min(...vals) : 0
  let hi = vals.length ? Math.max(...vals) : 1
  lo = Math.max(0, Math.floor((lo - 0.05) * 20) / 20)
  hi = Math.min(1, Math.ceil((hi + 0.05) * 20) / 20)
  if (hi - lo < 0.2) {
    // Lebarkan sampai 20 poin tanpa keluar dari 0–100%.
    const mid = (hi + lo) / 2
    lo = Math.max(0, mid - 0.1)
    hi = Math.min(1, lo + 0.2)
    lo = Math.max(0, hi - 0.2)
  }
  const grid = [lo, (lo + hi) / 2, hi]
  const x = (i: number) => PAD.l + (n <= 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (n - 1))
  const y = (v: number) => PAD.t + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - PAD.t - PAD.b)

  // Pecah menjadi ruas berurutan yang punya data.
  const runs: { i: number; v: number }[][] = []
  points.forEach((p, i) => {
    if (p.value == null) {
      runs.push([])
    } else {
      if (runs.length === 0) runs.push([])
      runs[runs.length - 1].push({ i, v: p.value })
    }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
      {grid.map((g) => (
        <g key={g}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} className="stroke-line" strokeWidth={1} />
          <text x={PAD.l - 6} y={y(g) + 4} textAnchor="end" className="fill-muted" fontSize={10}>
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}
      {runs.map((run, k) =>
        run.length > 1 ? (
          <polyline key={k} points={run.map((r) => `${x(r.i)},${y(r.v)}`).join(' ')} fill="none" className="stroke-navy-700" strokeWidth={2} />
        ) : null,
      )}
      {points.map((p, i) => (
        <g key={p.label}>
          <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={10}>
            {p.label}
          </text>
          {p.value != null && (
            <>
              <circle cx={x(i)} cy={y(p.value)} r={3.5} className="fill-navy-700" />
              <text x={x(i)} y={y(p.value) - 8} textAnchor="middle" className="fill-ink" fontSize={10} fontWeight={700}>
                {pct(p.value)}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}
