"use client";
import { useCallback, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DeleteVehicleButtonClient({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onConfirm = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vehicle");
      window.location.href = "/vehicles";
    } catch (e) {
      // minimal alert; we don't have a toast here
      alert(e instanceof Error ? e.message : "Failed to delete vehicle");
      setBusy(false);
      setOpen(false);
    }
  }, [vehicleId, busy]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm px-3 py-1 rounded border bg-white text-red-700 border-red-300 hover:bg-red-50" disabled={busy} data-testid="btn-delete-vehicle">
        Delete Vehicle
      </button>
      <ConfirmDialog
        open={open}
        title="Delete vehicle?"
        description="This will permanently delete this vehicle and its data. This action cannot be undone."
        confirmLabel={busy ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
        dataTest="confirm-delete-vehicle"
      />
    </>
  );
}


