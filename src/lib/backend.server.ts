import { createCookie, redirect } from 'react-router'
import { ApiError, type PeriodsResponse, type Unit } from './api'

// Modul khusus server: tidak ikut ke bundel browser. Token JWT backend hanya hidup di cookie httpOnly.

const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const TIMEOUT_MS = 30_000
const SESSION_SECONDS = 12 * 60 * 60 // sama dengan umur token backend

export const sessionCookie = createCookie('session', {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_SECONDS,
  // Secure di produksi (di belakang HTTPS Caddy). Atur COOKIE_SECURE=false untuk uji lewat http biasa.
  secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
})

export async function getToken(request: Request): Promise<string | null> {
  const v = await sessionCookie.parse(request.headers.get('Cookie'))
  return typeof v === 'string' && v !== '' ? v : null
}

export async function clearSessionHeaders(): Promise<HeadersInit> {
  return { 'Set-Cookie': await sessionCookie.serialize('', { maxAge: 0 }) }
}

type Init = { method?: string; json?: unknown }

// Meneruskan permintaan ke backend. IP klien asli diteruskan lewat X-Forwarded-For (dari Caddy) untuk pembatas login.
export async function backendFetch(request: Request, path: string, init: Init = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = await getToken(request)
  if (token) headers.Authorization = `Bearer ${token}`
  const xff = request.headers.get('X-Forwarded-For')
  if (xff) headers['X-Forwarded-For'] = xff
  let body: string | undefined
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(init.json)
  }
  try {
    return await fetch(BACKEND_URL + path, {
      method: init.method ?? 'GET',
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return Response.json({ error: 'backend_unreachable', message: 'Backend tidak bisa dihubungi.' }, { status: 502 })
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

// GET JSON untuk loader. 401 berarti sesi habis: cookie dihapus dan pengguna diarahkan ke halaman masuk.
export async function apiGet<T>(request: Request, path: string): Promise<ApiResult<T>> {
  const res = await backendFetch(request, path)
  if (res.status === 401) {
    const from = new URL(request.url)
    throw redirect(`/login?from=${encodeURIComponent(from.pathname + from.search)}`, { headers: await clearSessionHeaders() })
  }
  if (!res.ok) {
    let code = 'error'
    let message = 'Terjadi kesalahan. Coba lagi.'
    try {
      const body = (await res.json()) as { error?: string; message?: string }
      code = body.error ?? code
      message = body.message ?? message
    } catch {
      /* badan bukan JSON */
    }
    return { ok: false, error: new ApiError(res.status, code, message) }
  }
  return { ok: true, data: (await res.json()) as T }
}

// Hanya jalur relatif satu-asal yang boleh jadi tujuan setelah masuk (cegah open redirect).
export function safeFrom(v: string | null | undefined): string {
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/'
}

export type Failure = { status: number; code: string; message: string }

export const toFailure = (e: ApiError): Failure => ({ status: e.status, code: e.code, message: e.message })

// Konteks bersama halaman agenda dan murid: daftar periode serta unit dan periode terpilih (default dari backend).
export async function periodContext(request: Request) {
  const params = new URL(request.url).searchParams
  const periods = await apiGet<PeriodsResponse>(request, '/api/periods')
  if (!periods.ok) return { ok: false as const, failure: toFailure(periods.error) }
  return {
    ok: true as const,
    periods: periods.data,
    unit: (params.get('unit') ?? periods.data.default.unit) as Unit,
    period: params.get('period') ?? periods.data.default.period,
  }
}
