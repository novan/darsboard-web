# AGENTS.md (frontend)

Antarmuka Dashboard Evaluasi Darsyafii: React Router 7 dalam mode SSR. Kebutuhan produk ada di folder `docs/` di atas
repo ini (tidak ikut repo). Backend ada di repo `backend/`.

## Perintah

`npm run build` (typegen + tsc + build SSR), `npm run lint`, `npm run dev`, `npm start` (setelah build).
Tidak ada framework tes frontend (keputusan rencana). Pada mesin dengan banyak Node, pastikan `npm` dan `node` sama-sama
arm64 atau sama-sama x64; campuran keduanya merusak binding native (rolldown, oxlint).

## Arsitektur dan aturan

- Browser -> server frontend (SSR + proxy `/api/*`) -> backend. Backend dibaca server lewat `BACKEND_URL`.
- Token JWT hanya hidup di cookie httpOnly yang diset server. Kode yang menyentuh token atau memanggil backend langsung
  ada di modul `*.server.ts` dan loader/action route; browser hanya memanggil `/api/*` lewat `src/routes/api-proxy.ts`.
  Token tidak boleh sampai ke JavaScript browser.
- Data murid asli tidak boleh masuk repo; nama murid tidak ditulis ke log.
- Teks antarmuka berbahasa Indonesia. Status ditampilkan dengan teks, bukan hanya warna.
