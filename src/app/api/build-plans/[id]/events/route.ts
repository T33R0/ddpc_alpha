import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function sb(){
  const c = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => c.get(n)?.value } }
  )
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await sb()
  // Link table contains event_id for build events
  const { data: links, error: linkErr } = await supabase
    .from('event_entities')
    .select('event_id')
    .eq('build_plan_id', params.id)
  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

  const ids = (links ?? []).map((l: { event_id: string }) => l.event_id)
  if (!ids.length) return NextResponse.json({ events: [] })

  const { data: events, error: evtErr } = await supabase
    .from('events')
    .select('id, type, title, occurred_on, created_at, payload')
    .in('id', ids)
    .order('created_at', { ascending: false })
  if (evtErr) return NextResponse.json({ error: evtErr.message }, { status: 500 })
  return NextResponse.json({ events })
}


