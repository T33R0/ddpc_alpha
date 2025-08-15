import { getServerSupabase } from '@/lib/supabase';
import type { EventType } from '@/types/event-types';

export async function getEventTypes(): Promise<EventType[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('event_types')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventType[];
}


