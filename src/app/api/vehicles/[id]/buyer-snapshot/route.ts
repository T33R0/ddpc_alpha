import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import type { BuyerSnapshot } from '@/types/buyer';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_vehicle_buyer_snapshot')
    .select('*')
    .eq('vehicle_id', params.id)
    .single<BuyerSnapshot>();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
