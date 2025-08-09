import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";
import { redirect } from "next/navigation";

type Invite = { garage_id: string; role: string };

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate invite
  let inv: Invite | null = null;
  try {
    const { data } = await supabase
      .rpc("validate_garage_invite", { p_token: token as unknown as string })
      .single();
    inv = data as Invite;
  } catch {
    inv = null;
  }
  if (!inv) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Invite invalid</h1>
        <p className="text-sm text-gray-600">This invite link is invalid or has expired.</p>
        <div className="mt-4"><Link href="/" className="text-blue-600 hover:underline">Go home</Link></div>
      </div>
    );
  }
  const garageId = inv.garage_id as string;
  const role = inv.role as string;

  if (!user) {
    // Prompt sign-in (Google) and return to this page with next
    const next = encodeURIComponent(`/invite/${token}`);
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Join garage</h1>
        <p className="text-sm text-gray-700">Sign in to accept your invite.</p>
        <form action={async () => { 'use server'; }}>
          <a href={`/auth/google?next=${next}`} className="inline-block bg-red-600 text-white rounded px-3 py-1">Continue with Google</a>
        </form>
      </div>
    );
  }

  async function accept() {
    "use server";
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    // Accept via RPC to perform upsert/upgrade
    const { error } = await supabase.rpc("accept_garage_invite", { p_token: token as unknown as string });
    if (error) throw new Error(error.message);
    await logActivity({ actorId: user.id, entityType: "garage", entityId: garageId, action: "member_joined_from_invite", diff: { role } });
    // Redirect to vehicles with toast param
    redirect(`/vehicles?garage=${garageId}&joined=1`);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Accept invite</h1>
      <p className="text-sm text-gray-700">You are being invited to join this garage as <span className="font-medium">{role}</span>.</p>
      <form action={accept} className="flex items-center gap-3" data-test="invite-accept">
        <button type="submit" className="bg-black text-white rounded px-3 py-1">Accept</button>
        <Link href="/vehicles" className="text-blue-600 hover:underline">Cancel</Link>
      </form>
    </div>
  );
}


