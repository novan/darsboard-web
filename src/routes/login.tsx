import { data, Form, redirect, useActionData, useNavigation, useSearchParams, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router'
import { backendFetch, getToken, safeFrom, sessionCookie } from '../lib/backend.server'
import { Button } from '../components/ui'

export async function loader({ request }: LoaderFunctionArgs) {
  if (await getToken(request)) {
    throw redirect(safeFrom(new URL(request.url).searchParams.get('from')))
  }
  return null
}

// Login dilakukan di server: token dari backend ditaruh di cookie httpOnly dan tidak pernah sampai ke JavaScript browser.
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const username = String(form.get('username') ?? '')
  const password = String(form.get('password') ?? '')
  const res = await backendFetch(request, '/api/login', { method: 'POST', json: { username, password } })
  if (!res.ok) {
    let message = 'Tidak bisa masuk. Coba lagi.'
    try {
      message = ((await res.json()) as { message?: string }).message ?? message
    } catch {
      /* badan bukan JSON */
    }
    return data({ error: message }, { status: res.status === 429 ? 429 : res.status >= 500 ? 502 : 401 })
  }
  const { token } = (await res.json()) as { token: string }
  return redirect(safeFrom(String(form.get('from') ?? '')), { headers: { 'Set-Cookie': await sessionCookie.serialize(token) } })
}

export default function Login() {
  const actionData = useActionData<typeof action>()
  const busy = useNavigation().state !== 'idle'
  const [params] = useSearchParams()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gold-500">Darsyafii Islamic School</p>
      <h1 className="mb-4 text-2xl font-extrabold text-navy-900">Dashboard Evaluasi</h1>
      <Form method="post" className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
        <input type="hidden" name="from" value={params.get('from') ?? ''} />
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nama pengguna
          <input className="rounded-lg border border-line px-3 py-2 font-normal" name="username" autoComplete="username" required autoFocus />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Kata sandi
          <input className="rounded-lg border border-line px-3 py-2 font-normal" type="password" name="password" autoComplete="current-password" required />
        </label>
        {actionData?.error && (
          <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {actionData.error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Masuk…' : 'Masuk'}
        </Button>
      </Form>
    </div>
  )
}
