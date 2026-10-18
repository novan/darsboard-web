import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),
  // Proxy ke backend untuk panggilan API dari browser (mis. riwayat murid).
  route('api/*', 'routes/api-proxy.ts'),
  layout('routes/shell.tsx', [index('routes/agenda.tsx'), route('temuan/:id', 'routes/finding.tsx')]),
] satisfies RouteConfig
