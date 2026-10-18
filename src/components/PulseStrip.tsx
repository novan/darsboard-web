import { ArrowDownRight, ArrowRight, ArrowUpRight, HelpCircle } from 'lucide-react'
import type { AgendaResponse, Component } from '../lib/api'
import { directionLabel, pct, pulseTitle, reasonText } from '../lib/labels'
import { Badge, Card } from './ui'

function Direction({ c }: { c: Component }) {
  const text = directionLabel[c.direction]
  switch (c.direction) {
    case 'membaik':
      return <Badge tone="ok" icon={<ArrowUpRight className="h-3 w-3" aria-hidden />}>{text}</Badge>
    case 'memburuk':
      return <Badge tone="danger" icon={<ArrowDownRight className="h-3 w-3" aria-hidden />}>{text}</Badge>
    case 'tetap':
      return <Badge icon={<ArrowRight className="h-3 w-3" aria-hidden />}>{text}</Badge>
    default:
      return <Badge tone="warn" icon={<HelpCircle className="h-3 w-3" aria-hidden />}>{text}</Badge>
  }
}

function Row({ c }: { c: Component }) {
  return (
    <li className="flex flex-col gap-1 border-t border-line py-2 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{c.label}</span>
        {c.avail ? (
          <span className="text-lg font-extrabold tabular-nums">{c.key === 'weak_cells' ? c.value?.toFixed(0) : pct(c.value)}</span>
        ) : (
          <span className="text-sm font-semibold text-muted">Tidak tersedia</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {c.avail ? <Direction c={c} /> : <Badge tone="neutral">{reasonText(c.reason)}</Badge>}
        {c.avail && c.direction === 'tidak_tersedia' && c.direction_reason && (
          <span className="text-xs text-muted">{reasonText(c.direction_reason)}</span>
        )}
        {c.reconstructed && <Badge tone="warn">dihitung ulang dari data terbaru</Badge>}
      </div>
      {c.detail && <p className="text-xs text-muted">{c.detail}</p>}
    </li>
  )
}

export function PulseStrip({ pulses }: { pulses: AgendaResponse['pulses'] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(['commitment', 'process', 'outcome'] as const).map((k) => {
        const comps = pulses[k] ?? []
        return (
          <Card key={k}>
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-navy-900">{pulseTitle[k]}</h2>
            {comps.length === 0 ? (
              <p className="text-sm text-muted">Tidak tersedia untuk unit ini.</p>
            ) : (
              <ul>
                {comps.map((c) => (
                  <Row key={c.key} c={c} />
                ))}
              </ul>
            )}
          </Card>
        )
      })}
    </div>
  )
}
