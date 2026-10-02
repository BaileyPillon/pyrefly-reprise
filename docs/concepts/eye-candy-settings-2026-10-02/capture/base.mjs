// Baseline: today's OPTIONS tab, real keys, both games, both sizes. Also dumps the geometry the mockups must respect.
//   PYREFLY_BROWSER=gpu node base.mjs [ffx|ffx2] [desk|phone]
import { mkdirSync, writeFileSync } from 'node:fs';
import { OUT, openBattle, openOptions, shot } from './lib.mjs';

const games = process.argv[2] ? [process.argv[2]] : ['ffx', 'ffx2'];
const sizes = process.argv[3] ? [process.argv[3]] : ['desk', 'phone'];
mkdirSync(OUT + 'shots', { recursive: true });
const report = {};
for (const game of games) {
  for (const size of sizes) {
    const key = `${game}-${size}`;
    const { browser, page, errors } = await openBattle(game, size);
    await page.screenshot({ path: OUT + `shots/_battle-${key}.jpg`, type: 'jpeg', quality: 70 });
    const r = await openOptions(page, { phone: size === 'phone' });
    await shot(page, `today-${key}-tabs`);
    // enter the body with the real Down key: the cursor lands on the first row
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await shot(page, `today-${key}-body`);
    const geo = await page.evaluate(() => {
      const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
      const q = (s) => document.querySelector(s);
      const cs = getComputedStyle(q('.pause'));
      const vars = {};
      for (const v of ['--pu-gut', '--pu-fs', '--pu-fs-v', '--pu-fs-on', '--pu-row', '--pu-key', '--pu-bar', '--pu-top-body', '--pu-top-obj', '--pu-accent']) vars[v] = cs.getPropertyValue(v).trim();
      const rows = [...document.querySelectorAll('.pause__col[data-col="settings"] .pause__row')].map((r) => ({ id: r.dataset.row, k: r.querySelector('.pause__k')?.textContent, v: r.querySelector('.pause__v')?.textContent, box: box(r), sel: r.classList.contains('pause__row--sel') }));
      const enc = [...document.querySelectorAll('.pause__col[data-col="encounter"] .pause__row')].map((r) => ({ id: r.dataset.row, k: r.querySelector('.pause__k')?.textContent, box: box(r) }));
      return {
        vars,
        tabs: [...document.querySelectorAll('.pause__tab')].map((t) => t.dataset.tab),
        body: box(q('.pause__body')), settings: box(q('.pause__col[data-col="settings"]')), encounter: box(q('.pause__col[data-col="encounter"]')),
        obj: box(q('.pause__obj')), prompts: box(q('.pause__prompts')), back: box(q('.pause__back')), hide: box(q('.pause__hide')),
        settingsScroll: (() => { const c = q('.pause__col[data-col="settings"]'); return c ? { sh: c.scrollHeight, ch: c.clientHeight } : null; })(),
        rows, enc,
        mirror: q('.pause').classList.contains('pause--mirror'),
        ig2: q('.pause').classList.contains('ig--ffx2') || !!q('.ig--ffx2'),
        root: q('.pause').className,
        snapshot: window.__pyrefly.snapshotState()?.screenState ?? null,
      };
    });
    geo.nav = r; geo.errors = errors;
    report[key] = geo;
    await browser.close();
  }
}
writeFileSync(OUT + `base-${process.argv[2] ?? 'all'}-${process.argv[3] ?? 'all'}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([k, v]) => [k, { settings: v.settings, encounter: v.encounter, obj: v.obj, prompts: v.prompts, rows: v.rows.length, scroll: v.settingsScroll, errors: v.errors.length, nav: v.nav }])), null, 1));
