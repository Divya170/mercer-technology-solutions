/**
 * Registry of every generic content type on the Mercer site. The backend
 * validates against these and serves them to the admin UI, which builds its
 * forms from them.
 */

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
  /** text fields: suggest existing values (datalist) */
  suggest?: boolean;
}

export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  /** rows can be flagged as sample content (visible only while "Show sample content" is on) */
  sampleable?: boolean;
  /** only one published item per value of this field (page photos by slot) */
  uniqueBy?: string;
  /** field used for public detail URLs (/careers/:slug) */
  slugField?: string;
}

export const IMAGE_SLOTS = [{ value: 'company', label: 'Company — overview image (architectural office facade, editorial)' }];

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: 'stage', label: 'Approach stages', page: 'Home — [03] Approach', titleField: 'name',
    description: 'The questions worked through with a client, in order. The timeline fills as visitors scroll.',
    fields: [
      { key: 'name', label: 'Stage', kind: 'text', required: true, max: 60 },
      { key: 'body', label: 'Description', kind: 'textarea', required: true, max: 400 },
    ],
  },
  {
    type: 'layer', label: 'Stack layers', page: 'Home — [04] Across the stack', titleField: 'name',
    description: 'Layers of an enterprise environment. Selecting a capability highlights the layers it touches.',
    fields: [
      { key: 'code', label: 'Code', kind: 'text', required: true, max: 6, help: 'e.g. L4' },
      { key: 'name', label: 'Layer', kind: 'text', required: true, max: 60 },
      { key: 'desc', label: 'Description', kind: 'text', required: true, max: 120 },
      { key: 'services', label: 'Capabilities that touch this layer', kind: 'services' },
    ],
  },
  {
    type: 'principle', label: 'Principles (“How we work”)', page: 'Company', titleField: 'name',
    description: 'Short principles shown as cards.',
    fields: [
      { key: 'name', label: 'Principle', kind: 'text', required: true, max: 40 },
      { key: 'body', label: 'Description', kind: 'textarea', required: true, max: 300 },
    ],
  },
  {
    type: 'leader', label: 'Leadership', page: 'Company — Leadership', titleField: 'name',
    description: 'Publish only verified titles and biographies. With none published, the page shows the primary-contact card from Settings.',
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true, max: 120 },
      { key: 'title', label: 'Verified title', kind: 'text', required: true, max: 120 },
      { key: 'bio', label: 'Approved biography', kind: 'textarea', required: true, max: 2000 },
      { key: 'photo', label: 'Photo', kind: 'image' },
    ],
  },
  {
    type: 'industry', label: 'Industries', page: 'Industries + Home', titleField: 'name', sampleable: true,
    description: 'Industry profiles. Publish a real profile only once it is backed by verified work. Sample profiles show only while “Show sample content” is on.',
    fields: [
      { key: 'name', label: 'Industry', kind: 'text', required: true, max: 80 },
      { key: 'challenges', label: 'Business challenges', kind: 'textarea', required: true, max: 600 },
      { key: 'solutions', label: 'Relevant solutions', kind: 'text', required: true, max: 200 },
      { key: 'useCase', label: 'Example / verified use case', kind: 'textarea', required: true, max: 600 },
      { key: 'related', label: 'Related case study', kind: 'text', max: 200 },
    ],
  },
  {
    type: 'industry-field', label: 'Industries — “Each profile will cover”', page: 'Industries (empty state)', titleField: 'name',
    description: 'Shown while no industry profiles are published.',
    fields: [
      { key: 'name', label: 'Item', kind: 'text', required: true, max: 60 },
      { key: 'desc', label: 'Description', kind: 'text', required: true, max: 160 },
    ],
  },
  {
    type: 'job', label: 'Open positions', page: 'Careers', titleField: 'title', sampleable: true, slugField: 'slug',
    description: 'Job openings. Each gets a detail page at /careers/<slug>.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 120 },
      { key: 'slug', label: 'URL slug', kind: 'slug', required: true, max: 80, help: 'Lowercase letters, numbers and hyphens, e.g. senior-integration-engineer' },
      { key: 'department', label: 'Department', kind: 'text', required: true, max: 60, suggest: true },
      { key: 'location', label: 'Location', kind: 'text', required: true, max: 80, suggest: true },
      { key: 'type', label: 'Type', kind: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Internship'].map((v) => ({ value: v, label: v })) },
      { key: 'about', label: 'About the role', kind: 'textarea', required: true, max: 3000 },
      { key: 'requirements', label: 'Requirements', kind: 'list', required: true, max: 15 },
      { key: 'apply', label: 'How to apply', kind: 'textarea', required: true, max: 1000 },
    ],
  },
  {
    type: 'site-image', label: 'Page photos', page: 'Company', titleField: 'slot', uniqueBy: 'slot',
    description: 'Photos for image slots. Until a photo is added the site shows the design’s labelled placeholder. Service, case-study and article images are set on those records.',
    fields: [
      { key: 'slot', label: 'Slot', kind: 'select', required: true, options: IMAGE_SLOTS },
      { key: 'image', label: 'Photo', kind: 'image', required: true },
      { key: 'alt', label: 'Alt text (describe the photo)', kind: 'text', required: true, max: 200 },
    ],
  },
];

export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map((t) => [t.type, t]));
