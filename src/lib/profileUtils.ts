export function deriveUsernameFromEmail(email: string | null | undefined): string {
  const local = (email || '').split('@')[0] || 'user';
  const normalized = local.toLowerCase().replace(/[^a-z0-9_\-\.]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'user';
}

export function normalizeUsername(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_\-\.]+/g, '-').replace(/^-+|-+$/g, '');
}
