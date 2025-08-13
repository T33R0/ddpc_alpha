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
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
			const m = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(m.matches);
		const onChange = () => setReduced(m.matches);
			if ("addEventListener" in m) {
				m.addEventListener("change", onChange);
			} else if ("addListener" in m) {
				m.addListener(onChange);
			}
		return () => {
				if ("removeEventListener" in m) {
					m.removeEventListener("change", onChange);
				} else if ("removeListener" in m) {
					m.removeListener(onChange);
				}
		};
	}, []);
	return reduced;
}


