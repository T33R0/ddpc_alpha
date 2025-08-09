import { ImageResponse } from "next/og";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, photo_url, privacy")
    .eq("id", id)
    .maybeSingle();

  const title = vehicle?.nickname?.trim()
    ? vehicle.nickname
    : [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ") || "Vehicle";

  const photo = vehicle?.photo_url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#0a0a0a",
          color: "white",
          position: "relative",
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        {photo ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url(${photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.7,
            }}
          />
        ) : null}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 48,
            width: "100%",
            background: "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.6) 80%)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                fontSize: 24,
                opacity: 0.9,
              }}
            >
              <span
                style={{
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "6px 10px",
                  borderRadius: 999,
                }}
              >
                PUBLIC
              </span>
              <span>MyDDPC</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}


