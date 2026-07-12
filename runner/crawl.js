#!/usr/bin/env node
'use strict';
// Cold-start bootstrap: BFS-crawl the app's same-origin links and emit a route
// inventory as markdown for the ui-map. Read-only: follows <a href> with GET
// only, never clicks buttons or submits forms, and skips links whose path or
// label looks state-changing or sensitive. Dev environments only.
//
//   node crawl.js --start <url> [--max-pages 30] [--max-depth 2]
//                 [--skip <extra-regex>] [--out <file.md>]
const fs = require('fs');
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
  if (!args.start) {
    process.stdout.write(JSON.stringify({ ok: false, error: 'Usage: crawl.js --start <url> [--max-pages n] [--max-depth n] [--skip regex] [--out file.md]' }) + '\n');
    process.exit(2);
  }
  const maxPages = Number(args['max-pages'] || 30);
  const maxDepth = Number(args['max-depth'] || 2);
  const defaultSkip = 'log-?out|sign-?out|delete|destroy|remove|deactivate|cancel|close|billing|password|/api/|\\.(pdf|zip|csv|png|jpg)$';
  const skip = new RegExp(args.skip ? defaultSkip + '|' + args.skip : defaultSkip, 'i');

  const start = new URL(args.start);
  const { browser, context } = await attach();
  const page = await context.newPage();
  const seen = new Map(); // pathname -> record
  const queued = new Set([start.pathname]);
  const queue = [{ url: start.href, depth: 0 }];
  const startedAt = Date.now();

  while (queue.length > 0 && seen.size < maxPages) {
    const item = queue.shift();
    const key = new URL(item.url).pathname;
    if (seen.has(key)) continue;
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(700);
      const info = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const links = [];
        const anchors = document.querySelectorAll('a[href]');
        for (let i = 0; i < anchors.length; i++) {
          const a = anchors[i];
          const text = (a.innerText || '').trim().slice(0, 80);
          if (text) links.push({ href: a.href, text: text });
        }
        return { title: document.title, h1: h1 ? (h1.innerText || '').trim().slice(0, 120) : '', links: links };
      });
      seen.set(key, { path: key, title: info.title, h1: info.h1, depth: item.depth });
      if (item.depth < maxDepth) {
        for (const l of info.links) {
          let u;
          try { u = new URL(l.href); } catch (e) { continue; }
          if (u.origin !== start.origin) continue;
          if (skip.test(u.pathname) || skip.test(l.text)) continue;
          if (!queued.has(u.pathname)) {
            queued.add(u.pathname);
            queue.push({ url: u.href, depth: item.depth + 1 });
          }
        }
      }
    } catch (err) {
      seen.set(key, { path: key, error: String((err && err.message) || err).slice(0, 120), depth: item.depth });
    }
  }

  let md = '# Route inventory (crawled ' + new Date().toISOString().slice(0, 10) + ', start ' + start.href + ')\n\n';
  md += 'Read-only GET crawl, same-origin, depth <= ' + maxDepth + ', ' + seen.size + ' pages in ' + Math.round((Date.now() - startedAt) / 1000) + 's.\n\n';
  const rows = Array.from(seen.values()).sort((a, b) => a.path.localeCompare(b.path));
  for (const r of rows) {
    md += '- `' + r.path + '`';
    if (r.title) md += ' — ' + r.title;
    if (r.h1 && r.h1 !== r.title) md += ' (h1: ' + r.h1 + ')';
    if (r.error) md += ' [error: ' + r.error + ']';
    md += '\n';
  }
  if (args.out) fs.writeFileSync(args.out, md);
  process.stdout.write(md);
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
  process.exit(0);
})();
