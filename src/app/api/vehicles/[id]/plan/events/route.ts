import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function sb() {
  const c = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => c.get(n)?.value } }
  )
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await sb()
  const { data: plan, error: planErr } = await supabase
    .from('build_plans')
    .select('id')
    .eq('vehicle_id', params.id)
    .single()
  if (planErr || !plan) return NextResponse.json({ events: [] })

  const { data: links } = await supabase
    .from('event_entities')
    .select('event_id')
    .eq('build_plan_id', plan.id)
  const ids = (links ?? []).map((l: { event_id: string }) => l.event_id)
  if (!ids.length) return NextResponse.json({ events: [] })

  const { data: events } = await supabase
    .from('events')
    .select('id, type, title, occurred_on, created_at, payload')
    .in('id', ids)
    .order('created_at', { ascending: false })

  return NextResponse.json({ events: events ?? [] })
}


