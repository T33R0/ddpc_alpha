"use client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function VehiclesJoinedToastClient() {
  const { success } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  useEffect(() => {
    if (sp.get("joined") === "1") {
      success("Joined garage.");
      const next = new URLSearchParams(sp.toString());
      next.delete("joined");
      router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
    }
  }, [sp, pathname, router, success]);
  return null;
}
