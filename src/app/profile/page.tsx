import ThemeSection from "./ThemeSection";

export default function ProfilePage() {
  return (
    <div className="space-y-6" data-testid="profile-page">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ThemeSection />
    </div>
  );
}

import { getServerSupabase } from "@/lib/supabase";
import type { Theme } from "@/lib/queries/userSettings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Profile</h1>
          <p className="text-sm text-gray-600 mb-4">You must be signed in to view your profile.</p>
          <Link href="/" className="text-blue-600 hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const email = user.email ?? "(no email)";
  const providers = Array.from(new Set([user.app_metadata?.provider, ...(user.identities?.map(i => i.provider) ?? [])].filter(Boolean))) as string[];

  // Theme section shell; Cursor will drop in UI
  const currentTheme: Theme = "system";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto rounded-2xl border bg-white p-6 shadow-sm space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profile</h1>
        </header>
        <section className="space-y-1">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="text-base">{email}</div>
          {providers.length > 0 && (
            <div className="text-xs text-gray-600">Providers: {providers.join(", ")}</div>
          )}
        </section>
        <section>
          <div className="text-sm font-semibold mb-2">Theme</div>
          <div className="text-sm text-gray-600">Current: {currentTheme}</div>
          <div className="text-xs text-gray-500">(Placeholder – UI to be added later)</div>
        </section>
      </div>
    </div>
  );
}
