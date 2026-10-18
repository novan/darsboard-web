import type { ReactNode } from 'react'
import { AlertTriangle, Clock, Info, KeyRound } from 'lucide-react'
import type { AgendaResponse, StatusResponse } from '../lib/api'
import { fmtDateTime, sourceLabel } from '../lib/labels'

function Banner({ tone, icon, children }: { tone: 'warn' | 'info'; icon: ReactNode; children: ReactNode }) {
  const style = tone === 'warn' ? 'bg-warn-bg text-warn border-warn/30' : 'bg-navy-50 text-navy-700 border-navy-700/20'
  return (
    <div role="status" className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${style}`}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon}
      </span>
      <div>{children}</div>
    </div>
  )
}

export function StateBanners({ agenda, status }: { agenda: AgendaResponse; status: StatusResponse | null }) {
  const out: ReactNode[] = []
  if (agenda.period.provisional) {
    out.push(
      <Banner key="prov" tone="warn" icon={<Clock className="h-4 w-4" />}>
        <strong>Sementara.</strong> Periode ini belum lama berakhir atau masih berjalan, jadi nilai dan temuannya masih bisa berubah ketika data
        diisi menyusul.
      </Banner>,
    )
  }
  for (const s of agenda.sources) {
    if (s.stale) {
      out.push(
        <Banner key={`stale-${s.source}`} tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
          <strong>Data {sourceLabel[s.source] ?? s.source} belum diperbarui.</strong>{' '}
          {s.as_of ? `Terakhir ditarik ${fmtDateTime(s.as_of)}.` : 'Belum pernah berhasil ditarik.'} Temuan memakai data lama.
        </Banner>,
      )
    }
  }
  for (const s of status?.sources ?? []) {
    if (s.expiry_warning) {
      out.push(
        <Banner key={`exp-${s.source}`} tone="warn" icon={<KeyRound className="h-4 w-4" />}>
          <strong>Kunci API {sourceLabel[s.source] ?? s.source} segera kedaluwarsa</strong> ({s.expires_in_days} hari lagi). Minta kunci baru
          sebelum sinkronisasi terhenti.
        </Banner>,
      )
    }
  }
  const asOf = agenda.sources
    .filter((s) => s.as_of)
    .map((s) => `${sourceLabel[s.source] ?? s.source}: ${fmtDateTime(s.as_of)}`)
    .join(' · ')
  if (asOf) {
    out.push(
      <Banner key="asof" tone="info" icon={<Info className="h-4 w-4" />}>
        Data per {asOf}.
      </Banner>,
    )
  }
  return <div className="flex flex-col gap-2">{out}</div>
}
