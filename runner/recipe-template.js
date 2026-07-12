#!/usr/bin/env node
'use strict';
// Template for a compiled recipe — a multi-step flow the verifier LLM-drove
// once and then froze into code. Copy into the project's .claude/qa/scripts/,
// rename to describe the check, and fill in the steps.
//
// Conventions every compiled recipe follows:
// - Args in via --flags, one JSON object out on stdout.
// - Exit 0 = expectation met, 1 = not met, 2 = infra error.
// - Read/act only on QA-agent-prefixed test data; never touch credentials,
//   billing, or account settings; dev environments only.
// - On failure, include enough evidence (sample text, final_url, screenshot)
//   for the verifier to decide: real defect vs. selector drift (then it
//   re-drives the flow manually and repairs this script).
const { attach } = require(process.env.QA_AGENT_RUNNER ? process.env.QA_AGENT_RUNNER + '/attach' : '../../../runner/attach');

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
  const started = Date.now();
  const { browser, context } = await attach();
  const page = await context.newPage();
  let exitCode = 2;
  try {
    // --- steps (replace with the verified flow) ------------------------
    // await page.goto(args.url, { waitUntil: 'domcontentloaded' });
    // await page.locator('#settings-field').fill(args.value);
    // await page.locator('button:has-text("Save")').click();
    // await page.waitForTimeout(1000);
    // const banner = page.locator('.setup-banner');
    // const present = await banner.first().isVisible().catch(() => false);
    // -------------------------------------------------------------------
    const present = false; // replace
    const pass = present; // replace with the expectation
    process.stdout.write(JSON.stringify({
      ok: true,
      pass: pass,
      evidence: null, // sample text / counts / values observed
      final_url: page.url(),
      elapsed_ms: Date.now() - started
    }, null, 2) + '\n');
    exitCode = pass ? 0 : 1;
  } catch (err) {
    process.stdout.write(JSON.stringify({
      ok: false,
      error: String((err && err.message) || err).slice(0, 400),
      elapsed_ms: Date.now() - started
    }) + '\n');
    exitCode = 2;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
  process.exit(exitCode);
})();
