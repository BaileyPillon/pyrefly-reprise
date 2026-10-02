// Compose the mockups on the live pause screen. Real keys open the pause and walk to OPTIONS; each frame is then a
// rebuild of the OPTIONS DOM with the pause's own markup (mock.js + mock.css). Between frames the real tab keys re-render
// the shipped OPTIONS tab, so every frame starts from the real thing.
//   PYREFLY_BROWSER=gpu node capture.mjs [ffx|ffx2|all] [desk|phone|all] [frames,comma,separated|all]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { GAMES, HERE, OUT, openBattle, openOptions, shot } from './lib.mjs';

const games = (process.argv[2] ?? 'all') === 'all' ? ['ffx', 'ffx2'] : [process.argv[2]];
const sizes = (process.argv[3] ?? 'all') === 'all' ? ['desk', 'phone'] : [process.argv[3]];
const want = (process.argv[4] ?? 'all') === 'all' ? null : new Set(process.argv[4].split(','));
const MOCK_JS = readFileSync(HERE + 'mock.js', 'utf8');
const MOCK_CSS = readFileSync(HERE + 'mock.css', 'utf8');
mkdirSync(OUT + 'shots', { recursive: true });

// What each frame shows. `off` = switches stored OFF; the page and list both read it.
const STATE = {
  ffx: { off: [], rm: false },
  ffx2: { off: ['fxLiving', 'fxFog'], rm: false },
};
const FRAMES = {
  A1: (g) => ({ off: STATE[g].off, call: `__ecm.listA({sel:true})` }),
  A2: (g) => ({ off: STATE[g].off, call: `__ecm.openPage({variant:'A', sel:'${g === 'ffx' ? 'fxHero' : 'fxSphere'}'})` }),
  A3: (g) => ({ off: STATE[g].off, rm: true, call: `__ecm.openPage({variant:'A', sel:'fxBreath'})` }),
  B1: (g) => ({ off: STATE[g].off, call: `__ecm.listB({open:[], sel:'fxLight'})` }),
  B2: (g) => ({ off: STATE[g].off, call: g === 'ffx' ? `__ecm.listB({open:['fxSpectacle'], sel:'fxFraming'})` : `__ecm.listB({open:['fxLight'], sel:'fxFog'})` }),
  B3: (g) => ({ off: STATE[g].off, call: `__ecm.listB({open:['fxLight','fxLiving','fxSpectacle'], sel:'${g === 'ffx' ? 'fxSplash' : 'fxSphere'}'})` }),
  C1: (g) => ({ off: STATE[g].off, preset: g === 'ffx' ? 'FULL' : 'CUSTOM', call: `__ecm.listC({preset:'${g === 'ffx' ? 'FULL' : 'CUSTOM'}', sel:'preset'})` }),
  C3: (g) => ({ off: STATE[g].off, preset: 'BALANCED', call: `__ecm.listC({preset:'BALANCED', sel:'customize'})` }),
  C2: (g) => ({ off: g === 'ffx' ? ['fxFog'] : STATE[g].off, preset: 'CUSTOM', call: `__ecm.openPage({variant:'C', sel:'${g === 'ffx' ? 'fxDof' : 'fxFog'}', title:'Eye candy \\u00B7 customize'})` }),
};

async function reset(page, phone) {
  await page.evaluate(() => {
    document.querySelector('.ec-layer')?.remove();
    document.querySelectorAll('.ec-prompt').forEach((e) => e.remove());
    const r = document.querySelector('.pause');
    r.classList.remove('pause--ec', 'ec-fold');
  });
  // Real keys re-render the shipped OPTIONS tab: next tab (CONTROLS), previous tab (OPTIONS), Down to enter the body.
  await page.keyboard.press('e'); await page.waitForTimeout(350);
  await page.keyboard.press('q'); await page.waitForTimeout(450);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(450);
  const tab = await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab);
  if (tab !== 'options') throw new Error('reset left the pause on ' + tab);
}

const report = {};
for (const game of games) {
  for (const size of sizes) {
    const key = `${game}-${size}`;
    const { browser, page, errors } = await openBattle(game, size);
    await openOptions(page, { phone: size === 'phone' });
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: MOCK_CSS });
    await page.addScriptTag({ content: MOCK_JS });
    report[key] = {};
    for (const [name, spec] of Object.entries(FRAMES)) {
      if (want && !want.has(name)) continue;
      const f = spec(game);
      await page.evaluate(([g, off, rm, preset]) => { __ecm.setup(g, off, rm); if (preset) __ecm.preset = preset; }, [game, f.off, !!f.rm, f.preset ?? null]);
      await page.evaluate(f.call);
      await page.waitForTimeout(350);
      const audit = await page.evaluate(() => __ecm.audit());
      report[key][name] = audit;
      await shot(page, `${name}-${key}`);
      await reset(page, size === 'phone');
    }
    report[key].errors = errors;
    await browser.close();
  }
}
const out = OUT + `audit-${process.argv[2] ?? 'all'}-${process.argv[3] ?? 'all'}.json`;
writeFileSync(out, JSON.stringify(report, null, 1));
for (const [k, v] of Object.entries(report)) {
  for (const [n, a] of Object.entries(v)) {
    if (n === 'errors') { console.log(k, 'errors', a.length); continue; }
    console.log(k, n, 'issues', JSON.stringify(a.issues), 'layer', JSON.stringify(a.layer), 'scroll', JSON.stringify(a.scroll), 'settings', JSON.stringify(a.settings), 'objTop', a.objTop, 'lastRow', a.lastRowBottom);
  }
}
