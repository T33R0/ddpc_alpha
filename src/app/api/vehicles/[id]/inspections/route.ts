import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { emitVehicleEvent } from '@/lib/activity/emitEvent';
import type { Inspection } from '@/types/buyer';

const Body = z.object({
  kind: z.enum(['ppi','emissions','general']),
  inspected_on: z.string().min(4),
  odo: z.number().int().nonnegative().optional(),
  result: z.string().optional(),
  report_media_id: z.string().uuid().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inspection')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('inspected_on', { ascending: false }) as any as { data: Inspection[]; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('inspection')
    .insert([{ ...parsed.data, vehicle_id: params.id }])
    .select('*')
    .single<Inspection>();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await emitVehicleEvent({
    vehicle_id: params.id,
    typeKey: 'INSPECT',
    title: `${data.kind.toUpperCase()} inspection`,
    occurred_on: data.inspected_on,
    payload: { odo: data.odo ?? null, result: data.result ?? null }
  });

  return NextResponse.json({ item: data });
}
