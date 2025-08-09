"use client";
import { useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { updateVehiclePhoto } from "@/app/vehicles/actions";
import { useToast } from "@/components/ui/ToastProvider";

export default function UploadPhoto({ vehicleId }: { vehicleId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { success, error } = useToast();

  const onPick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = getBrowserSupabase();
      const ext = file.name.split(".").pop();
      const path = `${vehicleId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vehicle-media").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("vehicle-media").getPublicUrl(path);
      await updateVehiclePhoto(vehicleId, data.publicUrl);
      success("Photo uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      error(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="ml-auto">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <button onClick={onPick} disabled={uploading} className="text-sm px-2 py-1 rounded border hover:bg-gray-50">
        {uploading ? "Uploading..." : "Upload photo"}
      </button>
    </div>
  );
}
