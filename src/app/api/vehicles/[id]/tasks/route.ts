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
  const { data: plan } = await supabase
    .from('build_plans')
    .select('id')
    .eq('vehicle_id', params.id)
    .single()
  if (!plan) return NextResponse.json({ recent: [], upcoming: [] })

  const { data: jobIdsRes } = await supabase
    .from('job')
    .select('id')
    .eq('build_plan_id', plan.id)
  const jobIds = (jobIdsRes ?? []).map(j => j.id)

  type TaskRow = { id: string; job_id: string; title: string; status: string; due_on: string | null; updated_at: string; created_at: string }
  const { data: tasks } = jobIds.length
    ? await supabase
        .from('job_task')
        .select('id, job_id, title, status, due_on, updated_at, created_at')
        .in('job_id', jobIds)
    : { data: [] as TaskRow[] }

  const recent = (tasks ?? [] as TaskRow[])
    .filter((t) => t.status === 'done')
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 20)

  const upcoming = (tasks ?? [] as TaskRow[])
    .filter((t) => t.status !== 'done')
    .sort((a, b) => +new Date(a.due_on || '9999-12-31') - +new Date(b.due_on || '9999-12-31'))
    .slice(0, 50)

  return NextResponse.json({ recent, upcoming })
}


