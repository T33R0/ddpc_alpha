// Minimal URL enrichment helper
// Returns basic metadata extracted or inferred from the given URL.

export type EnrichedFromUrl = {
  url: string;
  title?: string | null;
  price?: number | null;
  image?: string | null;
  vendor?: { name: string; domain: string } | null;
};

function extractDomain(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function humanizeVendor(domain: string): string {
  const base = domain.replace(/^www\./, "");
  const parts = base.split(".");
  const core = parts.length >= 2 ? parts[parts.length - 2] : base;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

export async function enrichFromUrl(url: string): Promise<EnrichedFromUrl> {
  const domain = extractDomain(url);
  const vendor = domain ? { name: humanizeVendor(domain), domain } : null;
  // Stub implementation: callers can still persist useful vendor and notes
  return {
    url,
    title: null,
    price: null,
    image: null,
    vendor,
  };
}

export default enrichFromUrl;


