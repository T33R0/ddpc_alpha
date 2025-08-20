import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getInvoiceUploadUrl } from "@/lib/storage";

type PostBody = {
  vehicleId?: string;
  title?: string;
  notes?: string | null;
  occurred_at?: string | null;
  cost?: number | null;
  wantInvoice?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : undefined;
    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    if (!vehicleId || !title) return NextResponse.json({ message: "vehicleId and title are required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = {
      vehicle_id: vehicleId,
      title,
      notes: typeof body.notes === "string" ? body.notes : null,
      occurred_at: typeof body.occurred_at === "string" ? body.occurred_at : null,
      cost: typeof body.cost === "number" ? body.cost : null,
    };
    const { data, error } = await supabase
      .from("service_record" as unknown as string)
      .insert(payload)
      .select("id, vehicle_id, title, occurred_at")
      .single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    let uploadUrl: { url: string; path: string } | undefined;
    if (body.wantInvoice) {
      const signed = await getInvoiceUploadUrl((data as any).vehicle_id, (data as any).id);
      uploadUrl = { url: signed.url, path: signed.path };
    }

    return NextResponse.json({ ok: true, record: data, uploadUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


