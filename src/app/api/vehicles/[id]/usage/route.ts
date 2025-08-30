import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { emitVehicleEvent } from '@/lib/activity/emitEvent';
import type { UsageLog } from '@/types/buyer';

const Body = z.object({
  occurred_on: z.string().min(4),
  odo: z.number().int().nonnegative().optional(),
  kind: z.enum(['daily','weekend','track_day','road_trip','show','storage']),
  details: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('usage_log')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('occurred_on', { ascending: false }) as any as { data: UsageLog[]; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('usage_log')
    .insert([{ ...parsed.data, vehicle_id: params.id }])
    .select('*')
    .single<UsageLog>();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await emitVehicleEvent({
    vehicle_id: params.id,
    typeKey: 'USAGE',
    title: `${data.kind.replace('_',' ')} use`,
    occurred_on: data.occurred_on,
    payload: { odo: data.odo ?? null, details: data.details ?? null }
  });

  return NextResponse.json({ item: data });
}
