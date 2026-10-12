/**
 * Mirror of backend/src/inquiries/inquiry-validation.ts for instant feedback.
 * The backend stays authoritative — keep the two in sync.
 */

export interface EnquiryForm {
  name: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  interest: string;
  overview: string;
  timeline: string;
  budget: string;
  consent: boolean;
  website: string; // honeypot
}

export const EMPTY_FORM: EnquiryForm = { name: '', email: '', company: '', title: '', phone: '', interest: '', overview: '', timeline: '', budget: '', consent: false, website: '' };

/** Fields in form order (error summary + focus); `title` is the job title. */
export const FIELDS = ['name', 'email', 'company', 'phone', 'interest', 'overview', 'timeline', 'consent'] as const;
export type Field = (typeof FIELDS)[number];

export function validateField(n: string, f: EnquiryForm): string {
  const raw = f[n as keyof EnquiryForm];
  const v = typeof raw === 'string' ? raw.trim() : raw;
  switch (n) {
    case 'name':
      return !v ? 'Enter your full name.' : (v as string).length > 120 ? 'Name must be 120 characters or fewer.' : '';
    case 'email':
      return !v ? 'Enter your business email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v as string) ? 'Enter a valid email address, like name@company.com.' : '';
    case 'company':
      return !v ? 'Enter your company name.' : '';
    case 'phone':
      return v && !/^[0-9+()\-.\s]{7,30}$/.test(v as string) ? 'Enter a valid phone number, or leave this blank.' : '';
    case 'interest':
      return !v ? 'Select an area of interest.' : '';
    case 'overview':
      return !v ? 'Describe your project or business challenge.' : (v as string).length < 30 ? 'Add a little more detail (at least 30 characters).' : '';
    case 'timeline':
      return !v ? 'Select an expected timeline.' : '';
    case 'consent':
      return !v ? 'Confirm you agree so we can respond to your enquiry.' : '';
    default:
      return '';
  }
}

export function validateAll(f: EnquiryForm): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  FIELDS.forEach((k) => {
    const m = validateField(k, f);
    if (m) e[k] = m;
  });
  return e;
}

export function newRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
