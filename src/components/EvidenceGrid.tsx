import type { ClassCell, Evidence } from '../lib/api'
import { pct, processLabel, reasonText, signalLabel } from '../lib/labels'
import { Badge } from './ui'

function OutcomeCell({ o }: { o: ClassCell['now'] }) {
  if (!o.avail) return <span className="text-muted">Tidak tersedia ({reasonText(o.reason)})</span>
  return (
    <span>
      <strong className="tabular-nums">{pct(o.share)}</strong>{' '}
      <span className="text-xs text-muted">
        ({o.at_ref}/{o.observations} pengamatan, {o.students} murid)
      </span>
    </span>
  )
}

export function EvidenceGrid({ ev, refLabel }: { ev: Evidence; refLabel: string }) {
  const classes = ev.classes ?? []
  const affected = new Set(ev.affected_class_ids ?? [])
  if (classes.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="mb-2 text-left text-sm text-muted">
          Hasil = porsi pengamatan di level {refLabel} ke atas, sebagai keadaan sampai akhir periode.
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-3">Kelas</th>
            <th className="py-2 pr-3">Guru</th>
            <th className="py-2 pr-3">Hasil periode ini</th>
            <th className="py-2 pr-3">Akhir bulan lalu</th>
            <th className="py-2">Proses mengajar</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.class_id} className="border-b border-line align-top">
              <th scope="row" className="py-2 pr-3 text-left">
                {c.class_name}
                {affected.has(c.class_id) && (
                  <div className="mt-1">
                    <Badge tone="danger">Perlu perhatian</Badge>
                  </div>
                )}
              </th>
              <td className="py-2 pr-3">
                {c.teachers && c.teachers.length > 0 ? (
                  c.teachers.map((t) => (
                    <div key={t.id}>
                      {t.name}
                      {t.derived && <span className="text-xs text-muted"> (penulis aktivitas)</span>}
                    </div>
                  ))
                ) : (
                  <span className="text-muted">Belum diketahui</span>
                )}
              </td>
              <td className="py-2 pr-3">
                <OutcomeCell o={c.now} />
              </td>
              <td className="py-2 pr-3">
                <OutcomeCell o={c.prev} />
              </td>
              <td className="py-2">
                <Badge tone={c.process.status === 'ok' ? 'ok' : c.process.status === 'weak' ? 'danger' : c.process.status === 'borderline' ? 'warn' : 'neutral'}>
                  {processLabel[c.process.status]}
                </Badge>
                {c.process.relative && <div className="text-xs text-muted">Dibandingkan dengan kelas paralel saja</div>}
                {c.process.signals && c.process.signals.length > 0 && (
                  <ul className="mt-1 text-xs">
                    {c.process.signals.map((s) => (
                      <li key={s.name} className={s.weak ? 'font-bold text-danger' : 'text-muted'}>
                        {signalLabel[s.name] ?? s.name}: {s.avail ? pct(s.value) : 'tidak tersedia'}
                        {s.weak && ' — lemah'}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
