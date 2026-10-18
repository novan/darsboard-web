import { useState } from 'react'
import type { ColumnKey, FindingSummary } from '../lib/api'
import { columnMeta } from '../lib/labels'
import { Button } from './ui'
import { FindingCard } from './FindingCard'

export function FindingColumn({
  column,
  items,
  initial,
  runId,
}: {
  column: ColumnKey
  items: FindingSummary[]
  initial: number
  runId: number
}) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, initial)
  const meta = columnMeta[column]
  return (
    <section aria-labelledby={`col-${column}`} className="flex min-w-0 flex-col gap-2">
      <header>
        <h2 id={`col-${column}`} className="flex items-baseline gap-2 text-base font-extrabold text-navy-900">
          {meta.title}
          <span className="rounded-full bg-navy-50 px-2 text-xs font-bold text-navy-700">{items.length}</span>
        </h2>
        <p className="text-xs text-muted">{meta.hint}</p>
      </header>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">Tidak ada temuan pada kolom ini.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((f) => (
            <FindingCard key={f.id} f={f} runId={runId} />
          ))}
        </ul>
      )}
      {items.length > initial && (
        <Button variant="ghost" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Tampilkan lebih sedikit' : `Lihat semua (${items.length})`}
        </Button>
      )}
    </section>
  )
}
