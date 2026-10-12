export interface PublicSettings {
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  mailHref: string | null;
  telHref: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locationTag: string;
  companyStatement: string;
  companyOverview: string;
  companyFocus: string;
  hasPrivacyPolicy: boolean;
  privacyPolicy: string;
  showSamples: boolean;
  showBudget: boolean;
  enquiriesOpen: boolean;
}

export interface Consideration {
  title: string;
  body: string;
}

export interface Service {
  id: number;
  n: string;
  slug: string;
  name: string;
  short: string;
  overview: string;
  problems: string[];
  scope: string[];
  considerations: Consideration[];
  image: string | null;
  imageAlt: string;
  imageLabel: string;
  isSample: boolean;
}

export type SiteImages = Partial<Record<'company', { url: string; alt: string }>>;

export interface SiteData {
  settings: PublicSettings;
  services: Service[];
  images: SiteImages;
}

export interface ContentBase {
  id: number;
  num: string;
  isSample: boolean;
}
export type Stage = ContentBase & { name: string; body: string };
export type Layer = ContentBase & { code: string; name: string; desc: string; services: string[] };
export type Principle = ContentBase & { name: string; body: string };
export type Leader = ContentBase & { name: string; title: string; bio: string; photo: string };
export type Industry = ContentBase & { name: string; challenges: string; solutions: string; useCase: string; related: string };
export type IndustryField = ContentBase & { name: string; desc: string };
export type Job = ContentBase & { title: string; slug: string; department: string; location: string; type: string; about: string; requirements: string[]; apply: string };

export interface ContentMap {
  stage: Stage;
  layer: Layer;
  principle: Principle;
  leader: Leader;
  industry: Industry;
  'industry-field': IndustryField;
  job: Job;
}
export type ContentType = keyof ContentMap;
export type ContentBundle<K extends ContentType> = { [P in K]: ContentMap[P][] };

export interface CaseCard {
  id: number;
  slug: string;
  title: string;
  client: string;
  serviceSlug: string;
  serviceName: string;
  image: string | null;
  imageAlt: string;
  isSample: boolean;
}
export interface CaseList {
  items: CaseCard[];
  total: number;
  filters: { value: string; label: string }[];
  hasSamples: boolean;
}
export interface CaseDetail extends CaseCard {
  context: string;
  challenge: string;
  approach: string;
  scope: string;
  implementation: string;
  outcomes: string;
}

export interface ArticleCard {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  readingMinutes: number;
  image: string | null;
  imageAlt: string;
  featured: boolean;
  publishedAt: string | null;
  isSample: boolean;
}
export interface ArticleList {
  items: ArticleCard[];
  total: number;
  categories: string[];
  hasSamples: boolean;
}
export interface ArticleDetail extends ArticleCard {
  body: string[];
}

export interface LeadOptions {
  interests: { value: string; label: string }[];
  timelines: string[];
  budgets: string[];
  showBudget: boolean;
  enquiriesOpen: boolean;
  minFillMs: number;
}

// ---------- admin ----------

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'spam';
export type NotificationStatus = 'not-configured' | 'pending' | 'sent' | 'failed';

export interface Lead {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string | null;
  phone: string | null;
  interest: string;
  interestLabel: string;
  overview: string;
  timeline: string;
  budget: string | null;
  consentAt: string;
  source: string;
  formStartedAt: string | null;
  status: LeadStatus;
  assignedTo: string;
  notes: string;
  retentionUntil: string;
  notificationStatus: NotificationStatus;
  notificationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublishStatus = 'published' | 'draft';

export interface AdminService {
  id: number;
  slug: string;
  name: string;
  short: string;
  overview: string;
  problems: string[];
  scope: string[];
  considerations: Consideration[];
  image: string | null;
  imageAlt: string;
  imageLabel: string;
  status: PublishStatus;
  isSample: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminCase {
  id: number;
  slug: string;
  title: string;
  client: string;
  serviceSlug: string;
  context: string;
  challenge: string;
  approach: string;
  scope: string;
  implementation: string;
  outcomes: string;
  image: string | null;
  imageAlt: string;
  status: PublishStatus;
  isSample: boolean;
  updatedAt: string;
}

export interface AdminArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  author: string;
  readingMinutes: number;
  image: string | null;
  imageAlt: string;
  featured: boolean;
  status: PublishStatus;
  publishedAt: string | null;
  isSample: boolean;
  updatedAt: string;
}

export type FieldKind = 'text' | 'textarea' | 'number' | 'list' | 'select' | 'image' | 'slug' | 'services';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  min?: number;
  maxValue?: number;
  options?: { value: string; label: string }[];
  help?: string;
  suggest?: boolean;
}
export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  sampleable?: boolean;
  uniqueBy?: string;
  slugField?: string;
}
export interface AdminContentItem {
  id: number;
  type: string;
  sortOrder: number;
  fields: Record<string, unknown>;
  published: boolean;
  isSample: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locationTag: string;
  companyStatement: string;
  companyOverview: string;
  companyFocus: string;
  privacyPolicy: string;
  showSamples: boolean;
  showBudget: boolean;
  enquiriesOpen: boolean;
  updatedAt: string;
}
