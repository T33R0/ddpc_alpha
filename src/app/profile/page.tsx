import ThemeSection from "./ThemeSection";
import { getServerSupabase } from "@/lib/supabase";
import { getMySettings, getProfile, updateProfile } from "./actions";
import { serverLog } from "@/lib/serverLog";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Profile</h1>
          <p className="text-sm text-muted mb-4">You must be signed in to view your profile.</p>
          <Link href="/" className="text-brand hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const email = user.email ?? "(no email)";
  const providers = Array.from(new Set([user.app_metadata?.provider, ...(user.identities?.map(i => i.provider) ?? [])].filter(Boolean))) as string[];

  const [{ theme }, profile] = await Promise.all([getMySettings(), getProfile()]);
  serverLog("theme_initialized", { userId: user.id, theme });

  return (
    <div className="min-h-screen p-8" data-testid="profile-page">
      <div className="max-w-2xl mx-auto rounded-2xl border bg-card p-6 shadow-sm space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profile</h1>
          <Link href="/profile/billing" className="text-sm text-brand hover:underline">Billing</Link>
        </header>

        <section className="space-y-1">
          <div className="text-sm text-muted">Signed in as</div>
          <div className="text-base">{email}</div>
          {providers.length > 0 && (
            <div className="text-xs text-muted">Providers: {providers.join(", ")}</div>
          )}
        </section>

        <form action={updateProfile} className="space-y-4" data-testid="profile-edit-form">
          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm">Username
              <input name="username" defaultValue={profile?.username ?? ''} placeholder="username" className="mt-1 w-full border rounded px-2 py-1" />
            </label>
            <label className="text-sm">Display name
              <input name="display_name" defaultValue={profile?.display_name ?? ''} placeholder="Full name" className="mt-1 w-full border rounded px-2 py-1" />
            </label>
            <label className="text-sm">Location
              <input name="location" defaultValue={profile?.location ?? ''} placeholder="City, Country" className="mt-1 w-full border rounded px-2 py-1" />
            </label>
            <label className="text-sm">Website
              <input name="website" defaultValue={profile?.website ?? ''} placeholder="https://" className="mt-1 w-full border rounded px-2 py-1" />
            </label>
            <label className="text-sm">Bio
              <textarea name="bio" defaultValue={profile?.bio ?? ''} placeholder="Short bio" className="mt-1 w-full border rounded px-2 py-1" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_public" defaultChecked={profile?.is_public ?? true} className="accent-brand" />
              Public profile
            </label>

            <div>
              <label className="text-sm">Avatar URL
                <input name="avatar_url" defaultValue={profile?.avatar_url ?? ''} placeholder="https://..." className="mt-1 w-full border rounded px-2 py-1" />
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-3 py-1 rounded bg-black text-white">Save Profile</button>
            <Link href={`/u/${encodeURIComponent(profile?.username || user.id)}`} className="text-sm underline">View public profile</Link>
          </div>
        </form>

        <ThemeSection initialTheme={theme} userId={user.id} />
      </div>
    </div>
  );
}
