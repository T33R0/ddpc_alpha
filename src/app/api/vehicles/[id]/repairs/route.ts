import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { emitVehicleEvent } from '@/lib/activity/emitEvent';
import type { Repair } from '@/types/buyer';

const Body = z.object({
  occurred_on: z.string().min(4),
  odo: z.number().int().nonnegative().optional(),
  description: z.string().min(3),
  shop: z.string().optional(),
  insurance_claim: z.boolean().optional(),
  cost: z.number().nonnegative().optional(),
  photos: z.array(z.any()).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('repair')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('occurred_on', { ascending: false }) as any as { data: Repair[]; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('repair')
    .insert([{ ...parsed.data, vehicle_id: params.id }])
    .select('*')
    .single<Repair>();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await emitVehicleEvent({
    vehicle_id: params.id,
    typeKey: 'REPAIR',
    title: 'Repair',
    occurred_on: data.occurred_on,
    payload: { odo: data.odo ?? null, cost: data.cost ?? null, shop: data.shop ?? null, insurance_claim: data.insurance_claim ?? null }
  });

  return NextResponse.json({ item: data });
}
