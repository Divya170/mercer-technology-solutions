/* Dependency-free tests for the pure business rules. Run: npm run test:validation */
import assert from 'node:assert/strict';
import { isBot, validateLead } from './inquiries/inquiry-validation';
import { validateService } from './services/service-validation';
import { validateCaseStudy } from './case-studies/case-study-validation';
import { readingTime, validateArticle } from './articles/article-validation';
import { validateContentFields } from './content/content.validation';
import { CONTENT_TYPE_MAP } from './content/content.schemas';
import { sniffImage } from './uploads/sniff';
import { ARTICLES_SEED, CASE_STUDIES_SEED, CONTENT_SEED, SERVICES_SEED } from './database/seed-data';

const ctx = { interests: new Set(['cloud-solutions', 'not-sure']), showBudget: true };
const lead = {
  name: ' Ada Lane ',
  email: 'Ada@Example.com',
  company: 'Northwind',
  interest: 'cloud-solutions',
  overview: 'We need to move three internal apps to the cloud this year.',
  timeline: 'Within 3 months',
  consent: true,
  meta: { source: 'website-contact', formStartedAt: new Date(Date.now() - 60_000).toISOString(), hp: '' },
};
const slugs = new Set(SERVICES_SEED.map((s) => s.slug));

let passed = 0;
const t = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('leads');
t('valid lead is normalised', () => {
  const { value, errors } = validateLead({ ...lead, phone: '', jobTitle: '', budget: 'Prefer not to say' }, ctx);
  assert.deepEqual(errors, {});
  assert.equal(value.name, 'Ada Lane');
  assert.equal(value.email, 'ada@example.com');
  assert.equal(value.phone, null);
  assert.equal(value.budget, 'Prefer not to say');
  assert.equal(value.source, 'website-contact');
});
t('required fields and exact messages', () => {
  const e = validateLead({}, ctx).errors;
  assert.equal(e.name, 'Enter your full name.');
  assert.equal(e.email, 'Enter your business email address.');
  assert.equal(e.company, 'Enter your company name.');
  assert.equal(e.interest, 'Select an area of interest.');
  assert.equal(e.overview, 'Describe your project or business challenge.');
  assert.equal(e.timeline, 'Select an expected timeline.');
  assert.equal(e.consent, 'Confirm you agree so we can respond to your enquiry.');
});
t('format rules', () => {
  const e = validateLead({ ...lead, name: 'x'.repeat(121), email: 'a@b', phone: 'call me', overview: 'too short', interest: 'gardening', timeline: 'Tomorrow', budget: '$5' }, ctx).errors;
  assert.equal(e.name, 'Name must be 120 characters or fewer.');
  assert.equal(e.email, 'Enter a valid email address, like name@company.com.');
  assert.equal(e.phone, 'Enter a valid phone number, or leave this blank.');
  assert.equal(e.overview, 'Add a little more detail (at least 30 characters).');
  assert.ok(e.interest && e.timeline && e.budget);
});
t('budget ignored when the field is hidden', () => {
  const { value, errors } = validateLead({ ...lead, budget: '$5' }, { ...ctx, showBudget: false });
  assert.deepEqual(errors, {});
  assert.equal(value.budget, null);
});
t('consent must be literally true', () => {
  assert.ok(validateLead({ ...lead, consent: 'true' }, ctx).errors.consent);
});
t('bot checks: honeypot and implausibly fast', () => {
  assert.equal(isBot({ meta: { hp: 'http://spam' } }, 2500), 'honeypot');
  assert.equal(isBot({ meta: { formStartedAt: new Date().toISOString() } }, 2500), 'too-fast');
  assert.equal(isBot(lead, 2500), null);
});

console.log('content');
t('service rules', () => {
  assert.equal(validateService({ name: 'X' }).errors.name, 'Enter a service name.');
  assert.equal(validateService({ name: 'Data', slug: 'not-sure' }).errors.slug, '"not-sure" is reserved for the enquiry form.');
  const pub = validateService({ name: 'Data', status: 'published' }).errors;
  assert.ok(pub.short && pub.overview);
  assert.ok(validateService({ name: 'Data', considerations: [{ title: 'Only a title' }] }).errors.considerations);
});
t('case study needs a known solution and full sections to publish', () => {
  assert.equal(validateCaseStudy({ title: 'A project', serviceSlug: 'nope' }, slugs).errors.serviceSlug, 'Choose the related solution.');
  const e = validateCaseStudy({ title: 'A project', serviceSlug: 'cloud-solutions', status: 'published' }, slugs).errors;
  assert.ok(e.client && e.context && e.outcomes);
});
t('article: reading time and publish rules', () => {
  assert.equal(readingTime('word '.repeat(1000)), 5);
  const e = validateArticle({ title: 'Hello there', category: 'Cloud', status: 'published' }).errors;
  assert.ok(e.excerpt && e.body);
  assert.ok(validateArticle({ title: 'Hello there', category: 'Cloud', publishedAt: 'soon' }).errors.publishedAt);
});
t('layer capabilities must be known services', () => {
  const def = CONTENT_TYPE_MAP.get('layer')!;
  assert.equal(Object.keys(validateContentFields(def, { code: 'L1', name: 'Infra', desc: 'x', services: ['cloud-solutions'] }, { serviceSlugs: slugs }).errors).length, 0);
  assert.ok(validateContentFields(def, { code: 'L1', name: 'Infra', desc: 'x', services: ['nope'] }, { serviceSlugs: slugs }).errors.services);
  assert.ok(validateContentFields(CONTENT_TYPE_MAP.get('job')!, { slug: 'Bad Slug' }).errors.slug);
});
t('every seed row passes its own validation', () => {
  for (const s of SERVICES_SEED) assert.deepEqual(validateService(s).errors, {}, s.slug);
  for (const c of CASE_STUDIES_SEED) assert.deepEqual(validateCaseStudy(c, slugs).errors, {}, c.slug);
  for (const a of ARTICLES_SEED) assert.deepEqual(validateArticle(a).errors, {}, a.slug);
  for (const [type, items] of Object.entries(CONTENT_SEED)) for (const it of items) assert.deepEqual(validateContentFields(CONTENT_TYPE_MAP.get(type)!, it.fields, { serviceSlugs: slugs }).errors, {}, type);
});
t('image sniffing ignores the claimed type', () => {
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
});

console.log(`\n${passed} checks passed`);
