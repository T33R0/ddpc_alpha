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
  const body = await req.json().catch(() => ({}))
  const { name, brand, part_number, affiliate_url, price, qty } = body as {
    name?: string
    brand?: string | null
    part_number?: string | null
    affiliate_url?: string | null
    price?: number | null
    qty?: number | null
  }

  const supabase = await sb()
  // Guardrail: ensure job belongs to an open plan; rely on RLS for authorization
  const { data: job } = await supabase
    .from('job')
    .select('id, build_plan_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  const { data: plan } = await supabase
    .from('build_plans')
    .select('id, vehicle_id, status')
    .eq('id', job.build_plan_id as string)
    .maybeSingle()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.status !== 'open') {
    return NextResponse.json({ error: 'Plan is not open. You can only add parts to jobs on an open plan.' }, { status: 400 })
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('job_part').insert({
    job_id: params.id,
    name,
    brand,
    part_number,
    affiliate_url,
    price,
    qty,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
