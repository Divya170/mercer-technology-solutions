import type { LeadStatus } from './types';

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export const STATUS_LABEL: Record<LeadStatus, string> = { new: 'NEW', contacted: 'CONTACTED', qualified: 'QUALIFIED', closed: 'CLOSED', spam: 'SPAM' };
export const NOTIFY_LABEL: Record<string, string> = { 'not-configured': 'Not configured', pending: 'Sending…', sent: 'Email sent', failed: 'Email failed' };

/** Splits admin-entered text into paragraphs (blank-line separated). */
export const paragraphs = (s: string) => (s || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** Alternating lavender / pink accents, as in the design. */
export const ACCENTS = [
  { accent: '#B9A6FF', glow: 'rgba(185,166,255,.45)', stroke: 'rgba(185,166,255,.22)' },
  { accent: '#FF8FC7', glow: 'rgba(255,143,199,.45)', stroke: 'rgba(255,143,199,.22)' },
];
export const accentFor = (i: number) => ACCENTS[i % 2];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
