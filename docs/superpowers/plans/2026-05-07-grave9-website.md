# grave9.com Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a production marketing site at grave9.com that passes A2P 10DLC pre-flight verification and mirrors the engineering and hosting pattern proven on hutchops.com, fully separated as its own project, repo, and deploy.

**Architecture:** Static HTML/CSS/JS marketing site (single page + privacy + terms), deployed via Cloudflare Pages from a public GitHub repo, with DNS at Cloudflare and registrar at GoDaddy. A Node-based pre-flight verifier (`tools/verify_a2p_compliance.js`) acts as the integration test suite: it greps the live site for every TCR/Twilio-required phrase, exits 0 when everything passes, exits 1 on any miss. The verifier is built first; site sections are then implemented to make verifier checks pass section by section.

**Tech Stack:** Vanilla HTML5, CSS3 (no preprocessor, no framework), vanilla JS, Node.js stdlib (verifier only), `http-server` for local preview, GHL inline form embed, Cloudflare Pages, GitHub.

---

## File structure

```
C:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\
├── CLAUDE.md             WAT framework instructions, project-scoped (cloned from Hutch Ops)
├── .gitignore            same as Hutch Ops
├── package.json          start script + name = grave-9-website
├── index.html            single-page home: nav, hero, stats, services, about, why, partners, contact, footer
├── privacy.html          A2P 10DLC privacy policy (magic clause + SMS section + Grave 9 contact)
├── terms.html            A2P 10DLC terms (18+ + AZ governing law + Grave 9 service description)
├── styles.css            Grave 9 palette (red/black/white) + layout primitives + components
├── script.js             year stamp, sticky-header toggle, mobile nav, reveal-on-scroll
├── brand_assets\
│   ├── Grave-9-Logo.png             dark-on-light variant (red/black on white)
│   ├── Grave-9-Logo-Dark.png        light-on-dark variant (white/red on black)
│   └── Grave-9-Brand-Guidelines.*   official guidelines (user provides; PDF or PNG)
├── tools\
│   └── verify_a2p_compliance.js     A2P pre-flight checker, grave9.com baseline
└── docs\superpowers\
    ├── specs\2026-05-07-grave9-website-design.md
    └── plans\2026-05-07-grave9-website.md   (this file)
```

Each file has one responsibility. `styles.css` is one file by convention (matches Hutch Ops); if it grows beyond manageable in future, splitting is fair game.

---

## Task 1: Bootstrap the project directory

