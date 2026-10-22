import { bootChapter } from '../../runner/lib/gap-boot.mjs';
import fs from 'node:fs';
const EV = 'D:/pyrefly-release55/critic/reviews/6db09ac86-live/ev';
const out = {};
const L = (k, v) => { out[k] = v; console.log(k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 800)); };
const base = 'https://echoesofspira.com/?cb=r59rel' + Date.now();
const b = await bootChapter({ base, evidence: EV, id: 'seymour-flux', dir: 'chreload', seed: 1 });
const { page, input } = b;
const save = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); return s && { v: s.version, music: s.settings?.musicVolume, sfx: s.settings?.sfxVolume, chap: s.chapters?.['seymour-flux'], keys: Object.keys(localStorage) }; });
L('save before', await save());
await input.press('Escape'); await page.waitForTimeout(900);
const activeTab = () => page.evaluate(() => document.querySelector('[class*="pause"] [aria-selected="true"], .pause__tab--active, .pause__tab[aria-current]')?.textContent?.trim() ?? null);
for (let i = 0; i < 12; i++) { const t = await activeTab(); if (t && /OPTIONS/i.test(t)) break; await input.press('ArrowRight'); await page.waitForTimeout(250); }
L('tab', await activeTab());
await input.press('ArrowDown'); await page.waitForTimeout(300);
const rowsText = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 500));
L('options text', await rowsText());
await b.snap('40-options.png', { asserted: 'pause options tab' });
await input.press('ArrowDown'); await page.waitForTimeout(250); // MUSIC row
for (let i = 0; i < 3; i++) { await input.press('ArrowLeft'); await page.waitForTimeout(250); }
L('options text after', await rowsText());
await b.snap('41-options-changed.png', { asserted: 'music volume lowered' });
L('save after change', await save());
await input.press('Escape'); await page.waitForTimeout(500); await input.press('Escape'); await page.waitForTimeout(800);
L('screen', await b.scr());
// progress: one attack turn
await input.press('Enter'); await page.waitForTimeout(500); await input.press('Enter'); await page.waitForTimeout(3500);
L('save after turn', await save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
await page.waitForTimeout(1500);
L('screen after reload', await page.evaluate(() => window.__pyrefly.screen()));
L('save after reload', await save());
L('applied volumes', await page.evaluate(() => { const a = window.__pyrefly.audioDebug(); return a.volumes; }));
await input.press('Enter'); await page.waitForTimeout(1200);
L('applied volumes after gesture', await page.evaluate(() => window.__pyrefly.audioDebug().volumes));
L('console', b.consoleErrors); L('404', b.notFound);
fs.writeFileSync(EV + '/smoke6.json', JSON.stringify({ ...out, consoleErrors: b.consoleErrors, notFound: b.notFound }, null, 1));
await b.browser.close();
