# Mercer Technology Solutions — Data model extraction

Sources: `design-source/Mercer Website v2.dc.html` (**built from this one** — the dark "lavender on night" redesign), `Mercer Website.dc.html` (v1, light lavender theme, same structure), `API-CONTRACT.md` (the comp's own integration contract).

## Identity

- **Name:** Mercer Technology Solutions — "Technology, Orchestrated." Phoenix, Arizona.
- **Contact:** Holden Mercer · `holden.mercer@outlook.com` · `+1 (407) 239-8251` · `301 E Jefferson St, Phoenix, AZ 85004` · hero tag "PHOENIX, AZ · 33.45°N 112.07°W".
- **Fonts:** Unbounded 400–700 (display), Instrument Serif italic (accent words), Manrope 400–700 (body), JetBrains Mono 400/500 (labels).
- **Colours:** night `#0D0A1C` (page), `#110D24` (alt band), `#0A0817` (footer), surfaces `#15112B` / `#0F0B22` / `#17122F` / `#120E26` / `#1A1436` / `#1C1638`, lines `#2A2350` / `#3A2F6E` / `#4A3D88`, text `#F4F0FF`, body `#C4BCDF`, muted `#B6ADD3`, soft `#D9D1F5`, lavender `#B9A6FF` (primary), lavender-2 `#C9BAFF` (links), violet `#9B82FF`, pink `#FF8FC7` (accent/hover), pink-soft `#FFC2E0`, error `#FF7A8A` / `#FFB3BD`, warning `#E0A458` / `#FFD39A`, success `#6EE7B7`.
- **Motion:** animated network "topology" SVG (lines draw in, pink flow dashes along hub→core edges, glowing nodes, spinning core ring) with mouse parallax; marquee band; scroll-reveal (fade/rise, "clip" variant); approach timeline fill + stage counter driven by scroll; isometric "stack plates" that lift per capability; animations pause when the tab is hidden; all off under `prefers-reduced-motion`.
- **Breakpoints:** full nav ≥ 1200px (else "Menu" button + full-screen menu), wide hero visual / large stack plates ≥ 980px.

## Routes

| Route | Sections |
|---|---|
| `/` | Hero (tag, 3-line headline, CTA + "Explore Our Capabilities ↓", topology, service strip + location tag) · marquee · [02] Capabilities (service cards with dot-line motif, top 4 scope chips, "Not sure where your project fits?") · [03] Approach (sticky intro + 5 stages with scroll progress) · [04] Across the stack (toggle a capability → highlight layers L1–L4 + isometric plates) · Industries (samples only) · [05] Closing CTA |
| `/solutions` (`/solutions/:slug`) | Intro · Service explorer (vertical tablist, arrow keys; overview, problems, scope, "[Specific technologies… to be confirmed]", considerations accordion, "Discuss {name}") · In context (alternating image/text rows, "View details" → explorer, "Enquire →") |
| `/industries` | Intro · profiles: "in preparation" + 5 fields each profile will cover, **or** industry tabs with challenges / solutions / use case / related case study |
| `/case-studies` (`/:slug`) | Intro · portfolio: "0 published" empty state **or** filter by solution + count + cards · detail: 6 sections (Context, Challenge, Approach, Technology scope, Implementation, Outcomes) + related solution |
| `/company` | Intro · overview (image slot, statement, extended overview placeholder, Location / Focus) · How we work (4 principles) · Leadership (placeholder + primary contact card) |
| `/careers` (`/:slug`) | Intro · openings or "no open positions" · job detail (about, requirements, how to apply, Apply by email) |
| `/insights` (`/:slug`) | Intro · "being prepared" **or** category filter + search + count + featured + grid · article (meta, lead image, body, CTA) |
| `/contact` (`?interest=slug`) | Contact details · Project enquiry form |
| 404 | "This page isn't available." |

## Content (seeded verbatim)

- **Services (4):** Enterprise Software, Cloud Solutions, Systems Integration (published) + Infrastructure & Managed Services (*draft, unconfirmed* → sample). Each: slug, short, overview, 3 problems, 4 scope items, 4 considerations, image caption.
- **Stages (5)**, **stack layers (4, mapped to services)**, **principles (4)**, **industry profile fields (5)** — copy in `backend/src/database/seed-data.ts`.
- **Samples (shown only while "Show sample content" is on):** 4 industries, 3 case studies, 2 jobs, 4 articles — all explicitly marked SAMPLE in the comp.

## Enquiry form (API-CONTRACT.md + comp validation)

| Field | Rule → message |
|---|---|
| name | required, ≤120 → "Enter your full name." / "Name must be 120 characters or fewer." |
| email | required, ≤254, `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, lower-cased → "Enter your business email address." / "Enter a valid email address, like name@company.com." |
| company | required, ≤160 → "Enter your company name." |
| jobTitle | optional ≤120 |
| phone | optional, `/^[0-9+()\-.\s]{7,30}$/` → "Enter a valid phone number, or leave this blank." |
| interest | required: a published service slug or `not-sure` → "Select an area of interest." |
| overview | required, 30–4000 → "Describe your project or business challenge." / "Add a little more detail (at least 30 characters)." |
| timeline | required: As soon as possible · Within 3 months · 3–6 months · 6–12 months · Exploring options → "Select an expected timeline." |
| budget | optional (when `showBudget`): Under $50,000 · $50,000–$150,000 · $150,000–$500,000 · Over $500,000 · Prefer not to say |
| consent | must be true → "Confirm you agree so we can respond to your enquiry." |
| meta | `{ source, formStartedAt, hp }` — honeypot must be empty; completed in < 2.5s → rejected |

Responses: `201 {id}` success only · `422 {errors}` inline + error summary · `429` "Too many submissions…" · other → "Our server could not process…" · network → "We could not reach the server…". Failure keeps the form and offers **Try again** + **Email your enquiry instead** (mailto with the details).

Lead record: id, createdAt, name, email, company, jobTitle, phone, interest, overview, timeline, budget, consentAt, status (new · contacted · qualified · closed · spam), assignedTo, notes, retentionUntil.

## Flags & simulations

| Prop | Default | Implementation |
|---|---|---|
| `showSamples` (v1 `showDrafts`) | true | Setting "Show sample content" — must be **off** in production (contract) |
| `showBudget` | true | Setting |
| `enquiryEndpoint` | "" | Not needed — the form always posts to the real `/api/inquiries` |

Not reproduced: the "not connected" failure, the in-component sample arrays (moved to the database), JS width checks (real CSS breakpoints).
