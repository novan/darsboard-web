import { Form, Outlet, redirect, type LoaderFunctionArgs } from 'react-router'
import { LogOut } from 'lucide-react'
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

export default function Shell() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <header className="flex items-center justify-between gap-3 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-500">Darsyafii Islamic School</p>
          <h1 className="text-xl font-extrabold text-navy-900">Dashboard Evaluasi</h1>
        </div>
        <Form method="post" action="/logout">
          <Button variant="ghost" type="submit">
            <LogOut className="h-4 w-4" aria-hidden /> Keluar
          </Button>
        </Form>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
