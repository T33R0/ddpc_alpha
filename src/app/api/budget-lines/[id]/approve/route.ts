import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type Body = {
  token?: string;
  decision?: "approved" | "declined";
  note?: string | null;
  email?: string | null;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as Body;
    const token = typeof body.token === "string" ? body.token : undefined;
    const decision = body.decision === "approved" || body.decision === "declined" ? body.decision : undefined;
    if (!token || !decision) return NextResponse.json({ message: "token and decision required" }, { status: 400 });

    const supabase = await getServerSupabase();

    // Validate token via join on plan
    type BudgetLineRow = { id: string; budget_plan_id: string; status: string };
    const { data: line, error: lineErr } = await supabase
      .from("budget_line" as unknown as string)
      .select("id, budget_plan_id, status")
      .eq("id", id)
      .maybeSingle<BudgetLineRow>();
    if (lineErr) return NextResponse.json({ message: lineErr.message }, { status: 400 });
    if (!line) return NextResponse.json({ message: "Line not found" }, { status: 404 });

    type BudgetPlanRow = { id: string; share_token: string | null };
    const { data: plan } = await supabase
      .from("budget_plan" as unknown as string)
      .select("id, share_token")
      .eq("id", line.budget_plan_id)
      .maybeSingle<BudgetPlanRow>();
    if (!plan || plan.share_token !== token) return NextResponse.json({ message: "Invalid token" }, { status: 403 });

    // Insert approval record
    const { error: apprErr } = await supabase
      .from("budget_approval" as unknown as string)
      .insert({ budget_line_id: id, decision, note: body.note ?? null, email: body.email ?? null });
    if (apprErr) return NextResponse.json({ message: apprErr.message }, { status: 400 });

    // Update line status
    const newStatus = decision === "approved" ? "approved" : "declined";
    const { error: updErr } = await supabase
      .from("budget_line" as unknown as string)
      .update({ status: newStatus })
      .eq("id", id);
    if (updErr) return NextResponse.json({ message: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


