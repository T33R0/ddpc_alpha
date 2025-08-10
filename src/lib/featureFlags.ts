export function isEnabled(flag: string): boolean {
  const key = `NEXT_PUBLIC_${flag}`;
  const env = process.env as Record<string, string | undefined>;
  const v = env[key];
  return v === "1" || v === "true";
}


