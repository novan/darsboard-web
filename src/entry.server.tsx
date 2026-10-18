import { randomBytes } from 'node:crypto'
import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { ServerRouter, type EntryContext } from 'react-router'

const STREAM_TIMEOUT_MS = 10_000

// CSP berbasis nonce di produksi. Di dev Vite menyisipkan skrip HMR tanpa nonce, jadi CSP dilewati.
function securityHeaders(nonce: string): Record<string, string> {
  const h: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  }
  if (process.env.NODE_ENV === 'production') {
    h['Content-Security-Policy'] = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  }
  return h
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    const nonce = randomBytes(16).toString('base64')
    // Bot menunggu seluruh halaman; browser mendapat shell lebih dulu.
    const readyOption = isbot(request.headers.get('user-agent') || '') ? 'onAllReady' : 'onShellReady'
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={routerContext} url={request.url} nonce={nonce} />, {
      nonce,
      [readyOption]() {
        shellRendered = true
        const body = new PassThrough()
        const stream = createReadableStreamFromReadable(body)
        responseHeaders.set('Content-Type', 'text/html; charset=utf-8')
        for (const [k, v] of Object.entries(securityHeaders(nonce))) responseHeaders.set(k, v)
        resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }))
        pipe(body)
      },
      onShellError(error: unknown) {
        reject(error)
      },
      onError(error: unknown) {
        responseStatusCode = 500
        // Setelah shell terkirim, kesalahan hanya dicatat. Pesan tidak memuat data pengguna.
        if (shellRendered) console.error('kesalahan render', error instanceof Error ? error.name : 'unknown')
      },
    })
    setTimeout(abort, STREAM_TIMEOUT_MS + 1000)
  })
}
