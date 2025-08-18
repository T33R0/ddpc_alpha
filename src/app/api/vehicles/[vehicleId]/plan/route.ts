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

export async function GET(_: Request, { params }: { params: { vehicleId: string } }) {
  const supabase = await sb()

  const { data: plan, error: planErr } = await supabase
    .from('build_plans')
    .select('id, vehicle_id, name, description, status, created_by, created_at, updated_at')
    .eq('vehicle_id', params.vehicleId)
    .single()
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data: jobs } = await supabase
    .from('job')
    .select('id, title, description, status, created_at, updated_at')
    .eq('build_plan_id', plan.id)
    .order('created_at', { ascending: true })

  const jobIds = (jobs ?? []).map(j => j.id)
  const { data: parts } = jobIds.length
    ? await supabase
        .from('job_part')
        .select('id, job_id, name, brand, part_number, affiliate_url, price, qty, created_at')
        .in('job_id', jobIds)
    : { data: [] as any[] }

  const { data: planTotal } = await supabase
    .from('v_build_plan_costs')
    .select('cost_total')
    .eq('build_plan_id', plan.id)
    .single()

  return NextResponse.json({
    plan: { ...plan, total_cost: planTotal?.cost_total ?? 0 },
    jobs: (jobs ?? []).map(j => ({ ...j, parts: (parts ?? []).filter((p: { job_id: string }) => p.job_id === j.id) })),
  })
}


