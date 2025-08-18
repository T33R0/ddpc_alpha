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
    .select('id, vehicle_id, name, description, status, created_by, created_at, updated_at')
    .eq('vehicle_id', params.id)
    .single()
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data: jobs } = await supabase
    .from('job')
    .select('id, title, description, status, created_at, updated_at')
    .eq('build_plan_id', plan.id)
    .order('created_at', { ascending: true })

  type PartRow = {
    id: string
    job_id: string
    name: string
    brand: string | null
    part_number: string | null
    affiliate_url: string | null
    price: number | null
    qty: number | null
    created_at: string
  }
  const jobIds = (jobs ?? []).map(j => j.id)
  const { data: parts } = jobIds.length
    ? await supabase
        .from('job_part')
        .select('id, job_id, name, brand, part_number, affiliate_url, price, qty, created_at')
        .in('job_id', jobIds)
    : { data: [] as PartRow[] }

  const { data: planTotal } = await supabase
    .from('v_build_plan_costs')
    .select('cost_total')
    .eq('build_plan_id', plan.id)
    .single()

  return NextResponse.json({
    plan: { ...plan, total_cost: planTotal?.cost_total ?? 0 },
    jobs: (jobs ?? []).map(j => ({ ...j, parts: (parts ?? [] as PartRow[]).filter((p) => p.job_id === j.id) })),
  })
}


