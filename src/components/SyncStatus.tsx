import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BellRing, Info } from 'lucide-react'
import type { AgendaResponse, SourceState } from '../lib/api'
import { fmtDate, fmtDateTime, sourceLabel } from '../lib/labels'

const runStatus: Record<string, string> = { succeeded: 'Berhasil', partial: 'Sebagian berhasil', failed: 'Gagal', running: 'Sedang berjalan' }

// Sebab singkat dari backend dibuat lebih mudah dipahami untuk sebab yang umum.
function cause(name: string, err?: string): string {
  if (!err) return ''
  if (err.includes('ip_not_allowed')) return `Penyebab: alamat IP server belum didaftarkan di allowlist ${name}.`
  if (err.includes('daily_quota_exceeded')) return 'Penyebab: kuota harian API sudah habis; coba lagi besok.'
  return `Penyebab: ${err}`
}

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

type Warning = { key: string; title: string; text: string }

// Peringatan dihitung dari keadaan sinkronisasi saat ini, jadi hilang sendiri setelah sinkronisasi berikutnya berhasil.
function warningsOf(sources: SourceState[]): Warning[] {
  const out: Warning[] = []
  for (const s of sources) {
    const name = sourceLabel[s.source] ?? s.source
    const because = cause(name, s.last_error)
    const lastData = s.as_of ? `Data terakhir berhasil ditarik ${fmtDateTime(s.as_of)}.` : 'Belum pernah berhasil ditarik.'
    if (s.stale) {
      out.push({
        key: `stale-${s.source}`,
        title: `Data ${name} belum diperbarui`,
        text: [lastData, s.last_status === 'failed' ? `Sinkronisasi terakhir gagal (${fmtDateTime(s.last_attempt)}).` : '', because, 'Temuan memakai data lama.']
          .filter(Boolean)
          .join(' '),
      })
    } else if (s.last_status === 'failed') {
      out.push({
        key: `failed-${s.source}`,
        title: `Sinkronisasi ${name} terakhir gagal`,
        text: [`Percobaan ${fmtDateTime(s.last_attempt)} gagal; data yang tampil dari sinkronisasi berhasil sebelumnya.`, because].filter(Boolean).join(' '),
      })
    } else if (s.last_status === 'partial') {
      out.push({
        key: `partial-${s.source}`,
        title: `Sinkronisasi ${name} hanya sebagian berhasil`,
        text: ['Sebagian jenis data gagal ditarik, jadi sebagian temuan memakai data lama.', because].filter(Boolean).join(' '),
      })
    }
    if (s.expiry_warning) {
      out.push({
        key: `exp-${s.source}`,
        title: `Kunci API ${name} segera kedaluwarsa`,
        text: `Tersisa ${s.expires_in_days} hari. Minta kunci baru sebelum sinkronisasi terhenti.`,
      })
    }
  }
  return out
}

// Pusat status sinkronisasi: ikon peringatan (hanya bila ada) dan ikon info sinkronisasi terakhir.
export function SyncStatus({ agenda }: { agenda: AgendaResponse }) {
  const warnings = warningsOf(agenda.sources)
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
          {agenda.sources.map((s) => (
            <li key={s.source} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <p className="font-bold">{sourceLabel[s.source] ?? s.source}</p>
              <p className="text-muted">Data berhasil ditarik: {s.as_of ? fmtDateTime(s.as_of) : 'belum pernah'}</p>
              {s.last_status && (
                <p className="text-muted">
                  Percobaan terakhir: {runStatus[s.last_status] ?? s.last_status}
                  {s.last_attempt ? ` · ${fmtDateTime(s.last_attempt)}` : ''}
                </p>
              )}
              {s.last_status === 'failed' && s.last_error && <p className="text-muted">{cause(sourceLabel[s.source] ?? s.source, s.last_error)}</p>}
              {s.expires_at && <p className="text-muted">Kunci API berlaku sampai {fmtDate(s.expires_at)}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          Perhitungan #{agenda.run.id} · {fmtDateTime(agenda.run.computed_at)} · aturan {agenda.run.rules_version}
        </p>
      </IconPopover>
    </div>
  )
}
