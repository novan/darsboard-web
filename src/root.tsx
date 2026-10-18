import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import './index.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Dashboard Evaluasi Darsyafii</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-extrabold text-navy-900">{notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}</h1>
      <p className="mt-2 text-muted">
        {notFound ? 'Alamat yang Anda buka tidak ada.' : 'Server tidak bisa menampilkan halaman ini. Coba muat ulang beberapa saat lagi.'}
      </p>
      <a href="/" className="mt-4 inline-block font-bold text-navy-700 underline">
        Kembali ke agenda
      </a>
    </main>
  )
}