**Files:**
- Create: `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\package.json`
- Create: `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\.gitignore`
- Create: `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\CLAUDE.md`
- Create: `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\brand_assets\.gitkeep`
- Create: `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\tools\.gitkeep`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "grave-9-website",
  "version": "1.0.0",
  "private": true,
  "description": "Grave 9 Productions LLC marketing site + A2P 10DLC compliance tooling",
  "scripts": {
    "start": "npx http-server -p 8765 -c-1 .",
    "verify": "node tools/verify_a2p_compliance.js",
    "verify:local": "node tools/verify_a2p_compliance.js --base-url http://127.0.0.1:8765"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.tmp/
.env
.DS_Store
Thumbs.db
*.log

# Local tooling and credentials
.claude/
credentials.json
token.json
```

- [ ] **Step 3: Create `CLAUDE.md`** (clone the Hutch Ops `CLAUDE.md` verbatim; it describes the WAT framework, which applies to this project too)

Run from `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\`:

```bash
cp "../../Hutch Ops/Website/CLAUDE.md" CLAUDE.md
```

- [ ] **Step 4: Create empty `brand_assets/.gitkeep` and `tools/.gitkeep` so the directories are tracked**

```bash
mkdir -p brand_assets tools
touch brand_assets/.gitkeep tools/.gitkeep
```

- [ ] **Step 5: Verify scaffold**

Run: `ls -la`
Expected output includes: `CLAUDE.md`, `.gitignore`, `package.json`, `brand_assets/`, `tools/`.

- [ ] **Step 6: Initialize git and make the first commit**

```bash
git init -b main
git add CLAUDE.md .gitignore package.json brand_assets/.gitkeep tools/.gitkeep docs/
git commit -m "Initial scaffold: Grave 9 Productions LLC website"
```

Expected: commit succeeds. The `docs/` directory contains the spec and this plan, both tracked.

---

## Task 2: Drop in Grave 9 logo files (USER ACTION)

**Files:**
- Create: `brand_assets/Grave-9-Logo.png` (red/black mark on white background)
- Create: `brand_assets/Grave-9-Logo-Dark.png` (white/red on black background)
- Create: `brand_assets/Grave-9-Brand-Guidelines.pdf` (or `.png`)

- [ ] **Step 1: User saves the three files into `brand_assets/`**

The logo PNGs were shared in the design brainstorming session. The user must save them to disk at the paths above before continuing. Filenames must match exactly so HTML `<img>` references resolve.

- [ ] **Step 2: Verify all three files exist**

Run: `ls -la brand_assets/`
Expected: all three files present, non-zero size.

- [ ] **Step 3: Commit the brand assets**

```bash
git add brand_assets/Grave-9-Logo.png brand_assets/Grave-9-Logo-Dark.png brand_assets/Grave-9-Brand-Guidelines.*
git commit -m "Add Grave 9 logo variants and brand guidelines"
```

---

## Task 3: Build the A2P pre-flight verifier (TDD: write the tests first)

**Files:**
- Create: `tools/verify_a2p_compliance.js`

The verifier serves as the integration test suite. It is built first so that as each subsequent task lands, we run the verifier and watch checks turn from FAIL to PASS.

- [ ] **Step 1: Create the verifier**

Clone the structure from `c:/Users/drewh/Documents/Claude/Projects/Hutch Ops/Website/tools/verify_a2p_compliance.js`, then change the brand-specific constants and check phrases. The full file is below. Write it verbatim:

```javascript
/**
 * A2P 10DLC pre-flight compliance checker for grave9.com.
 *
 * Fetches your live website pages and verifies every piece of language
 * that TCR / Twilio / GHL reviewers look for is actually published before
 * you submit your A2P registration. Run this before clicking "Submit" in GHL.
 *
 * Usage:
 *   node tools/verify_a2p_compliance.js
 *   node tools/verify_a2p_compliance.js --base-url https://grave9.com
 *   node tools/verify_a2p_compliance.js --base-url http://127.0.0.1:8765
 *
 * Exits 0 if every required check passes, 1 if anything is missing.
 * Stdlib only. No dependencies, no API calls, no costs.
 */

'use strict';

const http  = require('http');
const https = require('https');
const { URL } = require('url');

const DEFAULT_BASE_URL = 'https://grave9.com';

// GHL contact form. Lives on api.leadconnectorhq.com regardless of where
// the site is hosted, so it's checked as an absolute URL. Until the Grave 9
// form ID is provided, the form check will fail; that's expected.
const GHL_FORM_ID  = 'GRAVE9_FORM_ID_PENDING';
const GHL_FORM_URL = `https://api.leadconnectorhq.com/widget/form/${GHL_FORM_ID}`;

const REQUIRED_PAGES = {
  home:    '/',
  privacy: '/privacy.html',
  terms:   '/terms.html',
  form:    GHL_FORM_URL,
};

const MAGIC_CLAUSE =
  'no mobile information will be shared with third parties or affiliates ' +
  'for marketing or promotional purposes';

function parseArgs(argv) {
  const out = { baseUrl: DEFAULT_BASE_URL };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base-url' || a === '-u') {
      out.baseUrl = argv[++i];
    } else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'Usage: node tools/verify_a2p_compliance.js [--base-url <url>]\n'
      );
      process.exit(0);
    } else {
      process.stderr.write(`unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

function fetch(url, { timeoutMs = 10_000 } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); }
    catch (e) {
      return resolve({ url, status: 0, ok: false, body: '', error: `bad url: ${e.message}` });
    }
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(url, {
      headers: { 'User-Agent': 'Grave9-A2P-Verifier/1.0' },
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetch(next, { timeoutMs }));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ url, status: res.statusCode, ok: res.statusCode === 200, body, error: '' });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    req.on('error', (err) => {
      resolve({ url, status: 0, ok: false, body: '', error: `${err.code || ''} ${err.message}`.trim() });
    });
  });
}

function flat(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const contains    = (needle)     => (html) => flat(html).includes(flat(needle));
const containsAny = (...needles) => (html) => { const f = flat(html); return needles.some(n => f.includes(flat(n))); };
const containsAll = (...needles) => (html) => { const f = flat(html); return needles.every(n => f.includes(flat(n))); };

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const hasLinkTo = (path) => {
  const re = new RegExp(
    `href\\s*=\\s*["'][^"']*${escapeRegex(path)}(?:[?#"'][^"']*)?["']`,
    'i'
  );
  return (html) => re.test(html);
};

function buildChecks() {
  return [
    { name: 'Privacy: TCR magic clause is present',
      page: 'privacy', test: contains(MAGIC_CLAUSE),
      why: 'Single most common rejection reason. TCR/Twilio reviewers grep for this exact phrase.' },
    { name: 'Privacy: SMS section names the messaging program',
      page: 'privacy', test: containsAll('sms', 'text messag'),
      why: 'Reviewers want a section that explicitly describes the SMS program.' },
    { name: 'Privacy: discloses STOP / HELP keywords',
      page: 'privacy', test: containsAll('stop', 'help'),
      why: 'Required: must tell users how to opt out and get help.' },
    { name: 'Privacy: discloses message frequency',
      page: 'privacy',
      test: containsAny('5 messages per month', '5 msgs per month', 'up to 5 messages', 'up to 5 msgs'),
      why: 'Required: a stated frequency cap (chose up to 5 per month).' },
    { name: 'Privacy: msg & data rates may apply disclosure',
      page: 'privacy',
      test: containsAny('msg & data rates may apply', 'message and data rates may apply', 'msg and data rates may apply'),
      why: 'Required language. Most carriers want this verbatim.' },
    { name: 'Privacy: contact / business address',
      page: 'privacy',
      test: containsAll('grave 9', 'phoenix', '85023'),
      why: 'Reviewers cross-check business identity against EIN / brand registration.' },

    { name: 'Terms: SMS Messaging Terms section',
      page: 'terms', test: containsAll('sms', 'frequency', 'stop', 'help'),
      why: 'Dedicated SMS terms section with frequency + opt-out keywords required.' },
    { name: 'Terms: msg & data rates may apply disclosure',
      page: 'terms',
      test: containsAny('msg & data rates may apply', 'message and data rates may apply', 'msg and data rates may apply'),
      why: 'Required language on the terms page too.' },
    { name: 'Terms: carrier liability disclaimer',
      page: 'terms',
      test: containsAny('carriers are not liable', 'carrier is not liable', 'not liable for delayed or undelivered'),
      why: 'Standard CTIA-recommended disclaimer.' },
    { name: 'Terms: age restriction (18+)',
      page: 'terms',
      test: containsAny('at least 18', '18 years old', '18 years of age', 'eighteen years', '18+'),
      why: 'CTIA / TCR requires terms to state an 18+ age requirement for SMS.' },

    { name: 'Home: links to Privacy Policy',
      page: 'home', test: hasLinkTo('privacy.html'),
      why: 'Privacy policy must be reachable from the page that hosts the opt-in form.' },
    { name: 'Home: links to Terms of Service',
      page: 'home', test: hasLinkTo('terms.html'),
      why: 'Terms must be reachable from the page that hosts the opt-in form.' },
    { name: 'Home: SMS opt-in description near the form',
      page: 'home', test: containsAll('text messag', 'stop', '5 messages'),
      why: 'Reviewers visit the URL where consumers opt in. Page must describe message types, frequency, and opt-out.' },
    { name: 'Home: msg & data rates may apply near the form',
      page: 'home',
      test: containsAny('msg & data rates may apply', 'message and data rates may apply', 'msg and data rates may apply'),
      why: 'Required disclosure where consent is captured.' },
    { name: 'Home: business address on page',
      page: 'home', test: containsAll('phoenix', '85023'),
      why: 'Visible business identity helps reviewers confirm brand registration.' },
    { name: 'Home: business phone number on page',
      page: 'home',
      test: containsAny('(602) 560-7737', '602-560-7737', '6025607737', '+16025607737'),
      why: 'Carrier compliance checklists expect a publicly visible phone number on the business website.' },
    { name: 'Privacy: business phone number on page',
      page: 'privacy',
      test: containsAny('(602) 560-7737', '602-560-7737', '6025607737', '+16025607737'),
      why: 'Phone should appear consistently across legal pages.' },
    { name: 'Terms: business phone number on page',
      page: 'terms',
      test: containsAny('(602) 560-7737', '602-560-7737', '6025607737', '+16025607737'),
      why: 'Phone should appear consistently across legal pages.' },

    { name: 'Form: SMS consent label is present',
      page: 'form',
      test: containsAny('i agree to receive', 'i consent to receive'),
      why: 'The form must have an explicit consent statement next to the checkbox.' },
    { name: 'Form: identifies brand (Grave 9)',
      page: 'form', test: contains('grave 9'),
      why: 'Consent must name the sending brand.' },
    { name: 'Form: describes message types concretely',
      page: 'form',
      test: containsAny('appointment', 'reminders', 'replies', 'follow-ups', 'follow ups'),
      why: 'Vague descriptions fail review. Reviewers want concrete message types.' },
    { name: 'Form: states message frequency cap',
      page: 'form',
      test: containsAny('5 msgs/month', '5 msgs per month', '5 messages per month', 'up to 5 messages', 'up to 5 msgs'),
      why: 'A specific cap is required and must match your privacy policy.' },
    { name: 'Form: msg & data rates may apply disclosure',
      page: 'form',
      test: containsAny('msg & data rates may apply', 'message and data rates may apply', 'msg and data rates may apply'),
      why: 'Required carrier disclosure on the consent label itself.' },
    { name: 'Form: STOP and HELP keywords disclosed',
      page: 'form', test: containsAll('stop', 'help'),
      why: 'Required: opt-out and help keywords on the consent label.' },
    { name: 'Form: "consent is not a condition" language',
      page: 'form',
      test: containsAny('consent is not a condition', 'not required to consent', 'not a condition of any purchase'),
      why: 'TCPA-recommended language. Removes a common rejection vector.' },
    { name: 'Form: references Privacy Policy',
      page: 'form', test: contains('privacy'),
      why: 'CTIA best practice: consent label should reference the privacy policy.' },
    { name: 'Form: references Terms',
      page: 'form', test: contains('terms'),
      why: 'CTIA best practice: consent label should reference the terms.' },
  ];
}

async function run(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');
  const pages = {};
  for (const [key, path] of Object.entries(REQUIRED_PAGES)) {
    const url = /^https?:\/\//i.test(path) ? path : base + path;
    pages[key] = await fetch(url);
  }

  const checks = buildChecks();
  for (const check of checks) {
    const page = pages[check.page];
    if (!page || !page.ok) {
      check.passed = false;
      check.notes = `page '${check.page}' not reachable`;
      continue;
    }
    try { check.passed = !!check.test(page.body); }
    catch (e) { check.passed = false; check.notes = `check raised: ${e.message}`; }
  }

  return { baseUrl: base, pages, checks };
}

const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (s, code) => (supportsColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => c(s, '92');
const red   = (s) => c(s, '91');
const yel   = (s) => c(s, '93');
const dim   = (s) => c(s, '2');
const bold  = (s) => c(s, '1');

function printReport(report) {
  console.log();
  console.log(bold(`A2P 10DLC pre-flight check  ::  ${report.baseUrl}`));
  console.log(dim('='.repeat(72)));
  console.log();

  console.log(bold('Page reachability:'));
  for (const [key, page] of Object.entries(report.pages)) {
    const label = key.padEnd(8);
    if (page.ok) {
      console.log(`  ${green('PASS')}  ${label}  ${page.url}  (${page.status})`);
    } else {
      const detail = page.error || `HTTP ${page.status}`;
      console.log(`  ${red('FAIL')}  ${label}  ${page.url}  (${detail})`);
    }
  }
  console.log();

  console.log(bold('Content checks:'));
  let fails = 0;
  for (const check of report.checks) {
    if (check.passed) {
      console.log(`  ${green('PASS')}  ${check.name}`);
    } else {
      fails++;
      console.log(`  ${red('FAIL')}  ${check.name}`);
      console.log(`        ${dim('why: ' + check.why)}`);
      if (check.notes) {
        console.log(`        ${yel('note: ' + check.notes)}`);
      }
    }
  }
  console.log();

  const total = report.checks.length;
  const passed = total - fails;
  const pagesOk = Object.values(report.pages).every(p => p.ok);
  const summary = `${passed} / ${total} checks passed`;
  if (fails === 0 && pagesOk) {
    console.log(green(`  ${summary}.  Ready to submit A2P registration in GHL.`));
  } else {
    console.log(red(`  ${summary}.  Fix the failures above before submitting.`));
  }
  console.log();
  return fails === 0 && pagesOk;
}

(async () => {
  const args = parseArgs(process.argv);
  const report = await run(args.baseUrl);
  const ok = printReport(report);
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(red('verifier crashed: ') + err.stack);
  process.exit(2);
});
```

- [ ] **Step 2: Confirm the verifier runs (against the live hutchops.com to sanity-check the harness)**

Run: `node tools/verify_a2p_compliance.js --base-url https://hutchops.com`
Expected: the script runs, fetches pages, prints the report. Many checks will FAIL (because hutchops.com has Hutch Ops phone/brand, not Grave 9). The point of this step is only to confirm the harness itself runs without crashing. Exit code 1 is expected here.

- [ ] **Step 3: Commit the verifier**

```bash
git add tools/verify_a2p_compliance.js
git commit -m "Add A2P 10DLC pre-flight verifier for grave9.com"
```

---

## Task 4: Build privacy.html (target: privacy checks pass)

**Files:**
- Create: `privacy.html`

- [ ] **Step 1: Verify the privacy checks currently fail (no file exists yet)**

We can't run the verifier against a missing file. The "test fails" state for this task is: privacy.html does not exist. Confirm: `ls privacy.html` returns "No such file."

- [ ] **Step 2: Create `privacy.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Grave 9 Productions LLC privacy policy. How we collect, use, and protect your information, including SMS messaging data." />
  <meta name="theme-color" content="#0A0A0A" />
  <title>Privacy Policy | Grave 9 Productions LLC</title>

  <link rel="icon" type="image/png" href="brand_assets/Grave-9-Logo.png" />

  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <header class="site-header">
    <div class="container nav">
      <a href="index.html#top" class="logomark" aria-label="Grave 9 Productions home">
        <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
      </a>

      <nav class="nav__links" aria-label="Primary">
        <a href="index.html#services">Services</a>
        <a href="index.html#about">About</a>
        <a href="index.html#partners">Partners</a>
        <a href="index.html#contact">Contact</a>
      </nav>

      <a href="index.html#contact" class="btn btn--primary btn--sm nav__cta">
        Request a Consultation
      </a>
    </div>
  </header>

  <main class="legal">
    <div class="container legal__inner">

      <span class="eyebrow"><span class="eyebrow__fig">&sect; A</span>Privacy Policy</span>
      <h1 class="legal__title">Privacy Policy</h1>
      <p class="legal__meta">Effective date: May 7, 2026</p>

      <section>
        <p>
          Grave 9 Productions LLC ("Grave 9," "we," "us," or "our") respects your
          privacy. This Privacy Policy explains what information we collect when
          you visit <a href="https://grave9.com">grave9.com</a> or contact us, how
          we use it, how we share it, and the choices you have. By using our
          website or submitting your information through our contact form, you
          agree to this policy.
        </p>
      </section>

      <section>
        <h2>1. Who we are</h2>
        <p>
          Grave 9 Productions LLC is an Arizona limited liability company that
          provides live event production, festival production, broadcast and
          sponsor integration services, and event consulting throughout the
          United States, in business since 1998.
        </p>
        <p class="legal__address">
          Grave 9 Productions LLC<br />
          758 W Moon Valley Dr<br />
          Phoenix, AZ 85023<br />
          <a href="tel:+16025607737">(602) 560-7737</a><br />
          <a href="mailto:drew@grave9.com">drew@grave9.com</a>
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>We only collect information you give us directly. That includes:</p>
        <ul>
          <li><strong>Contact details</strong> you submit through our contact form, including your name, email address, phone number, company name, event details, and any other information you provide.</li>
          <li><strong>Message content</strong> from emails, SMS, and calls you send us.</li>
          <li><strong>Basic technical data</strong> your browser sends automatically, such as IP address, device type, browser type, referring page, and the pages you view on our site.</li>
        </ul>
        <p>
          We do not knowingly collect information from anyone under 13 years of
          age. Our services are intended for businesses and the people who run
          them.
        </p>
      </section>

      <section>
        <h2>3. How we use your information</h2>
        <p>We use the information you give us to:</p>
        <ul>
          <li>Respond to your inquiry and follow up about a possible engagement.</li>
          <li>Send appointment confirmations, reminders, and follow-ups by email or SMS if you have opted in.</li>
          <li>Deliver the services we agree to perform for you.</li>
          <li>Improve our website and our services.</li>
          <li>Comply with our legal and tax obligations.</li>
        </ul>
      </section>

      <section id="sms">
        <h2>4. SMS and text messaging</h2>
        <p>
          If you provide your mobile number through our contact form and check
          the SMS consent box, you are opting in to receive text messages from
          Grave 9 Productions related to your inquiry. This includes appointment
          confirmations, reminders, replies to your questions, and follow-ups
          about your event or project.
        </p>
        <ul>
          <li><strong>Message frequency:</strong> Up to 5 messages per month, depending on your conversation with us.</li>
          <li><strong>Costs:</strong> Message and data rates may apply, depending on your mobile carrier and plan.</li>
          <li><strong>Opt out:</strong> Reply <strong>STOP</strong> to any message to unsubscribe at any time. You can reply <strong>HELP</strong> for help, or email us at <a href="mailto:drew@grave9.com">drew@grave9.com</a>.</li>
          <li><strong>Carriers:</strong> Carriers are not liable for delayed or undelivered messages.</li>
        </ul>
        <p>
          <strong>
            No mobile information will be shared with third parties or affiliates
            for marketing or promotional purposes. Information sharing to
            subcontractors in support services, such as customer service, is
            permitted. All other use case categories exclude text messaging
            originator opt-in data and consent; this information will not be
            shared with any third parties.
          </strong>
        </p>
      </section>

      <section>
        <h2>5. How we share information</h2>
        <p>We do not sell your personal information. We share it only in these limited cases:</p>
        <ul>
          <li><strong>Service providers</strong> we use to run our business, such as our CRM (HighLevel / LeadConnector), email provider, hosting provider, and analytics tools. These vendors only see what they need to deliver their service to us, and they are bound to keep it confidential.</li>
          <li><strong>Legal requirements</strong> if we are required to disclose information by law, subpoena, or court order, or to protect the rights, property, or safety of Grave 9 Productions, our clients, or others.</li>
          <li><strong>Business transfers</strong> if Grave 9 Productions is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
        </ul>
        <p>
          As stated above, mobile phone numbers and SMS opt-in data are never
          shared with third parties or affiliates for marketing or promotional
          purposes.
        </p>
      </section>

      <section>
        <h2>6. Cookies and analytics</h2>
        <p>
          Our site uses a small number of cookies and similar technologies to
          keep basic session state and to understand how the site is used. You
          can disable cookies in your browser settings. Doing so should not
          break the site.
        </p>
      </section>

      <section>
        <h2>7. Data retention</h2>
        <p>
          We keep your information for as long as we need it to respond to you,
          deliver services to you, or meet our legal obligations. If you ask us
          to delete your information, we will, except where we are required to
          keep it.
        </p>
      </section>

      <section>
        <h2>8. Your rights and choices</h2>
        <p>
          You can ask us to access, correct, or delete the personal information
          we hold about you, or to stop using it for marketing. To make a
          request, email <a href="mailto:drew@grave9.com">drew@grave9.com</a>
          from the address we have on file. We will respond within a reasonable
          time.
        </p>
        <p>
          You can opt out of SMS at any time by replying STOP to any message we
          send you. You can opt out of email by clicking the unsubscribe link in
          any marketing email or by emailing us.
        </p>
      </section>

      <section>
        <h2>9. Security</h2>
        <p>
          We use reasonable administrative, technical, and physical safeguards
          to protect the information you give us. No system is perfectly secure,
          so we cannot guarantee absolute security, but we work to keep your
          data safe.
        </p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will change the effective date at the top of this page. If the changes
          are significant, we will let you know through the website or by email.
        </p>
      </section>

      <section>
        <h2>11. Contact us</h2>
        <p>
          Questions about this policy or about the information we hold about
          you? Email <a href="mailto:drew@grave9.com">drew@grave9.com</a> or
          write to us at the address listed above.
        </p>
      </section>

    </div>
  </main>

  <footer class="site-footer" id="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a href="index.html#top" class="logomark" aria-label="Grave 9 Productions home">
          <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
        </a>
        <p class="footer__tag">Built for Broadcast. Designed for Fans.</p>
        <p class="footer__addr">
          758 W Moon Valley Dr<br />
          Phoenix, AZ 85023<br />
          <a href="tel:+16025607737">(602) 560-7737</a>
        </p>
      </div>

      <div class="footer__cols">
        <div>
          <h5>Company</h5>
          <a href="index.html#services">Services</a>
          <a href="index.html#about">About</a>
          <a href="index.html#partners">Partners</a>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:drew@grave9.com">Email</a>
          <a href="index.html#contact">Request a consultation</a>
        </div>
        <div>
          <h5>Legal</h5>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a>
        </div>
      </div>
    </div>
    <div class="container footer__base">
      <span class="footer__rev">REV. 1.0 / <span id="year"></span></span>
      <span class="footer__copy">&copy; Grave 9 Productions LLC. All rights reserved.</span>
      <span class="footer__est">Producing live events since 1998.</span>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add privacy.html
git commit -m "Add privacy.html with A2P 10DLC magic clause and SMS section"
```

The verifier checks for privacy.html will pass once the local server is running (Task 8 onward). We don't run the verifier yet because index.html doesn't exist; the verifier needs all four pages to fetch.

---

## Task 5: Build terms.html (target: terms checks pass)

**Files:**
- Create: `terms.html`

- [ ] **Step 1: Create `terms.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Grave 9 Productions LLC terms of service and SMS messaging terms." />
  <meta name="theme-color" content="#0A0A0A" />
  <title>Terms of Service | Grave 9 Productions LLC</title>

  <link rel="icon" type="image/png" href="brand_assets/Grave-9-Logo.png" />

  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <header class="site-header">
    <div class="container nav">
      <a href="index.html#top" class="logomark" aria-label="Grave 9 Productions home">
        <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
      </a>

      <nav class="nav__links" aria-label="Primary">
        <a href="index.html#services">Services</a>
        <a href="index.html#about">About</a>
        <a href="index.html#partners">Partners</a>
        <a href="index.html#contact">Contact</a>
      </nav>

      <a href="index.html#contact" class="btn btn--primary btn--sm nav__cta">
        Request a Consultation
      </a>
    </div>
  </header>

  <main class="legal">
    <div class="container legal__inner">

      <span class="eyebrow"><span class="eyebrow__fig">&sect; B</span>Terms of Service</span>
      <h1 class="legal__title">Terms of Service</h1>
      <p class="legal__meta">Effective date: May 7, 2026</p>

      <section>
        <p>
          These Terms of Service ("Terms") govern your use of
          <a href="https://grave9.com">grave9.com</a> and any services provided
          by Grave 9 Productions LLC ("Grave 9," "we," "us," or "our"). By
          using our website or contacting us, you agree to these Terms. If you
          do not agree, please do not use the site.
        </p>
      </section>

      <section>
        <h2>1. Use of the website</h2>
        <p>
          You may use this site for lawful purposes only. You agree not to use
          the site to harm anyone, send spam, attempt to access systems or data
          you are not authorized to access, or interfere with the site's
          operation.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and age restriction</h2>
        <p>
          You must be at least <strong>18 years old</strong> to use this
          website, submit our contact form, provide your phone number, or opt
          in to receive SMS text messages from Grave 9 Productions. By using
          this site, providing your information, or consenting to receive
          messages, you represent and warrant that you are 18 years of age or
          older. Grave 9 Productions does not knowingly collect information
          from or send marketing or transactional messages to individuals under
          18. If we learn that we have collected information from a person
          under 18, we will delete it.
        </p>
      </section>

      <section>
        <h2>3. Services</h2>
        <p>
          Grave 9 Productions LLC provides live event production, festival
          production, broadcast and sponsor integration services, and event
          consulting throughout the United States. Any specific engagement we
          take on is governed by a separate written agreement signed by both
          parties. Nothing on this website is a contract for services.
          Information on this site is provided for general purposes and is not
          legal, financial, or tax advice.
        </p>
      </section>

      <section>
        <h2>4. Intellectual property</h2>
        <p>
          The content on this site, including the Grave 9 Productions name,
          logo, copy, design, and code, belongs to Grave 9 Productions LLC.
          You may not copy, modify, distribute, or use it without our written
          permission, except as allowed by fair use or as needed to view the
          site in your browser.
        </p>
      </section>

      <section id="sms-terms">
        <h2>5. SMS messaging terms</h2>
        <p>
          When you opt in by submitting your phone number through our contact
          form and checking the SMS consent box, you agree to receive text
          messages from Grave 9 Productions at the number you provided,
          including messages sent using an automated dialing system. Consent is
          not a condition of any purchase.
        </p>
        <ul>
          <li><strong>Program:</strong> Grave 9 Productions SMS communications related to your inquiry, including appointment confirmations, reminders, replies to questions you send us, and follow-ups about your event or project.</li>
          <li><strong>Frequency:</strong> Up to 5 messages per month, depending on your conversation with us.</li>
          <li><strong>Costs:</strong> Message and data rates may apply, depending on your mobile carrier and plan. Grave 9 Productions does not charge for the messages themselves.</li>
          <li><strong>Opt out:</strong> Reply <strong>STOP</strong> to any message at any time to unsubscribe. You will receive a confirmation message and no further texts from Grave 9 Productions.</li>
          <li><strong>Help:</strong> Reply <strong>HELP</strong> to any message for support, or email <a href="mailto:drew@grave9.com">drew@grave9.com</a>.</li>
          <li><strong>Carriers:</strong> Supported by major U.S. carriers. Carriers are not liable for delayed or undelivered messages.</li>
          <li><strong>Privacy:</strong> Your information is handled according to our <a href="privacy.html">Privacy Policy</a>. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</li>
        </ul>
      </section>

      <section>
        <h2>6. Disclaimers</h2>
        <p>
          The website and any information provided through it are offered "as
          is" and "as available," without warranties of any kind, either
          express or implied. To the maximum extent allowed by law, Grave 9
          Productions disclaims all warranties, including merchantability,
          fitness for a particular purpose, and non-infringement.
        </p>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent allowed by law, Grave 9 Productions will not
          be liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits or revenues, arising out of
          or related to your use of the site. Our total liability for any
          claim arising out of the website will not exceed one hundred U.S.
          dollars ($100).
        </p>
      </section>

      <section>
        <h2>8. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold Grave 9 Productions, its
          officers, members, employees, and contractors harmless from any
          claim, loss, or expense (including reasonable attorneys' fees)
          arising out of your use of the site, your violation of these Terms,
          or your violation of any rights of another party.
        </p>
      </section>

      <section>
        <h2>9. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Arizona, without
          regard to its conflict-of-laws rules. Any dispute arising out of
          these Terms or your use of the site will be brought in the state or
          federal courts located in Maricopa County, Arizona, and you consent
          to the jurisdiction of those courts.
        </p>
      </section>

      <section>
        <h2>10. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. The updated Terms will
          be posted on this page with a new effective date. Your continued use
          of the site after a change means you accept the updated Terms.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p class="legal__address">
          Grave 9 Productions LLC<br />
          758 W Moon Valley Dr<br />
          Phoenix, AZ 85023<br />
          <a href="tel:+16025607737">(602) 560-7737</a><br />
          <a href="mailto:drew@grave9.com">drew@grave9.com</a>
        </p>
      </section>

    </div>
  </main>

  <footer class="site-footer" id="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a href="index.html#top" class="logomark" aria-label="Grave 9 Productions home">
          <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
        </a>
        <p class="footer__tag">Built for Broadcast. Designed for Fans.</p>
        <p class="footer__addr">
          758 W Moon Valley Dr<br />
          Phoenix, AZ 85023<br />
          <a href="tel:+16025607737">(602) 560-7737</a>
        </p>
      </div>

      <div class="footer__cols">
        <div>
          <h5>Company</h5>
          <a href="index.html#services">Services</a>
          <a href="index.html#about">About</a>
          <a href="index.html#partners">Partners</a>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:drew@grave9.com">Email</a>
          <a href="index.html#contact">Request a consultation</a>
        </div>
        <div>
          <h5>Legal</h5>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a>
        </div>
      </div>
    </div>
    <div class="container footer__base">
      <span class="footer__rev">REV. 1.0 / <span id="year"></span></span>
      <span class="footer__copy">&copy; Grave 9 Productions LLC. All rights reserved.</span>
      <span class="footer__est">Producing live events since 1998.</span>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add terms.html
git commit -m "Add terms.html with 18+ clause, AZ governing law, and SMS terms"
```

---

## Task 6: Build styles.css (clone Hutch Ops, swap palette, swap logomark)

**Files:**
- Create: `styles.css`

The Hutch Ops `styles.css` is 42KB of layout/typography/component CSS that all carries over to Grave 9. Cloning + targeted edits is faster and lower risk than rewriting from scratch.

- [ ] **Step 1: Copy `styles.css` from Hutch Ops verbatim**

Run from `c:\Users\drewh\Documents\Claude\Projects\Grave 9\Website\`:

```bash
cp "../../Hutch Ops/Website/styles.css" styles.css
```

- [ ] **Step 2: Replace the `:root` brand tokens block at the top of the file**

Open `styles.css`. Replace the entire `:root { ... }` block (lines 5 through approximately 46 in the Hutch Ops original) with:

```css
/* =========================================================
   Grave 9 Productions LLC marketing site styles
   ========================================================= */

/* Brand tokens */
:root {
  --bg:           #0A0A0A;
  --bg-elev:      #141414;
  --bg-card:      #1A1A1A;
  --bg-card-hi:   #222222;
  --line:         rgba(255, 255, 255, 0.08);
  --line-hi:      rgba(255, 255, 255, 0.16);
  --line-tech:    rgba(200, 16, 46, 0.30);

  --ink:          #FFFFFF;
  --ink-mute:     #C8C8C8;
  --ink-soft:     #9A9A9A;
  --ink-faint:    #5A5A5A;

  --red:          #C8102E;
  --red-bright:   #E4243F;
  --red-deep:     #9C0C24;
  --red-soft:     #FF4860;
  --accent:       #C8102E;
  --accent-soft:  #E4243F;

  --radius-sm:    6px;
  --radius:       10px;
  --radius-lg:    14px;

  --container:    1180px;

  --shadow-red:   0 12px 40px -12px rgba(200, 16, 46, 0.55);
  --shadow-card:  0 1px 0 rgba(255,255,255,0.04) inset, 0 14px 44px -22px rgba(0,0,0,0.7);
  --shadow-accent:0 12px 36px -14px rgba(200, 16, 46, 0.55);

  --t-fast:       150ms cubic-bezier(.2,.8,.2,1);
  --t-med:        260ms cubic-bezier(.2,.8,.2,1);

  --font-display: 'Bricolage Grotesque', 'Onest', sans-serif;
  --font-sans:    'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

- [ ] **Step 3: Replace every reference to the old palette variables with the new ones**

Use find-and-replace across `styles.css`:

- `var(--blue)` -> `var(--red)`
- `var(--blue-bright)` -> `var(--red-bright)`
- `var(--blue-deep)` -> `var(--red-deep)`
- `var(--teal)` -> `var(--red-soft)`
- `var(--green)` -> `var(--red-soft)`
- `var(--cyan)` -> `var(--ink-soft)`
- `rgba(42, 143, 255` -> `rgba(200, 16, 46`
- `rgba(42,143,255` -> `rgba(200,16,46`
- `rgba(77, 163, 255` -> `rgba(228, 36, 63`
- `rgba(77,163,255` -> `rgba(228,36,63`
- `rgba(122, 200, 240` -> `rgba(255, 255, 255`
- `rgba(122,200,240` -> `rgba(255,255,255`
- `rgba(31, 224, 194` -> `rgba(200, 16, 46`
- `rgba(31,224,194` -> `rgba(200,16,46`
- `--shadow-blue` -> `--shadow-red`

This converts every blue/teal/green accent to red and every cyan grid line to white-on-black.

- [ ] **Step 4: Replace the entire `.logomark` block (the recreated wordmark) with image-based logomark styles**

Find the comment block `Logomark: recreated brand wordmark (CSS, not PNG)` and the styles that follow it (everything from `.logomark {` down through the related `.logomark__row`, `.logomark__hutch`, `.logomark__ops`, `.logomark__sub`, `.logomark__rule`, `.logomark__llc`, `.logomark__tag`, `.logomark--mini`, `.logomark--full` selectors). Delete that entire block and replace with:

```css
/* =========================================================
   Logomark: image-based wordmark for Grave 9
   ========================================================= */
.logomark {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  user-select: none;
}
.logomark__img {
  height: 36px;
  width: auto;
  display: block;
}
.site-header .logomark__img {
  height: 32px;
}
.footer__brand .logomark__img {
  height: 44px;
  margin-bottom: 12px;
}
```

- [ ] **Step 5: Update the `body` background**

Hutch Ops uses a navy-tinted `var(--bg)` already. After Step 2 it's now `#0A0A0A`. No code change needed here; this step just verifies the body block reads `background: var(--bg);`. If it reads `background: #06080F;` or a literal hex, change to `var(--bg)`.

- [ ] **Step 6: Update `::selection`**

Find:
```css
::selection { background: var(--blue); color: #fff; }
```

It should already be `var(--red)` after Step 3. If not, change it now.

- [ ] **Step 7: Remove or repurpose Hutch-Ops-specific component classes that won't be used on Grave 9**

The following selectors live in `styles.css` from the Hutch Ops trust strip but won't be used on Grave 9 (we're using a chip grid instead): `.brand`, `.brand--hubspot`, `.brand--salesforce`, `.brand--highlevel`, `.brand--zapier`, `.brand--make`, `.brand--openai`, `.brand--anthropic`, `.brand--google`, `.brand__icon`, plus the entire `.visual` / `.vstep` / `.vfoot` "live system" hero illustration block. Leave them in place for now; they're dormant rules, do no harm if unused, and stripping them adds risk without value. Revisit in a later cleanup if the file feels bloated.

- [ ] **Step 8: Add a `.partners` chip grid block (new component for Grave 9)**

At the end of the file, add:

```css
/* =========================================================
   Partners chip grid (Grave 9-specific)
   ========================================================= */
.partners {
  padding: 96px 0;
}
.partners__head {
  text-align: center;
  margin-bottom: 40px;
}
.partners__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  max-width: 880px;
  margin: 0 auto;
}
.partners__chip {
  padding: 10px 18px;
  border: 1px solid var(--line-hi);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--ink-mute);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: border-color var(--t-fast), color var(--t-fast), background var(--t-fast);
}
.partners__chip:hover {
  border-color: var(--red);
  color: var(--ink);
  background: var(--bg-card-hi);
}
```

- [ ] **Step 9: Add a `.footer__tag` and `.footer__est` rule (used by privacy/terms/index footers)**

At the end of the file, add:

```css
.footer__tag {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--red);
}
.footer__est {
  font-size: 12px;
  color: var(--ink-soft);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

- [ ] **Step 10: Smoke test in a browser**

```bash
npm start
```

Open `http://127.0.0.1:8765/privacy.html` and `http://127.0.0.1:8765/terms.html`. Both should render with dark background, white text, red accents, and the Grave 9 logo in the nav and footer. Layout should be the same as Hutch Ops's legal pages, just rebranded.

Stop the server (Ctrl+C).

- [ ] **Step 11: Commit**

```bash
git add styles.css
git commit -m "Add styles.css with Grave 9 palette and image-based logomark"
```

---

## Task 7: Build script.js (year stamp, sticky header, mobile nav, reveal-on-scroll)

**Files:**
- Create: `script.js`

- [ ] **Step 1: Create `script.js`**

```javascript
/* Grave 9 Productions LLC landing interactions */
(function () {
  'use strict';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const revealTargets = document.querySelectorAll(
    '.section__head, .service, .stat, .why__intro, .why__list li, .partners__chip, .cta__panel'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }
})();
```

- [ ] **Step 2: Commit**

```bash
git add script.js
git commit -m "Add script.js for nav, scroll, and reveal-on-scroll"
```

---

## Task 8: Build index.html sections 1-3 (head, nav, hero, stats strip)

**Files:**
- Create: `index.html`

This and the next two tasks build `index.html` incrementally. Create the file with the head + nav + hero + stats strip first, then append more sections in subsequent tasks.

- [ ] **Step 1: Create `index.html` with head + nav + hero + stats**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Grave 9 Productions LLC is a nationwide live event production company specializing in concerts, festivals, broadcast events, sponsor activations, and fan experiences since 1998." />
  <meta name="theme-color" content="#0A0A0A" />
  <title>Grave 9 Productions LLC | Live Event Production Company</title>

  <link rel="icon" type="image/png" href="brand_assets/Grave-9-Logo.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Onest:wght@300..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <div class="bg-layer" aria-hidden="true">
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow--1"></div>
    <div class="bg-glow bg-glow--2"></div>
  </div>

  <header class="site-header">
    <div class="container nav">
      <a href="#top" class="logomark" aria-label="Grave 9 Productions home">
        <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
      </a>

      <nav class="nav__links" aria-label="Primary">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#partners">Partners</a>
        <a href="#contact">Contact</a>
      </nav>

      <a href="#contact" class="btn btn--primary btn--sm nav__cta">
        Request a Consultation
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>

      <button class="nav__toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main id="top">

    <section class="hero" id="hero">
      <div class="container hero__inner">

        <div class="hero__main">
          <div class="hero__badge">
            <span class="dot"></span>
            Producing live events nationwide since 1998
          </div>

          <h1 class="hero__title">
            <span class="line">Live Event Production Built for</span>
            <span class="line"><span class="grad">Broadcast</span>, Sponsors &amp; <em>Fans.</em></span>
          </h1>

          <p class="hero__sub">
            Since 1998, Grave 9 Productions LLC has produced live events across
            the United States, from intimate venue activations to large-scale
            festivals and nationally supported broadcast events. We specialize
            in creating seamless experiences that connect brands, broadcasters,
            artists, and audiences.
          </p>

          <div class="hero__cta">
            <a href="#contact" class="btn btn--primary btn--lg">
              Request a Consultation
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a href="tel:+16025607737" class="btn btn--ghost btn--lg">
              Talk With Our Team
            </a>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="hero__stats">
          <div class="stat">
            <div class="stat__num">25+</div>
            <div class="stat__label">Years producing live events</div>
          </div>
          <span class="stat__sep" aria-hidden="true"></span>
          <div class="stat">
            <div class="stat__num">Nationwide</div>
            <div class="stat__label">Coast-to-coast event execution</div>
          </div>
          <span class="stat__sep" aria-hidden="true"></span>
          <div class="stat">
            <div class="stat__num">Festivals &amp; Broadcast</div>
            <div class="stat__label">From venues to nationally televised events</div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Smoke test in a browser**

```bash
npm start
```

Open `http://127.0.0.1:8765/`. Hero should render with the headline, subheadline, two CTAs, and a stats strip. Background should be near-black with red accents. Stop the server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add index.html with nav, hero, and stats strip"
```

---

## Task 9: Add What We Produce, About, Why, and Partners sections

**Files:**
- Modify: `index.html` (insert sections between `</section>` of hero and `</main>`)

- [ ] **Step 1: Open `index.html` and find the closing `</section>` of the hero block (the line right after the hero stats strip's closing `</div>`s)**

Insert the following sections after that closing `</section>` and before `</main>`:

```html
    <section class="services" id="services">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow"><span class="eyebrow__fig">&sect; 01</span>What We Produce</span>
          <h2>Live event production from venue to broadcast.</h2>
          <p class="section__lede">
            Complete production for concerts, festivals, touring events,
            community activations, and corporate entertainment, executed under
            real-world conditions by a team that has done it for 25+ years.
          </p>
        </div>

        <div class="services__grid">

          <article class="service">
            <div class="service__num">01</div>
            <h3>Live Event Production</h3>
            <p>Complete event production management for concerts, festivals, touring events, community activations, and corporate entertainment experiences.</p>
            <ul>
              <li>Full event coordination</li>
              <li>Production management</li>
              <li>Site operations &amp; vendor coordination</li>
              <li>Run of show development</li>
              <li>Stage management &amp; talent logistics</li>
              <li>Venue operations &amp; backstage coordination</li>
              <li>Staffing &amp; crew management</li>
            </ul>
          </article>

          <article class="service service--featured">
            <div class="service__tag">Most requested</div>
            <div class="service__num">02</div>
            <h3>Festival Production</h3>
            <p>From planning through teardown, we help festivals operate smoothly while delivering exceptional attendee experiences.</p>
            <ul>
              <li>Multi-stage coordination</li>
              <li>Festival site planning</li>
              <li>Crowd flow &amp; guest experience</li>
              <li>Sponsor activation management</li>
              <li>VIP experiences &amp; artist hospitality</li>
              <li>Production scheduling</li>
              <li>Operations command coordination</li>
            </ul>
          </article>

          <article class="service">
            <div class="service__num">03</div>
            <h3>Broadcast &amp; Sponsor Integration</h3>
            <p>We work closely with broadcast partners and sponsors to ensure every activation feels authentic, engaging, and flawlessly executed.</p>
            <ul>
              <li>Broadcast event coordination</li>
              <li>Sponsor activation planning</li>
              <li>Branded experiences &amp; fan engagement zones</li>
              <li>On-air integration support</li>
              <li>Remote broadcast logistics</li>
              <li>Media coordination</li>
              <li>Experiential marketing support</li>
            </ul>
          </article>

          <article class="service">
            <div class="service__num">04</div>
            <h3>Event Consulting</h3>
            <p>Strategic guidance and operational planning support for events of all sizes, from concept to execution.</p>
            <ul>
              <li>Event strategy</li>
              <li>Production planning</li>
              <li>Venue evaluation</li>
              <li>Logistics consulting</li>
              <li>Budget development</li>
              <li>Operational assessments</li>
              <li>Event workflow optimization</li>
            </ul>
          </article>

        </div>
      </div>
    </section>

    <section class="problem" id="about">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow"><span class="eyebrow__fig">&sect; 02</span>About Grave 9</span>
          <h2>27 years of producing events that actually deliver.</h2>
        </div>

        <div class="legal__inner">
          <p>
            Founded in 1998, Grave 9 Productions LLC is a full-service live
            event production company with decades of experience producing
            events of every scale throughout the United States.
          </p>
          <p>
            From small venue productions and branded activations to multi-day
            festivals and nationally supported broadcast events, our team
            understands what it takes to execute memorable experiences under
            real-world conditions.
          </p>
          <p>
            We specialize in partnering with broadcast companies, sponsors,
            promoters, venues, and brands to create events that not only run
            flawlessly behind the scenes, but deliver an unforgettable fan
            experience in front of the stage.
          </p>
          <p>
            Our approach combines technical production expertise, operational
            planning, sponsor integration, crowd engagement, and on-site
            execution to ensure every event achieves its goals while exceeding
            audience expectations.
          </p>
          <p>
            For more than 25 years, Grave 9 Productions has built a reputation
            for reliability, creativity, and professionalism in live
            entertainment production.
          </p>
        </div>
      </div>
    </section>

    <section class="why" id="why">
      <div class="container">
        <div class="why__grid">
          <div class="why__intro">
            <span class="eyebrow"><span class="eyebrow__fig">&sect; 03</span>Why Grave 9</span>
            <h2>Built for Broadcast. Designed for Fans.</h2>
            <p>Five reasons production teams, sponsors, and broadcasters keep coming back.</p>
            <a href="#contact" class="btn btn--primary">
              Let's Build Your Event
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>

          <ul class="why__list">
            <li>
              <div class="why__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h4>Decades of experience</h4>
                <p>Producing live events nationwide since 1998.</p>
              </div>
            </li>
            <li>
              <div class="why__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h4>Events of every scale</h4>
                <p>From intimate venues to large-scale festivals and broadcast productions.</p>
              </div>
            </li>
            <li>
              <div class="why__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h4>Broadcast &amp; sponsor expertise</h4>
                <p>We understand the unique relationship between production, media, sponsors, and audience engagement.</p>
              </div>
            </li>
            <li>
              <div class="why__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h4>Fan-first approach</h4>
                <p>Every decision is made with the attendee experience in mind.</p>
              </div>
            </li>
            <li>
              <div class="why__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h4>Reliable execution</h4>
                <p>Professional planning, communication, and on-site management from start to finish.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="partners" id="partners">
      <div class="container">
        <div class="partners__head">
          <span class="eyebrow"><span class="eyebrow__fig">&sect; 04</span>Who We Work With</span>
          <h2>Trusted partners across live entertainment.</h2>
          <p class="section__lede">
            Grave 9 Productions proudly partners with the companies and
            communities that make live events happen.
          </p>
        </div>
        <div class="partners__chips">
          <span class="partners__chip">Broadcast Companies</span>
          <span class="partners__chip">National &amp; Regional Sponsors</span>
          <span class="partners__chip">Music Festivals</span>
          <span class="partners__chip">Concert Promoters</span>
          <span class="partners__chip">Venues &amp; Arenas</span>
          <span class="partners__chip">Community Events</span>
          <span class="partners__chip">Corporate Brands</span>
          <span class="partners__chip">Entertainment Agencies</span>
          <span class="partners__chip">Touring Productions</span>
          <span class="partners__chip">Sports &amp; Lifestyle Events</span>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Smoke test**

```bash
npm start
```

Open `http://127.0.0.1:8765/`. Scroll the page. The four service cards should render in a 2x2 grid (or stacked on narrow viewports), the About section should show all five paragraphs, the Why section should show the heading + 5-up list, and the Partners chips should wrap into a centered grid. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add services, about, why, and partners sections to index"
```

---

## Task 10: Add Contact section, GHL form embed, A2P consent text, and footer

**Files:**
- Modify: `index.html`

This task wires up the consent text and footer that the verifier checks for.

- [ ] **Step 1: Find the closing `</section>` of the partners block, and insert the contact + footer markup before `</main>`**

```html
    <section class="cta" id="contact">
      <div class="container">
        <div class="cta__panel">
          <div class="cta__content">
            <span class="eyebrow"><span class="eyebrow__fig">&sect; 05</span>Get In Touch</span>
            <h2>Let's create something unforgettable.</h2>
            <p>
              Whether you're planning a venue show, festival, sponsor
              activation, or broadcast-supported event, Grave 9 Productions
              is ready to help bring your vision to life.
            </p>

            <div class="cta__meta">
              <a href="mailto:drew@grave9.com" class="cta__contact">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                drew@grave9.com
              </a>
              <a href="tel:+16025607737" class="cta__contact">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                (602) 560-7737
              </a>
            </div>

            <div class="sms-info">
              <h3 class="sms-info__title">How we use your phone number</h3>
              <p>
                If you give us your mobile number and check the SMS box on the
                form, you're opting in to text messages from Grave 9
                Productions about your inquiry: appointment confirmations,
                reminders, replies to your questions, and follow-ups about
                your event or project.
              </p>
              <ul class="sms-info__list">
                <li><span>Frequency</span> Up to 5 messages per month</li>
                <li><span>Cost</span> Msg &amp; data rates may apply</li>
                <li><span>Opt out</span> Reply STOP anytime, HELP for help</li>
              </ul>
              <p class="sms-info__fine">
                Your number is never shared with third parties or affiliates
                for marketing or promotional purposes. See our
                <a href="privacy.html">Privacy Policy</a> and
                <a href="terms.html">Terms of Service</a>.
              </p>
            </div>
          </div>

          <div class="cta__form-wrap">
            <!-- GHL inline form: Grave 9 Productions LLC sub-account.
                 TODO: replace GRAVE9_FORM_ID_PENDING with the real form ID
                 before A2P submission. -->
            <div class="cta__form cta__form--ghl">
              <iframe
                src="https://api.leadconnectorhq.com/widget/form/GRAVE9_FORM_ID_PENDING"
                style="width:100%;height:100%;border:none;border-radius:8px"
                id="inline-GRAVE9_FORM_ID_PENDING"
                data-layout='{"id":"INLINE"}'
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="Grave 9 Contact Form"
                data-height="766"
                data-layout-iframe-id="inline-GRAVE9_FORM_ID_PENDING"
                data-form-id="GRAVE9_FORM_ID_PENDING"
                title="Grave 9 Productions Contact Form">
              </iframe>
              <script src="https://link.msgsndr.com/js/form_embed.js"></script>
            </div>

            <p class="cta__consent">
              By submitting this form you agree to our
              <a href="privacy.html">Privacy Policy</a> and
              <a href="terms.html">Terms of Service</a>. If you provide your
              mobile number and check the SMS consent box on the form, you
              agree to receive up to 5 text messages per month from Grave 9
              Productions as described above. Message &amp; data rates may
              apply. Reply STOP to unsubscribe at any time. Reply HELP for
              support.
            </p>
          </div>
        </div>
      </div>
    </section>

  </main>

  <footer class="site-footer" id="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a href="#top" class="logomark" aria-label="Grave 9 Productions home">
          <img src="brand_assets/Grave-9-Logo-Dark.png" alt="Grave 9" class="logomark__img" />
        </a>
        <p class="footer__tag">Built for Broadcast. Designed for Fans.</p>
        <p class="footer__addr">
          758 W Moon Valley Dr<br />
          Phoenix, AZ 85023<br />
          <a href="tel:+16025607737">(602) 560-7737</a>
        </p>
      </div>

      <div class="footer__cols">
        <div>
          <h5>Company</h5>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#partners">Partners</a>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:drew@grave9.com">Email</a>
          <a href="#contact">Request a consultation</a>
        </div>
        <div>
          <h5>Legal</h5>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a>
        </div>
      </div>
    </div>
    <div class="container footer__base">
      <span class="footer__rev">REV. 1.0 / <span id="year"></span></span>
      <span class="footer__copy">&copy; Grave 9 Productions LLC. All rights reserved.</span>
      <span class="footer__est">Producing live events since 1998.</span>
    </div>
  </footer>
```

Note: the closing `</main>` tag was already in `index.html` from Task 8; replace its position so it sits right before `<footer class="site-footer"`. The result is `</section>` (closing partners) -> `</main>` -> `<footer ...>`.

- [ ] **Step 2: Move the existing closing `</main>` tag if needed**

After Step 1 the structure must be: hero, services, about, why, partners, contact (all `<section>` inside `<main>`), then `</main>`, then `<footer>`. Verify this in your editor and adjust if `</main>` is misplaced.

- [ ] **Step 3: Smoke test**

```bash
npm start
```

Open `http://127.0.0.1:8765/`. The contact section should render with two columns: the SMS info and CTA on the left, the GHL form iframe on the right. The iframe will be empty/error because `GRAVE9_FORM_ID_PENDING` isn't a real form ID; that is expected. The footer should render with the logo, tagline, address, three column nav, and the bottom rev/copy/est strip.

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Add contact section, GHL form scaffold, and footer"
```

---

## Task 11: Run the verifier locally and confirm green except for form-page checks

**Files:** none (verification only)

- [ ] **Step 1: Start the local server in one terminal**

```bash
npm start
```

- [ ] **Step 2: In a second terminal, run the verifier against the local URL**

```bash
npm run verify:local
```

Expected output:

- All `home`, `privacy`, and `terms` page reachability checks: PASS
- The `form` page reachability check: FAIL (because `GRAVE9_FORM_ID_PENDING` is not a real GHL form)
- All `Privacy:`, `Terms:`, and `Home:` content checks: PASS
- All `Form:` content checks: FAIL (with note `page 'form' not reachable`)
- Final summary: `~19 / 27 checks passed. Fix the failures above before submitting.` and exit code 1.

**Reading the failures:** the only failures should be in the `Form:` group, all noting `page 'form' not reachable`. If any non-form check fails, fix the corresponding HTML and re-run.

- [ ] **Step 3: Stop the server**

Ctrl+C in the first terminal.

- [ ] **Step 4: No commit. This is a verification-only step.**

If any non-form check failed, find and fix the corresponding HTML, re-run the verifier, and commit the fix as a follow-up before continuing to Task 12.

---

## Task 12: Manual browser smoke test (responsive + cross-section navigation)

**Files:** none (verification only)

- [ ] **Step 1: Start the local server**

```bash
npm start
```

- [ ] **Step 2: Open `http://127.0.0.1:8765/` and walk through this checklist**

- Sticky nav stays visible while scrolling
- Each nav link (Services, About, Partners, Contact) jumps to the right section
- "Request a Consultation" CTA in nav and hero both anchor to `#contact`
- "Talk With Our Team" hero CTA opens the phone dialer (`tel:+16025607737`)
- Hero, services, about, why, partners, contact, footer all render with the expected styling
- Logo image loads in nav and footer
- Privacy Policy and Terms of Service links in the footer and contact section open the correct pages
- Phone number `(602) 560-7737` is visible somewhere on the home page
- Address `Phoenix, AZ 85023` is visible in the footer

- [ ] **Step 3: Resize the browser narrow (under 700px) and confirm**

- Nav collapses (mobile toggle visible), tap toggle to open menu
- Service cards stack vertically
- Why list stacks vertically
- Partner chips wrap into multiple lines
- Contact section stacks (form below info)
- Footer columns stack

- [ ] **Step 4: Open `privacy.html` and `terms.html` directly**

- Both pages render with header, body content, and footer
- All section headings visible
- All `mailto:` and `tel:` links work
- Magic clause is visually present in privacy.html section 4
- 18+ clause is visually present in terms.html section 2

- [ ] **Step 5: Stop the server**

Ctrl+C.

- [ ] **Step 6: No commit. Verification only.**

If anything is broken, fix it, re-test, then commit. Examples: broken anchor IDs, incorrect image paths, missing classes referenced by the CSS.

---

## Task 13: Create GitHub repo and push

**Files:** none (deployment).

- [ ] **Step 1: Create a public GitHub repo named `grave9-website` under your account**

Run:

```bash
gh repo create drew-hutchinson/grave9-website --public --source=. --remote=origin --description "Grave 9 Productions LLC marketing site (grave9.com)"
```

If `drew-hutchinson` is not your actual GitHub username, substitute the correct one. Verify with `gh api user --jq .login`.

- [ ] **Step 2: Push `main`**

```bash
git push -u origin main
```

Expected: push succeeds, `origin/main` set as upstream.

- [ ] **Step 3: Verify the repo is public**

```bash
gh repo view drew-hutchinson/grave9-website --json visibility
```

Expected: `{"visibility": "PUBLIC"}`.

- [ ] **Step 4: No commit. The push itself is the deliverable.**

---

## Task 14: Create Cloudflare Pages project and connect to the repo

**Files:** none (Cloudflare dashboard + DNS)

This is a manual step in the Cloudflare dashboard. Do it in a browser; no terminal needed.

- [ ] **Step 1: In Cloudflare dashboard, go to Pages -> Create a project -> Connect to Git -> select `grave9-website`**

- [ ] **Step 2: Build settings**

- Production branch: `main`
- Framework preset: `None`
- Build command: (empty)
- Build output directory: `/`
- Root directory: `/` (default)
- Environment variables: (none)

- [ ] **Step 3: Save and Deploy**

Wait for the first deploy to finish. Cloudflare will assign a temporary `*.pages.dev` URL.

- [ ] **Step 4: Verify the temp URL**

Open the assigned `<project>.pages.dev` URL. Site should render identically to local. If anything 404s, the build output directory or root directory is wrong; correct it and redeploy.

- [ ] **Step 5: Run the verifier against the temp URL**

```bash
node tools/verify_a2p_compliance.js --base-url https://<project>.pages.dev
```

Expected: same result as the local run (everything passes except form checks).

---

## Task 15: Add custom domain in Cloudflare Pages and configure DNS

**Files:** none (Cloudflare dashboard + GoDaddy)

- [ ] **Step 1: In the Pages project, go to Custom domains -> Set up a custom domain**

Add `grave9.com`. Cloudflare will tell you the required DNS records.

- [ ] **Step 2: If grave9.com is not yet on Cloudflare DNS, add it as a site in Cloudflare**

In Cloudflare dashboard -> Add a site -> enter `grave9.com`. Cloudflare scans existing DNS and gives you two nameservers (something like `ns1.cloudflare.com` and `ns2.cloudflare.com`, but each account gets unique values).

- [ ] **Step 3: At GoDaddy, change the nameservers for grave9.com to the two Cloudflare nameservers from Step 2**

GoDaddy -> My Products -> Domains -> grave9.com -> DNS -> Nameservers -> Change. Enter the two Cloudflare values. Save.

- [ ] **Step 4: Wait for nameserver propagation**

Can take 15 minutes to a few hours. Cloudflare emails when active.

- [ ] **Step 5: Back in the Pages project, add `www.grave9.com` as a second custom domain**

Cloudflare will prompt to create a CNAME from `www` to the Pages project. Accept.

- [ ] **Step 6: In Cloudflare DNS, set up a redirect rule (or page rule) so `www.grave9.com` 301s to `grave9.com`**

Pick whichever apex form you want as canonical (recommend bare `grave9.com`).

- [ ] **Step 7: Wait for the SSL certificate to provision (Cloudflare auto-issues)**

Visiting `https://grave9.com` should serve the site with a valid cert. If a "site not secure" warning appears, wait another 5 minutes.

---

## Task 16: Run the verifier against production grave9.com

**Files:** none (verification only)

- [ ] **Step 1: Run the verifier against the live site**

```bash
node tools/verify_a2p_compliance.js --base-url https://grave9.com
```

Expected: same as local + Cloudflare temp URL: every check passes except `Form:` group (still pending real form ID). Exit code 1.

- [ ] **Step 2: Cross-check the live site visually**

Open `https://grave9.com` in a fresh browser. Confirm: page loads, all sections render, privacy and terms reachable, fonts load, logo loads.

- [ ] **Step 3: No commit.**

---

## Task 17: Wire in the real Grave 9 GHL form ID (USER ACTION + code change)

**Files:**
- Modify: `tools/verify_a2p_compliance.js` (line: `const GHL_FORM_ID = 'GRAVE9_FORM_ID_PENDING';`)
- Modify: `index.html` (every occurrence of `GRAVE9_FORM_ID_PENDING`)

This task is gated on the user creating a Grave 9 contact form inside the Grave 9 GHL sub-account (`tplC2NjstFhYWVx7e9oM`). Until the user provides the real form ID, this task cannot complete.

- [ ] **Step 1: User creates the Grave 9 contact form in GHL with consent text matching what `verify_a2p_compliance.js` checks for**

Required consent label content (paste into the form's consent checkbox label):

> "I agree to receive text messages from Grave 9 Productions (appointment confirmations, reminders, replies, and follow-ups) at the number provided. Up to 5 messages per month. Msg & data rates may apply. Reply STOP to unsubscribe, HELP for help. Consent is not a condition of any purchase. See our Privacy Policy and Terms of Service."

- [ ] **Step 2: User shares the new form ID with the implementer**

Form ID is the path segment after `/widget/form/` in the GHL share URL.

- [ ] **Step 3: Replace `GRAVE9_FORM_ID_PENDING` with the real form ID in `tools/verify_a2p_compliance.js`**

Change line:
```js
const GHL_FORM_ID  = 'GRAVE9_FORM_ID_PENDING';
```
to:
```js
const GHL_FORM_ID  = '<real form ID>';
```

- [ ] **Step 4: Replace all 4 occurrences of `GRAVE9_FORM_ID_PENDING` in `index.html`**

The placeholder appears in: `iframe src`, `iframe id`, `data-layout-iframe-id`, and `data-form-id`. Replace all four with the real form ID.

- [ ] **Step 5: Smoke test locally**

```bash
npm start
```

Open `http://127.0.0.1:8765/#contact`. The GHL form should now load (not a blank/error iframe). All form fields visible.

Stop the server.

- [ ] **Step 6: Run the verifier against local**

```bash
npm run verify:local
```

Every `Form:` content check must now PASS. If any fails, the form's consent label is missing the required language; the user must fix it inside GHL (the form is loaded from GHL's CDN, not the repo) and re-run the verifier.

- [ ] **Step 7: Commit the form ID swap**

```bash
git add tools/verify_a2p_compliance.js index.html
git commit -m "Wire in Grave 9 GHL contact form ID"
git push
```

- [ ] **Step 8: Wait for Cloudflare Pages to auto-deploy (typically 30-90 seconds), then re-run the verifier against production**

```bash
node tools/verify_a2p_compliance.js --base-url https://grave9.com
```

Expected: every check passes. Exit code 0. Final line reads: `Ready to submit A2P registration in GHL.`

---

## Task 18: Submit A2P 10DLC registration in GHL (USER ACTION)

**Files:** none (manual GHL + TCR submission)

- [ ] **Step 1: In the Grave 9 GHL sub-account, navigate to Settings -> Phone Numbers -> A2P 10DLC -> Register Brand**

Use:
- Legal entity name: `GRAVE 9 PRODUCTIONS LLC`
- Address: `758 W Moon Valley Dr, Phoenix, AZ 85023`
- Phone: `(602) 560-7737`
- Email: `drew@grave9.com`
- Website: `https://grave9.com`
- Industry: Entertainment

- [ ] **Step 2: Create a Use Case under the brand**

- Use case type: Customer Care
- Description (verbatim): "Capture inquiries from prospective live event production partners (venues, promoters, sponsors, broadcast companies, brands) submitted via the website contact form. Respond via SMS to coordinate consultations, confirm appointments, share project details, and follow up on event production engagements."
- Sample messages:
  1. "Hi {{name}}, this is Drew at Grave 9 Productions following up on your inquiry. Want to set up a 15-min call to discuss your event? Reply STOP to opt out."
  2. "Reminder: your consultation with Grave 9 Productions is tomorrow at 2pm MST. Reply C to confirm or R to reschedule. Msg&data rates may apply."
  3. "Thanks for the details on your festival. We'll have a draft production scope back to you by Friday. Questions in the meantime? Just reply here."

- [ ] **Step 3: Submit and wait for TCR review**

Approval typically takes 1 to 5 business days.

---

## Self-Review

I checked the plan against the spec.

**Spec coverage:**
- Project separation -> Task 1 (separate dir), Task 13 (separate repo), Task 14 (separate Pages project) ✓
- Directory layout -> Task 1 ✓
- Visual identity -> Task 6 (Grave 9 palette + image-based logomark) ✓
- Home page structure -> Tasks 8, 9, 10 (nav/hero, services/about/why/partners, contact/footer) ✓
- Source content -> Tasks 8-10 use the approved copy verbatim ✓
- Business facts (entity, phone, email, address, governing law) -> Tasks 4 (privacy), 5 (terms), 8-10 (index) ✓
- A2P 10DLC: privacy.html magic clause + SMS section -> Task 4 ✓
- A2P 10DLC: terms.html 18+ + governing law + service description -> Task 5 ✓
- A2P 10DLC: index visible consent + visible phone -> Task 10 ✓
- Tooling: verify_a2p_compliance.js with grave9.com baselines -> Task 3 ✓
- Build/deploy pipeline -> Tasks 13-16 ✓
- Public repo -> Task 13 ✓
- Open item: GHL form ID pending -> Task 17 (placeholder + replace flow) ✓
- Open item: brand guidelines PDF -> Task 2 (user drops in) ✓

**Placeholder scan:**
- The string `GRAVE9_FORM_ID_PENDING` is intentional and explicitly documented as the placeholder until the user provides the real form ID. Task 17 swaps it. Not a plan defect.
- No "TBD," "TODO," or "implement later" in any step that needs concrete code. Task 6 Step 3 lists explicit find-and-replace pairs. Task 9 inserts complete HTML.
- Task 13 references a placeholder GitHub username `drew-hutchinson` but instructs how to verify the real one with `gh api user --jq .login`. Acceptable.

**Type/identifier consistency:**
- Section IDs `#services`, `#about`, `#partners`, `#contact` used consistently across nav, content, and footer in Tasks 4, 5, 8, 9, 10 ✓
- CSS classes `.service`, `.partners__chip`, `.cta__panel`, `.why__list`, `.why__check`, `.section__head`, `.eyebrow`, `.eyebrow__fig`, `.btn`, `.btn--primary`, `.btn--lg`, `.btn--sm`, `.btn--ghost`, `.logomark`, `.logomark__img`, `.footer__addr`, `.footer__tag`, `.footer__est`, `.sms-info`, `.cta__consent`, `.legal__inner`, `.legal__title`, `.legal__meta`, `.legal__address` used consistently. New ones added in Task 6 (`.partners`, `.partners__chips`, `.partners__chip`, `.footer__tag`, `.footer__est`) match references in Tasks 4, 5, 9, 10 ✓
- Phone number `(602) 560-7737` / `+16025607737` / `6025607737` covered by all verifier `containsAny` patterns and used consistently in HTML ✓
- Form ID placeholder `GRAVE9_FORM_ID_PENDING` matches across Task 3 (verifier constant) and Task 10 (4 occurrences in iframe), with Task 17 swapping all 5 sites ✓

No issues found.
