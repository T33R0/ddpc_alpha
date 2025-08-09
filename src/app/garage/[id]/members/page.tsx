import { getServerSupabase } from "@/lib/supabase";

type Member = { id: string; user_id: string; role: "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER" };

async function getRoleForUser(garageId: string, userId: string) {
  const supabase = await getServerSupabase();
  const { data: m } = await supabase
    .from("garage_member")
    .select("role")
    .eq("garage_id", garageId)
    .eq("user_id", userId)
    .maybeSingle();
  return (m?.role as Member["role"]) || null;
}

async function getMembers(garageId: string) {
  const supabase = await getServerSupabase();
  const { data: members } = await supabase
    .from("garage_member")
    .select("id, user_id, role")
    .eq("garage_id", garageId)
    .order("created_at", { ascending: true });

  // Best-effort email lookup via auth.users. If denied by RLS, fall back to user_id.
  const results: Array<Member & { email: string }> = [];
  for (const m of (members ?? []) as Member[]) {
    let email = m.user_id;
    try {
      const { data: u } = await supabase
        .from("auth.users" as unknown as string)
        .select("id, email")
        .eq("id", m.user_id)
        .maybeSingle();
      if (u?.email) email = u.email as string;
    } catch {
      // ignore
    }
    results.push({ ...m, email });
  }
  return results;
}

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: garageId } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-4">Sign in required.</div>;

  const myRole = await getRoleForUser(garageId, user.id);
  if (!myRole) return <div className="p-4">Access denied.</div>;

  const members = await getMembers(garageId);
  const canManage = myRole === "OWNER" || myRole === "MANAGER";
  const isOwner = myRole === "OWNER";

  async function addMember(formData: FormData) {
    "use server";
    const supabase = await getServerSupabase();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const role = (formData.get("role") || "VIEWER").toString() as Member["role"];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // ensure caller permission
    const callerRole = await getRoleForUser(garageId, user.id);
    if (!(callerRole === "OWNER" || callerRole === "MANAGER")) throw new Error("Forbidden");

    // lookup by email in auth.users
    const { data: found, error: lookupErr } = await supabase
      .from("auth.users" as unknown as string)
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (lookupErr || !found) {
      throw new Error("User must sign in first.");
    }

    const { error: insErr } = await supabase
      .from("garage_member")
      .insert({ garage_id: garageId, user_id: (found as { id: string }).id, role });
    if (insErr) throw new Error(insErr.message);
  }

  async function changeRole(formData: FormData) {
    "use server";
    const supabase = await getServerSupabase();
    const memberId = (formData.get("member_id") || "").toString();
    const role = (formData.get("role") || "VIEWER").toString() as Member["role"];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const callerRole = await getRoleForUser(garageId, user.id);
    if (!(callerRole === "OWNER" || callerRole === "MANAGER")) throw new Error("Forbidden");
    // Fetch target to enforce invariants
    const { data: target } = await supabase
      .from("garage_member")
      .select("id, role, user_id")
      .eq("id", memberId)
      .maybeSingle();
    if (!target) throw new Error("Not found");
    if ((target as Member).role === "OWNER") {
      throw new Error("Cannot change owner role");
    }
    if (callerRole === "MANAGER" && role === "OWNER") {
      throw new Error("Only owner can assign OWNER");
    }
    const { error } = await supabase.from("garage_member").update({ role }).eq("id", memberId);
    if (error) throw new Error(error.message);
  }

  async function removeMember(formData: FormData) {
    "use server";
    const supabase = await getServerSupabase();
    const memberId = (formData.get("member_id") || "").toString();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const callerRole = await getRoleForUser(garageId, user.id);
    if (!(callerRole === "OWNER" || callerRole === "MANAGER")) throw new Error("Forbidden");
    // Prevent removing OWNER
    const { data: target } = await supabase
      .from("garage_member")
      .select("id, role")
      .eq("id", memberId)
      .maybeSingle();
    if (!target) throw new Error("Not found");
    if ((target as Member).role === "OWNER") throw new Error("Cannot remove owner");
    const { error } = await supabase.from("garage_member").delete().eq("id", memberId);
    if (error) throw new Error(error.message);
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
      </div>
      <div className="border rounded bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{m.email}</td>
                <td className="p-2">{m.role}</td>
                <td className="p-2">
                  {canManage && (
                    <form action={changeRole} className="inline-flex items-center gap-2">
                      <input type="hidden" name="member_id" value={m.id} />
                      <select
                        name="role"
                        defaultValue={m.role}
                        className="border rounded px-2 py-1 text-xs"
                        disabled={m.role === "OWNER"}
                        title={m.role === "OWNER" ? "Owner role cannot be changed" : undefined}
                      >
                        <option value="OWNER" disabled={!isOwner}>OWNER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                      <button
                        className="text-xs px-2 py-1 border rounded bg-gray-50 disabled:opacity-50"
                        disabled={m.role === "OWNER"}
                        title={m.role === "OWNER" ? "Owner role cannot be changed" : undefined}
                      >
                        Update
                      </button>
                    </form>
                  )}
                  {canManage && (
                    <form action={removeMember} className="inline-block ml-2">
                      <input type="hidden" name="member_id" value={m.id} />
                      <button
                        className="text-xs px-2 py-1 border rounded text-red-700 disabled:opacity-50"
                        disabled={m.role === "OWNER"}
                        title={m.role === "OWNER" ? "Owner cannot be removed" : undefined}
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canManage && (
        <form action={addMember} className="flex items-center gap-2 border rounded p-3 bg-white">
          <input name="email" type="email" placeholder="user@example.com" className="border rounded px-2 py-1 flex-1" required />
          <select name="role" className="border rounded px-2 py-1 text-sm">
            <option value="MANAGER">MANAGER</option>
            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button type="submit" className="px-3 py-1 rounded bg-black text-white">Add</button>
        </form>
      )}
    </div>
  );
}


