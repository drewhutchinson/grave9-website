# grave9.com Website Design Spec

**Date:** 2026-05-07
**Status:** Approved (pending implementation plan)
**Project:** Grave 9 Productions LLC marketing site

## Goal

Stand up a single-page marketing site at grave9.com that satisfies A2P 10DLC registration requirements and mirrors the engineering and hosting pattern already proven on hutchops.com, while presenting Grave 9 Productions LLC's actual business (live event production since 1998) with its own visual identity.

## Non-goals

- No CMS, no blog, no dynamic backend. Static HTML/CSS/JS only.
- No analytics integration in v1 (can be added later).
- No build step. Files in the repo are what gets served.
- No shared code, assets, or deploys with hutchops.com. The two sites are fully separated.
- No custom design system beyond what the Grave 9 logo and brand guidelines dictate.

## Project separation

Each site is its own project, its own git repo, its own GitHub remote, its own Cloudflare Pages deploy. No shared parent, no monorepo, no symlinks.

```
C:\Users\drewh\Documents\Claude\Projects\
├── Hutch Ops\Website\        (existing, untouched)
└── Grave 9\Website\          (new, this spec)
```

The Hutch Ops project is not modified by this work.

## Directory layout (new project)

```
Grave 9\Website\
├── CLAUDE.md             (WAT framework instructions, project-scoped)
├── .gitignore
├── package.json          (start script: npx http-server -p 8765 -c-1)
├── index.html
├── privacy.html
├── terms.html
├── styles.css
├── script.js
├── brand_assets\
│   ├── Grave-9-Logo.png            (red/black mark on white)
│   ├── Grave-9-Logo-Dark.png       (white/red on dark variant)
│   ├── Grave-9-Brand-Guidelines.*  (PDF or PNG, dropped in by user)
│   └── ghl-form-theme.css          (themed for Grave 9 colors)
├── tools\
│   └── verify_a2p_compliance.js    (grave9.com baseline, Grave 9 form ID)
└── docs\superpowers\specs\
    └── 2026-05-07-grave9-website-design.md  (this file)
```

## Visual identity

Distinct from Hutch Ops. Same blueprint, different skin.

- **Palette**
  - Background: black `#0A0A0A`
  - Body text: white `#FFFFFF`
  - Accent: signature Grave 9 red (color-picked from the official logo file at build time; approximate `#C8102E`)
  - Secondary text and dividers: grey `#9A9A9A` (matches the dark-mode logo variant)
- **Primary surface:** dark. Hero, nav, and most sections sit on near-black with white type. Hutch Ops uses light/blue. Grave 9 uses dark/red.
- **Logo placement**
  - Default site usage: dark-on-light variant where surface is light, light-on-dark variant where surface is dark
  - Hero/nav default: light-on-dark variant
  - Footer: dark-on-light variant on a white slab, or light-on-dark on the black slab (final choice during build)
- **Typography**
  - Body: system sans stack, same as Hutch Ops
  - Headlines: heavier display weight to read closer to the bold italic energy of the Grave9 wordmark
  - No web-font additions unless the brand guidelines PDF requires one. Reconciled at build time after assets land.
- **Accents:** red is reserved for CTAs, the inline "9" in any `Grave9` text mention, key stat numbers, hover states, and section dividers. Not used as a background wash.

## Home page structure

Single page, sticky top nav, anchor-linked sections.

```
[ Sticky nav ]
  Logo (Grave9 mark, left) | Services · About · Partners · Contact | Phone CTA right

[ Hero ]
  H1: Live Event Production Built for Broadcast, Sponsors & Fans
  Sub: Since 1998, Grave 9 Productions LLC has produced live events
       across the United States, from intimate venue activations to
       large-scale festivals and nationally supported broadcast events.
  Primary CTA: Request a Consultation -> scrolls to #contact
  Secondary:   Talk With Our Team     -> tel: link to (602) 560-7737

[ Stats strip ]   one row, three numbers in red
  25+ Years   ·   Nationwide   ·   Festivals to Broadcast Events

[ What We Produce ]   4 service cards, 2x2 desktop, stacked mobile
  • Live Event Production
  • Festival Production
  • Broadcast & Sponsor Integration
  • Event Consulting
  Each card: short blurb + bulleted capabilities (verbatim from approved copy)

[ About Grave 9 ]
  Heritage paragraph (1998 -> today). Full About copy from approved document.

[ Why Grave 9 ]   5-up icon row
  Decades of Experience · Events of Every Scale · Broadcast & Sponsor
  Expertise · Fan-First Approach · Reliable Execution

[ Who We Work With ]   replaces Hutch Ops trusted-by logo wall
  10-item chip grid:
    Broadcast Companies, National & Regional Sponsors, Music Festivals,
    Concert Promoters, Venues & Arenas, Community Events, Corporate Brands,
    Entertainment Agencies, Touring Productions, Sports & Lifestyle Events

[ Contact ]   #contact
  H2: Let's Create Something Unforgettable
  Lead-in paragraph from approved copy
  -> GHL form embed (Grave 9 form ID, themed dark/red)
  Below form: A2P 10DLC consent text + links to Privacy and Terms

[ Footer ]
  Grave9 logo · © 2026 Grave 9 Productions LLC
  Phone (clickable) · Email (clickable) · Mailing address
  Privacy · Terms · SMS opt-in disclosure
```

**Recurring secondary tagline:** *Built for Broadcast. Designed for Fans.*

