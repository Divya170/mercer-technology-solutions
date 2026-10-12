/**
 * Enquiry ("lead") validation — rules and messages from the design comp and
 * API-CONTRACT.md (see DATA-MODEL.md). Authoritative; the frontend mirrors it
 * in frontend/lib/validation.ts for instant feedback.
 */
import { clean } from '../common/text';

export const TIMELINES = ['As soon as possible', 'Within 3 months', '3–6 months', '6–12 months', 'Exploring options'] as const;
export const BUDGETS = ['Under $50,000', '$50,000–$150,000', '$150,000–$500,000', 'Over $500,000', 'Prefer not to say'] as const;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+()\-.\s]{7,30}$/;

export interface LeadInput {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  jobTitle?: unknown;
  phone?: unknown;
  interest?: unknown;
  overview?: unknown;
  timeline?: unknown;
  budget?: unknown;
  consent?: unknown;
  meta?: unknown;
  clientRequestId?: unknown;
}

export interface CleanLead {
  name: string;
  email: string;
  company: string;
  jobTitle: string | null;
  phone: string | null;
  interest: string;
  overview: string;
  timeline: string;
  budget: string | null;
  source: string;
  formStartedAt: Date | null;
}

export type LeadErrors = Partial<Record<'name' | 'email' | 'company' | 'jobTitle' | 'phone' | 'interest' | 'overview' | 'timeline' | 'budget' | 'consent', string>>;

export interface LeadContext {
  /** visible service slugs + "not-sure" */
  interests: Set<string>;
  showBudget: boolean;
}

export function readMeta(input: LeadInput) {
  const m = input.meta && typeof input.meta === 'object' ? (input.meta as Record<string, unknown>) : {};
  const started = m.formStartedAt ? new Date(String(m.formStartedAt)) : null;
  return {
    hp: typeof m.hp === 'string' ? m.hp : '',
    source: clean(m.source, 60) || 'website',
    formStartedAt: started && !Number.isNaN(started.getTime()) ? started : null,
  };
}

/** Bot heuristics from the contract: honeypot filled, or completed implausibly fast. */
export function isBot(input: LeadInput, minFillMs: number, now = Date.now()) {
  const meta = readMeta(input);
  if (meta.hp.trim()) return 'honeypot';
  if (meta.formStartedAt && now - meta.formStartedAt.getTime() < minFillMs) return 'too-fast';
  return null;
}

export function validateLead(input: LeadInput, ctx: LeadContext): { value: CleanLead; errors: LeadErrors } {
  const e: LeadErrors = {};
  const name = clean(input.name, 200);
  const email = clean(input.email, 300);
  const company = clean(input.company, 200);
  const jobTitle = clean(input.jobTitle, 200);
  const phone = clean(input.phone, 60);
  const interest = clean(input.interest, 80);
  const overview = clean(input.overview, 4001, true);
  const timeline = clean(input.timeline, 40);
  const budget = ctx.showBudget ? clean(input.budget, 40) : '';

  if (!name) e.name = 'Enter your full name.';
  else if (name.length > 120) e.name = 'Name must be 120 characters or fewer.';
  if (!email) e.email = 'Enter your business email address.';
  else if (!EMAIL_RE.test(email) || email.length > 254) e.email = 'Enter a valid email address, like name@company.com.';
  if (!company) e.company = 'Enter your company name.';
  else if (company.length > 160) e.company = 'Company name must be 160 characters or fewer.';
  if (jobTitle.length > 120) e.jobTitle = 'Job title must be 120 characters or fewer.';
  if (phone && !PHONE_RE.test(phone)) e.phone = 'Enter a valid phone number, or leave this blank.';
  if (!interest || !ctx.interests.has(interest)) e.interest = 'Select an area of interest.';
  if (!overview) e.overview = 'Describe your project or business challenge.';
  else if (overview.length < 30) e.overview = 'Add a little more detail (at least 30 characters).';
  else if (overview.length > 4000) e.overview = 'Keep the overview to 4,000 characters or fewer.';
  if (!(TIMELINES as readonly string[]).includes(timeline)) e.timeline = 'Select an expected timeline.';
  if (budget && !(BUDGETS as readonly string[]).includes(budget)) e.budget = 'Select a budget range from the list.';
  if (input.consent !== true) e.consent = 'Confirm you agree so we can respond to your enquiry.';

  const meta = readMeta(input);
  return {
    value: { name, email: email.toLowerCase(), company, jobTitle: jobTitle || null, phone: phone || null, interest, overview, timeline, budget: budget || null, source: meta.source, formStartedAt: meta.formStartedAt },
    errors: e,
  };
}

/** Order used for the error summary and focus (matches the form). */
export const FIELD_ORDER = ['name', 'email', 'company', 'phone', 'interest', 'overview', 'timeline', 'consent'] as const;
