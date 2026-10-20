import { useState } from 'react'
import { BookOpen, GraduationCap, SearchCheck, UserRound, type LucideIcon } from 'lucide-react'
import type { ColumnKey, FindingSummary } from '../lib/api'
import { columnMeta } from '../lib/labels'
import { Button } from './ui'
import { FindingRow } from './FindingRow'

const ORDER: ColumnKey[] = ['program', 'guru', 'murid', 'tinjau']
const ICONS: Record<ColumnKey, LucideIcon> = { program: BookOpen, guru: UserRound, murid: GraduationCap, tinjau: SearchCheck }

type Props = {
  columns: Record<ColumnKey, FindingSummary[]>
  initial: number
  runId: number
}

// Ringkasan empat jenis temuan (bisa diklik untuk memfilter) lalu daftar temuan per jenis.
export function FindingOverview({ columns, initial, runId }: Props) {
  const [focus, setFocus] = useState<ColumnKey | null>(null)
  const total = ORDER.reduce((n, k) => n + columns[k].length, 0)
  const visible = focus ? [focus] : ORDER

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="ringkasan-temuan">
        <h2 id="ringkasan-temuan" className="mb-2 text-base font-extrabold text-navy-900">
          Temuan periode ini <span className="font-semibold text-muted">· {total} temuan</span>
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {ORDER.map((k) => {
            const Icon = ICONS[k]
            const active = focus === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFocus(active ? null : k)}
                aria-pressed={active}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 ${
                  active ? 'border-navy-700 bg-navy-50' : 'border-line bg-white hover:border-navy-700'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold text-navy-900">
                  <Icon className="h-4 w-4" aria-hidden /> {columnMeta[k].title}
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-ink">{columns[k].length}</span>
                <span className="text-xs text-muted">{columns[k].length === 0 ? 'tidak ada temuan' : 'temuan'}</span>
              </button>
            )
          })}
        </div>
        {focus && (
          <div className="mt-2">
            <Button variant="ghost" onClick={() => setFocus(null)}>
              Tampilkan semua jenis temuan
            </Button>
          </div>
        )}
      </section>

      {visible.map((k) => (
        <FindingSection key={k} kind={k} items={columns[k]} initial={focus ? Infinity : initial} runId={runId} />
      ))}
    </div>
  )
}

function FindingSection({ kind, items, initial, runId }: { kind: ColumnKey; items: FindingSummary[]; initial: number; runId: number }) {
  const [all, setAll] = useState(false)
  const meta = columnMeta[kind]
  const Icon = ICONS[kind]
  const shown = all ? items : items.slice(0, initial)
  const hidden = items.length - shown.length
  if (items.length === 0) {
    // Jenis tanpa temuan cukup satu baris; penjelasan lengkap hanya untuk yang berisi.
    return (
      <section aria-labelledby={`jenis-${kind}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-white px-4 py-3">
        <h3 id={`jenis-${kind}`} className="flex items-center gap-2 text-base font-extrabold text-navy-900">
          <Icon className="h-5 w-5" aria-hidden /> {meta.title}
          <span className="rounded-full bg-navy-50 px-2 text-xs font-bold text-navy-700">0</span>
        </h3>
        <p className="text-sm text-muted">Tidak ada temuan.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby={`jenis-${kind}`} className="overflow-hidden rounded-xl border border-line bg-white">
      <header className="border-b border-line bg-paper px-4 py-3">
        <h3 id={`jenis-${kind}`} className="flex items-center gap-2 text-base font-extrabold text-navy-900">
          <Icon className="h-5 w-5" aria-hidden /> {meta.title}
          <span className="rounded-full bg-navy-50 px-2 text-xs font-bold text-navy-700">{items.length}</span>
        </h3>
        <p className="mt-1 text-sm text-muted">{meta.hint}</p>
        <p className="mt-1 text-sm">
          <span className="font-bold text-navy-900">Tindak lanjut:</span> {meta.action}
        </p>
      </header>
      <ul className="divide-y divide-line">
        {shown.map((f) => (
          <FindingRow key={f.id} f={f} runId={runId} />
        ))}
      </ul>
      {hidden > 0 && (
        <div className="border-t border-line p-2">
          <Button variant="ghost" onClick={() => setAll(true)}>
            Tampilkan {hidden} temuan lainnya
          </Button>
        </div>
      )}
      {all && items.length > initial && (
        <div className="border-t border-line p-2">
          <Button variant="ghost" onClick={() => setAll(false)}>
            Tampilkan lebih sedikit
          </Button>
        </div>
      )}
    </section>
  )
}
