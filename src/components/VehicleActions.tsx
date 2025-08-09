"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateVehicle, deleteVehicle } from "@/app/vehicles/actions";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  id: string;
  initialNickname: string | null;
  initialPrivacy: "PUBLIC" | "PRIVATE";
};

export default function VehicleActions({ id, initialNickname, initialPrivacy }: Props) {
  const [nickname, setNickname] = useState<string>(initialNickname ?? "");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE">(initialPrivacy);
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();
  const [confirming, setConfirming] = useState(false);
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onSave = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("id", id);
        if (nickname) fd.append("nickname", nickname);
        fd.append("privacy", privacy);
        await updateVehicle(fd);
        success("Vehicle updated");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update vehicle";
        error(message);
      }
    });
  };

  const onDelete = () => {
    if (!confirming) {
      setConfirming(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirming(false), 5000);
      return;
    }
    setConfirming(false);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    startTransition(async () => {
      try {
        await deleteVehicle(id);
        success("Vehicle deleted");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to delete vehicle";
        error(message);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
        className="border rounded px-2 py-1 text-xs w-32 md:w-44"
      />
      <select
        value={privacy}
        onChange={(e) => setPrivacy(e.target.value as "PUBLIC" | "PRIVATE")}
        className="border rounded px-2 py-1 text-xs"
      >
        <option value="PRIVATE">Private</option>
        <option value="PUBLIC">Public</option>
      </select>
      <button
        onClick={onSave}
        disabled={isPending}
        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      <button
        onClick={onDelete}
        disabled={isPending}
        className={`text-xs px-2 py-1 rounded border hover:bg-red-50 ${confirming ? "border-red-600 bg-red-50 text-red-700" : "text-red-600"}`}
      >
        {isPending ? "Deleting..." : confirming ? "Confirm" : "Delete"}
      </button>
    </div>
  );
}
