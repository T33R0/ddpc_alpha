import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import type { ModEntry } from '@/types/buyer';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_modification_entry')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('installed_on', { ascending: false }) as any as { data: ModEntry[]; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}
