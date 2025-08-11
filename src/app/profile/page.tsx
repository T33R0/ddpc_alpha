import ThemeSection from "./ThemeSection";
import AvatarUpload from "./AvatarUpload";
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

        {/* Static profile info */}
        <section className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {/* Simple avatar display from URL; upload handled in editor below */}
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div>
              <div className="text-base font-medium">{profile?.display_name || profile?.username || "User"}</div>
              <div className="text-sm text-muted">@{profile?.username || "(username required)"}</div>
            </div>
          </div>
          <div className="text-sm text-muted">Signed in as</div>
          <div className="text-base">{email}</div>
          {providers.length > 0 && (
            <div className="text-xs text-muted">Providers: {providers.join(", ")}</div>
          )}
          {profile?.location && <div className="text-sm">Location: {profile.location}</div>}
          {profile?.website && (
            <div className="text-sm">
              Website: <a href={profile.website} target="_blank" rel="noreferrer" className="underline">{profile.website}</a>
            </div>
          )}
          {profile?.bio && <p className="text-sm whitespace-pre-line">{profile.bio}</p>}
        </section>

        {/* Edit section collapsed by default */}
        <details className="rounded border bg-background" data-testid="profile-edit-form">
          <summary className="cursor-pointer px-4 py-2 select-none">Edit profile</summary>
          <div className="p-4 border-t space-y-4">
            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm">Username (required)
                  <input name="username" required defaultValue={profile?.username ?? ''} placeholder="username" className="mt-1 w-full border rounded px-2 py-1" />
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

                <div className="space-y-2">
                  <label className="text-sm">Avatar URL
                    <input name="avatar_url" defaultValue={profile?.avatar_url ?? ''} placeholder="https://..." className="mt-1 w-full border rounded px-2 py-1" />
                  </label>
                  <AvatarUpload />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-3 py-1 rounded bg-black text-white">Save Profile</button>
                <Link href={`/u/${encodeURIComponent(profile?.username || user.id)}`} className="text-sm underline">View public profile</Link>
              </div>
            </form>
          </div>
        </details>

        <ThemeSection initialTheme={theme} userId={user.id} />
      </div>
    </div>
  );
}
