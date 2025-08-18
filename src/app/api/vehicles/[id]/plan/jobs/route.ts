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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({})) as { title?: string; description?: string }
  const { title, description } = body
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const supabase = await sb()
  const { data: plan, error: planErr } = await supabase
    .from('build_plans')
    .select('id, status')
    .eq('vehicle_id', params.id)
    .single()
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.status !== 'open') return NextResponse.json({ error: `Plan is ${plan.status}` }, { status: 400 })

  const { data, error } = await supabase
    .from('job')
    .insert({ build_plan_id: plan.id, title, description })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}


