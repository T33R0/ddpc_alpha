export function isEnabled(envVar: string): boolean {
  try {
    // In Next.js, NEXT_PUBLIC_* are inlined at build; guard for SSR and client
    const val = (process as any)?.env?.[envVar] as string | undefined;
    if (!val) return false;
    return val === "1" || val.toLowerCase() === "true";
  } catch {
    return false;
  }
}


