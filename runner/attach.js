'use strict';
// Attach to the user's real Chrome over CDP. Requires Chrome launched with
// --remote-debugging-port (see README). Inherits the user's logged-in sessions,
// so scripts stay black-box: they see exactly what the user's browser renders.
const { chromium } = require('playwright-core');

const PORT = process.env.QA_AGENT_CDP_PORT || '9222';

async function attach() {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  } catch (err) {
    process.stdout.write(JSON.stringify({
      ok: false,
      error: 'Could not attach to Chrome on CDP port ' + PORT + '. Quit Chrome fully, then relaunch it with the debug port (macOS): ' +
             'open -a "Google Chrome" --args --remote-debugging-port=' + PORT,
      detail: String((err && err.message) || err)
    }) + '\n');
    process.exit(2);
  }
  const context = browser.contexts()[0] || (await browser.newContext());
  return { browser, context };
}

module.exports = { attach, PORT };
