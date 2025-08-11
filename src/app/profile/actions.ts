'use server';
import { getServerSupabase } from '@/lib/supabase';
import type { Theme } from '@/lib/queries/userSettings';
import { getUserSettings } from '@/lib/queries/userSettings';
import { getMyProfile, upsertMyProfile, type UserProfile } from '@/lib/queries/userProfile';

export async function getMySettings(): Promise<{ theme: Theme }> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { theme: 'system' };
  const settings = await getUserSettings(supabase);
  return { theme: settings?.theme ?? 'system' };
}
<<<<<<< Current (Your changes)
=======

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return await getMyProfile(supabase);
}

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const input = {
    username: (formData.get('username') as string | null) || null,
    display_name: (formData.get('display_name') as string | null) || null,
    location: (formData.get('location') as string | null) || null,
    website: (formData.get('website') as string | null) || null,
    bio: (formData.get('bio') as string | null) || null,
    avatar_url: (formData.get('avatar_url') as string | null) || null,
    is_public: (formData.get('is_public') as string | null) === 'on',
  };

  await upsertMyProfile(supabase, user.id, input);
}
>>>>>>> Incoming (Background Agent changes)
