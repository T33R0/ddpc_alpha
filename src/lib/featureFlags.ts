export function isEnabled(flag: string): boolean {
  const key = flag.startsWith("NEXT_PUBLIC_") ? flag : `NEXT_PUBLIC_${flag}`;
  // Guard for client-side where process may be undefined
  if (typeof process !== "undefined" && process.env) {
    const env = process.env as Record<string, string | undefined>;
    const v = env[key];
    return v === "1" || v === "true";
  }
  return false;
}


