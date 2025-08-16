import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function sb() {
  const c = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (n: string) => c.get(n)?.value },
    }
  )
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { build_plan_id?: string; title?: string; description?: string }
  const { build_plan_id, title, description } = body

  if (!build_plan_id || !title)
    return NextResponse.json({ error: 'build_plan_id and title are required' }, { status: 400 })

  const supabase = await sb()
  const { data, error } = await supabase
    .from('job')
    .insert({ build_plan_id, title, description })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
