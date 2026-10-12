/** Small helpers shared by the admin pages. */

/** ISO string -> value for <input type="datetime-local"> in the viewer's time zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** datetime-local value -> ISO string ('' when empty or invalid). */
export function fromLocalInput(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Textarea text -> trimmed non-empty lines. */
export const toLines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

/** Moves item `i` by `dir` (-1 / +1) in a copy of the list. */
export function moved<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = list.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}
