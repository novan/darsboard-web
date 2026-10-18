import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { HistoryPoint, StudentHistoryResponse } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { fmtDate } from '../lib/labels'
import { Spinner } from './ui'

function Series({ points }: { points: HistoryPoint[] }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
      {points.map((p, i) => (
        <li key={`${p.at}-${i}`} className="rounded bg-paper px-1.5 py-0.5">
          <span className="text-muted">{fmtDate(p.at)}:</span> <strong>{p.label ?? p.level}</strong>
        </li>
      ))}
    </ol>
  )
}

// Laci riwayat asesmen satu murid. Fokus dipindah ke laci saat dibuka; Escape menutup.
export function StudentHistory({ id, onClose }: { id: number; onClose: () => void }) {
  const load = useLoad<StudentHistoryResponse>(`/api/students/${id}/history`)
  const data = load.state === 'ok' ? load.data : null
  const error = load.state === 'error' ? load.error.message : ''
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Riwayat asesmen murid"
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">{data?.student.name ?? 'Riwayat murid'}</h2>
            {data && (
              <p className="text-sm text-muted">
                {data.student.unit}
                {data.student.class ? ` · ${data.student.class}` : ''}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-navy-700"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {!data && !error && <Spinner />}
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {data && (
          <div className="flex flex-col gap-5">
            {data.mastery.length === 0 && data.rubric.length === 0 && <p className="text-muted">Belum ada riwayat asesmen.</p>}
            {data.mastery.length > 0 && (
              <section>
                <h3 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-navy-900">Mapel akademik</h3>
                {data.notes.mastery_history_since && (
                  <p className="mb-2 text-xs text-muted">
                    Riwayat penguasaan tercatat sejak {data.notes.mastery_history_since}. Sebelum itu hanya level terakhir yang diketahui.
                  </p>
                )}
                {data.mastery.map((s) => (
                  <details key={s.subject} className="mb-2 rounded-lg border border-line p-2">
                    <summary className="cursor-pointer text-sm font-bold">
                      {s.subject} <span className="font-normal text-muted">({s.standards.length} standar)</span>
                    </summary>
                    <ul className="mt-2 flex flex-col gap-2">
                      {s.standards.map((st) => (
                        <li key={st.code}>
                          <div className="text-xs font-semibold">{st.code}</div>
                          <Series points={st.series} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </section>
            )}
            {data.rubric.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-navy-900">Rubrik</h3>
                {data.rubric.map((a) => (
                  <details key={a.area} className="mb-2 rounded-lg border border-line p-2">
                    <summary className="cursor-pointer text-sm font-bold">
                      {a.area} <span className="font-normal text-muted">({a.lessons.length} materi)</span>
                    </summary>
                    <ul className="mt-2 flex flex-col gap-2">
                      {a.lessons.map((l) => (
                        <li key={l.lesson_ref}>
                          <div className="text-xs font-semibold">{l.title || l.lesson_ref}</div>
                          <Series points={l.series} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </section>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
