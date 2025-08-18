"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { compareStore } from "./compareStore";

export default function DiscoverCard({
    id,
    title,
    imageSrc,
    stats,
}: {
    id: string;
    title: string;
    imageSrc: string;
    stats: { power: string; engine: string; weight: string; drive: string };
}) {
    const [open, setOpen] = useState(false);

    const onOpen = useCallback(() => setOpen(true), []);
    const onClose = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpen(false);
    }, []);

    const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
        }
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={onOpen}
                onKeyDown={onKey}
                className="overflow-hidden rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md transition-shadow cursor-pointer"
            >
                <div className="relative aspect-[16/9] bg-gray-100">
                    <Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                </div>
                <div className="p-4">
                    <h3 className="mb-2 font-semibold line-clamp-2">{title}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                        <div>
                            <div className="uppercase text-[10px] text-gray-500">Power</div>
                            <div className="font-medium text-gray-900">{stats.power}</div>
                        </div>
                        <div>
                            <div className="uppercase text-[10px] text-gray-500">Engine</div>
                            <div className="font-medium text-gray-900">{stats.engine}</div>
                        </div>
                        <div>
                            <div className="uppercase text-[10px] text-gray-500">Weight</div>
                            <div className="font-medium text-gray-900">{stats.weight}</div>
                        </div>
                        <div>
                            <div className="uppercase text-[10px] text-gray-500">Drive</div>
                            <div className="font-medium text-gray-900">{stats.drive}</div>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            className="rounded border px-3 py-1 text-sm font-medium"
                            onClick={(e) => { e.stopPropagation(); compareStore.add({ id, title, imageSrc }); }}
                        >
                            Compare
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between p-4 border-b">
                            <h4 className="text-lg font-semibold">{title}</h4>
                            <button aria-label="Close" className="p-1 rounded hover:bg-gray-100" onClick={onClose}>✕</button>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative aspect-video bg-gray-100">
                                <Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                            </div>
                            <div className="text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[11px] uppercase text-gray-500">Power</div>
                                        <div className="font-medium">{stats.power}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase text-gray-500">Engine</div>
                                        <div className="font-medium">{stats.engine}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase text-gray-500">Weight</div>
                                        <div className="font-medium">{stats.weight}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase text-gray-500">Drive</div>
                                        <div className="font-medium">{stats.drive}</div>
                                    </div>
                                </div>
                                <div className="mt-4 text-gray-700">
                                    <p className="mb-2">Vehicle details (placeholder):</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>VIN: 1A2BC3D4E5F6G7H8I</li>
                                        <li>Color: Metallic Gray</li>
                                        <li>Odometer: 42,150 miles</li>
                                        <li>Owner: Example Owner</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button className="rounded border px-3 py-1 text-sm" onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
