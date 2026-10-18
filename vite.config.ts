import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev: arahkan /api ke backend Go lokal. Produksi: SPA disajikan oleh binary Go yang sama.
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
