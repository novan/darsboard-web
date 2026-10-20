import { useMemo, useState } from 'react'
import { data, Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import type { FindingResponse } from '../lib/api'
import { apiGet } from '../lib/backend.server'
import { EvidenceGrid } from '../components/EvidenceGrid'
import { StudentHistory } from '../components/StudentHistory'
import { StudentTable } from '../components/StudentTable'
import type { StudentRow } from '../components/StudentTable'
import { Badge, Card } from '../components/ui'
import { columnMeta, patternLabel } from '../lib/labels'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const run = new URL(request.url).searchParams.get('run')
  const id = encodeURIComponent(params.id ?? '')
  const res = await apiGet<FindingResponse>(request, `/api/findings/${id}${run ? `?run=${encodeURIComponent(run)}` : ''}`)
  if (!res.ok) {
    return data({ res: null, failure: { status: res.error.status, message: res.error.message } }, { status: res.error.status })
  }
  return { res: res.data, failure: null }
}

export default function Finding() {
  const { res, failure } = useLoaderData<typeof loader>()
  const [openStudent, setOpenStudent] = useState<number | null>(null)

  // Murid pada program (mapel/area) ini: yang tertinggal dan seluruh murid di kelas yang dibandingkan.
  const [mode, setMode] = useState<'behind' | 'all'>('behind')
  const { behindRows, allRows } = useMemo(() => {
    const out = { behindRows: [] as StudentRow[], allRows: [] as StudentRow[] }
    if (!res) return out
    const ev = res.evidence
    if (ev.students) {
      out.behindRows = ev.students.map((s) => ({
        id: s.id,
        name: s.name,
        className: ev.class_name ?? '',
        detail: `di ${s.scopes.join(', ')}`,
        behind: true,
      }))
      return out
    }
    const affected = new Set(ev.affected_class_ids ?? [])
    const byName = (a: StudentRow, b: StudentRow) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name, 'id')
    for (const c of ev.classes ?? []) {
      for (const s of c.students ?? []) {
        const row: StudentRow = {
          id: s.student_id,
          name: s.name,
          className: c.class_name,
          detail: `${s.at_ref} dari ${s.obs} pengamatan di level acuan`,
          behind: s.behind,
        }
        out.allRows.push(row)
        if (s.behind && affected.has(c.class_id)) out.behindRows.push(row)
      }
    }
    out.behindRows.sort(byName)
    // Yang tertinggal tampil lebih dulu, lalu urut kelas dan nama.
    out.allRows.sort((a, b) => Number(b.behind) - Number(a.behind) || byName(a, b))
    return out
  }, [res])
  const canShowAll = allRows.length > 0
  const rows = mode === 'all' && canShowAll ? allRows : behindRows

  const back = res ? `/?unit=${res.finding.unit}&period=${res.finding.period.key}` : '/'

  if (failure) {
    const stale = failure.status === 404
    return (
      <div className="flex flex-col gap-3">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-navy-700">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke agenda
        </Link>
        <p role="alert" className="rounded-lg border border-warn/30 bg-warn-bg p-4 text-warn">
          {stale
            ? 'Temuan ini tidak ada pada perhitungan terbaru. Kemungkinan datanya sudah berubah sejak tautan ini dibuat. Buka agenda untuk melihat temuan saat ini.'
            : failure.message}
        </p>
      </div>
    )
  }
  if (!res) return null

  const { finding, evidence } = res
  const refLabel = evidence.reference_level ?? ''
  return (
    <div className="flex flex-col gap-4">
      <Link to={back} className="inline-flex items-center gap-1 text-sm font-bold text-navy-700">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke agenda
      </Link>
      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{columnMeta[finding.column].title}</Badge>
          <Badge>{patternLabel[finding.pattern] ?? finding.pattern}</Badge>
          <Badge>{finding.period.label}{finding.period.provisional ? ' (sementara)' : ''}</Badge>
          {evidence.scope && (
            <Badge>
              {evidence.scope.name} · {evidence.scope.grade}
            </Badge>
          )}
        </div>
        <h2 className="text-lg font-extrabold leading-snug text-navy-900">{finding.sentence}</h2>
        {evidence.trace && evidence.trace.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted">Dasar penilaian</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {evidence.trace.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {evidence.history_reconstructed && (
          <p role="note" className="mt-3 rounded-lg border border-warn/30 bg-warn-bg px-3 py-2 text-sm text-warn">
            <strong>Riwayat belum penuh.</strong> Penguasaan GK baru tercatat sejak sinkronisasi pertama, jadi hasil bulan pembanding dihitung dari
            data terbaru. Bahwa masalah ini sudah ada bulan lalu belum sepenuhnya terbukti.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          Aturan versi {finding.rules_version}. Perhitungan #{res.run.id}.
          {evidence.thresholds &&
            ` Kelas dianggap bermasalah bila di bawah ${Math.round(evidence.thresholds.abs_problem_share * 100)}% (mapel akademik) atau ${Math.round(
              evidence.thresholds.rel_problem_gap * 100,
            )} poin di bawah kelas paralel.`}
        </p>
      </Card>

      {evidence.classes && evidence.classes.length > 0 && (
        <Card>
          <h2 className="mb-2 text-base font-extrabold text-navy-900">Perbandingan kelas</h2>
          <EvidenceGrid ev={evidence} refLabel={refLabel} />
        </Card>
      )}

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-navy-900">Murid</h2>
          {canShowAll && (
            <div role="group" aria-label="Murid yang ditampilkan" className="inline-flex overflow-hidden rounded-lg border border-line text-sm">
              {(
                [
                  ['behind', `Yang tertinggal (${behindRows.length})`],
                  ['all', `Semua murid (${allRows.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={mode === k}
                  onClick={() => setMode(k)}
                  className={`px-3 py-1.5 font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-700 ${
                    mode === k ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {canShowAll && mode === 'all' && (
          <p className="mb-2 text-xs text-muted">Seluruh murid yang punya penilaian pada {evidence.scope?.name ?? 'program'} di kelas yang dibandingkan.</p>
        )}
        <StudentTable rows={rows} onOpen={setOpenStudent} />
      </Card>

      {openStudent != null && <StudentHistory key={openStudent} id={openStudent} onClose={() => setOpenStudent(null)} />}
    </div>
  )
}
