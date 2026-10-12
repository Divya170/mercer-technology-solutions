# Mercer Technology Solutions — website

Next.js (App Router) frontend · NestJS API · SQLite3 (TypeORM). Built from the "Site redesign in lavender" design comp (`design-source/`). Content, form rules and flags are documented in `DATA-MODEL.md`.

```
mercer-technology-solutions/
├── backend/      NestJS API (src/, package.json, .env.example)
├── frontend/     Next.js site + admin (app/, components/, lib/, public/)
├── database/     app.sqlite is created here on first boot
├── design-source/  original .dc.html comps, API-CONTRACT.md, screenshots
├── DATA-MODEL.md
└── package.json  root scripts
```

## Run it

```bash
npm install                 # root (concurrently)
npm run install:all         # backend + frontend dependencies
cp backend/.env.example backend/.env       # set JWT_SECRET, admin login, SMTP
cp frontend/.env.example frontend/.env.local
npm run dev                 # API on :4000, site on :3000
```

The API creates `database/app.sqlite` on first boot. It then seeds the settings, solutions, page content, sample case studies and sample articles, and the admin account. Seeding is idempotent, and the admin credentials are printed to the console.

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin. Default login: `admin@mercertech.local` / `MercerAdmin#2026` (change it in `.env` or under Account).
- Tests: `npm test` runs the backend validation and seed checks.

## What works

**Public site**
- Pages: Home, Solutions (explorer + `/solutions/[slug]`), Industries, Case studies (filter by solution + detail), Company, Careers (+ job detail), Insights (category filter, search, scheduled publishing, detail), Contact, and Privacy (shown only when a policy is entered).
- Every page has loading, empty, error and 404 states.
- Responsive, using the design's real breakpoints: nav collapses at 1200px and the hero visual hides at 980px.
- Scroll reveal and animations pause when the tab is hidden and respect reduced motion.

**Enquiry form (`POST /api/enquiries`)**
- Validation messages copied exactly from the design, mirrored on the client.
- Spam and abuse protection:
  - a hidden honeypot field;
  - a minimum fill time;
  - 5 submissions/min per IP and 3/hour per email;
  - an idempotency key, so a double click doesn't create two leads.
- After sending you see a success card with the lead reference, plus "Explore our solutions" and "Send another enquiry" buttons.
- If sending fails you get a Try again button and an email fallback link.
- Supports `?interest=` prefill. Optional email notification over SMTP.
- Leads are kept for 730 days by default (`LEAD_RETENTION_DAYS`).

**Admin** (`/admin`, one login)
- **Dashboard:** lead counts, the last 30 days, a breakdown by interest, recent leads, CSV export and a button to delete expired leads.
- **Leads:**
  - status filters with counts (new / contacted / qualified / closed / spam), search, area-of-interest and "unassigned" filters, sorting and paging;
  - a detail panel with the full enquiry, status, "assigned to", internal notes, resend-notification and delete;
  - CSV export of the current status filter. Changes show in the sidebar "new" badge straight away.
- **Solutions:** add, edit, publish or unpublish, reorder (the order is the site order) and delete. Includes problems and scope lists, a considerations editor, image upload and the sample flag. A solution's page address is fixed once created.
- **Case studies:** add, edit, publish or unpublish and delete, with the six sections, related solution and image. Publishing needs an approved client name and all six sections.
- **Insights:** articles with category, author, excerpt, body, reading time (blank = calculated), featured flag, image and publish date. A future date schedules the article; the list shows Published / Scheduled / Draft with filters and search.
- **Site content & photos:** stages, stack layers, principles, leadership, industries, industry fields, jobs and page photos. Add, edit, hide, reorder and delete items, and upload images.
- **Settings:** company and contact details, company page copy, privacy policy text, a launch checklist, and the switches for sample content, the budget question and accepting enquiries.
- **Account:** change password.
- Admin views of lead data are written to an audit log (JSON, no personal data).

**API**
- Complete REST endpoints for services, case studies, articles, leads, settings, content and uploads. See `design-source/API-CONTRACT.md` and the controllers in `backend/src`.

## Missing / not implemented

### Other gaps
- **Not run end to end.** Package installation was blocked where this was built, so it was checked only by a TypeScript typecheck and the backend unit tests. Run `npm run install:all && npm run dev` and click through before launch.
- **Only the dark design (v2) is built.** The comp contains two versions. The public site follows the latest dark "v2" design; the light lavender "v1" palette is used only for the admin.
- **No user roles.** The contract mentions Editor, Administrator and Lead manager roles; there is a single admin account, so "assigned to" on a lead is free text.
- **No CRM integration.** The CRM adapter from the contract isn't built; leads are stored in SQLite and can be exported as CSV.

### Content to replace or confirm before launch
- **Sample content is on by default.** The comp default is `showSamples = true`. Sample industries, jobs, case studies, articles and the Infrastructure & Managed Services entry are seeded with the sample flag. Turn off **Show sample content** in Admin → Settings (the launch checklist there tracks it) and delete or replace the samples in Solutions, Case studies, Insights and Site content before going live.
- **No real images.** Every image slot shows the design's labelled placeholder until photos are uploaded.
- **Contact details need checking:**
  - The phone number `+1 (407) 239-8251` has an Orlando area code but the office address is in Phoenix, AZ.
  - The email is a personal Outlook address.
- **Privacy policy not supplied.** `/privacy` returns 404 and the form shows a placeholder until the policy text is added.
- **Technologies not specified.** The "Specific technologies and platforms — to be confirmed" note appears on every solution.
- **Leadership bios** come from the comp and need verifying.

### Production hardening
- **Rate limiting is in memory.** It resets on restart and isn't shared between instances; use Redis for multiple instances.
- **Schema uses `synchronize: true`.** Switch to TypeORM migrations for production.
- **Uploads are on local disk** (`backend/uploads`). Use object storage if you host on more than one server.
- **Expired-lead purge is manual** (the Dashboard button). There is no scheduled job.
- **Not built:** E2E tests, `sitemap.xml` / `robots.txt`, and analytics.
