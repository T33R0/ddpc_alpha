import { getServerSupabase } from "@/lib/supabase";
import { getPublicProfileByUsername } from "@/lib/queries/userProfile";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const supabase = await getServerSupabase();
  const profile = await getPublicProfileByUsername(supabase, params.username);

  if (!profile) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-xl mx-auto rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Profile not found</h1>
          <p className="text-sm text-muted">This user may not exist or their profile is private.</p>
          <Link href="/" className="text-sm text-brand hover:underline mt-3 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="avatar" width={64} height={64} className="rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}
          <div>
            <h1 className="text-xl font-semibold">{profile.display_name || profile.username || "User"}</h1>
            {profile.username && <div className="text-sm text-muted">@{profile.username}</div>}
          </div>
        </div>
        {profile.bio && <p className="text-sm whitespace-pre-line">{profile.bio}</p>}
        <div className="flex items-center gap-4 text-sm text-muted">
          {profile.location && <div>{profile.location}</div>}
          {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="underline">Website</a>}
        </div>
      </div>
    </div>
  );
}