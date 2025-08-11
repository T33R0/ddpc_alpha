import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  location: string | null;
  website: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export async function getMyProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profile")
    .select("user_id, username, display_name, location, website, bio, avatar_url, is_public, created_at, updated_at")
    .maybeSingle();
  if (error) return null;
  return data as UserProfile | null;
}

export async function upsertMyProfile(
  supabase: SupabaseClient,
  userId: string,
  input: Partial<Pick<UserProfile, "username" | "display_name" | "location" | "website" | "bio" | "avatar_url" | "is_public">>
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profile")
    .upsert({ user_id: userId, ...input })
    .select("user_id, username, display_name, location, website, bio, avatar_url, is_public, created_at, updated_at")
    .maybeSingle();
  if (error) return null;
  return data as UserProfile | null;
}

export async function getPublicProfileByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profile")
    .select("user_id, username, display_name, location, website, bio, avatar_url, is_public, created_at, updated_at")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();
  return data as UserProfile | null;
}
