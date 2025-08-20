import { getServerSupabase } from "@/lib/supabase";

export type SignedUpload = {
  url: string;
  path: string;
  expiresIn: number;
};

function ensurePath(base: string, segments: string[]): string {
  const cleaned = [base.replace(/^\/+|\/+$/g, "")]
    .concat(segments.map((s) => String(s).replace(/^\/+|\/+$/g, "")))
    .filter(Boolean)
    .join("/");
  return cleaned;
}

export async function getSignedUploadUrl(bucket: "invoices" | "jobs", path: string, expiresInSeconds = 60 * 10): Promise<SignedUpload> {
  const supabase = await getServerSupabase();
  const objectPath = ensurePath("", [path]);
  // Using createSignedUploadUrl allows clients to PUT directly to storage
  // Current SDK expects an options object (e.g., { upsert: true })
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath, { upsert: true });
  if (error || !data) {
    const message = error?.message ?? "Failed to create signed upload URL";
    throw new Error(message);
  }
  return { url: data.signedUrl, path: objectPath, expiresIn: expiresInSeconds };
}

export async function getInvoiceUploadUrl(vehicleId: string, id: string): Promise<SignedUpload> {
  // Path must be relative to the bucket, do not prefix bucket name here
  const path = ensurePath("", [vehicleId, id]);
  return getSignedUploadUrl("invoices", path);
}

export async function getJobMediaUploadUrl(vehicleId: string, id: string): Promise<SignedUpload> {
  // Path must be relative to the bucket, do not prefix bucket name here
  const path = ensurePath("", [vehicleId, id]);
  return getSignedUploadUrl("jobs", path);
}