**Removed vs. Hutch Ops layout:** no trusted-by tech logo wall (HubSpot/Make/Anthropic/etc.); no automation-process section. Replaced by Services + Why Choose Us + Who We Work With.

## Source content

All headline copy, service blurbs, capabilities lists, taglines, About paragraph, and Contact lead-in are taken verbatim from the approved content document supplied by the user. The build will not invent or paraphrase service copy.

## Business facts (canonical)

These values appear on the site, in legal pages, and in the A2P verifier tool. Single source of truth for the build.

- **Legal entity:** GRAVE 9 PRODUCTIONS LLC
- **Phone:** +1 602-560-7737 (E.164 for `tel:` links; displayed as `(602) 560-7737`)
- **Email:** drew@grave9.com
- **Mailing address:** 758 W Moon Valley Dr, Phoenix, AZ 85023
- **Governing law:** Arizona
- **Established:** 1998
- **GHL location ID:** tplC2NjstFhYWVx7e9oM
- **GHL form ID:** PENDING (the value initially provided is the Hutch Ops form ID and must not be used)

## A2P 10DLC compliance

A2P/TCR/Twilio reviewers grep these sites for specific phrases. Every item below must appear on the live site for registration to pass first review.

### privacy.html

Cloned from the Hutch Ops template with substitutions.

- Legal entity replaced everywhere: "Grave 9 Productions LLC"
- Mailing address, phone, and email swapped throughout
- The TCR magic clause stays verbatim (case-insensitive, whitespace-tolerant): *"No mobile information will be shared with third parties or affiliates for marketing or promotional purposes."*
- SMS section: messaging frequency, message-and-data-rates language, HELP and STOP instructions, opt-in mechanism description, opt-out instructions
- Cookie/analytics section: dropped in v1 (no analytics installed)
- Effective date: build date

### terms.html

Cloned from the Hutch Ops template with substitutions.

- 18+ eligibility clause (same wording as the most recent Hutch Ops commit)
- Service description rewritten in one paragraph for Grave 9: *"Grave 9 Productions LLC provides live event production, festival production, broadcast and sponsor integration services, and event consulting throughout the United States."*
- Governing law: Arizona
- Contact, entity, and mailing address swapped

### index.html A2P artifacts

- Visible consent line below the contact form stating that submitting the form opts the visitor in to SMS from Grave 9 Productions, including messaging frequency, msg/data rates language, HELP/STOP instructions, and links to Privacy and Terms
- Visible business phone number on the page (TCR expects to see one)
- Footer always shows entity, phone, email, address, and links to Privacy / Terms / SMS opt-in disclosure

### Form-side compliance (handled in GHL by user, not in this build)

- Consent checkbox text on the Grave 9 form must include the magic clause and carrier disclaimer language
- A2P brand registration uses "Grave 9 Productions LLC" matching the legal entity in privacy/terms
- Use case sample messages reference Grave 9, e.g. *"Hi, this is Drew from Grave 9 Productions following up on your event inquiry..."*

## Tooling

`tools/verify_a2p_compliance.js` is cloned from the Hutch Ops version and modified at the top:

```js
const DEFAULT_BASE_URL = 'https://grave9.com';
const GHL_FORM_ID      = '<grave-9-form-id>';   // populated when user provides
```

User-Agent header changes to `Grave9-A2P-Verifier/1.0`. All other checks remain: magic clause grep on `/privacy.html`, opt-out language, HELP/STOP, and link reachability for `/`, `/privacy.html`, `/terms.html`, and the GHL form URL.

Run before submitting the A2P registration. Exits 0 if every required check passes, 1 otherwise.

## Build / deploy pipeline

1. `git init` in `Grave 9\Website\`, initial commit on `main` containing all source files plus this spec
2. Create a public GitHub repo (e.g. `drew-hutchinson/grave9-website`)
3. Push `main`
4. Cloudflare Pages: new project, connect the GitHub repo, no build command, output directory `/`
5. Auto-deploy on push to `main`
6. Add `grave9.com` and `www.grave9.com` as custom domains in the Pages project
7. Cloudflare DNS: apex + `www` records pointing at the Pages project (Cloudflare auto-suggests records when the custom domain is added)
8. GoDaddy: change nameservers for grave9.com to Cloudflare's two NS values
9. After DNS propagation, run `node tools/verify_a2p_compliance.js --base-url https://grave9.com` and confirm exit 0
10. Submit A2P 10DLC registration in GHL for the Grave 9 sub-account

**Local preview:** `npm start` runs `npx http-server -p 8765 -c-1`. Site previews at `http://127.0.0.1:8765`.

**Repo visibility:** Public, matching Hutch Ops.

## Open items / blockers

These do not block writing the implementation plan, but they block shipping a passing A2P verifier run:

1. **Grave 9 GHL form ID.** The value initially provided was the Hutch Ops form ID. The build will scaffold a placeholder block with correct dimensions where the form goes, and the verifier will be wired with a `TODO` constant until the real ID is supplied.
2. **Brand guidelines file.** User will drop the official guidelines (PDF or PNG) into `brand_assets/`. Build will reconcile the exact red hex value, type rules, and spacing against the official spec before final commit.

## Out of scope (explicitly)

- Modifying the Hutch Ops project in any way
- Sharing assets, code, or deploys between the two sites
- Building a multi-page site beyond home + privacy + terms
- Custom backend, CMS, or analytics
- Designing or modifying the GHL form itself (handled by user inside GHL)
- A2P registration submission (handled by user inside GHL after the verifier passes)
