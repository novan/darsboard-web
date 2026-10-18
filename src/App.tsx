import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useToken } from './lib/auth'
import { Button } from './components/ui'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import Finding from './pages/Finding'

function Shell({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <header className="flex items-center justify-between gap-3 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-500">Darsyafii Islamic School</p>
          <h1 className="text-xl font-extrabold text-navy-900">Dashboard Evaluasi</h1>
        </div>
        <Button variant="ghost" onClick={onSignOut}>
          <LogOut className="h-4 w-4" aria-hidden /> Keluar
        </Button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  const { token, signIn, signOut } = useToken()
  const loc = useLocation()
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSignIn={signIn} />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to={(loc.state as { from?: string } | null)?.from ?? '/'} replace />} />
      <Route element={<Shell onSignOut={signOut} />}>
        <Route index element={<Agenda />} />
        <Route path="temuan/:id" element={<Finding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
