import { request } from '@/lib/api'

export type CountRow = { value: string; count: number }
export type MonitoringData = {
  generated_at: string
  range_days: number
  health: {
    status: 'ok' | 'unavailable'
    uptime_seconds: number
    checks: { supabase: { status: 'ok' | 'error'; latency_ms: number } }
  }
  summary: {
    total_users: number
    active_users: number
    app_opens: number
    screen_views: number
    soundscape_plays: number
    listening_seconds: number
    onboarding_dropoffs: number
  }
  plays: Array<{ soundscape_id: string; title: string; plays: number; listening_seconds: number }>
  screens: CountRow[]
  onboarding_steps: CountRow[]
  onboarding_dropoffs: CountRow[]
  recent_activity: Array<{
    id: string
    event_name: string
    created_at: string
    session_id: string | null
    user: { id: string | number; name: string | null; email: string | null } | null
    details: Record<string, unknown>
  }>
}

export const monitoringApi = {
  get: (days: number, signal?: AbortSignal) =>
    request<MonitoringData>(`/api/admin/monitoring?days=${days}`, { signal }),
}

