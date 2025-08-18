import { getServerSupabase } from "@/lib/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import DiscoverFiltersClient from "@/components/discover/DiscoverFiltersClient";
import DiscoverCard from "@/components/discover/DiscoverCard";
import PaginationClient from "@/components/discover/PaginationClient";
import DiscoverCompareBarClient from "@/components/discover/DiscoverCompareBarClient";

// Static import of fallback DDPC logo from the repository's media folder
// This brings the asset into the Next build pipeline even though it's not in /public
// Path relative to this file: src/app/discover/page.tsx → ../../../media/branding/Fiverr Premium Kit/PNG Logo Files/Original Logo.png
import ddpcLogo from "../../../media/branding/Fiverr Premium Kit/PNG Logo Files/Original Logo.png";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type VehicleDataRow = {
	id: string;
	year?: number | string | null;
	make?: string | null;
	model?: string | null;
	trim?: string | null;
	body_type?: string | null;
	body_style?: string | null;
	car_classification?: string | null;
	drivetrain?: string | null;
	drive_type?: string | null;
	transmission?: string | null;
	engine_configuration?: string | null;
	cylinders?: number | string | null;
	displacement_l?: number | string | null;
	power_hp?: number | string | null;
	torque_lbft?: number | string | null;
	weight_lbs?: number | string | null;
	image_url?: string | null;
};

// Helper: choose the first column name that exists on the example row
function pickColumn(row: Record<string, unknown> | null, candidates: string[]): string | null {
	if (!row) return candidates[0] ?? null;
	for (const c of candidates) {
		if (c in row) return c;
	}
	return null;
}

function toArray(val: string | string[] | undefined): string[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}

