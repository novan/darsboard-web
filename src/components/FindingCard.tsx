import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { FindingSummary } from '../lib/api'
import { patternLabel } from '../lib/labels'
import { Badge } from './ui'

export function FindingCard({ f, runId }: { f: FindingSummary; runId: number }) {
  return (
    <li>
      <Link
        to={`/temuan/${f.id}?run=${runId}`}
        className="group block rounded-lg border border-line bg-white p-3 hover:border-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700"
      >
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{patternLabel[f.pattern] ?? f.pattern}</Badge>
          {f.scope && (
            <Badge>
              {f.scope.name} · {f.scope.grade}
            </Badge>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug">{f.sentence}</p>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span>
            {f.class_names.length > 0 ? `Kelas ${f.class_names.join(', ')}` : 'Semua kelas'}
            {f.impact > 0 && ` · ${f.impact} murid terdampak`}
          </span>
          <span className="inline-flex items-center gap-0.5 font-bold text-navy-700 group-hover:underline">
            Lihat bukti <ChevronRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  )
}
