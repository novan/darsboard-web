export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Panggilan dari browser: selalu ke asal yang sama (proxy server frontend); cookie sesi ikut otomatis.
export async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
  if (res.status === 401) {
    window.location.assign('/login')
  }
  if (!res.ok) {
    let code = 'error'
    let message = 'Terjadi kesalahan. Coba lagi.'
    try {
      const body = await res.json()
      code = body.error ?? code
      message = body.message ?? message
    } catch {
      /* badan bukan JSON */
    }
    throw new ApiError(res.status, code, message)
  }
  return (await res.json()) as T
}

// ---------- tipe respons ----------

export type Unit = 'TK' | 'SD'

export type Period = {
  key: string
  kind: 'month' | 'term'
  label: string
  start: string
  end: string
  provisional: boolean
}

export type RunInfo = { id: number; computed_at: string; rules_version: string }

export type PeriodsResponse = {
  run: RunInfo
  periods: Period[]
  units: Unit[]
  default: { unit: Unit; period: string }
}

export type Component = {
  key: string
  label: string
  value?: number
  avail: boolean
  reason?: string
  direction: 'membaik' | 'tetap' | 'memburuk' | 'tidak_tersedia'
  direction_reason?: string
  reconstructed?: boolean
  detail?: string
  // Nilai dan kunci periode pembanding (bulan atau term sebelumnya) sebagai acuan angka.
  prev_value?: number
  prev_period?: string
  higher_is_better?: boolean
}

export type FindingSummary = {
  id: string
  area_key: string
  pattern: string
  sentence: string
  impact: number
  rank: number
  scope?: { name: string; grade: string; kind: string; source: string }
  class_names: string[]
  students?: number
  worsening: number
}

export type ColumnKey = 'program' | 'guru' | 'murid' | 'tinjau'

export type SourceState = {
  source: string
  // Sinkronisasi penuh terakhir yang berhasil; stale bila lebih tua dari 36 jam.
  as_of?: string
  stale: boolean
  // Percobaan terakhir (berhasil atau tidak) dan sebab singkat bila gagal.
  last_status?: 'running' | 'succeeded' | 'partial' | 'failed'
  last_attempt?: string
  last_error?: string
  expires_at?: string
  expires_in_days?: number
  expiry_warning: boolean
}

export type AgendaResponse = {
  run: RunInfo
  unit: Unit
  period: Period
  sources: SourceState[]
  pulses: Partial<Record<'commitment' | 'process' | 'outcome', Component[]>>
  columns: Record<ColumnKey, FindingSummary[]>
  initial_per_column: number
  empty: boolean
}

export type Outcome = {
  avail: boolean
  reason?: string
  students: number
  observations: number
  at_ref: number
  share: number
}

export type Signal = { name: string; value: number; avail: boolean; weak: boolean; detail?: string }

export type StudentOutcome = {
  student_id: number
  name: string
  obs: number
  at_ref: number
  behind: boolean
}

export type ClassCell = {
  class_id: number
  class_name: string
  teachers: { id: number; name: string; derived?: boolean }[] | null
  now: Outcome
  prev: Outcome
  process: { status: 'ok' | 'borderline' | 'weak' | 'unavailable'; signals?: Signal[]; relative?: boolean }
  students?: StudentOutcome[]
}

export type Evidence = {
  rules_version: string
  trace?: string[]
  worsening?: number
  scope?: { name: string; grade: string; kind: string; source: string; shared_standards: number }
  classes?: ClassCell[]
  affected_class_ids?: number[]
  thresholds?: { abs_problem_share: number; rel_problem_gap: number }
  history_reconstructed?: boolean
  reference_level?: string
  class_id?: number
  class_name?: string
  students?: { id: number; name: string; scopes: string[] }[]
}

export type FindingResponse = {
  run: RunInfo
  finding: {
    id: string
    unit: Unit
    period: Period
    column: ColumnKey
    pattern: string
    sentence: string
    impact: number
    rules_version: string
  }
  evidence: Evidence
}

export type HistoryPoint = { at: string; level: string; label?: string; order: number }

export type StudentHistoryResponse = {
  student: { id: number; name: string; unit: string; class: string | null }
  rubric: { area: string; lessons: { lesson_ref: string; title?: string; series: HistoryPoint[] }[] }[]
  mastery: { subject: string; standards: { code: string; series: HistoryPoint[] }[] }[]
  notes: { mastery_history_since: string }
}

export type StudentStatus = 'behind' | 'watch' | 'ok' | 'insufficient'

export type StudentListItem = {
  id: number
  name: string
  class: string
  status: StudentStatus
  assessed: number
  behind: number
  behind_scopes: string[]
}

export type StudentListResponse = {
  run: RunInfo
  unit: Unit
  period: Period
  counts: { total: number; behind: number; watch: number; ok: number; insufficient: number }
  classes: string[]
  students: StudentListItem[]
}

export type ReportMonth = {
  key: string
  label: string
  provisional: boolean
  pulses: Partial<Record<'commitment' | 'process' | 'outcome', Component[]>>
  findings: Record<ColumnKey | 'total', number>
}

export type ReportResponse = { run: RunInfo; unit: Unit; months: ReportMonth[] }
