import { useMemo } from 'react'
import { Link, useLoaderData, useNavigation, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { Printer } from 'lucide-react'
import type { Component, ReportMonth, ReportResponse, Unit } from '../lib/api'
import { apiGet, periodContext, toFailure } from '../lib/backend.server'
import { useAutoRefresh } from '../lib/useAutoRefresh'
import { LineChart } from '../components/LineChart'
import { StackedBars } from '../components/StackedBars'
import { UnitToggle } from '../components/UnitToggle'
import { Badge, Button, Card, Spinner } from '../components/ui'
import { columnMeta, componentHint, directionLabel, fmtDateTime, pct, pointsDiff, pulseTitle } from '../lib/labels'

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = await periodContext(request)
  if (!ctx.ok) return { report: null, unit: null, error: ctx.failure }
  const report = await apiGet<ReportResponse>(request, `/api/report?unit=${encodeURIComponent(ctx.unit)}`)
  return { report: report.ok ? report.data : null, unit: ctx.unit, error: report.ok ? null : toFailure(report.error) }
}

const PULSES = ['commitment', 'process', 'outcome'] as const
const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' })
function shortMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 1)))
}

type Series = { key: string; label: string; pulse: (typeof PULSES)[number]; comps: (Component | undefined)[] }

// Satu deret per komponen, berurutan mengikuti bulan; bulan tanpa komponen diisi undefined.
function seriesOf(months: ReportMonth[]): Series[] {
  const out: Series[] = []
  for (const pulse of PULSES) {
    const order: string[] = []
    const labels = new Map<string, string>()
    for (const m of months) {
      for (const c of m.pulses[pulse] ?? []) {
        if (!labels.has(c.key)) {
          labels.set(c.key, c.label)
          order.push(c.key)
        }
      }
    }
    for (const key of order) {
      out.push({ key, label: labels.get(key)!, pulse, comps: months.map((m) => (m.pulses[pulse] ?? []).find((c) => c.key === key)) })
    }
  }
  return out
}

function Change({ c, prevLabel }: { c?: Component; prevLabel: string }) {
  if (!c || !c.avail) return <span className="text-muted">Tidak tersedia</span>
  if (c.direction === 'tidak_tersedia' || c.prev_value == null) return <span className="text-muted">Belum ada pembanding</span>
  const tone = c.direction === 'membaik' ? 'ok' : c.direction === 'memburuk' ? 'danger' : 'neutral'
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone={tone}>{directionLabel[c.direction]}</Badge>
      <span className="text-xs text-muted">
        {pointsDiff(c.value, c.prev_value)} dibanding {prevLabel} ({pct(c.prev_value)})
      </span>
    </span>
  )
}

