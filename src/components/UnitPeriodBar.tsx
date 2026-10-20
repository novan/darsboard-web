import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Clock } from 'lucide-react'
import type { PeriodsResponse, Unit } from '../lib/api'
import { Select, type SelectGroup } from './Select'
import { UnitToggle } from './UnitToggle'
import { Badge, Spinner } from './ui'

// Bar pilihan unit (TK/SD) dan periode yang dipakai bersama halaman Agenda dan Murid. Pilihan disimpan di query string.
export function UnitPeriodBar({
  periods,
  unit,
  period,
  loading,
  children,
}: {
  periods: PeriodsResponse
  unit: Unit
  period: string
  loading: boolean
  children?: ReactNode
}) {
  const [params, setParams] = useSearchParams()
  const choose = (next: { unit?: string; period?: string }) => {
    const p = new URLSearchParams(params)
    p.set('unit', unit)
    p.set('period', period)
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p)
  }
  const toOption = (p: PeriodsResponse['periods'][number]) => ({ value: p.key, label: p.label, note: p.provisional ? 'sementara' : undefined })
  const groups: SelectGroup[] = [
    { label: 'Bulan', options: periods.periods.filter((p) => p.kind === 'month').map(toOption) },
    { label: 'Term', options: periods.periods.filter((p) => p.kind === 'term').map(toOption) },
  ].filter((g) => g.options.length > 0)
  const current = periods.periods.find((p) => p.key === period)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <UnitToggle unit={unit} onChange={(u) => choose({ unit: u })} />
      <Select label="Periode" value={period} groups={groups} onChange={(v) => choose({ period: v })} />
      {current?.provisional && (
        <Badge tone="warn" icon={<Clock className="h-3 w-3" aria-hidden />}>
          Periode sementara: nilai masih bisa berubah
        </Badge>
      )}
      {loading && <Spinner label="Memuat…" />}
      {children && <div className="ml-auto">{children}</div>}
    </div>
  )
}
