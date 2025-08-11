import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });

  try {
    // Authorization: ensure user is an OWNER or MANAGER of the vehicle's garage
    const { data: veh } = await supabase
      .from("vehicle")
      .select("garage_id")
      .eq("id", id)
      .maybeSingle();
    if (!veh) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const { data: member } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", (veh as { garage_id: string }).garage_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (member?.role as string) ?? null;
    const authorized = role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR";
    if (!authorized) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const key = `${id}/cover.${ext}`;
    const { error: upErr } = await supabase.storage.from("vehicle-media").upload(key, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message || "upload_failed" }, { status: 500 });

    // Save public URL in DB for faster access (optional)
    const { data: urlData } = supabase.storage.from("vehicle-media").getPublicUrl(key);
    const photo_url = urlData.publicUrl;
    await supabase.from("vehicle").update({ photo_url }).eq("id", id);

    return NextResponse.json({ ok: true, url: photo_url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