export default function Laporan() {
  const data = useLoaderData<typeof loader>()
  const loading = useNavigation().state === 'loading'
  const [, setParams] = useSearchParams()
  useAutoRefresh()
  const report = data.report
  const months = useMemo(() => report?.months ?? [], [report])
  const series = useMemo(() => seriesOf(months), [months])

  if (!report) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-white p-4">
        {data.error?.code === 'no_run'
          ? 'Belum ada hasil perhitungan. Jalankan sinkronisasi data terlebih dahulu, lalu muat ulang halaman ini.'
          : (data.error?.message ?? 'Laporan tidak bisa dimuat.')}
      </p>
    )
  }

  const unit = report.unit as Unit
  const last = months.length - 1
  const prevLabel = last > 0 ? shortMonth(months[last - 1].key) : ''
  const labelOf = (key: string) => months.find((m) => m.key === key)?.label ?? key

  return (
    <div className={`flex flex-col gap-5 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <UnitToggle unit={unit} onChange={(u) => setParams({ unit: u })} />
        {loading && <Spinner label="Memuat…" />}
        <div className="ml-auto">
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden /> Cetak laporan
          </Button>
        </div>
      </div>

      <header>
        <h2 className="text-lg font-extrabold text-navy-900">Laporan perkembangan {unit} per bulan</h2>
        <p className="text-sm text-muted">
          {months.length > 0 ? `${months[0].label} sampai ${months[last].label}` : 'Belum ada bulan'} · perhitungan #{report.run.id}, {fmtDateTime(report.run.computed_at)}. Bulan bertanda
          "sementara" masih bisa berubah ketika data diisi menyusul.
        </p>
      </header>

      {PULSES.map((pulse) => {
        const list = series.filter((s) => s.pulse === pulse)
        if (list.length === 0) return null
        return (
          <section key={pulse} aria-labelledby={`lap-${pulse}`} className="flex flex-col gap-3">
            <h3 id={`lap-${pulse}`} className="text-base font-extrabold uppercase tracking-wide text-navy-900">
              {pulseTitle[pulse]}
            </h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((s) => {
                const cur = s.comps[last]
                return (
                  <Card key={s.key} className="break-inside-avoid">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-bold">{s.label}</h4>
                      <span className="text-xl font-extrabold tabular-nums">{cur?.avail ? pct(cur.value) : '–'}</span>
                    </div>
                    <p className="mb-2 text-xs">
                      <Change c={cur} prevLabel={prevLabel} />
                    </p>
                    {componentHint[s.key] && <p className="mb-1 text-xs text-muted">{componentHint[s.key]}</p>}
                    <LineChart
                      title={`${s.label} per bulan`}
                      points={months.map((m, i) => ({ label: shortMonth(m.key), value: s.comps[i]?.avail ? (s.comps[i]!.value ?? null) : null }))}
                    />
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}

      <section aria-labelledby="lap-temuan" className="flex flex-col gap-3">
        <h3 id="lap-temuan" className="text-base font-extrabold uppercase tracking-wide text-navy-900">
          Temuan per bulan
        </h3>
        <Card className="mx-auto w-full max-w-lg">
          <StackedBars
            title="Jumlah temuan per bulan menurut jenis"
            months={months.map((m) => ({ label: shortMonth(m.key), counts: m.findings }))}
          />
        </Card>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Jumlah temuan per bulan menurut jenis</caption>
            <thead>
              <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2">Bulan</th>
                {(['program', 'guru', 'murid', 'tinjau'] as const).map((k) => (
                  <th key={k} className="px-2 py-2 text-right">
                    {columnMeta[k].title}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-4 py-2 print:hidden">
                  <span className="sr-only">Lihat</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-2 text-left font-semibold">
                    {m.label}
                    {m.provisional && <span className="ml-2 text-xs font-normal text-warn">(sementara)</span>}
                  </th>
                  {(['program', 'guru', 'murid', 'tinjau'] as const).map((k) => (
                    <td key={k} className="px-2 py-2 text-right tabular-nums">
                      {m.findings[k]}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-bold tabular-nums">{m.findings.total}</td>
                  <td className="px-4 py-2 text-right print:hidden">
                    <Link to={`/?unit=${unit}&period=${m.key}`} className="font-bold text-navy-700 hover:underline">
                      Lihat temuan
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="lap-tabel" className="flex flex-col gap-3">
        <h3 id="lap-tabel" className="text-base font-extrabold uppercase tracking-wide text-navy-900">
          Tabel angka
        </h3>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Nilai komponen komitmen, proses, dan hasil per bulan</caption>
            <thead>
              <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2">Komponen</th>
                {months.map((m) => (
                  <th key={m.key} className="px-2 py-2 text-right">
                    {shortMonth(m.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={`${s.pulse}-${s.key}`} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-2 text-left font-semibold">
                    <span className="mr-2 text-xs font-normal text-muted">{pulseTitle[s.pulse]}</span>
                    {s.label}
                  </th>
                  {s.comps.map((c, i) => (
                    <td key={months[i].key} className="px-2 py-2 text-right tabular-nums">
                      {c?.avail ? pct(c.value) : <span className="text-muted">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          Tanda – berarti data bulan itu belum cukup atau tidak berlaku. Perbandingan terakhir memakai {prevLabel ? labelOf(months[last - 1].key) : 'bulan sebelumnya'} sebagai acuan.
        </p>
      </section>
    </div>
  )
}
