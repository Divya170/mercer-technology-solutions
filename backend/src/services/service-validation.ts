/** Pure validation for services (unit-tested). */
import type { Consideration, PublishStatus } from './service.entity';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const str = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, ' ').trim().slice(0, max + 1);
const list = (v: unknown, maxItems: number, maxLen: number) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems + 1);

export interface ServiceInput {
  slug?: unknown;
  name?: unknown;
  short?: unknown;
  overview?: unknown;
  problems?: unknown;
  scope?: unknown;
  considerations?: unknown;
  image?: unknown;
  imageAlt?: unknown;
  imageLabel?: unknown;
  status?: unknown;
  isSample?: unknown;
}

export function validateService(input: ServiceInput) {
  const e: Record<string, string> = {};
  const name = str(input.name, 80);
  const slug = str(input.slug, 60).toLowerCase();
  const short = str(input.short, 300);
  const overview = str(input.overview, 2000);
  const problems = list(input.problems, 8, 200);
  const scope = list(input.scope, 12, 80);
  const consIn = Array.isArray(input.considerations) ? input.considerations : [];
  const considerations: Consideration[] = consIn
    .map((c) => ({ title: str((c as Consideration)?.title, 120), body: str((c as Consideration)?.body, 800) }))
    .filter((c) => c.title || c.body);
  const image = str(input.image, 500);
  const status: PublishStatus = input.status === 'published' ? 'published' : 'draft';

  if (name.length < 2) e.name = 'Enter a service name.';
  else if (name.length > 80) e.name = 'Use 80 characters or fewer.';
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (slug === 'not-sure') e.slug = '"not-sure" is reserved for the enquiry form.';
  if (short.length > 300) e.short = 'Use 300 characters or fewer.';
  if (overview.length > 2000) e.overview = 'Use 2,000 characters or fewer.';
  if (problems.length > 8) e.problems = 'Use 8 items or fewer.';
  if (scope.length > 12) e.scope = 'Use 12 items or fewer.';
  if (considerations.length > 8) e.considerations = 'Use 8 considerations or fewer.';
  if (considerations.some((c) => !c.title || !c.body)) e.considerations = 'Each consideration needs a title and a description.';
  if (image && !/^(\/uploads\/[\w.-]+|https:\/\/\S+)$/.test(image)) e.image = 'Upload an image or use an https:// URL.';
  if (status === 'published') {
    if (!short) e.short = 'Required to publish.';
    if (!overview) e.overview = 'Required to publish.';
  }
  return {
    value: { name, slug, short, overview, problems, scope, considerations, image: image || null, imageAlt: str(input.imageAlt, 200), imageLabel: str(input.imageLabel, 120), status, isSample: input.isSample === true },
    errors: e,
  };
}
