#!/usr/bin/env node
/** One page load per chapter: report missing mid-battle scripts and fired triggers. */
import { chromium } from 'playwright';

const URL_ = process.argv[2] ?? 'http://localhost:5209/';
const CHAPTERS = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin'];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'],
});

for (const id of CHAPTERS) {
 for (let attempt = 1; attempt <= 4; attempt++) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const lines = [];
  page.on('console', (m) => lines.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => lines.push(`pageerror: ${e.message}`));
  // Swallow Vite's HMR socket: other agents are saving files in this repo and
  // a full reload mid-run destroys the execution context.
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });

  let out;
  try {
    out = await page.evaluate(async (chapterId) => {
      const fired = [];
      const seen = new Set();
      const api = window.__pyrefly;
      api.setSeed(7);
      const poll = setInterval(() => {
        try {
          for (const e of api.battleLog() ?? []) {
            if (e.type === 'script-trigger' && !seen.has(`${e.seq}:${e.name}`)) {
              seen.add(`${e.seq}:${e.name}`);
              fired.push(e.name);
            }
          }
        } catch {}
      }, 120);
      const run = await api.gotoChapter(chapterId, { skipCutscenes: true, auto: 'intended' });
      clearInterval(poll);
      return { outcome: run.outcome, turns: run.result?.turns ?? null, links: run.links ?? null, fired };
    }, id);
  } catch (err) {
    out = { outcome: `THREW: ${String(err.message).split('\n')[0]}`, fired: [] };
  }
  const missing = lines.filter((l) => l.includes('no mid-battle script'));
  const timeouts = lines.filter((l) => l.includes('did not finish within'));
  const errors = lines.filter((l) => l.startsWith('error:') || l.startsWith('pageerror:'));
  const counts = {};
  for (const n of out.fired ?? []) counts[n] = (counts[n] ?? 0) + 1;
  console.log(`\n=== ${id}  outcome=${out.outcome} turns=${out.turns ?? '-'} links=${out.links ?? '-'}`);
  console.log(`    triggers fired  : ${(out.fired ?? []).length} ${JSON.stringify(counts)}`);
  console.log(`    missing scripts : ${missing.length}`);
  missing.slice(0, 10).forEach((l) => console.log(`      ${l}`));
  console.log(`    script timeouts : ${timeouts.length}`);
  timeouts.slice(0, 10).forEach((l) => console.log(`      ${l}`));
  console.log(`    console errors  : ${errors.length}`);
  errors.slice(0, 6).forEach((l) => console.log(`      ${l.slice(0, 180)}`));
  await page.close();
  if (!String(out.outcome).startsWith('THREW')) break;
  console.log(`    (attempt ${attempt} lost the page to an HMR reload; retrying)`);
 }
}
await browser.close();
