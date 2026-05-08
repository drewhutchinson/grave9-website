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
