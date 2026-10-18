import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ApiError } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import type { FindingResponse } from '../lib/api'
import { EvidenceGrid } from '../components/EvidenceGrid'
import { StudentHistory } from '../components/StudentHistory'
import { StudentTable } from '../components/StudentTable'
import type { StudentRow } from '../components/StudentTable'
import { Badge, Card, Spinner } from '../components/ui'
import { columnMeta, patternLabel } from '../lib/labels'

export default function Finding() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const run = params.get('run')
  const load = useLoad<FindingResponse>(`/api/findings/${id}${run ? `?run=${encodeURIComponent(run)}` : ''}`)
  const res = load.state === 'ok' ? load.data : null
  const error = load.state === 'error' ? load.error : null
  const [openStudent, setOpenStudent] = useState<number | null>(null)

  const rows = useMemo<StudentRow[]>(() => {
    if (!res) return []
    const ev = res.evidence
    if (ev.students) {
      return ev.students.map((s) => ({
        id: s.id,
        name: s.name,
        className: ev.class_name ?? '',
        detail: `Tertinggal pada ${s.scopes.join(', ')}`,
        behind: true,
      }))
    }
    const affected = new Set(ev.affected_class_ids ?? [])
    return (ev.classes ?? [])
      .filter((c) => affected.has(c.class_id))
      .flatMap((c) =>
        (c.students ?? [])
          .filter((s) => s.behind)
          .map((s) => ({
            id: s.student_id,
            name: s.name,
            className: c.class_name,
            detail: `${s.at_ref} dari ${s.obs} pengamatan di level acuan`,
            behind: true,
          })),
      )
  }, [res])

  const back = res ? `/?unit=${res.finding.unit}&period=${res.finding.period.key}` : '/'

  if (error) {
    const stale = error instanceof ApiError && error.status === 404
    return (
      <div className="flex flex-col gap-3">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-navy-700">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke agenda
        </Link>
        <p role="alert" className="rounded-lg border border-warn/30 bg-warn-bg p-4 text-warn">
          {stale
            ? 'Temuan ini tidak ada pada perhitungan terbaru. Kemungkinan datanya sudah berubah sejak tautan ini dibuat. Buka agenda untuk melihat temuan saat ini.'
            : error.message}
        </p>
      </div>
    )
  }
  if (!res) return <Spinner />

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
        <h2 className="mb-2 text-base font-extrabold text-navy-900">Murid</h2>
        <StudentTable rows={rows} onOpen={setOpenStudent} />
      </Card>

      {openStudent != null && <StudentHistory key={openStudent} id={openStudent} onClose={() => setOpenStudent(null)} />}
    </div>
  )
}
