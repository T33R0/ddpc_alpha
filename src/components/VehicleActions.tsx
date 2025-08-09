"use client";
import { useEffect, useRef, useState, useTransition, type KeyboardEventHandler } from "react";
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
  canWrite?: boolean;
};

export default function VehicleActions({ id, initialNickname, initialPrivacy, initialVin, initialYear, initialMake, initialModel, initialTrim, canWrite = true }: Props) {
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

  const revertEdits = () => {
    setNickname(base.nickname);
    setPrivacy(base.privacy);
    setVin(base.vin);
    setYear(base.year);
    setMake(base.make);
    setModel(base.model);
    setTrim(base.trim);
  };

  const onKeyDownInput: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canWrite && isDirty && !isPending) onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      revertEdits();
    }
  };

  const onKeyDownSelect: KeyboardEventHandler<HTMLSelectElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canWrite && isDirty && !isPending) onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      revertEdits();
    }
  };

  const onSave = () => {
    if (!canWrite) return;
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
    if (!canWrite) return;
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
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} onKeyDown={onKeyDownInput} placeholder="Nickname" className="border rounded px-2 py-1 text-xs w-28 md:w-32 disabled:opacity-50" data-test="vehicle-nickname" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <input value={vin} onChange={(e) => setVin(e.target.value)} onKeyDown={onKeyDownInput} placeholder="VIN" className="border rounded px-2 py-1 text-xs w-28 md:w-32 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <input value={year} onChange={(e) => setYear(e.target.value)} onKeyDown={onKeyDownInput} placeholder="Year" className="border rounded px-2 py-1 text-xs w-20 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <input value={make} onChange={(e) => setMake(e.target.value)} onKeyDown={onKeyDownInput} placeholder="Make" className="border rounded px-2 py-1 text-xs w-24 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <input value={model} onChange={(e) => setModel(e.target.value)} onKeyDown={onKeyDownInput} placeholder="Model" className="border rounded px-2 py-1 text-xs w-24 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <input value={trim} onChange={(e) => setTrim(e.target.value)} onKeyDown={onKeyDownInput} placeholder="Trim" className="border rounded px-2 py-1 text-xs w-24 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
      <select value={privacy} onChange={(e) => setPrivacy(e.target.value as "PUBLIC" | "PRIVATE")} onKeyDown={onKeyDownSelect} className="border rounded px-2 py-1 text-xs disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined}>
        <option value="PRIVATE">Private</option>
        <option value="PUBLIC">Public</option>
      </select>
      <div className="flex items-center gap-2">
        <button onClick={onSave} disabled={!canWrite || isPending || !isDirty} title={!canWrite ? "Insufficient permissions" : undefined} className={`text-xs px-2 py-1 rounded border ${!canWrite || isPending || !isDirty ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {savedTick && <span className="text-xs text-green-600">Saved ✓</span>}
        <button type="button" onClick={revertEdits} disabled={!canWrite || isPending || !isDirty} title={!canWrite ? "Insufficient permissions" : undefined} className={`text-xs px-2 py-1 rounded border ${!canWrite || isPending || !isDirty ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}>
          Revert (Esc)
        </button>
      </div>
      <button onClick={onDelete} disabled={!canWrite || isPending} title={!canWrite ? "Insufficient permissions" : undefined} className={`text-xs px-2 py-1 rounded border ${!canWrite || isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50"} ${confirming ? "border-red-600 bg-red-50 text-red-700" : "text-red-600"}`}>
        {isPending ? "Deleting..." : confirming ? "Confirm" : "Delete"}
      </button>
    </div>
  );
}
