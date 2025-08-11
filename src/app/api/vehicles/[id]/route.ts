import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function DELETE(_req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id", code: 400 }, { status: 400 });
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 });
    // Only allow delete if user owns the garage or vehicle.
    const { data: veh } = await supabase
      .from("vehicle")
      .select("id, garage_id")
      .eq("id", id)
      .maybeSingle();
    if (!veh) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });
    // Ensure user is a member with OWNER or MANAGER role
    const { data: member } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", veh.garage_id as string)
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (member?.role as string) ?? null;
    const canDelete = role === "OWNER" || role === "MANAGER";
    if (!canDelete) return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
    const { error } = await supabase.from("vehicle").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/vehicles");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg, code: 500 }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id", code: 400 }, { status: 400 });
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 });
    const form = await req.formData();
    const nickname = (form.get("nickname") || null) as string | null;
    const yearStr = (form.get("year") || "") as string;
    const year = yearStr ? Number(yearStr) : null;
    const make = (form.get("make") || null) as string | null;
    const model = (form.get("model") || null) as string | null;
    const trim = (form.get("trim") || null) as string | null;
    const privacy = ((form.get("privacy") || "PRIVATE") as string).toUpperCase();

    // Authorization: ensure user is a member of the garage
    const { data: veh } = await supabase.from("vehicle").select("garage_id").eq("id", id).maybeSingle();
    if (!veh) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });
    const { data: member } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", (veh as { garage_id: string }).garage_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (member?.role as string) ?? null;
    const canWrite = role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR";
    if (!canWrite) return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });

    const { error } = await supabase
      .from("vehicle")
      .update({ nickname, year, make, model, trim, privacy })
      .eq("id", id);
    if (error) throw error;
    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/vehicles");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg, code: 500 }, { status: 500 });
  }
}


