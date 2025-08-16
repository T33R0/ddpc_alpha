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
