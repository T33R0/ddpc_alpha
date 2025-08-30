import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase';

const Body = z.object({
  decoded: z.record<Record<string, unknown>>().optional(),
  options: z.record<Record<string, unknown>>().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('vehicle_factory_config')
    .select('*')
    .eq('vehicle_id', params.id)
    .single();
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data ?? null });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getServerSupabase();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // upsert by PK (vehicle_id)
  const { data, error } = await supabase
    .from('vehicle_factory_config')
    .upsert({ vehicle_id: params.id, ...parsed.data }, { onConflict: 'vehicle_id' })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
