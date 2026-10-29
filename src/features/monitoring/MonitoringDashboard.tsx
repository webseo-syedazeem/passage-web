import { useQuery } from '@tanstack/react-query'
import { Activity, Clock3, Headphones, Smartphone, Users, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

import { PageHeading, QueryState, RefreshButton, dateLabel } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { monitoringApi, type CountRow } from '@/services/monitoring'

const ranges = [1, 7, 30, 90]
const duration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}
const label = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function Bars({ rows, empty }: { rows: CountRow[]; empty: string }) {
  if (!rows.length) return <p className="muted py-5">{empty}</p>
  const max = Math.max(...rows.map((row) => row.count), 1)
  return <div className="space-y-3">
    {rows.slice(0, 10).map((row) => <div key={row.value}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="truncate">{label(row.value)}</span><span className="tabular-nums text-muted-foreground">{row.count}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, row.count / max * 100)}%` }} /></div>
    </div>)}
  </div>
}

export function MonitoringDashboard() {
  const [days, setDays] = useState(7)
  const query = useQuery({
    queryKey: ['monitoring', days],
    queryFn: ({ signal }) => monitoringApi.get(days, signal),
    refetchInterval: 60_000,
  })
  const data = query.data
  const cards = data ? [
    ['Total users', data.summary.total_users, Users],
    ['Active listeners', data.summary.active_users, Activity],
    ['App opens', data.summary.app_opens, Smartphone],
    ['Soundscape plays', data.summary.soundscape_plays, Headphones],
    ['Listening time', duration(data.summary.listening_seconds), Clock3],
  ] as const : []

  return <>
    <PageHeading title="Monitoring & Analytics" description="Live service status, listener activity, playback and onboarding performance.">
      <div className="actions">
        {ranges.map((range) => <Button key={range} size="sm" variant={days === range ? 'default' : 'outline'} onClick={() => setDays(range)}>{range}d</Button>)}
        <RefreshButton busy={query.isFetching} onClick={query.refetch} />
      </div>
    </PageHeading>
    <QueryState pending={query.isPending} error={query.error} retry={query.refetch} />
    {data && !query.error && <>
      <section className={`panel mb-5 flex flex-wrap items-center justify-between gap-4 ${data.health.status === 'ok' ? 'border-emerald-600/40' : 'border-destructive/60'}`}>
        <div className="flex items-center gap-3">
          <span className={`flex size-11 items-center justify-center rounded-full ${data.health.status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
            {data.health.status === 'ok' ? <Wifi size={21} /> : <WifiOff size={21} />}
          </span>
          <div><p className="font-semibold">{data.health.status === 'ok' ? 'All systems operational' : 'Service unavailable'}</p><p className="muted">Supabase {data.health.checks.supabase.status} · {data.health.checks.supabase.latency_ms} ms · API uptime {duration(data.health.uptime_seconds)}</p></div>
        </div>
        <Badge variant="outline">Auto-refreshes every minute</Badge>
      </section>
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([title, value, Icon]) => <div className="panel" key={title}><div className="flex items-center justify-between text-muted-foreground"><p className="text-xs">{title}</p><Icon size={17} /></div><p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p></div>)}
      </section>
      <section className="mb-5 grid gap-5 xl:grid-cols-3">
        <div className="panel"><h2 className="mb-5 font-semibold">Top screens</h2><Bars rows={data.screens} empty="Screen views will appear after the app update is live." /></div>
        <div className="panel"><h2 className="mb-5 font-semibold">Onboarding step views</h2><Bars rows={data.onboarding_steps} empty="No onboarding activity in this range." /></div>
        <div className="panel"><h2 className="mb-5 font-semibold">Onboarding drop-off</h2><Bars rows={data.onboarding_dropoffs} empty="No drop-offs recorded in this range." /><p className="muted mt-5">{data.summary.onboarding_dropoffs} total exits</p></div>
      </section>
      <section className="panel mb-5">
        <h2 className="mb-5 font-semibold">Soundscape listening</h2>
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Soundscape</th><th>Plays</th><th>Listening time</th></tr></thead><tbody>
          {data.plays.length ? data.plays.slice(0, 25).map((row) => <tr key={row.soundscape_id}><td data-label="Soundscape">{row.title}</td><td data-label="Plays" className="tabular-nums">{row.plays}</td><td data-label="Listening time">{duration(row.listening_seconds)}</td></tr>) : <tr><td colSpan={3} className="muted">No individual plays recorded in this range.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="panel">
        <h2 className="mb-1 font-semibold">Recent listener activity</h2><p className="muted mb-5">Privacy-safe operational events only; reflections and health data are never included.</p>
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Event</th><th>Listener</th><th>Details</th><th>Time</th></tr></thead><tbody>
          {data.recent_activity.map((event) => <tr key={event.id}><td data-label="Event"><Badge variant="outline">{label(event.event_name)}</Badge></td><td data-label="Listener"><p>{event.user?.name || (event.user ? 'Registered listener' : 'Guest')}</p><p className="mt-1 text-xs text-muted-foreground">{event.user?.email || event.session_id || 'Anonymous session'}</p></td><td data-label="Details" className="max-w-md text-xs text-muted-foreground">{Object.entries(event.details).map(([key, value]) => `${label(key)}: ${String(value)}`).join(' · ') || '—'}</td><td data-label="Time" className="text-xs text-muted-foreground">{dateLabel(event.created_at)}</td></tr>)}
        </tbody></table></div>
      </section>
    </>}
  </>
}

