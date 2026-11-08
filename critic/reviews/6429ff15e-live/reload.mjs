import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = 'D:/pyrefly-release55';
const OUT = resolve(REPO, 'critic/reviews/6429ff15e-live/shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);
const ctx = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page, browser, consoleErrors, notFound } = ctx;
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const snapStore = () => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) o[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)); return o; });
const out = {};
try {
  await assertScreen(page, 'title');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select'); await page.waitForTimeout(2500);
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
  if ((await scr()) === 'party-prep') { await page.keyboard.press('Enter'); await page.waitForTimeout(2500); }
  for (let g = 0; (await scr()) === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  if (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
  // progress: one real attack
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  // Options tab
  await page.getByText(/^options$/i).first().click(); await page.waitForTimeout(1000);
  await page.screenshot({ path: join(OUT, '30-options.png') });
  out.optionsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 600));
  const rows = await page.evaluate(() => [...document.querySelectorAll('input,select,[role=slider],[role=switch],button')].map((e) => (e.tagName + ':' + (e.getAttribute('aria-label') || e.id || e.className || e.textContent).toString().slice(0, 50) + ':' + (e.value ?? ''))).slice(0, 40));
  out.controls = rows;
  const before = await snapStore();
  // try the music slider tab instead: use Right arrow on the focused option row
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '31-options-changed.png') });
  const after = await snapStore();
  out.changedKeys = Object.keys(after).filter((k) => after[k] !== before[k]);
  out.before = Object.fromEntries(Object.entries(before).map(([k, v]) => [k, v.slice(0, 300)]));
  out.after = Object.fromEntries(Object.entries(after).map(([k, v]) => [k, v.slice(0, 300)]));
  await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const re = JSON.parse((await snapStore())['pyrefly-reprise:save:v1']);
  out.reloaded = { master: re.settings.masterVolume, attempts: re.chapters['seymour-flux']?.attempts, screen: await scr() };
  const ad = await page.evaluate(() => JSON.stringify(window.__pyrefly.audioDebug().volumes));
  out.reloadedAudioVolumes = ad;
} catch (e) { out.error = String(e).slice(0, 400); }
out.consoleErrors = consoleErrors; out.notFound = notFound;
writeFileSync(join(OUT, '..', 'reload-probe.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await browser.close();
