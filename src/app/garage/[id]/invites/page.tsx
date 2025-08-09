import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";
import { logActivity } from "@/lib/activity/log";

type Role = "MANAGER" | "CONTRIBUTOR" | "VIEWER";

function makeToken(): string {
  // Simple ULID-like sortable token; ok for invites
  const ts = Date.now().toString(36);
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => (b % 36).toString(36))
    .join("");
  return `${ts}${rand}`;
}

export default async function InvitesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: garageId } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-4">Sign in required.</div>;

  async function getRole(userId: string): Promise<"OWNER"|"MANAGER"|"CONTRIBUTOR"|"VIEWER"|null> {
    // OWNER via garage.owner_id or membership as MANAGER+
    const { data: g } = await supabase.from("garage").select("owner_id").eq("id", garageId).maybeSingle();
    if (g?.owner_id === userId) return "OWNER";
    const { data: m } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", garageId)
      .eq("user_id", userId)
      .maybeSingle();
    return (m?.role ?? null) as ("OWNER"|"MANAGER"|"CONTRIBUTOR"|"VIEWER"|null);
  }
  const myRole = await getRole(user.id);
  const canManage = myRole === "OWNER" || myRole === "MANAGER";
  if (!canManage) return <div className="p-4">Access denied.</div>;

  const { data: invites } = await supabase
    .from("garage_invite")
    .select("id, role, token, expires_at, created_at, created_by")
    .eq("garage_id", garageId)
    .order("created_at", { ascending: false });

  async function createInvite(formData: FormData) {
    "use server";
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const role = (formData.get("role") || "VIEWER").toString() as Role;
    const days = Number((formData.get("days") || "7").toString());
    const token = makeToken();
    const expires_at = new Date(Date.now() + Math.max(1, Math.min(90, days)) * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("garage_invite")
      .insert({ garage_id: garageId, role, token, expires_at, created_by: user.id })
      .select("id, token")
      .single();
    if (error) throw new Error(error.message);
    await logActivity({ actorId: user.id, entityType: "garage", entityId: garageId, action: "invite_created", diff: { role, expires_at } });
  }

  async function revokeInvite(formData: FormData) {
    "use server";
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const id = (formData.get("id") || "").toString();
    const { error } = await supabase.from("garage_invite").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logActivity({ actorId: user.id, entityType: "garage", entityId: garageId, action: "invite_revoked", diff: { id } });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invites</h1>
        <Link href={`/garage/${garageId}/members`} className="text-sm text-blue-600 hover:underline">Back to Members</Link>
      </div>
      <div className="border rounded bg-white p-3">
        <form action={createInvite} className="flex flex-wrap items-end gap-3" data-test="invite-create">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Role</label>
            <select name="role" className="border rounded px-2 py-1">
              <option value="VIEWER">VIEWER</option>
              <option value="CONTRIBUTOR">CONTRIBUTOR</option>
              <option value="MANAGER">MANAGER</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Expires</label>
            <select name="days" className="border rounded px-2 py-1">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
          <button type="submit" className="px-3 py-1 rounded bg-black text-white">Create</button>
        </form>
      </div>
      <div className="border rounded bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="p-2">Role</th>
              <th className="p-2">Expires</th>
              <th className="p-2">Link</th>
              <th className="p-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(invites ?? []).map((inv) => {
              const url = `${origin}/invite/${inv.token}`;
              const exp = new Date(inv.expires_at as string);
              const expired = Date.now() > exp.getTime();
              return (
                <tr key={inv.id} className="border-b">
                  <td className="p-2">{inv.role}</td>
                  <td className="p-2">{new Date(inv.expires_at as string).toLocaleString()} {expired ? <span className="text-red-600">(expired)</span> : null}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <input readOnly value={url} className="border rounded px-2 py-1 w-80" />
                      <button
                        className="text-xs px-2 py-1 border rounded"
                        type="button"
                        aria-label="Copy invite link"
                        data-test="invite-copy"
                        onClick={() => navigator.clipboard?.writeText(url)}
                      >Copy</button>
                    </div>
                  </td>
                  <td className="p-2">
                    <form action={revokeInvite}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="text-xs px-2 py-1 border rounded text-red-700" data-test="invite-revoke" type="submit">Revoke</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


