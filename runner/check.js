#!/usr/bin/env node
'use strict';
// Generic one-shot assertion: is an element/text present (or absent) on a page?
// Covers most quick checks without writing a custom script.
//
//   node check.js --url <url> [--selector <css>] [--text <substring>]
//                 [--expect present|absent] [--settle <ms>] [--timeout <ms>]
//                 [--screenshot <path>]
//
// Output: one JSON object on stdout. Exit 0 = expectation met, 1 = not met,
// 2 = infrastructure error (could not attach/navigate).
const { attach } = require('./attach');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(.+)$/.exec(argv[i]);
    if (m) { args[m[1]] = argv[i + 1]; i++; }
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url || (!args.selector && !args.text)) {
    process.stdout.write(JSON.stringify({
      ok: false,
      error: 'Usage: check.js --url <url> (--selector <css> and/or --text <substring>) [--expect present|absent] [--settle ms] [--timeout ms] [--screenshot path]'
    }) + '\n');
    process.exit(2);
  }
  const started = Date.now();
  const { browser, context } = await attach();
  const page = await context.newPage();
  let exitCode = 2;
  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: Number(args.timeout || 20000) });
    await page.waitForTimeout(Number(args.settle || 1500));

    let loc;
    if (args.selector && args.text) {
      loc = page.locator(args.selector).filter({ hasText: args.text });
    } else if (args.selector) {
      loc = page.locator(args.selector);
    } else {
      loc = page.getByText(args.text, { exact: false });
    }

    const total = await loc.count();
    let visible = 0;
    let sample = null;
    for (let i = 0; i < Math.min(total, 10); i++) {
      const el = loc.nth(i);
      const isVis = await el.isVisible().catch(() => false);
      if (isVis) {
        visible++;
        if (sample === null) {
          sample = String(await el.innerText().catch(() => '')).trim().slice(0, 300);
        }
      }
    }

    const present = visible > 0;
    const expect = args.expect === 'absent' ? 'absent' : 'present';
    const pass = expect === 'present' ? present : !present;
    if (args.screenshot) {
      await page.screenshot({ path: args.screenshot }).catch(() => {});
    }
    process.stdout.write(JSON.stringify({
      ok: true,
      pass: pass,
      expect: expect,
      present: present,
      visible_matches: visible,
      total_matches: total,
      sample: sample,
      final_url: page.url(),
      elapsed_ms: Date.now() - started
    }, null, 2) + '\n');
    exitCode = pass ? 0 : 1;
  } catch (err) {
    process.stdout.write(JSON.stringify({
      ok: false,
      error: String((err && err.message) || err).slice(0, 400),
      url: args.url,
      elapsed_ms: Date.now() - started
    }) + '\n');
    exitCode = 2;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {}); // disconnects from CDP; does not quit the user's Chrome
  }
  process.exit(exitCode);
})();
