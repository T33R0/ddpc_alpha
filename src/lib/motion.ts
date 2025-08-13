"use client";
import { useEffect, useState } from "react";

export const cubicEasing: [number, number, number, number] = [0.2, 0.6, 0.2, 1];

export const motionDurations = {
	micro: 0.15, // 150ms
	ui: 0.22, // 220ms
	page: 0.28, // 280ms
	hero: 0.32, // 320ms
} as const;

export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	function addChangeListener(m: MediaQueryList, handler: () => void): () => void {
		if (typeof m.addEventListener === "function") {
			m.addEventListener("change", handler);
			return () => m.removeEventListener("change", handler);
		}
		// Fallback for older browsers: addListener/removeListener
		const legacy = m as unknown as {
			addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
			removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
		};
		if (typeof legacy.addListener === "function") {
			const cb = () => handler();
			legacy.addListener(cb);
			return () => legacy.removeListener?.(cb);
		}
		return () => {};
	}

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
			const m = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(m.matches);
		const cleanup = addChangeListener(m, () => setReduced(m.matches));
		return cleanup;
	}, []);
	return reduced;
}


