import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-muted">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white p-4 shadow-sm ${className}`}>{children}</section>
}

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info'
const tones: Record<Tone, string> = {
  neutral: 'bg-paper text-muted border-line',
  ok: 'bg-ok-bg text-ok border-ok/30',
  warn: 'bg-warn-bg text-warn border-warn/30',
  danger: 'bg-danger-bg text-danger border-danger/30',
  info: 'bg-navy-50 text-navy-700 border-navy-700/20',
}

// Lencana selalu memuat teks; warna hanya penegas.
export function Badge({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  ...rest
}: { variant?: 'primary' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:opacity-60'
  const style =
    variant === 'primary' ? 'bg-navy-900 text-white hover:bg-navy-700' : 'text-navy-700 hover:bg-navy-50 border border-line'
  return (
    <button className={`${base} ${style}`} {...rest}>
      {children}
    </button>
  )
}
