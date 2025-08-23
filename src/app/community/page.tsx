import Link from "next/link";
import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const supabase = await getServerSupabase();

  type Row = {
    id: string;
    year: number | null;
    make: string | null;
    model: string | null;
    nickname: string | null;
    photo_url: string | null;
  };

  let rows: Row[] = [];
  try {
    const { data } = await supabase
      .from("vehicle")
      .select("id, year, make, model, nickname, photo_url, privacy")
      .eq("privacy", "PUBLIC")
      .order("created_at", { ascending: false })
      .limit(24);
    rows = (data as Row[] | null) ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Community</h1>
        <p className="text-sm text-muted">Public rides shared by the community</p>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted">No public vehicles yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((v) => {
            const title = v.nickname?.trim() || [v.year ?? "", v.make ?? "", v.model ?? ""].filter(Boolean).join(" ");
            const alt = `${title || "Vehicle"} — cover photo`;
            return (
              <Link
                key={v.id}
                href={`/v/${v.id}`}
                className="group rounded-2xl overflow-hidden border border-neutral-800 bg-[#111318] hover:-translate-y-0.5 hover:shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                aria-label={title || "Vehicle"}
              >
                <div className="relative">
                  {v.photo_url ? (
                    <Image src={v.photo_url} alt={alt} width={640} height={300} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-bg text-muted flex items-center justify-center">No photo</div>
                  )}
                </div>
                <div className="p-4 space-y-1 text-sm">
                  <div className="font-medium truncate">{title || "Vehicle"}</div>
                  <div className="text-muted truncate">Public vehicle</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
