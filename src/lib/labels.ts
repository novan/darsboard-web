import type { ClassCell, Component, ColumnKey } from './api'

export const columnMeta: Record<ColumnKey, { title: string; hint: string }> = {
  program: { title: 'Program', hint: 'Masalah ada di rancangan atau materi, bukan di satu guru' },
  guru: { title: 'Guru', hint: 'Satu kelas tertinggal sementara kelas paralelnya baik' },
  murid: { title: 'Murid', hint: 'Murid yang tertinggal di kelas yang secara umum baik' },
  tinjau: { title: 'Perlu ditinjau', hint: 'Data belum cukup untuk memastikan penyebabnya' },
}

export const patternLabel: Record<string, string> = {
  program_semua_kelas: 'Semua kelas tertinggal',
  guru_satu_kelas: 'Satu kelas tertinggal',
  satu_guru_semua_kelas: 'Satu guru mengajar semua kelas',
  guru_tumpang_tindih: 'Guru mengajar lintas kelas',
  guru_tidak_diketahui: 'Guru belum diketahui',
  perbandingan_belum_setara: 'Standar penilaian belum sama',
  data_belum_cukup_dibandingkan: 'Data belum cukup dibandingkan',
  semua_kelas_proses_lemah: 'Proses mengajar lemah di semua kelas',
  satu_kelas_proses_lengkap: 'Proses lengkap, hasil rendah',
  proses_tidak_tersedia: 'Data proses belum tersedia',
  pola_satu_bulan: 'Baru terlihat satu bulan',
  satu_kelas_saja: 'Hanya satu kelas diamati',
  murid_tertinggal: 'Murid tertinggal',
}

export const signalLabel: Record<string, string> = {
  plan_on_time: 'Rencana pembelajaran tepat waktu',
  execution_coverage: 'Rencana yang terlaksana',
  grading_timeliness: 'Ketepatan penilaian',
  grade_completeness: 'Kelengkapan nilai',
  assessment_density: 'Penilaian rubrik per murid',
  lesson_coverage: 'Materi berbeda yang dilatih',
}

// Sinyal Skolu berupa hitungan (bukan rasio) dan dibandingkan antar kelas paralel.
const countSignals = new Set(['assessment_density', 'lesson_coverage'])
export const fmtSignal = (name: string, v: number) =>
  countSignals.has(name) ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(v) : `${Math.round(v * 100)}%`

export const processLabel: Record<ClassCell['process']['status'], string> = {
  ok: 'Lengkap',
  borderline: 'Perlu dicermati',
  weak: 'Lemah',
  unavailable: 'Tidak tersedia',
}

const reasonLabel: Record<string, string> = {
  insufficient_data: 'data belum cukup',
  not_applicable: 'tidak berlaku untuk jenjang ini',
  riwayat_belum_cukup: 'riwayat penilaian belum cukup',
  belum_ada_periode_pembanding: 'belum ada periode pembanding',
  periode_pembanding_tidak_cukup_data: 'data periode pembanding belum cukup',
}

export const reasonText = (r?: string) => (r ? (reasonLabel[r] ?? r) : '')

export const directionLabel: Record<Component['direction'], string> = {
  membaik: 'Membaik',
  tetap: 'Tetap',
  memburuk: 'Memburuk',
  tidak_tersedia: 'Arah belum tersedia',
}

export const sourceLabel: Record<string, string> = { skolu: 'Skolu', gurukreator: 'Guru Kreator' }

export const pulseTitle = { commitment: 'Komitmen', process: 'Proses', outcome: 'Hasil' } as const

export const pct = (v?: number) => (v == null ? '–' : `${Math.round(v * 100)}%`)

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' })
export const fmtDate = (iso?: string) => (iso ? dateFmt.format(new Date(iso)) : '–')
export const fmtDateTime = (iso?: string) => (iso ? dateTimeFmt.format(new Date(iso)) : '–')
