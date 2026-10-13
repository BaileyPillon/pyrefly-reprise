// A WebKit pass over the same screens (Safari's engine; Playwright's WebKit build): layout and sweep only. CDP touch drags do not exist in
// WebKit, so the page is scrolled by script; taps are real (touchscreen.tap).
//   PREP_BASE=http://127.0.0.1:5843/ node proof-webkit.mjs --w=390 --h=844 --tag=webkit
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';
import { textFloorProbe } from './probe.mjs';
import { tapSel } from './touch.mjs';

const require = createRequire(`${process.env.PREP_WT ?? process.cwd()}/package.json`);
const { webkit } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const W = Number(args.w ?? 390);
const H = Number(args.h ?? 844);
const TAG = String(args.tag ?? 'webkit');
const OUT = join(OUT_ROOT, 'proof', `${TAG}-${W}x${H}`);
mkdir(OUT);
const results = [];
const check = (game, name, ok, detail = '') => {
  results.push({ game, name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${game.padEnd(6)} ${name}${detail ? '  ' + detail : ''}`);
};

const state = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('.prep');
    const box = (e) => (e ? (({ left, top, right, bottom }) => ({ l: Math.round(left), t: Math.round(top), r: Math.round(right), b: Math.round(bottom) }))(e.getBoundingClientRect()) : null);
    const host = document.querySelector('.prep__panel:not([hidden]) > .prph');
    return { tab: p.dataset.tab, phone: p.dataset.phone ?? null, top: p.scrollTop, sh: p.scrollHeight, ch: p.clientHeight, strip: box(document.querySelector('.prep__tabs')), roster: box(document.querySelector('.prep__roster')), start: box(document.querySelector('.prep__start')), last: box(host?.lastElementChild), docW: [document.documentElement.scrollWidth, document.documentElement.clientWidth], prepW: [p.scrollWidth, p.clientWidth], uaSticky: getComputedStyle(document.querySelector('.prep__tabs')).position, engine: navigator.userAgent.slice(0, 60) };
  });

const browser = await webkit.launch();
try {
  for (const id of ['seymour-flux', 'ffx2-bahamut']) {
    const game = id === 'seymour-flux' ? 'FFX' : 'FFX-2';
    const { ctx, page, scr } = await openPrep(browser, { id, width: W, height: H, touch: true, dpr: 1 });
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.prep__tab')].map((e) => e.getAttribute('data-action').replace('prep:tab:', '')));
    console.log(`--- ${game} WebKit ${W}x${H}: ${tabs.join(', ')}`);
    for (let t = 0; t < tabs.length; t++) {
      const tab = tabs[t];
      if (t > 0) {
        await tapSel(page, `.prep__tab[data-action="prep:tab:${tab}"]`, 0, { wait: 1000, partial: true });
        await dismissCards(page, scr);
        await page.waitForTimeout(500);
      }
      const base = `${id}-${String(t).padStart(2, '0')}-${tab}`;
      const s0 = await state(page);
      await page.screenshot({ path: join(OUT, `${base}.png`) });
      const probe = await page.evaluate(textFloorProbe, { floor: 14, offscreen: true });
      const own = tab === 'chapter' || tab === 'sphere-grid';
      check(game, `${tab}: opened by a tap`, s0.tab === tab);
      check(game, `${tab}: ${own ? 'its own phone page' : 'the stacked page'}`, own ? s0.phone === null : s0.phone === 'page');
      check(game, `${tab}: no text under 14 px`, probe.underCount === 0, `n=${probe.nText} min=${probe.minEff}`);
      check(game, `${tab}: no sideways scroll`, s0.docW[0] <= s0.docW[1] && s0.prepW[0] <= s0.prepW[1] + 1, JSON.stringify([s0.docW, s0.prepW]));
      if (!own) {
        check(game, `${tab}: strip 45 px, faces 65 px under it`, s0.strip.b - s0.strip.t === 45 && s0.roster.b - s0.roster.t === 65 && s0.roster.t === s0.strip.b, JSON.stringify([s0.strip, s0.roster]));
        if (s0.sh > s0.ch + 4) {
          await page.evaluate(() => { const p = document.querySelector('.prep'); p.scrollTop = p.scrollHeight; p.dispatchEvent(new Event('scroll')); });
          await page.waitForTimeout(400);
          const s1 = await state(page);
          await page.screenshot({ path: join(OUT, `${base}-end.png`) });
          check(game, `${tab}: pinned strip and faces at the end of the page (sticky)`, s1.strip.t === 0 && s1.roster.t === 45, JSON.stringify([s1.strip, s1.roster]));
          check(game, `${tab}: the last row ends above START BATTLE at the end`, s1.last.b <= s1.start.t, `last.b=${s1.last.b} start.t=${s1.start.t}`);
          await page.evaluate(() => { document.querySelector('.prep').scrollTop = 0; });
        } else {
          check(game, `${tab}: fits one screen above START BATTLE`, s0.last.b <= s0.start.t, `last.b=${s0.last.b} start.t=${s0.start.t}`);
        }
      }
    }
    check(game, 'no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close().catch(() => {});
}
fs.writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ w: W, h: H, tag: TAG, checks: results }, null, 1));
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length} of ${results.length} checks pass; ${bad.length} fail`);
process.exit(bad.length ? 1 : 0);
