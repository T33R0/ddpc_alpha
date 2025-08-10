import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { serverLog } from "@/lib/serverLog";

function getProjectRef(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // <ref>.supabase.co
    const [sub] = u.hostname.split(".");
    return sub || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Prepare a redirect response early so we can allow Supabase to set cookies on it
  const res = NextResponse.redirect(new URL(redirectTo, req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<NextResponse["cookies"]["set"]>[2]) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Parameters<NextResponse["cookies"]["set"]>[2]) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  try {
    // E2E test bypass to simulate success redirect without hitting Supabase.
    // This helps Playwright verify route behavior without real OAuth.
    if (
      process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === "1" &&
      code === "TEST"
    ) {
      serverLog("auth_callback_success", { reason: "e2e_bypass" });
      return res;
    }
    if (!code) {
      serverLog("auth_callback_error", { reason: "missing_code" });
      return errorResponse(req, "Missing authorization code.");
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      serverLog("auth_callback_error", { reason: error.message });
      return errorResponse(req, "We couldn’t complete sign-in. Please try again.");
    }

    serverLog("auth_callback_success", {
      project_ref: getProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL || undefined) ?? undefined,
    });
    return res;
  } catch (err) {
    await serverLog("auth_callback_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
  }
}

function errorResponse(req: NextRequest, message: string): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Sign-in error</title><style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fafafa;color:#111;padding:24px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;max-width:520px;width:100%;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}.inner{padding:24px 20px}.title{font-size:18px;font-weight:600;margin:0 0 8px}.msg{margin:0 0 16px;color:#374151}.btn{display:inline-block;background:#111;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none}</style></head><body><div class="card"><div class="inner"><h1 class="title">Sign-in error</h1><p class="msg">${message}</p><a class="btn" href="/">Try again</a></div></div></body></html>`;
  return new NextResponse(html, { status: 400, headers: { "content-type": "text/html; charset=utf-8" } });
}