export default async function DiscoverPage({ searchParams = {} }: { searchParams?: SearchParams }) {
	// Prefer service role (server-side only) if available to ensure public discover data loads regardless of anon RLS
	const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const supabase: SupabaseClient = (adminUrl && serviceKey)
		? createClient(adminUrl, serviceKey, { auth: { persistSession: false } })
		: await getServerSupabase();

	// Probe one row to infer available columns for resilient filtering
	const probe = await supabase.from("vehicle_data").select("*").limit(1);
	const probeRow = Array.isArray(probe.data) && probe.data.length > 0 ? (probe.data[0] as Record<string, unknown>) : null;


	async function pickColDynamic(candidates: string[]): Promise<string> {
		for (const c of candidates) {
			try {
				const { data } = await supabase.from("vehicle_data").select(c, { head: false, count: "exact" }).not(c, "is", null).limit(1);
				if (Array.isArray(data) && data.length > 0) return c;
			} catch {}
		}
		// None of the candidates exist in this dataset
		return "";
	}

	// Resolve columns using a single probe row for resilience across schemas (avoid many round-trips)
	const columns = {
		year: pickColumn(probeRow, ["year", "model_year"]) || "",
		make: pickColumn(probeRow, ["make", "brand"]) || "",
		model: pickColumn(probeRow, ["model"]) || "",
		trim: pickColumn(probeRow, ["trim"]) || "",
		body: pickColumn(probeRow, ["body_type", "body_style"]) || "",
		classification: pickColumn(probeRow, ["car_classification", "class", "segment"]) || "",
		drive: pickColumn(probeRow, ["drivetrain", "drive_type", "drive"]) || "",
		transmission: pickColumn(probeRow, ["transmission", "transmission_type"]) || "",
		engineConfig: pickColumn(probeRow, ["engine_configuration", "engine", "engine_config"]) || "",
		cylinders: pickColumn(probeRow, ["cylinders"]) || "",
		displacement: pickColumn(probeRow, ["displacement_l", "displacement", "engine_liters"]) || "",
		power: pickColumn(probeRow, ["power_hp", "horsepower", "bhp", "power_bhp", "hp", "power"]) || "",
		torque: pickColumn(probeRow, ["torque_lbft", "torque", "torque_lb_ft"]) || "",
		weight: pickColumn(probeRow, ["weight_lbs", "curb_weight_lbs", "weight"]) || "",
		image: pickColumn(probeRow, ["image_url", "photo_url"]) || "",
		country: pickColumn(probeRow, ["country_of_origin", "origin", "country"]) || "",
		seating: pickColumn(probeRow, ["seating", "total_seating", "seats"]) || "",
		doors: pickColumn(probeRow, ["doors", "num_doors"]) || "",
		fuel: pickColumn(probeRow, ["fuel_type", "fuel"]) || "",
	};

	// Pagination params
	const allowedLimits = new Set([10, 20, 50, 100]);
	const limit = (() => {
		const raw = Number(searchParams["limit"] ?? 20);
		return allowedLimits.has(raw) ? raw : 20;
	})();
	const page = Math.max(1, Number(searchParams["page"] ?? 1));
	const from = (page - 1) * limit;
	const to = from + limit - 1;

	// Build main query with a narrow column list and faster, planned count
	const selectCols = [
		"id",
		columns.year || undefined,
		columns.make || undefined,
		columns.model || undefined,
		columns.trim || undefined,
		(columns.displacement || columns.engineConfig) || undefined,
		columns.cylinders || undefined,
		columns.drive || undefined,
		columns.power || undefined,
		columns.weight || undefined,
		columns.image || undefined,
	].filter(Boolean).join(",");

	let q = supabase.from("vehicle_data").select(selectCols, { count: "planned", head: false });

	const eqIf = (key: string, col: string | null) => {
		const [val] = toArray(searchParams[key]);
		if (val && col) q = q.eq(col, val);
	};

	// Apply filters if present
	// Apply only filters whose columns were resolved
	if (columns.year) eqIf("year", columns.year);
	if (columns.make) eqIf("make", columns.make);
	if (columns.body) eqIf("body", columns.body);
	if (columns.classification) eqIf("classification", columns.classification);
	if (columns.drive) eqIf("drive", columns.drive);
	if (columns.transmission) eqIf("transmission", columns.transmission);
	if (columns.engineConfig) eqIf("engine", columns.engineConfig);
	if (columns.doors) eqIf("doors", columns.doors);
	if (columns.seating) eqIf("seating", columns.seating);
	if (columns.fuel) eqIf("fuel", columns.fuel);
	if (columns.country) eqIf("country", columns.country);

	const text = (searchParams["q"] as string | undefined)?.trim();
	if (text) {
		// Try a simple OR ilike across make/model/trim if available
		const like = `%${text}%`;
		const ors: string[] = [];
		if (columns.make) ors.push(`${columns.make}.ilike.${like}`);
		if (columns.model) ors.push(`${columns.model}.ilike.${like}`);
		if (columns.trim) ors.push(`${columns.trim}.ilike.${like}`);
		if (ors.length > 0) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore - postgrest filter string
			q = q.or(ors.join(","));
		}
	}

	// Basic ordering for determinism
	if (columns.year && columns.make && columns.model) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - chained order accepted by supabase-js
		q = q.order(columns.year as string, { ascending: false }).order(columns.make as string).order(columns.model as string);
	} else if (columns.make && columns.model) {
		q = q.order(columns.make as string).order(columns.model as string);
	} else if (columns.make) {
		q = q.order(columns.make as string);
	} else if (columns.model) {
		q = q.order(columns.model as string);
	}

	// Apply range for pagination
	q = q.range(from, to);

	const { data: vehiclesRaw, count: totalCount, error: vehiclesError } = await q;
	if (vehiclesError) {
		return (
			<div className="mx-auto max-w-7xl px-4 py-6">
				<div className="rounded border p-4 bg-yellow-50 text-yellow-900">
					<div className="font-semibold mb-1">Discover data unavailable</div>
					<div className="text-sm break-all">{vehiclesError.message}</div>
				</div>
			</div>
		);
	}
	const vehicles: VehicleDataRow[] = (vehiclesRaw as unknown as VehicleDataRow[]) || [];

	// Safe accessors for stats columns that may be absent
	const getStat = (row: VehicleDataRow, col: string | ""): string | null => {
		if (!col) return null;
		const r = row as unknown as Record<string, unknown>;
		const v = r[col];
		return v == null ? null : String(v);
	};

	// Defer filter option lists to client via /api/discover/filters for faster SSR

	return (
		<div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-6">
			<aside className="col-span-12 md:col-span-3 lg:col-span-3">
				<div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto rounded-lg border p-4">
					<h2 className="mb-3 text-lg font-semibold">Filters</h2>
					<DiscoverFiltersClient
						options={{
							year: [],
							make: [],
							body: [],
							classification: [],
							drive: [],
							transmission: [],
							engine: [],
							doors: [],
							seating: [],
							fuel: [],
							country: [],
						}}
					/>
				</div>
			</aside>
			<main className="col-span-12 md:col-span-9 lg:col-span-9">
				<PaginationClient totalCount={totalCount ?? 0} page={page} limit={limit} />
				<DiscoverCompareBarClient />
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					{vehicles.map((v) => {
						const title = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim();
						const engineLabel = (() => {
							const disp = getStat(v, columns.displacement);
							const cyl = getStat(v, columns.cylinders);
							const dispStr = disp ? `${disp} L` : null;
							const cylStr = cyl ? `${cyl} cyl` : null;
							return [dispStr, cylStr].filter(Boolean).join(" ");
						})();
						const drive = getStat(v, columns.drive) || "";

						const imageSrc = (columns.image ? (v as Record<string, unknown>)[columns.image] as string | undefined : undefined);
						const fallbackSrc = (ddpcLogo as { src: string }).src;

						return (
							<DiscoverCard
								key={v.id}
								id={v.id}
								title={title || v.trim || "Vehicle"}
								imageSrc={imageSrc || fallbackSrc}
								stats={{
									power: (() => {
										const p = getStat(v, columns.power);
										return p ? `${p} HP` : "N/A";
									})(),
									engine: engineLabel || "N/A",
									weight: (() => {
										const w = getStat(v, columns.weight);
										return w ? `${w} lbs` : "N/A";
									})(),
									drive: drive || "N/A",
								}}
							/>
						);
					})}
				</div>
				<PaginationClient totalCount={totalCount ?? 0} page={page} limit={limit} />
			</main>
		</div>
	);
}


