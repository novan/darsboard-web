# Dashboard Evaluasi Darsyafii: frontend

React Router 7 mode SSR. Login diproses di server dan menaruh token backend di cookie httpOnly; panggilan API dari
browser lewat proxy `/api/*` di server ini ke backend.

```bash
npm install
npm run dev                                # http://localhost:5173; BACKEND_URL default http://localhost:8080
npm run build && COOKIE_SECURE=false npm start   # produksi lokal di :3000 (tanpa HTTPS)
npm run lint
```

Variabel lingkungan: `BACKEND_URL` (alamat API), `COOKIE_SECURE` (`false` hanya untuk uji lewat http biasa), `PORT`, `HOST`.
Image: `docker build -t dashboard-frontend .`
