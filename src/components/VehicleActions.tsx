"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateVehicle, deleteVehicle } from "@/app/vehicles/actions";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  id: string;
  initialNickname: string | null;
  initialPrivacy: "PUBLIC" | "PRIVATE";
  initialVin: string | null;
  initialYear: number | null;
  initialMake: string;
  initialModel: string;
  initialTrim: string | null;
};

export default function VehicleActions({ id, initialNickname, initialPrivacy, initialVin, initialYear, initialMake, initialModel, initialTrim }: Props) {
  const [nickname, setNickname] = useState<string>(initialNickname ?? "");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE">(initialPrivacy);
  const [vin, setVin] = useState<string>(initialVin ?? "");
  const [year, setYear] = useState<string>(initialYear ? String(initialYear) : "");
  const [make, setMake] = useState<string>(initialMake ?? "");
  const [model, setModel] = useState<string>(initialModel ?? "");
  const [trim, setTrim] = useState<string>(initialTrim ?? "");
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();
  const [confirming, setConfirming] = useState(false);
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Baseline values to determine dirty state and reset after save
  const [base, setBase] = useState({
    nickname: initialNickname ?? "",
    privacy: initialPrivacy as "PUBLIC" | "PRIVATE",
    vin: initialVin ?? "",
    year: initialYear ? String(initialYear) : "",
    make: initialMake ?? "",
    model: initialModel ?? "",
    trim: initialTrim ?? "",
  });
  const isDirty =
    nickname !== base.nickname ||
    privacy !== base.privacy ||
    vin !== base.vin ||
    year !== base.year ||
    make !== base.make ||
    model !== base.model ||
    trim !== base.trim;
  const [savedTick, setSavedTick] = useState(false);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onSave = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("id", id);
        if (nickname) fd.append("nickname", nickname);
        fd.append("privacy", privacy);
        if (vin) fd.append("vin", vin);
        if (year) fd.append("year", year);
        if (make) fd.append("make", make);
        if (model) fd.append("model", model);
        if (trim) fd.append("trim", trim);
        await updateVehicle(fd);
        success("Vehicle updated");
        // Reset baseline and show saved tick
        setBase({ nickname, privacy, vin, year, make, model, trim });
        setSavedTick(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSavedTick(false), 1500);
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
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" className="border rounded px-2 py-1 text-xs w-28 md:w-32" />
      <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN" className="border rounded px-2 py-1 text-xs w-28 md:w-32" />
      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="border rounded px-2 py-1 text-xs w-20" />
      <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" className="border rounded px-2 py-1 text-xs w-24" />
      <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="border rounded px-2 py-1 text-xs w-24" />
      <input value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="Trim" className="border rounded px-2 py-1 text-xs w-24" />
      <select value={privacy} onChange={(e) => setPrivacy(e.target.value as "PUBLIC" | "PRIVATE")} className="border rounded px-2 py-1 text-xs">
        <option value="PRIVATE">Private</option>
        <option value="PUBLIC">Public</option>
      </select>
      <div className="flex items-center gap-2">
        <button onClick={onSave} disabled={isPending || !isDirty} className={`text-xs px-2 py-1 rounded border ${isPending || !isDirty ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {savedTick && <span className="text-xs text-green-600">Saved ✓</span>}
      </div>
      <button onClick={onDelete} disabled={isPending} className={`text-xs px-2 py-1 rounded border hover:bg-red-50 ${confirming ? "border-red-600 bg-red-50 text-red-700" : "text-red-600"}`}>
        {isPending ? "Deleting..." : confirming ? "Confirm" : "Delete"}
      </button>
    </div>
  );
}
