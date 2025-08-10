import type { SupabaseClient } from "@supabase/supabase-js";

export type Theme = "system" | "light" | "dark";
export interface UserSettings {
  user_id: string;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(supabase: SupabaseClient): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id, theme, created_at, updated_at")
    .maybeSingle();
  if (error) return null;
  return data as UserSettings | null;
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: { theme: Theme }
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, theme: settings.theme })
    .select("user_id, theme, created_at, updated_at")
    .maybeSingle();
  if (error) return null;
  return data as UserSettings | null;
}
