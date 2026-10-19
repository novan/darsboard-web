import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { FindingSummary } from '../lib/api'
import { patternLabel } from '../lib/labels'
import { Badge } from './ui'

// Satu temuan sebagai baris daftar: kalimat diagnosis, cakupan, dan tautan ke bukti.
export function FindingRow({ f, runId }: { f: FindingSummary; runId: number }) {
  const where = f.class_names.length > 0 ? `Kelas ${f.class_names.join(', ')}` : 'Semua kelas'
  return (
    <li>
      <Link
        to={`/temuan/${f.id}?run=${runId}`}
        className="group flex flex-col gap-2 px-4 py-3 hover:bg-navy-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="info">{patternLabel[f.pattern] ?? f.pattern}</Badge>
            {f.scope && (
              <Badge>
                {f.scope.name} · {f.scope.grade}
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug">{f.sentence}</p>
          <p className="mt-1 text-xs text-muted">
            {where}
            {f.impact > 0 && ` · ${f.impact} murid terdampak`}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold text-navy-700 group-hover:underline">
          Lihat bukti <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
    </li>
  )
}
