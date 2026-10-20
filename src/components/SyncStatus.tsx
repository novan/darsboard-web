import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BellRing, Info } from 'lucide-react'
import type { AgendaResponse, StatusResponse } from '../lib/api'
import { fmtDate, fmtDateTime, sourceLabel } from '../lib/labels'

const runStatus: Record<string, string> = { succeeded: 'Berhasil', partial: 'Sebagian berhasil', failed: 'Gagal', running: 'Sedang berjalan' }

// Tombol ikon dengan panel kecil. Terbuka saat disorot mouse, difokus keyboard, atau diketuk (layar sentuh).
function IconPopover({ label, icon, badge, tone, children }: { label: string; icon: ReactNode; badge?: number; tone: 'neutral' | 'warn'; children: ReactNode }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const colors = tone === 'warn' ? 'border-warn/40 bg-warn-bg text-warn hover:border-warn' : 'border-line bg-white text-navy-700 hover:border-navy-700'
  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 ${colors}`}
      >
        {icon}
        {badge ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">{badge}</span>
        ) : null}
      </button>
      {open && (
        <div
          id={id}
          role="region"
          aria-label={label}
          className="absolute right-0 top-full z-30 w-80 max-w-[calc(100vw-2rem)] pt-2"
        >
          <div className="rounded-xl border border-line bg-white p-3 text-sm shadow-lg">{children}</div>
        </div>
      )}
    </div>
  )
}

// Pusat status sinkronisasi: ikon peringatan (hanya bila ada) dan ikon info sinkronisasi terakhir.
export function SyncStatus({ agenda, status }: { agenda: AgendaResponse; status: StatusResponse | null }) {
  const warnings: { key: string; title: string; text: string }[] = []
  for (const s of agenda.sources) {
    const name = sourceLabel[s.source] ?? s.source
    if (s.stale) {
      warnings.push({
        key: `stale-${s.source}`,
        title: `Data ${name} belum diperbarui`,
        text: `${s.as_of ? `Terakhir ditarik ${fmtDateTime(s.as_of)}.` : 'Belum pernah berhasil ditarik.'} Temuan memakai data lama.`,
      })
    }
    if (s.last_status === 'failed') {
      warnings.push({ key: `failed-${s.source}`, title: `Sinkronisasi ${name} terakhir gagal`, text: 'Data yang tampil berasal dari sinkronisasi sebelumnya yang berhasil.' })
    }
  }
  for (const s of status?.sources ?? []) {
    if (s.expiry_warning) {
      warnings.push({
        key: `exp-${s.source}`,
        title: `Kunci API ${sourceLabel[s.source] ?? s.source} segera kedaluwarsa`,
        text: `Tersisa ${s.expires_in_days} hari. Minta kunci baru sebelum sinkronisasi terhenti.`,
      })
    }
  }
  const stat = new Map((status?.sources ?? []).map((s) => [s.source, s]))

  return (
    <div className="flex items-center gap-2">
      {warnings.length > 0 && (
        <IconPopover label={`Peringatan sinkronisasi: ${warnings.length}`} icon={<BellRing className="h-5 w-5" aria-hidden />} badge={warnings.length} tone="warn">
          <p className="mb-2 font-extrabold text-navy-900">Peringatan sinkronisasi</p>
          <ul className="flex flex-col gap-2">
            {warnings.map((w) => (
              <li key={w.key} className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
                <p className="font-bold">{w.title}</p>
                <p>{w.text}</p>
              </li>
            ))}
          </ul>
        </IconPopover>
      )}
      <IconPopover label="Info sinkronisasi terakhir" icon={<Info className="h-5 w-5" aria-hidden />} tone="neutral">
        <p className="mb-2 font-extrabold text-navy-900">Sinkronisasi terakhir</p>
        <ul className="flex flex-col gap-2">
          {agenda.sources.map((s) => {
            const st = stat.get(s.source)
            return (
              <li key={s.source} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
                <p className="font-bold">{sourceLabel[s.source] ?? s.source}</p>
                <p className="text-muted">Data per {s.as_of ? fmtDateTime(s.as_of) : 'belum ada'}</p>
                {(s.last_status ?? st?.last_status) && <p className="text-muted">Status: {runStatus[(s.last_status ?? st?.last_status)!] ?? s.last_status}</p>}
                {st?.expires_at && <p className="text-muted">Kunci API berlaku sampai {fmtDate(st.expires_at)}</p>}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          Perhitungan #{agenda.run.id} · {fmtDateTime(agenda.run.computed_at)} · aturan {agenda.run.rules_version}
        </p>
      </IconPopover>
    </div>
  )
}
