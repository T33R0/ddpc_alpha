import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { emitVehicleEvent } from '@/lib/activity/emitEvent';
import type { DynoRun } from '@/types/buyer';

const Body = z.object({
  run_on: z.string().min(4),
  odo: z.number().int().nonnegative().optional(),
  tune_label: z.string().optional(),
  whp: z.number().nonnegative().optional(),
  wtq: z.number().nonnegative().optional(),
  boost_psi: z.number().nonnegative().optional(),
  afr_note: z.string().optional(),
  sheet_media_id: z.string().uuid().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dyno_run')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('run_on', { ascending: false }) as any as { data: DynoRun[]; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('dyno_run')
    .insert([{ ...parsed.data, vehicle_id: params.id }])
    .select('*')
    .single<DynoRun>();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await emitVehicleEvent({
    vehicle_id: params.id,
    title: 'Dyno run',
    occurred_on: data.run_on,
    payload: { whp: data.whp ?? null, wtq: data.wtq ?? null, boost_psi: data.boost_psi ?? null, tune: data.tune_label ?? null }
  });

  return NextResponse.json({ item: data });
}
