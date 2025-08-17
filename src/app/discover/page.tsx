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
		return candidates[0] || "";
	}

	// Resolve critical columns using dynamic probing to survive schema differences
	const yearCol = await pickColDynamic(["year", "model_year"]);
	const makeCol = await pickColDynamic(["make", "brand"]);
	const modelCol = await pickColDynamic(["model"]);
	const trimCol = await pickColDynamic(["trim"]);

	// Column mapping per possible names present in different datasets
	const columns = {
		year: yearCol || pickColumn(probeRow, ["year", "model_year"]) || "year",
		make: makeCol || pickColumn(probeRow, ["make", "brand"]) || "make",
		model: modelCol || pickColumn(probeRow, ["model"]) || "model",
		trim: trimCol || pickColumn(probeRow, ["trim"]) || "trim",
		body: pickColumn(probeRow, ["body_type", "body_style"]) || "body_type",
		classification: pickColumn(probeRow, ["car_classification", "class", "segment"]) || "car_classification",
		drive: pickColumn(probeRow, ["drivetrain", "drive_type", "drive"]) || "drivetrain",
		transmission: pickColumn(probeRow, ["transmission", "transmission_type"]) || "transmission",
		engineConfig: pickColumn(probeRow, ["engine_configuration", "engine", "engine_config"]) || "engine_configuration",
		cylinders: pickColumn(probeRow, ["cylinders"]) || "cylinders",
		displacement: pickColumn(probeRow, ["displacement_l", "displacement", "engine_liters"]) || "displacement_l",
		power: pickColumn(probeRow, ["power_hp", "hp", "power"]) || "power_hp",
		torque: pickColumn(probeRow, ["torque_lbft", "torque", "torque_lb_ft"]) || "torque_lbft",
		weight: pickColumn(probeRow, ["weight_lbs", "curb_weight_lbs", "weight"]) || "weight_lbs",
		image: pickColumn(probeRow, ["image_url", "photo_url"]) || "image_url",
		country: pickColumn(probeRow, ["country_of_origin", "origin", "country"]) || "country_of_origin",
		seating: pickColumn(probeRow, ["seating", "total_seating", "seats"]) || "seating",
		doors: pickColumn(probeRow, ["doors", "num_doors"]) || "doors",
		fuel: pickColumn(probeRow, ["fuel_type", "fuel"]) || "fuel_type",
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

	// Build main query with total count
	let q = supabase.from("vehicle_data").select("*", { count: "exact", head: false });

	const eqIf = (key: string, col: string | null) => {
		const [val] = toArray(searchParams[key]);
		if (val && col) q = q.eq(col, val);
	};

	// Apply filters if present
	eqIf("year", columns.year);
	eqIf("make", columns.make);
	eqIf("body", columns.body);
	eqIf("classification", columns.classification);
	eqIf("drive", columns.drive);
	eqIf("transmission", columns.transmission);
	eqIf("engine", columns.engineConfig);
	eqIf("doors", columns.doors);
	eqIf("seating", columns.seating);
	eqIf("fuel", columns.fuel);
	eqIf("country", columns.country);

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
	}

	// Apply range for pagination
	q = q.range(from, to);

	const { data: vehiclesRaw, count: totalCount, error: vehiclesError } = await q;
	if (vehiclesError) {
		return (
			<div className="mx-auto max-w-7xl px-4 py-6">
				<div className="rounded border p-4 bg-yellow-50 text-yellow-900">
					<div className="font-semibold mb-1">Discover data unavailable</div>
					<div className="text-sm">{vehiclesError.message}</div>
				</div>
			</div>
		);
	}
	const vehicles: VehicleDataRow[] = (vehiclesRaw as unknown as VehicleDataRow[]) || [];

	// Build filter options (distinct values) based on available columns
	async function distinct(col: string | null): Promise<string[]> {
		if (!col) return [];
		try {
			const { data } = await supabase.from("vehicle_data").select(`${col}`, { count: "exact", head: false }).not(col, "is", null).order(col, { ascending: true }).limit(500);
			const vals = (data as Array<Record<string, string | number>> | null) || [];
			return Array.from(new Set(vals.map(v => String(v[col as keyof typeof v])))).filter(Boolean);
		} catch {
			return [];
		}
	}

	const [years, makes, bodies, classes, drives, transmissions, engines, doors, seatings, fuels, countries] = await Promise.all([
		distinct(columns.year),
		distinct(columns.make),
		distinct(columns.body),
		distinct(columns.classification),
		distinct(columns.drive),
		distinct(columns.transmission),
		distinct(columns.engineConfig),
		distinct(columns.doors),
		distinct(columns.seating),
		distinct(columns.fuel),
		distinct(columns.country),
	]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-6">
			<aside className="col-span-12 md:col-span-3 lg:col-span-3">
				<div className="sticky top-4 rounded-lg border p-4">
					<h2 className="mb-3 text-lg font-semibold">Filters</h2>
					<DiscoverFiltersClient
						options={{
							year: years,
							make: makes,
							body: bodies,
							classification: classes,
							drive: drives,
							transmission: transmissions,
							engine: engines,
							doors: doors,
							seating: seatings,
							fuel: fuels,
							country: countries,
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
							const disp = v.displacement_l ? `${v.displacement_l} L` : null;
							const cyl = v.cylinders ? `${v.cylinders} cyl` : null;
							return [disp, cyl].filter(Boolean).join(" ");
						})();
						const drive = (v.drivetrain || v.drive_type || "") as string;

						const imageSrc = (v as Record<string, unknown>)[columns.image] as string | undefined;
						const fallbackSrc = (ddpcLogo as { src: string }).src;

						return (
							<DiscoverCard
								key={v.id}
								id={v.id}
								title={title || v.trim || "Vehicle"}
								imageSrc={imageSrc || fallbackSrc}
								stats={{
									power: v.power_hp ? `${v.power_hp} HP` : "N/A",
									engine: engineLabel || "N/A",
									weight: v.weight_lbs ? `${v.weight_lbs} lbs` : "N/A",
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


