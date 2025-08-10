'use server';
import { getServerSupabase } from '@/lib/supabase';
import type { Theme } from '@/lib/queries/userSettings';
import { getUserSettings } from '@/lib/queries/userSettings';

export async function getMySettings(): Promise<{ theme: Theme }> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { theme: 'system' };
  const settings = await getUserSettings(supabase);
  return { theme: settings?.theme ?? 'system' };
}
