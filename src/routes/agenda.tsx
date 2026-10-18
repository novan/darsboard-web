import { useMemo } from 'react'
import { useLoaderData, useNavigation, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import type { AgendaResponse, ColumnKey, PeriodsResponse, StatusResponse, Unit } from '../lib/api'
import { apiGet } from '../lib/backend.server'
import { FindingColumn } from '../components/FindingColumn'
import { PulseStrip } from '../components/PulseStrip'
import { StateBanners } from '../components/StateBanner'
import { Spinner } from '../components/ui'

const COLUMNS: ColumnKey[] = ['program', 'guru', 'murid', 'tinjau']

type Failure = { status: number; code: string; message: string }

// Data agenda dimuat di server; navigasi unit/periode hanya mengubah query string lalu loader jalan lagi.
export async function loader({ request }: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams
  const periods = await apiGet<PeriodsResponse>(request, '/api/periods')
  if (!periods.ok) {
    const e = periods.error
    return { periods: null, error: { status: e.status, code: e.code, message: e.message } as Failure }
  }
  const unit = params.get('unit') ?? periods.data.default.unit
  const period = params.get('period') ?? periods.data.default.period
  const [agenda, status] = await Promise.all([
    apiGet<AgendaResponse>(request, `/api/agenda?unit=${encodeURIComponent(unit)}&period=${encodeURIComponent(period)}`),
    apiGet<StatusResponse>(request, '/api/status'),
  ])
  const failure: Failure | null = agenda.ok ? null : { status: agenda.error.status, code: agenda.error.code, message: agenda.error.message }
  return {
    periods: periods.data,
    unit: unit as Unit,
    period,
    agenda: agenda.ok ? agenda.data : null,
    status: status.ok ? status.data : null,
    error: failure,
  }
}

export default function Agenda() {
  const data = useLoaderData<typeof loader>()
  const [params, setParams] = useSearchParams()
  const loading = useNavigation().state === 'loading'
  const periods = data.periods
  const months = useMemo(() => periods?.periods.filter((p) => p.kind === 'month') ?? [], [periods])
  const terms = useMemo(() => periods?.periods.filter((p) => p.kind === 'term') ?? [], [periods])

  const choose = (next: { unit?: string; period?: string }) => {
    const p = new URLSearchParams(params)
    if (data.periods) {
      p.set('unit', data.unit)
      p.set('period', data.period)
    }
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p)
  }

  if (!periods) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-white p-4">
        {data.error.code === 'no_run'
          ? 'Belum ada hasil perhitungan. Jalankan sinkronisasi data terlebih dahulu, lalu muat ulang halaman ini.'
          : data.error.message}
      </p>
    )
  }

  const { agenda, status, unit, period } = data
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
            value={period}
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
        {loading && <Spinner label="Memuat…" />}
      </div>

      {data.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-danger">
          {data.error.message}
        </p>
      )}
      {agenda && (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <div className="flex flex-col gap-4">
            <StateBanners agenda={agenda} status={status} />
            <PulseStrip pulses={agenda.pulses} />
            {agenda.empty && (
              <p className="rounded-lg border border-ok/30 bg-ok-bg p-4 text-ok">
                <strong>Tidak ada temuan.</strong> Pada periode ini tidak ada kelas yang memenuhi kriteria perlu ditinjau. Ini bukan berarti
                semua data lengkap: cek kartu denyut di atas untuk komponen yang tidak tersedia.
              </p>
            )}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((c) => (
                <FindingColumn key={c} column={c} items={agenda.columns[c]} initial={agenda.initial_per_column} runId={agenda.run.id} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
