import type { Config } from '@react-router/dev/config'

// Mode SSR: HTML dirender di server Node; panggilan API dari browser lewat proxy di server yang sama.
export default {
  appDirectory: 'src',
  ssr: true,
} satisfies Config
