"use client";

import { useEffect } from "react";

type SlideKey = "OVERVIEW" | "SPEC" | "TIMELINE" | "TASKS" | "BUILD" | "PARTS";

function ensureSlideControl(timeoutMs = 2000, intervalMs = 50): Promise<((key: SlideKey) => void) | null> {
	return new Promise((resolve) => {
		const start = Date.now();
		const tryGet = () => {
			const setter = (window as unknown as { __vehSetSlide?: (key: SlideKey) => void }).__vehSetSlide || null;
			if (setter) {
				resolve(setter);
				return;
			}
			if (Date.now() - start >= timeoutMs) {
				resolve(null);
				return;
			}
			setTimeout(tryGet, intervalMs);
		};
		tryGet();
	});
}

export default function VehicleTabController() {
	useEffect(() => {
		const sections: Record<string, HTMLElement | null> = {
			overview: document.getElementById("veh-content-overview"),
			media: document.getElementById("veh-content-media"),
			wishlist: document.getElementById("veh-content-wishlist"),
			jobs: document.getElementById("veh-content-jobs"),
			receipts: document.getElementById("veh-content-receipts"),
			timeline: document.getElementById("veh-content-timeline"),
		};

		const setActive = (targetName: string) => {
			document.querySelectorAll<HTMLAnchorElement>('a[data-veh-nav]').forEach((a) => {
				const t = a.getAttribute('data-target');
				const active = (t === targetName);
				const bar = a.querySelector('span');
				if (bar) bar.className = 'block h-[2px] mt-2 rounded-full transition-all duration-200 ' + (active ? 'bg-fg w-full' : 'bg-transparent w-0');
				const base = 'text-sm pb-3 transition-colors ';
				a.className = base + (active ? 'text-fg' : 'text-muted hover:text-fg');
			});
		};

		const show = (section: string) => {
			Object.keys(sections).forEach((key) => {
				const el = sections[key]; if (!el) return; el.style.display = key === section ? '' : 'none';
			});
			if (section === 'media') { setActive('gallery'); return; }
			if (section === 'wishlist') { setActive('wishlist'); return; }
			if (section === 'jobs') { setActive('jobs'); return; }
			if (section === 'receipts') { setActive('receipts'); return; }
			if (section === 'timeline') { setActive('timeline'); return; }
			// Default to overview; try to reflect current slide if available
			try {
				const getter = (window as unknown as { __vehGetSlide?: () => SlideKey }).__vehGetSlide;
				const slide = getter ? getter() : 'OVERVIEW';
				const map: Record<string, string> = { OVERVIEW: 'overview', TIMELINE: 'timeline', TASKS: 'tasks', BUILD: 'build-plans', PARTS: 'parts', SPEC: 'display-page' };
				setActive(map[slide] || 'overview');
			} catch { setActive('overview'); }
		};

		const onHashChange = () => {
			const h = location.hash.replace('#','');
			if (h === 'gallery') show('media');
			else if (h === 'wishlist') show('wishlist');
			else if (h === 'jobs') show('jobs');
			else if (h === 'receipts') show('receipts');
			else if (h === 'timeline') show('timeline');
			else show('overview');
		};

		// Initialize from hash
		onHashChange();
		window.addEventListener('hashchange', onHashChange);

		const onClick = async (e: Event) => {
			const target = (e.target as HTMLElement | null)?.closest?.('a[data-veh-nav]') as HTMLAnchorElement | null;
			if (!target) return;
			const t = target.getAttribute('data-target');
			if (!t) return;
			e.preventDefault();
			if (t === 'gallery') {
				if (location.hash !== '#gallery') location.hash = '#gallery';
				else show('media');
				return;
			}
			if (t === 'wishlist' || t === 'jobs' || t === 'receipts' || t === 'timeline') {
				location.hash = '#' + t;
				return;
			}
			// All other tabs are slides within overview
			if (location.hash) history.replaceState({}, '', location.pathname);
			show('overview');
			const map: Record<string, SlideKey> = { overview: 'OVERVIEW', timeline: 'TIMELINE', tasks: 'TASKS', 'build-plans': 'BUILD', parts: 'PARTS', 'display-page': 'SPEC' };
			const setter = await ensureSlideControl();
			if (setter) setter(map[t] || 'OVERVIEW');
			setActive(t);
		};

		document.addEventListener('click', onClick, true);

		return () => {
			window.removeEventListener('hashchange', onHashChange);
			document.removeEventListener('click', onClick, true);
		};
	}, []);

	return null;
}


