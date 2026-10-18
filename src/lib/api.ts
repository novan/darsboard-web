const TOKEN_KEY = 'dashboard-evaluasi.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* penyimpanan diblokir: sesi hanya berlaku sampai halaman dimuat ulang */
  }
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401 && path !== '/api/login') {
    setToken(null)
    window.dispatchEvent(new Event('auth:expired'))
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

export const get = <T,>(path: string) => request<T>(path)
export const post = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

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
  as_of?: string
  stale: boolean
  last_status?: string
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

export type StatusResponse = {
  run: RunInfo
  sources: {
    source: string
    last_status?: string
    as_of?: string
    stale: boolean
    expires_at?: string
    expires_in_days?: number
    expiry_warning: boolean
  }[]
}
