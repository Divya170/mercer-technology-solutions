# Mercer Technology Solutions — Integration Contract

Status: **UI implemented, backend not connected.** The enquiry form only shows success on a real 2xx response. With no endpoint configured, the form shows an error and an email fallback.

## Configuration (props / env)
- `enquiryEndpoint`: URL of the enquiry API (e.g. `/api/enquiries`). Empty means not connected.
- `showDrafts`: admin preview of draft/unverified content. Must be `false` in production.
- `showBudget`: show the optional budget field.

## POST /api/enquiries
Request (JSON):
```
name        string  required  ≤120
email       string  required  ≤254, valid email, lowercased
company     string  required  ≤160
jobTitle    string|null       ≤120
phone       string|null       ≤30, [0-9+()-. ]
interest    enum    required  enterprise-software | cloud-solutions | systems-integration | not-sure (+ infrastructure-managed-services once confirmed)
overview    string  required  30–4000
timeline    enum    required
budget      string|null
consent     true    required
meta        { source, formStartedAt, hp }   hp = honeypot, must be empty
```
Responses:
- `201` `{ id }`: stored. This is the only response the UI treats as success.
- `422` `{ errors: { field: message } }`: shown inline per field.
- `429`: rate limited. UI asks the user to wait.
- `5xx`: generic error. Form data stays in the form.

Server requirements: re-validate and sanitize every field, reject when the honeypot is filled or the form was completed implausibly fast, rate-limit per IP and email, persist to `leads`, write structured logs without PII, never return stack traces.

## Lead record
`id, createdAt, name, email, company, jobTitle, phone, interest, overview, timeline, budget, consentAt, status (new | contacted | qualified | closed | spam), assignedTo, notes, retentionUntil`

## CMS models (draft | scheduled | published)
- SiteSettings: nav, contact details, SEO defaults
- Service: slug, name, short, overview, problems[], scope[], considerations[{title, body}], image, status
- Industry: name, challenges, solutions[→Service], useCases[], caseStudies[→CaseStudy], status
- CaseStudy: title, client (approved), category→Service, context, challenge, approach, scope, implementation, outcomes (verified), status
- CompanyProfile: overview, principles[], leadership[{name, title, bio, photo, verified}]
- Job: title, department, location, type, description, requirements, applyInstructions, status
- Article: title, slug, category, author→Author, publishedAt, readingTime, body, status
- Media / SEO: alt text, sizes, meta title/description, og image

## Roles (enforced server-side)
- Editor: create and edit content, cannot publish leadership or case studies
- Administrator: publish, manage users and settings
- Lead manager: read and update leads; access is audit-logged

## CRM (optional)
Adapter interface `pushLead(lead) → { externalId }`. Runs server-side with credentials from env vars and an idempotency key of `lead.id`. Retries with backoff, and failures are logged without blocking storage. No provider is assumed.
