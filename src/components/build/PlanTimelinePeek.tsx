'use client'
import { useEffect, useState } from 'react'

type EventRow = { id: string; type: string; title: string | null; occurred_on?: string | null; created_at: string }

export default function PlanTimelinePeek({ planId }: { planId: string }) {
  const [events, setEvents] = useState<EventRow[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/build-plans/${planId}/events`, { cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        if (alive && Array.isArray(j?.events)) setEvents(j.events)
      } catch {}
    })()
    return () => { alive = false }
  }, [planId])

  if (!events.length) return <div className="text-sm text-zinc-500">No recent build events.</div>
  return (
    <ul className="space-y-1">
      {events.slice(0, 10).map((e) => (
        <li key={e.id} className="text-sm">
          <span className="mr-2 text-xs uppercase rounded border px-1">{e.type}</span>
          {e.title ?? 'Event'}
        </li>
      ))}
    </ul>
  )
}


