import { useEffect, useState } from 'react'
import { getToken, setToken } from './api'

// Token bertahan di localStorage; respons 401 mengirim peristiwa auth:expired dari lib/api.
export function useToken() {
  const [token, set] = useState<string | null>(getToken())
  useEffect(() => {
    const onExpired = () => set(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])
  return {
    token,
    signIn: (t: string) => {
      setToken(t)
      set(t)
    },
    signOut: () => {
      setToken(null)
      set(null)
    },
  }
}
