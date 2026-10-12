/**
 * Server-side data access for public pages (React Server Components).
 * Uncached so admin edits appear immediately.
 */
import type { ArticleDetail, ArticleList, CaseDetail, CaseList, ContentBundle, ContentType, Job, LeadOptions, SiteData } from './types';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api${path}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(503, 'The site service is unavailable. Please try again shortly.');
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = Array.isArray(body.message) ? body.message[0] : body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

/** Returns null on 404 so pages can render their "not available" state. */
async function maybe<T>(path: string): Promise<T | null> {
  try {
    return await get<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const getSite = () => get<SiteData>('/site');

export function getContent<K extends ContentType>(...types: K[]): Promise<ContentBundle<K>> {
  return get<ContentBundle<K>>(`/content?types=${types.join(',')}`);
}

export const getJob = (slug: string) => maybe<Job>(`/content/item/job/${encodeURIComponent(slug)}`);

export const getCases = (service?: string) => get<CaseList>(`/case-studies${service ? `?service=${encodeURIComponent(service)}` : ''}`);
export const getCase = (slug: string) => maybe<CaseDetail>(`/case-studies/${encodeURIComponent(slug)}`);

export const getArticles = () => get<ArticleList>('/articles');
export const getArticle = (slug: string) => maybe<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`);

export const getLeadOptions = () => get<LeadOptions>('/inquiries/options');
