import { Form, NavLink, Outlet, redirect, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { ChartLine, LayoutList, LogOut, Users } from 'lucide-react'
import { getToken } from '../lib/backend.server'
import { Button } from '../components/ui'

// Tata letak untuk halaman yang butuh sesi. Keabsahan token diperiksa backend pada setiap panggilan data.
export async function loader({ request }: LoaderFunctionArgs) {
  if (!(await getToken(request))) {
    const u = new URL(request.url)
    throw redirect(`/login?from=${encodeURIComponent(u.pathname + u.search)}`)
  }
  return null
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-700 ${
    isActive ? 'border-navy-900 text-navy-900' : 'border-transparent text-muted hover:text-navy-700'
  }`

export default function Shell() {
  // Pilihan unit dan periode ikut terbawa saat berpindah antara Agenda dan Murid.
  const [params] = useSearchParams()
  const keep = new URLSearchParams()
  for (const k of ['unit', 'period']) {
    const v = params.get(k)
    if (v) keep.set(k, v)
  }
  const qs = keep.size > 0 ? `?${keep}` : ''
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <header className="flex items-center justify-between gap-3 py-4 print:py-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-500">Darsyafii Islamic School</p>
          <h1 className="text-xl font-extrabold text-navy-900">Dashboard Evaluasi</h1>
        </div>
        <Form method="post" action="/logout" className="print:hidden">
          <Button variant="ghost" type="submit">
            <LogOut className="h-4 w-4" aria-hidden /> Keluar
          </Button>
        </Form>
      </header>
      <nav aria-label="Menu utama" className="mb-4 flex gap-1 overflow-x-auto border-b border-line print:hidden">
        <NavLink to={`/${qs}`} end className={navClass}>
          <LayoutList className="h-4 w-4" aria-hidden /> Agenda temuan
        </NavLink>
        <NavLink to={`/murid${qs}`} className={navClass}>
          <Users className="h-4 w-4" aria-hidden /> Daftar murid
        </NavLink>
        <NavLink to={`/laporan${qs}`} className={navClass}>
          <ChartLine className="h-4 w-4" aria-hidden /> Laporan
        </NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
