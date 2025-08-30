import { createClient } from '@/lib/supabase';

type EmitArgs = {
  vehicle_id: string;
  title: string;
  occurred_on?: string | null;
  payload?: Record<string, any>;
  typeKey?: 'SERVICE'|'INSTALL'|'INSPECT'|'TUNE'|'REPAIR'|'USAGE';
};

export async function emitVehicleEvent({ vehicle_id, title, occurred_on, payload, typeKey }: EmitArgs) {
  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const created_by = userRes?.user?.id ?? null;

  // Try modern table first
  const tryEvents = await supabase
    .from('events')
    .insert([{ vehicle_id, type: typeKey as any, title, occurred_on: occurred_on ?? null, payload: payload ?? {}, created_by }])
    .select('id')
    .single();

  if (!tryEvents.error) return tryEvents;

  // Fallback to legacy table with TEXT type
  const fallbackType = typeKey && ['SERVICE','INSTALL','INSPECT','TUNE'].includes(typeKey) ? typeKey : 'SERVICE';
  return supabase
    .from('event')
    .insert([{ vehicle_id, type: fallbackType, title, occurred_on: occurred_on ?? null, notes: JSON.stringify(payload ?? {}), created_by }])
    .select('id')
    .single();
}
