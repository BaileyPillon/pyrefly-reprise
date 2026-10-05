// r39-judg L: a look turned back ON with every part OFF brings its parts back. Real keys on the EYE CANDY page.
// Start state: the release-35 save fixture (BATTLE SPECTACLE off; the nine parts did not exist, so they upgrade to OFF),
// or a save the player made by switching every part of CINEMA LIGHT off by hand. Everything after boot is a real key press.
import fs from 'node:fs';
import { launch, ready, until, phase, writeJson, BASE, SCRATCH, WT } from './lib.mjs';

const TAG = process.env.TAG ?? 'before';
const OUT = process.env.OUT ?? `${SCRATCH}/looks-${TAG}`;
fs.mkdirSync(OUT, { recursive: true });
const fixture = JSON.parse(fs.readFileSync(`${WT}/tests/fixtures/saves/release-35.json`, 'utf8'));
const KEY = 'pyrefly-reprise:save:v1';

const GAMES = (process.env.GAMES ?? 'seymour-flux,ffx2-bahamut').split(',');
const results = [];

for (const chapter of GAMES) {
  const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
  const log = [];
  const note = (...a) => { const s = a.join(' '); console.log(`[${chapter}]`, s); log.push(s); };
  // the old save goes in before the game boots, once (a reload would find the game's own newer save and leave it)
  await ctx.addInitScript(([key, blob]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, blob); }, [KEY, fixture.localStorage[KEY]]);
  await ready(page, `${BASE}?coach=off`);
  await page.evaluate((id) => { const P = window.__pyrefly; P.setMuted(true); P.markCoachSeen?.(); P.setSeed(1); void P.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  await until(page, () => phase(page), (v) => v.startsWith('command:'), 120000, 'a command menu');
  await page.waitForTimeout(800);

  const settings = () => page.evaluate(() => {
    const s = window.__pyrefly.app.save.settings;
    const keys = ['fxLight', 'fxDof', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxFraming', 'fxHero', 'fxSphere', 'fxSplash'];
    return Object.fromEntries(keys.map((k) => [k, s[k]]));
  });
  const stored = () => page.evaluate((k) => { const o = JSON.parse(localStorage.getItem(k) ?? '{}'); return { version: o.version, topKeys: Object.keys(o).sort(), settingsKeys: Object.keys(o.settings ?? {}).sort() }; }, KEY);
  const rows = () => page.evaluate(() => [...document.querySelectorAll('.pause__ec .pause__ec-row')].map((r) => ({
    id: r.dataset.row, label: r.querySelector('.pause__k')?.textContent?.trim(), value: r.querySelector('.pause__v')?.firstChild?.textContent?.trim(),
    note: r.querySelector('.pause__v em')?.textContent?.replace(/\s+/g, ' ').trim() ?? '', sel: r.classList.contains('pause__row--sel'), dim: r.classList.contains('pause__ec-row--dim'),
  })));
  const selectedId = () => page.evaluate(() => (document.querySelector('.pause__ec .pause__row--sel') ?? document.querySelector('.pause__row--sel'))?.dataset.row ?? null);
  const go = async (id) => {
    for (let i = 0; i < 24 && (await selectedId()) !== id; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120); }
    if ((await selectedId()) !== id) throw new Error(`could not reach row ${id}`);
  };
  const flip = async (id) => { await go(id); await page.keyboard.press('Enter'); await page.waitForTimeout(260); };
  const view = async (label) => {
    const r = await rows();
    const line = r.map((x) => `${x.label}=${x.value}${x.note ? `(${x.note})` : ''}`).join(' | ');
    note(label + ':', line);
    return r;
  };

  // open the page with real keys: Esc (pause), E (OPTIONS), Down to the EYE CANDY row, Enter
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  // E steps to the next tab (Tidus, Yuna, Kimahri, Chapter, Guide, Options): real key presses until OPTIONS is the open tab
  for (let i = 0; i < 10; i++) {
    const tab = await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab ?? document.querySelector('.pause__tab--on')?.dataset.action ?? '');
    if (tab === 'options') break;
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(300);
  await go('eyeCandy');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const opened = await rows();
  if (!opened.length) throw new Error('the EYE CANDY page did not open');
  const step = { chapter, start: await settings(), startStored: await stored() };
  step.opening = await view('opened');
  await page.screenshot({ path: `${OUT}/${chapter}-1-opened.png` });

  // 1. BATTLE SPECTACLE is OFF and so are its parts: turn the look ON
  await flip('fxSpectacle');
  step.afterLookOn = { settings: await settings(), rows: await view('BATTLE SPECTACLE turned ON') };
  await page.screenshot({ path: `${OUT}/${chapter}-2-spectacle-on.png` });

  // 2. a part the player turns off afterwards stays off
  await flip('fxSplash');
  step.afterSplashOff = { settings: await settings(), rows: await view('SPLASH ART turned OFF') };

  // 3. look OFF then ON again: a look with at least one part on keeps the player's choices (SPLASH ART stays off)
  await flip('fxSpectacle');
  step.afterLookOff = { settings: await settings(), rows: await view('BATTLE SPECTACLE turned OFF') };
  await flip('fxSpectacle');
  step.afterLookBack = { settings: await settings(), rows: await view('BATTLE SPECTACLE turned ON again') };
  await page.screenshot({ path: `${OUT}/${chapter}-3-keeps-choices.png` });

  // 4. CINEMA LIGHT: the player switches its three parts off by hand, then the look off and on
  for (const id of ['fxDof', 'fxFog', 'fxEdges']) await flip(id);
  step.cinemaPartsOff = { settings: await settings(), rows: await view('CINEMA LIGHT parts all OFF (look still ON)') };
  await flip('fxLight');
  await view('CINEMA LIGHT turned OFF');
  await flip('fxLight');
  step.cinemaBack = { settings: await settings(), rows: await view('CINEMA LIGHT turned ON again') };
  await page.screenshot({ path: `${OUT}/${chapter}-4-cinema-back.png` });

  step.endStored = await stored();
  step.errors = errors;
  step.log = log;
  results.push(step);
  await browser.close();
}
writeJson(`${OUT}/run.json`, { tag: TAG, results });
console.log('done');
