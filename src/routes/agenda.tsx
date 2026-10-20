import { useEffect, useMemo } from 'react'
import { useLoaderData, useNavigation, useRevalidator, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import type { AgendaResponse, PeriodsResponse, Unit } from '../lib/api'
import { apiGet } from '../lib/backend.server'
import { FindingOverview } from '../components/FindingOverview'
import { PulseStrip } from '../components/PulseStrip'
import { Select, type SelectGroup } from '../components/Select'
import { SyncStatus } from '../components/SyncStatus'
import { Badge, Spinner } from '../components/ui'
import { Clock } from 'lucide-react'

const REFRESH_MS = 60_000

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
  const agenda = await apiGet<AgendaResponse>(request, `/api/agenda?unit=${encodeURIComponent(unit)}&period=${encodeURIComponent(period)}`)
  const failure: Failure | null = agenda.ok ? null : { status: agenda.error.status, code: agenda.error.code, message: agenda.error.message }
  return {
    periods: periods.data,
    unit: unit as Unit,
    period,
    agenda: agenda.ok ? agenda.data : null,
    error: failure,
  }
}

export default function Agenda() {
  const data = useLoaderData<typeof loader>()
  const [params, setParams] = useSearchParams()
  const loading = useNavigation().state === 'loading'

  // Status sinkronisasi berubah di server tanpa aksi pengguna; muat ulang berkala dan saat tab kembali aktif
  // supaya peringatan hilang sendiri setelah sinkronisasi berikutnya berhasil.
  const { revalidate, state: revalidating } = useRevalidator()
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && revalidating === 'idle') revalidate()
    }
    const timer = setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [revalidate, revalidating])
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

  const { agenda, unit, period } = data
  const currentPeriod = periods.periods.find((p) => p.key === period)
  const toOption = (p: (typeof months)[number]) => ({ value: p.key, label: p.label, note: p.provisional ? 'sementara' : undefined })
  const periodGroups: SelectGroup[] = [
    { label: 'Bulan', options: months.map(toOption) },
    { label: 'Term', options: terms.map(toOption) },
  ].filter((g) => g.options.length > 0)
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
        <Select label="Periode" value={period} groups={periodGroups} onChange={(v) => choose({ period: v })} />
        {currentPeriod?.provisional && (
          <Badge tone="warn" icon={<Clock className="h-3 w-3" aria-hidden />}>
            Periode sementara: nilai masih bisa berubah
          </Badge>
        )}
        {loading && <Spinner label="Memuat…" />}
        {agenda && (
          <div className="ml-auto">
            <SyncStatus agenda={agenda} />
          </div>
        )}
      </div>

      {data.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-danger">
          {data.error.message}
        </p>
      )}
      {agenda && (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <div className="flex flex-col gap-4">
            <PulseStrip pulses={agenda.pulses} />
            {agenda.empty && (
              <p className="rounded-lg border border-ok/30 bg-ok-bg p-4 text-ok">
                <strong>Tidak ada temuan.</strong> Pada periode ini tidak ada kelas yang memenuhi kriteria perlu ditinjau. Ini bukan berarti
                semua data lengkap: cek kartu denyut di atas untuk komponen yang tidak tersedia.
              </p>
            )}
            <FindingOverview columns={agenda.columns} initial={agenda.initial_per_column} runId={agenda.run.id} />
          </div>
        </div>
      )}
    </div>
  )
}
