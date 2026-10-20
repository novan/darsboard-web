import { useEffect } from 'react'
import { useRevalidator } from 'react-router'

const REFRESH_MS = 60_000

// Data server (mis. status sinkronisasi) berubah tanpa aksi pengguna: muat ulang tiap menit dan saat tab kembali aktif.
export function useAutoRefresh() {
  const { revalidate, state } = useRevalidator()
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && state === 'idle') revalidate()
    }
    const timer = setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [revalidate, state])
}
