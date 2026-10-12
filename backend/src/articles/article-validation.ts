import type { PublishStatus } from '../services/service.entity';
import { clean, IMAGE_RE, SLUG_RE, tooLong } from '../common/text';

export type ArticleInput = Partial<Record<'slug' | 'title' | 'category' | 'excerpt' | 'body' | 'author' | 'readingMinutes' | 'image' | 'imageAlt' | 'featured' | 'status' | 'publishedAt' | 'isSample', unknown>>;

/** ~200 words per minute, at least 1 */
export const readingTime = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

export const paragraphs = (body: string) => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function validateArticle(input: ArticleInput) {
  const e: Record<string, string> = {};
  const title = clean(input.title, 200);
  const slug = clean(input.slug, 100).toLowerCase();
  const category = clean(input.category, 40);
  const excerpt = clean(input.excerpt, 400);
  const body = clean(input.body, 60000, true);
  const author = clean(input.author, 120);
  const image = clean(input.image, 500);
  const status: PublishStatus = input.status === 'published' ? 'published' : 'draft';
  const minsRaw = input.readingMinutes === '' || input.readingMinutes == null ? NaN : Number(input.readingMinutes);
  let publishedAt: Date | null = null;
  if (input.publishedAt) {
    const d = new Date(String(input.publishedAt));
    if (Number.isNaN(d.getTime())) e.publishedAt = 'Enter a valid date.';
    else publishedAt = d;
  }

  if (title.length < 4) e.title = 'Enter a title of at least 4 characters.';
  tooLong(e, 'title', title, 200);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (category.length < 2) e.category = 'Enter a category.';
  tooLong(e, 'category', category, 40);
  tooLong(e, 'excerpt', excerpt, 400);
  tooLong(e, 'body', body, 60000);
  if (image && !IMAGE_RE.test(image)) e.image = 'Upload an image or use an https:// URL.';
  if (!Number.isNaN(minsRaw) && (!Number.isInteger(minsRaw) || minsRaw < 1 || minsRaw > 120)) e.readingMinutes = 'Enter whole minutes between 1 and 120, or leave blank.';
  if (status === 'published') {
    if (excerpt.length < 10) e.excerpt = 'Write a short excerpt (at least 10 characters) to publish.';
    if (body.length < 20) e.body = 'Write the article body (at least 20 characters) to publish.';
  }
  return {
    value: {
      title,
      slug,
      category,
      excerpt,
      body,
      author,
      readingMinutes: Number.isNaN(minsRaw) ? readingTime(body) : minsRaw,
      image: image || null,
      imageAlt: clean(input.imageAlt, 200),
      featured: input.featured === true,
      status,
      publishedAt,
      isSample: input.isSample === true,
    },
    errors: e,
  };
}
