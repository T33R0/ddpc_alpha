"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Props = {
  urls: Array<string | null>;
};

export default function GarageGallery({ urls }: Props) {
  const pool: string[] = useMemo(
    () => (urls || []).filter((u): u is string => typeof u === "string" && u.trim().length > 0),
    [urls]
  );

  const initial: string[] = useMemo(() => {
    if (pool.length === 0) return [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [pool]);

  const [visible, setVisible] = useState<string[]>(initial);

  useEffect(() => {
    setVisible(initial);
  }, [initial]);

  useEffect(() => {
    if (pool.length <= 1) return;
    const id = setInterval(() => {
      setVisible((prev) => {
        if (pool.length === 0) return prev;
        const next = prev.slice();
        const slotIndex = Math.floor(Math.random() * 6);
        let candidate = pool[Math.floor(Math.random() * pool.length)];
        // try to avoid immediate duplicate in that slot
        for (let i = 0; i < 4 && candidate === next[slotIndex]; i++) {
          candidate = pool[Math.floor(Math.random() * pool.length)];
        }
        next[slotIndex] = candidate;
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [pool]);

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-1 h-60 p-1">
      {Array.from({ length: 6 }).map((_, i) => {
        const url = visible[i] ?? null;
        return (
          <div key={i} className="relative w-full h-full rounded overflow-hidden bg-bg/40">
            {url && (
              <Image
                src={url}
                alt="Vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={i < 3}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}


