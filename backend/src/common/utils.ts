/** Shared helpers used across modules. */

export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Escape a value for CSV output. */
export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** "+1 (215) 682-2917" -> "tel:+12156822917" */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}
