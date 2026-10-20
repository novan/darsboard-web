import { useLoaderData, useNavigation, type LoaderFunctionArgs } from 'react-router'
import type { AgendaResponse } from '../lib/api'
import { apiGet, periodContext, toFailure } from '../lib/backend.server'
import { useAutoRefresh } from '../lib/useAutoRefresh'
import { FindingOverview } from '../components/FindingOverview'
import { PulseStrip } from '../components/PulseStrip'
import { SyncStatus } from '../components/SyncStatus'
import { UnitPeriodBar } from '../components/UnitPeriodBar'

// Data agenda dimuat di server; navigasi unit/periode hanya mengubah query string lalu loader jalan lagi.
export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = await periodContext(request)
  if (!ctx.ok) return { periods: null, error: ctx.failure }
  const agenda = await apiGet<AgendaResponse>(request, `/api/agenda?unit=${encodeURIComponent(ctx.unit)}&period=${encodeURIComponent(ctx.period)}`)
  return {
    periods: ctx.periods,
    unit: ctx.unit,
    period: ctx.period,
    agenda: agenda.ok ? agenda.data : null,
    error: agenda.ok ? null : toFailure(agenda.error),
  }
}

export default function Agenda() {
  const data = useLoaderData<typeof loader>()
  const loading = useNavigation().state === 'loading'
  useAutoRefresh()

  if (!data.periods) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-white p-4">
        {data.error.code === 'no_run'
          ? 'Belum ada hasil perhitungan. Jalankan sinkronisasi data terlebih dahulu, lalu muat ulang halaman ini.'
          : data.error.message}
      </p>
    )
  }

  const { agenda } = data
  return (
    <div className="flex flex-col gap-4">
      <UnitPeriodBar periods={data.periods} unit={data.unit} period={data.period} loading={loading}>
        {agenda && <SyncStatus agenda={agenda} />}
      </UnitPeriodBar>

      {data.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-danger">
          {data.error.message}
        </p>
      )}
      {agenda && (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <div className="flex flex-col gap-4">
            <PulseStrip pulses={agenda.pulses} periodLabel={(key) => data.periods?.periods.find((p) => p.key === key)?.label ?? key} />
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
