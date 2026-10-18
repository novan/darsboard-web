import type { LoaderFunctionArgs } from 'react-router'
import { backendFetch } from '../lib/backend.server'

// Proxy GET /api/* ke backend untuk panggilan dari browser. Token diambil dari cookie sesi, bukan dari header klien.
// Login ditangani halaman /login (cookie diset di server), jadi tidak boleh lewat proxy ini.
export async function loader({ request, params }: LoaderFunctionArgs) {
  const rest = params['*'] ?? ''
  if (rest === 'login' || rest.startsWith('login/')) {
    return Response.json({ error: 'not_found', message: 'Tidak ditemukan.' }, { status: 404 })
  }
  const res = await backendFetch(request, `/api/${rest}${new URL(request.url).search}`)
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json', 'Cache-Control': 'no-store' },
  })
}

// Backend hanya membaca data; metode selain GET ditolak.
export async function action() {
  return Response.json({ error: 'method_not_allowed', message: 'Metode tidak didukung.' }, { status: 405 })
}
