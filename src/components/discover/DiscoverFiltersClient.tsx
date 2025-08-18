"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Options = {
	year: string[];
	make: string[];
	body: string[];
	classification: string[];
	drive: string[];
	transmission: string[];
	engine: string[];
	doors: string[];
	seating: string[];
	fuel: string[];
	country: string[];
};

export default function DiscoverFiltersClient({ options }: { options: Options }) {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();

	const [loaded, setLoaded] = useState(false);
	const [opts, setOpts] = useState<Options>(options);

	useEffect(() => {
		let canceled = false;
		(async () => {
			try {
				const res = await fetch("/api/discover/filters", { cache: "no-store" });
				const data = await res.json();
				if (!canceled && data?.options) {
					setOpts(data.options as Options);
					setLoaded(true);
				}
			} catch {}
		})();
		return () => { canceled = true; };
	}, []);

	const replace = (next: URLSearchParams) => {
		next.set("page", "1");
		router.replace(`${pathname}?${next.toString()}`, { scroll: false });
		if (typeof window !== "undefined") {
			window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		}
	};

	const def = (key: keyof Options, label: string, allLabel = `All ${label}`) => {
		const val = sp.get(key as string) ?? "";
		const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
			const next = new URLSearchParams(sp.toString());
			const v = e.target.value;
			if (v) next.set(key as string, v); else next.delete(key as string);
			replace(next);
		};
		return (
			<div className="mb-3">
				<label className="mb-1 block text-sm text-gray-700">{label}</label>
				<select className="w-full rounded border px-2 py-1 text-sm" value={val} onChange={onChange} disabled={!loaded}>
					<option value="">{allLabel}</option>
					{(opts[key] ?? []).map((o) => (
						<option key={`${key}-${o}`} value={o}>{o}</option>
					))}
				</select>
			</div>
		);
	};

	return (
		<div>
			<div className="mb-3">
				<label className="mb-1 block text-sm text-gray-700">Search</label>
				<input
					className="w-full rounded border px-2 py-1 text-sm"
					defaultValue={sp.get("q") ?? ""}
					onChange={(e) => {
						const next = new URLSearchParams(sp.toString());
						const v = e.target.value.trim();
						if (v) next.set("q", v); else next.delete("q");
						replace(next);
					}}
				/>
			</div>
			{def("year", "Year")}
			{def("make", "Make")}
			{def("body", "Body Type")}
			{def("classification", "Car Classification")}
			{def("drive", "Drive Type")}
			{def("transmission", "Transmission")}
			{def("engine", "Engine Configuration")}
			{def("doors", "Doors")}
			{def("seating", "Total Seating")}
			{def("fuel", "Fuel Type")}
			{def("country", "Country Of Origin")}
			<div className="mt-4 text-right">
				<button
					className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white"
					onClick={() => router.replace(pathname || "/")}
				>
					Reset All
				</button>
			</div>
		</div>
	);
}


