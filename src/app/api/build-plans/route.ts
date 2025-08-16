import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr' // or your helper

type JobPart = {
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

async function createSb() {
  // If you already have a helper, replace with it.
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(url, anon, { cookies: { get: (name: string) => cookieStore.get(name)?.value } })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const sb = await createSb()

  // Plan
  const { data: plan, error: planErr } = await sb
    .from('build_plans')
    .select('id, vehicle_id, name, status, created_by, created_at, updated_at')
    .eq('id', params.id)
    .single()
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Jobs
  const { data: jobs, error: jobsErr } = await sb
    .from('job')
    .select('id, title, description, status, created_at, updated_at')
    .eq('build_plan_id', params.id)
    .order('created_at', { ascending: true })
  if (jobsErr) return NextResponse.json({ error: jobsErr.message }, { status: 500 })

  // Parts for all jobs
  const jobIds = (jobs ?? []).map(j => j.id)
  const partsByJob: Record<string, JobPart[]> = {}
  if (jobIds.length) {
    const { data: parts, error: partsErr } = await sb
      .from('job_part')
      .select('id, job_id, name, brand, part_number, affiliate_url, price, qty, created_at')
      .in('job_id', jobIds)
    if (partsErr) return NextResponse.json({ error: partsErr.message }, { status: 500 })
    for (const p of parts ?? []) {
      (partsByJob[p.job_id] ||= []).push(p)
    }
  }

  // Totals
  const { data: planTotal } = await sb
    .from('v_build_plan_costs')
    .select('cost_total')
    .eq('build_plan_id', params.id)
    .single()

  return NextResponse.json({
    plan: { ...plan, total_cost: planTotal?.cost_total ?? 0 },
    jobs: (jobs ?? []).map(j => ({
      ...j,
      parts: partsByJob[j.id] ?? [],
    })),
  })
}
