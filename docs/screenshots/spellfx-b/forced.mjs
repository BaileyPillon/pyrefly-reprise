// Real engine path: each element cast as a real command through the presenter
// (a scripted AutoStrategy on the first party turn of a fresh battle).
// Labelled FORCED COMMAND in the report.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const BASE = process.env.SPELLFX_BASE ?? 'http://127.0.0.1:6050/';
const PLAN = {
  ffx: { chapter: 'seymour-flux', enemy: 'seymour-flux', ally: 'tidus', spells: ['fire', 'blizzard', 'thunder', 'water', 'holy', 'cure', 'attack'] },
  ffx2: { chapter: 'ffx2-bahamut', enemy: 'bahamut', ally: 'rikku', spells: ['x2-black-mage-fire', 'x2-black-mage-blizzard', 'x2-black-mage-thunder', 'x2-black-mage-water', 'x2-shared-holy', 'x2-white-mage-cure', 'attack'] },
};
const size = process.argv[2] ?? 'desk';
const SZ = size === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1600, height: 900 } };
const report = {};
const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
const page = await browser.newPage(SZ);
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
await page.goto(BASE); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
for (const [game, p] of Object.entries(PLAN)) {
  report[game] = [];
  for (const spell of p.spells) {
    await page.evaluate((ch) => { window.__pyrefly.setMuted(true); window.__pyrefly.setSeed(1); window.__pyrefly.gotoChapter(ch, { skipCutscenes: true }); }, p.chapter);
    await page.evaluate(async () => { for (let i = 0; i < 3000; i++) { await window.__pyrefly.frame(); const s = document.querySelector('.ig-cmd-stack, .x2-cmd, [class*="cmd"]'); if (window.__pyrefly.battleState?.() && s && !s.hidden && s.getBoundingClientRect().height > 0) return; } });
    await page.waitForTimeout(400);
    await page.evaluate(({ p, spell }) => {
      const st = window.__pyrefly.battle().stage;
      window.__fxLands = [];
      const land = st.spellFx.land.bind(st.spellFx);
      st.spellFx.land = (t, o) => { const r = land(t, o); window.__fxLands.push({ t, ability: o.abilityId ?? null, fx: st.spellFx.resolve(o), waitMs: Math.round(r) }); return r; };
      let done = false;
      window.__pyrefly.autoBattle((actor) => {
        if (done) return null;
        done = true;
        const target = spell.includes('cure') ? p.ally : p.enemy;
        window.__fxActor = actor;
        return spell === 'attack' ? { kind: 'attack', targets: [target] } : { kind: 'ability', id: spell, targets: [target] };
      });
    }, { p, spell });
    const seen = new Set();
    const want = { fire: 0.6, blizzard: 0.7, thunder: 0.45, water: 0.62, holy: 0.72, cure: 0.6, attack: 0.3 };
    const key = Object.keys(want).find((k) => spell.endsWith(k) || (k === 'blizzard' && spell.includes('blizzard'))) ?? 'attack';
    for (let i = 0; i < (game === 'ffx2' ? 220 : 90); i++) {
      await page.waitForTimeout(35);
      const s = await page.evaluate(() => window.__pyrefly.snapshotState().screenState.spellFx);
      for (const r of s?.running ?? []) {
        const fx = { fire: 'fire', blizzard: 'ice', thunder: 'thunder', water: 'water', holy: 'holy', cure: 'cure', attack: 'hit' }[key];
        if (r.id === fx && !seen.has(r.id) && r.t >= want[key] - 0.2 && r.t <= want[key] + 0.25) {
          seen.add(r.id);
          await page.screenshot({ path: `${OUT}frames/forced-${game}-${size}-${spell}.jpg`, type: 'jpeg', quality: 84 });
        }
      }
    }
    const r = await page.evaluate(() => ({ actor: window.__fxActor, lands: window.__fxLands.filter((l) => l.ability !== null) }));
    const ours = r.lands.filter((l) => l.ability === spell || (spell === 'attack' && l.ability === 'attack'));
    report[game].push({ spell, actor: r.actor, drawn: [...new Set(ours.map((l) => l.fx))], waitMs: ours.map((l) => l.waitMs) });
    console.log(game, size, spell, r.actor, JSON.stringify(report[game].at(-1)));
  }
}
await browser.close();
writeFileSync(`${OUT}report-forced-${size}.json`, JSON.stringify(report, null, 1));
