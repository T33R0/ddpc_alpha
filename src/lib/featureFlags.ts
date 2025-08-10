export function isEnabled(flag: string): boolean {
  const key = `NEXT_PUBLIC_${flag}`;
  const v = process.env[key];
  return v === "1" || v === "true";
}


