// The Sphere Grid tab keeps its own phone page: a touch smoke test of its controls under this branch's shell, to compare with origin/main.
//   PYREFLY_BROWSER=gpu PREP_BASE=http://127.0.0.1:5843/ node proof-sphere.mjs --w=390 --h=844
import crypto from 'node:crypto';
import fs from 'node:fs';
import { launch, openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';
import { tapSel, drag, hit, stripY } from './touch.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const W = Number(args.w ?? 390);
const H = Number(args.h ?? 844);
const TAG = String(args.tag ?? 'sphere');
const OUT = join(OUT_ROOT, 'proof', `${TAG}-${W}x${H}`);
mkdir(OUT);
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await launch();
try {
  const { ctx, page, scr } = await openPrep(browser, { id: 'seymour-flux', width: W, height: H, touch: true, dpr: 1 });
  const sel = '.prep__tab[data-action="prep:tab:sphere-grid"]';
  for (let i = 0; i < 5; i++) {
    const h = await hit(page, sel);
    if (h.found && h.box.x >= 4 && h.box.x + h.box.w <= W - 24) break;
    const y = await stripY(page);
    await drag(page, W - 60, y, Math.max(60, W - 260), y);
    await page.waitForTimeout(450);
  }
  await tapSel(page, sel, 0, { wait: 900, partial: true });
  await dismissCards(page, scr);
  await page.waitForTimeout(600);
  const tab = await page.evaluate(() => ({ tab: document.querySelector('.prep').dataset.tab, phone: document.querySelector('.prep').dataset.phone ?? null }));
  check('Sphere Grid opened by a tap, with no stacked page', tab.tab === 'sphere-grid' && tab.phone === null, JSON.stringify(tab));
  const labels = await page.evaluate(() => [...document.querySelectorAll('.ffxprep-sg__btn')].map((b) => b.textContent.trim()));
  console.log('buttons:', JSON.stringify(labels));
  const mapHash = async () => crypto.createHash('sha1').update(await page.screenshot({ clip: { x: 0, y: 190, width: W, height: 330 } })).digest('hex').slice(0, 10);
  const idx = (t) => labels.findIndex((l) => l === t);
  const h0 = await mapHash();
  if (idx('+') >= 0) {
    await tapSel(page, '.ffxprep-sg__btn', idx('+'), { wait: 700 });
    const h1 = await mapHash();
    check('the + button zooms the map by touch', h1 !== h0, `${h0} -> ${h1}`);
    await tapSel(page, '.ffxprep-sg__btn', idx('−') >= 0 ? idx('−') : idx('-'), { wait: 700 }).catch(() => {});
  } else check('a + button exists', false, JSON.stringify(labels));
  const c = idx('CENTRE');
  if (c >= 0) {
    await tapSel(page, '.ffxprep-sg__btn', c, { wait: 700 });
    check('CENTRE answers a tap (no error)', page.errors.length === 0);
  }
  // A member's face still switches the grid, and START BATTLE is still pinned and uncovered.
  // The Sphere Grid draws its own row of heads (.sgb-face); the shell's roster is hidden on this tab.
  await tapSel(page, '.sgb-face', 1, { wait: 800 });
  check('a tap on a head of the Sphere Grid page switches the member', (await page.evaluate(() => [...document.querySelectorAll('.sgb-face')].findIndex((f) => f.classList.contains('sgb-face--sel')))) === 1);
  const sb = await hit(page, '.prep__start');
  check('START BATTLE is on screen and uncovered', sb.found && sb.inView && !sb.covered, JSON.stringify(sb.box));
  check('no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
  await ctx.close();
} finally {
  await browser.close().catch(() => {});
}
fs.writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ w: W, h: H, tag: TAG, checks: results }, null, 1));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length} of ${results.length} checks pass; ${bad.length} fail`);
process.exit(bad.length ? 1 : 0);
