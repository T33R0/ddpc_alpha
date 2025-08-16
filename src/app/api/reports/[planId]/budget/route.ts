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

type JobRow = { id: string; title: string; status: string }
type PartRow = {
  job_id: string
  name: string
  brand: string | null
  part_number: string | null
  affiliate_url: string | null
  price: number | null
  qty: number | null
}

export async function GET(_: Request, { params }: { params: { planId: string } }) {
  const supabase = await sb()

  const { data: plan, error: planErr } = await supabase
    .from('build_plans')
    .select('id, name, status, vehicle_id')
    .eq('id', params.planId)
    .single()
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data: jobs } = await supabase
    .from('job')
    .select('id, title, status')
    .eq('build_plan_id', plan.id)
    .order('created_at', { ascending: true })

  const ids = (jobs ?? []).map(j => j.id)
  const { data: parts } = ids.length
    ? await supabase
        .from('job_part')
        .select('job_id, name, brand, part_number, affiliate_url, price, qty')
        .in('job_id', ids)
    : { data: [] as PartRow[] }

  const { data: total } = await supabase
    .from('v_build_plan_costs')
    .select('cost_total')
    .eq('build_plan_id', plan.id)
    .single()

  return NextResponse.json({
    plan: { id: plan.id, name: plan.name, status: plan.status, total: total?.cost_total ?? 0 },
    jobs: (jobs as JobRow[] | null ?? []).map(j => ({
      id: j.id,
      title: j.title,
      status: j.status,
      parts: (parts as PartRow[] | null ?? []).filter(p => p.job_id === j.id),
    })),
  })
}
