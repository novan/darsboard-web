import { useMemo, useState } from 'react'
import { useLoaderData, useNavigation, type LoaderFunctionArgs } from 'react-router'
import { History, Search } from 'lucide-react'
import type { StudentListResponse, StudentStatus } from '../lib/api'
import { apiGet, periodContext, toFailure } from '../lib/backend.server'
import { useAutoRefresh } from '../lib/useAutoRefresh'
import { Select } from '../components/Select'
import { StudentHistory } from '../components/StudentHistory'
import { UnitPeriodBar } from '../components/UnitPeriodBar'
import { Badge } from '../components/ui'

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = await periodContext(request)
  if (!ctx.ok) return { periods: null, error: ctx.failure }
  const list = await apiGet<StudentListResponse>(request, `/api/students?unit=${encodeURIComponent(ctx.unit)}&period=${encodeURIComponent(ctx.period)}`)
  return {
    periods: ctx.periods,
    unit: ctx.unit,
    period: ctx.period,
    list: list.ok ? list.data : null,
    error: list.ok ? null : toFailure(list.error),
  }
}

const STATUS_LABEL: Record<StudentStatus, string> = {
  behind: 'Tertinggal',
  watch: 'Perlu dipantau',
  ok: 'Di level acuan',
  insufficient: 'Belum cukup data',
}
const STATUS_TONE = { behind: 'danger', watch: 'warn', ok: 'ok', insufficient: 'neutral' } as const
type Filter = 'all' | StudentStatus
const norm = (s: string) => s.toLocaleLowerCase('id').normalize('NFKD').replace(/\p{M}/gu, '')

export default function Murid() {
  const data = useLoaderData<typeof loader>()
  const loading = useNavigation().state === 'loading'
  useAutoRefresh()
  const [filter, setFilter] = useState<Filter>('all')
  const [className, setClassName] = useState('')
  const [query, setQuery] = useState('')
  const [openStudent, setOpenStudent] = useState<number | null>(null)

  const list = data.periods ? data.list : null
  const shown = useMemo(() => {
    if (!list) return []
    const q = norm(query.trim())
    return list.students.filter(
      (s) => (filter === 'all' || s.status === filter) && (!className || s.class === className) && (!q || norm(s.name).includes(q)),
    )
  }, [list, filter, className, query])

  if (!data.periods) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-white p-4">
        {data.error.code === 'no_run'
          ? 'Belum ada hasil perhitungan. Jalankan sinkronisasi data terlebih dahulu, lalu muat ulang halaman ini.'
          : data.error.message}
      </p>
    )
  }

  const cards: { key: Filter; label: string; n: number }[] = list
    ? [
        { key: 'all', label: 'Semua murid', n: list.counts.total },
        { key: 'behind', label: 'Tertinggal', n: list.counts.behind },
        { key: 'watch', label: 'Perlu dipantau', n: list.counts.watch },
        { key: 'ok', label: 'Di level acuan', n: list.counts.ok },
        { key: 'insufficient', label: 'Belum cukup data', n: list.counts.insufficient },
      ]
    : []
  const classOptions = list ? [{ value: '', label: 'Semua kelas' }, ...list.classes.map((c) => ({ value: c, label: c }))] : []

  return (
    <div className="flex flex-col gap-4">
      <UnitPeriodBar periods={data.periods} unit={data.unit} period={data.period} loading={loading} />

      {data.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-danger">
          {data.error.message}
        </p>
      )}

      {list && (
        <div className={`flex flex-col gap-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
          <section aria-labelledby="ringkasan-murid">
            <h2 id="ringkasan-murid" className="mb-2 text-base font-extrabold text-navy-900">
              Murid {list.unit} <span className="font-semibold text-muted">· {list.counts.total} murid pada {list.period.label}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {cards.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={filter === c.key}
                  onClick={() => setFilter(c.key)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 ${
                    filter === c.key ? 'border-navy-700 bg-navy-50' : 'border-line bg-white hover:border-navy-700'
                  }`}
                >
                  <span className="text-sm font-bold text-navy-900">{c.label}</span>
                  <span className="text-2xl font-extrabold tabular-nums">{c.n}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              <strong>Tertinggal</strong>: di bawah level acuan pada sedikitnya 2 mapel atau area. <strong>Perlu dipantau</strong>: di bawah level
              acuan pada 1 mapel atau area. <strong>Belum cukup data</strong>: murid belum punya cukup penilaian pada periode ini, atau kelasnya belum
              punya cukup data untuk dibandingkan.
            </p>
          </section>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs font-semibold text-muted">
              Cari murid
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik nama murid"
                  className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm font-normal text-ink"
                />
              </span>
            </label>
            <Select label="Kelas" value={className} groups={[{ label: 'Kelas', options: classOptions }]} onChange={setClassName} />
          </div>

          <section className="overflow-hidden rounded-xl border border-line bg-white" aria-label="Daftar murid">
            <p className="border-b border-line bg-paper px-4 py-2 text-sm text-muted" role="status">
              Menampilkan {shown.length} dari {list.counts.total} murid
            </p>
            {shown.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Tidak ada murid yang cocok dengan pilihan ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-2">Murid</th>
                      <th className="px-2 py-2">Kelas</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Tertinggal di</th>
                      <th className="px-4 py-2">
                        <span className="sr-only">Riwayat</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <th scope="row" className="px-4 py-2 text-left font-semibold">
                          {s.name}
                        </th>
                        <td className="whitespace-nowrap px-2 py-2">{s.class}</td>
                        <td className="px-2 py-2">
                          <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                        </td>
                        <td className="px-2 py-2 text-muted">
                          {s.behind > 0 ? `${s.behind_scopes.join(', ')} (${s.behind} dari ${s.assessed})` : s.status === 'ok' ? `${s.assessed} mapel/area dinilai` : '–'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => setOpenStudent(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-navy-700 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-navy-700"
                          >
                            <History className="h-3 w-3" aria-hidden /> Riwayat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {openStudent != null && <StudentHistory key={openStudent} id={openStudent} onClose={() => setOpenStudent(null)} />}
    </div>
  )
}
