import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../lib/api'
import type { AgendaResponse, ColumnKey, PeriodsResponse, StatusResponse, Unit } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { FindingColumn } from '../components/FindingColumn'
import { PulseStrip } from '../components/PulseStrip'
import { StateBanners } from '../components/StateBanner'
import { Spinner } from '../components/ui'

const COLUMNS: ColumnKey[] = ['program', 'guru', 'murid', 'tinjau']

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const periods = useLoad<PeriodsResponse>('/api/periods')
  const statusLoad = useLoad<StatusResponse>('/api/status')
  const status = statusLoad.state === 'ok' ? statusLoad.data : null

  const unit = (params.get('unit') as Unit | null) ?? (periods.state === 'ok' ? periods.data.default.unit : null)
  const period = params.get('period') ?? (periods.state === 'ok' ? periods.data.default.period : null)

  const agenda = useLoad<AgendaResponse>(unit && period ? `/api/agenda?unit=${unit}&period=${encodeURIComponent(period)}` : null)

  const choose = (next: { unit?: string; period?: string }) => {
    const p = new URLSearchParams(params)
    if (unit) p.set('unit', unit)
    if (period) p.set('period', period)
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p)
  }

  const months = useMemo(() => (periods.state === 'ok' ? periods.data.periods.filter((p) => p.kind === 'month') : []), [periods])
  const terms = useMemo(() => (periods.state === 'ok' ? periods.data.periods.filter((p) => p.kind === 'term') : []), [periods])

  if (periods.state === 'loading') return <Spinner />
  if (periods.state === 'error') {
    const noRun = periods.error instanceof ApiError && periods.error.code === 'no_run'
    return (
      <p role="alert" className="rounded-lg border border-line bg-white p-4">
        {noRun
          ? 'Belum ada hasil perhitungan. Jalankan sinkronisasi data terlebih dahulu, lalu muat ulang halaman ini.'
          : periods.error.message}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Unit" className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
          {(['TK', 'SD'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => choose({ unit: u })}
              aria-pressed={unit === u}
              className={`px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-700 ${
                unit === u ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-50'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Periode
          <select
            value={period ?? ''}
            onChange={(e) => choose({ period: e.target.value })}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            <optgroup label="Bulan">
              {months.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                  {p.provisional ? ' (sementara)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Term">
              {terms.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                  {p.provisional ? ' (sementara)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      {agenda.state === 'loading' && <Spinner />}
      {agenda.state === 'error' && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-danger">
          {agenda.error.message}
        </p>
      )}
      {agenda.state === 'ok' && (
        <>
          <StateBanners agenda={agenda.data} status={status} />
          <PulseStrip pulses={agenda.data.pulses} />
          {agenda.data.empty && (
            <p className="rounded-lg border border-ok/30 bg-ok-bg p-4 text-ok">
              <strong>Tidak ada temuan.</strong> Pada periode ini tidak ada kelas yang memenuhi kriteria perlu ditinjau. Ini bukan berarti semua
              data lengkap: cek kartu denyut di atas untuk komponen yang tidak tersedia.
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((c) => (
              <FindingColumn
                key={c}
                column={c}
                items={agenda.data.columns[c]}
                initial={agenda.data.initial_per_column}
                runId={agenda.data.run.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
