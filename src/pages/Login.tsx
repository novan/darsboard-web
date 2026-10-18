import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError, post } from '../lib/api'
import { Button } from '../components/ui'

export default function Login({ onSignIn }: { onSignIn: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await post<{ token: string }>('/api/login', { username, password })
      onSignIn(res.token)
      nav((loc.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tidak bisa menghubungi server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gold-500">Darsyafii Islamic School</p>
      <h1 className="mb-4 text-2xl font-extrabold text-navy-900">Dashboard Evaluasi</h1>
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nama pengguna
          <input
            className="rounded-lg border border-line px-3 py-2 font-normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Kata sandi
          <input
            className="rounded-lg border border-line px-3 py-2 font-normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Masuk…' : 'Masuk'}
        </Button>
      </form>
    </div>
  )
}
