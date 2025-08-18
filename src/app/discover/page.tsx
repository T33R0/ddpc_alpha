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

	// Resolve columns using dynamic probing for resilience across schemas
	const columns = {
		year: await pickColDynamic(["year", "model_year"]) || "",
		make: await pickColDynamic(["make", "brand"]) || "",
		model: await pickColDynamic(["model"]) || "",
		trim: await pickColDynamic(["trim"]) || "",
		body: await pickColDynamic(["body_type", "body_style"]) || "",
		classification: await pickColDynamic(["car_classification", "class", "segment"]) || "",
		drive: await pickColDynamic(["drivetrain", "drive_type", "drive"]) || "",
		transmission: await pickColDynamic(["transmission", "transmission_type"]) || "",
		engineConfig: await pickColDynamic(["engine_configuration", "engine", "engine_config"]) || "",
		cylinders: await pickColDynamic(["cylinders"]) || "",
		displacement: await pickColDynamic(["displacement_l", "displacement", "engine_liters"]) || "",
		power: await pickColDynamic(["power_hp", "hp", "power"]) || "",
		torque: await pickColDynamic(["torque_lbft", "torque", "torque_lb_ft"]) || "",
		weight: await pickColDynamic(["weight_lbs", "curb_weight_lbs", "weight"]) || "",
		image: await pickColDynamic(["image_url", "photo_url"]) || "",
		country: await pickColDynamic(["country_of_origin", "origin", "country"]) || "",
		seating: await pickColDynamic(["seating", "total_seating", "seats"]) || "",
		doors: await pickColDynamic(["doors", "num_doors"]) || "",
		fuel: await pickColDynamic(["fuel_type", "fuel"]) || "",
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

	// Build filter options (distinct values) based on available columns
	async function distinct(col: string | null): Promise<string[]> {
		if (!col) return [];
		try {
			// Fetch in batches to include more than the default limit; dedupe client-side
			const MAX = 5000;
			const BATCH = 1000;
			const results = new Set<string>();
			for (let start = 0; start < MAX; start += BATCH) {
				const { data } = await supabase
					.from("vehicle_data")
					.select(`${col}`)
					.not(col, "is", null)
					.order(col as string, { ascending: true })
					.range(start, start + BATCH - 1);
				const rows = (data as Array<Record<string, string | number>> | null) || [];
				for (const r of rows) {
					const v = String(r[col as keyof typeof r] ?? "");
					if (v) results.add(v);
				}
				if (rows.length < BATCH) break;
			}
			return Array.from(results);
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
				<div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto rounded-lg border p-4">
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


