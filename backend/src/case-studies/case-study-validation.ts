import type { PublishStatus } from '../services/service.entity';
import { clean, IMAGE_RE, SLUG_RE, tooLong } from '../common/text';

export const CASE_SECTIONS = ['context', 'challenge', 'approach', 'scope', 'implementation', 'outcomes'] as const;
export type CaseInput = Partial<Record<'slug' | 'title' | 'client' | 'serviceSlug' | 'image' | 'imageAlt' | 'status' | 'isSample' | (typeof CASE_SECTIONS)[number], unknown>>;

export function validateCaseStudy(input: CaseInput, serviceSlugs: Set<string>) {
  const e: Record<string, string> = {};
  const title = clean(input.title, 160);
  const slug = clean(input.slug, 80).toLowerCase();
  const client = clean(input.client, 160);
  const serviceSlug = clean(input.serviceSlug, 60);
  const image = clean(input.image, 500);
  const status: PublishStatus = input.status === 'published' ? 'published' : 'draft';
  const sections = Object.fromEntries(CASE_SECTIONS.map((k) => [k, clean(input[k], 3000, true)])) as Record<(typeof CASE_SECTIONS)[number], string>;

  if (title.length < 4) e.title = 'Enter a title of at least 4 characters.';
  tooLong(e, 'title', title, 160);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  tooLong(e, 'client', client, 160);
  if (!serviceSlugs.has(serviceSlug)) e.serviceSlug = 'Choose the related solution.';
  for (const k of CASE_SECTIONS) tooLong(e, k, sections[k], 3000);
  if (image && !IMAGE_RE.test(image)) e.image = 'Upload an image or use an https:// URL.';
  if (status === 'published') {
    if (!client) e.client = 'Required to publish (approved client name or description).';
    for (const k of CASE_SECTIONS) if (!sections[k]) e[k] = 'Required to publish.';
  }
  return { value: { title, slug, client, serviceSlug, ...sections, image: image || null, imageAlt: clean(input.imageAlt, 200), status, isSample: input.isSample === true }, errors: e };
}
