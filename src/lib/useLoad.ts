import { useEffect, useState } from 'react'
import { ApiError, get } from './api'

export type Load<T> = { state: 'loading' } | { state: 'error'; error: ApiError | Error } | { state: 'ok'; data: T }

// Memuat GET path (null = belum siap). Status "loading" diturunkan dari path yang berubah, tanpa setState sinkron di efek.
export function useLoad<T>(path: string | null): Load<T> {
  const [done, setDone] = useState<{ path: string; result: Load<T> } | null>(null)
  useEffect(() => {
    if (!path) return
    let alive = true
    get<T>(path)
      .then((data) => alive && setDone({ path, result: { state: 'ok', data } }))
      .catch((error) => alive && setDone({ path, result: { state: 'error', error } }))
    return () => {
      alive = false
    }
  }, [path])
  return done && done.path === path ? done.result : { state: 'loading' }
}
