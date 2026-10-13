// The PREP-A target frame "FFX-2 Yuna Stats, scrolled" on the build, by real touch: Gunner unfolded with a tap, then a touch drag down the page
// until it rests at 230 px (the target's offset), plus the Dresspheres page with its folded sections opened by taps.
//   PYREFLY_BROWSER=gpu PREP_BASE=http://127.0.0.1:5843/ node proof-scrolled.mjs --w=390 --h=844 --tag=build
import { launch, openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';
import { tapSel, drag, scrollTo, hit, stripY, settle } from './touch.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const W = Number(args.w ?? 390);
const H = Number(args.h ?? 844);
const TAG = String(args.tag ?? 'build');
const OUT = join(OUT_ROOT, 'proof', `${TAG}-${W}x${H}`);
mkdir(OUT);

async function goTab(page, scr, id) {
  const sel = `.prep__tab[data-action="prep:tab:${id}"]`;
  for (let i = 0; i < 5; i++) {
    const h = await hit(page, sel);
    if (h.found && h.box.x >= 4 && h.box.x + h.box.w <= W - 24) break;
    const left = h.found && h.box.x < 4;
    const y = await stripY(page);
    await drag(page, left ? 60 : W - 60, y, left ? Math.min(W - 60, 260) : Math.max(60, W - 260), y);
    await page.waitForTimeout(450);
  }
  await tapSel(page, sel, 0, { wait: 900, partial: true });
  await dismissCards(page, scr);
  await page.waitForTimeout(500);
}

const browser = await launch();
try {
  const { ctx, page, scr } = await openPrep(browser, { id: 'ffx2-bahamut', width: W, height: H, touch: true, dpr: 1 });
  await goTab(page, scr, 'stats');
  await tapSel(page, '.prep__panel:not([hidden]) .prph-sec[data-fold="s:gunner"] [data-fold-head]', 0, { wait: 400 });
  const top = await scrollTo(page, 230, W, H);
  await settle(page);
  await page.screenshot({ path: join(OUT, 'ffx2-bahamut-02-stats-gunner-scrolled.png') });
  console.log('FFX-2 stats, Gunner unfolded, scrollTop', top);
  await goTab(page, scr, 'dresspheres');
  for (const k of ['grid', 'owned']) await tapSel(page, `.prep__panel:not([hidden]) .prph-sec[data-fold="${k}"] [data-fold-head]`, 0, { wait: 350 });
  await page.screenshot({ path: join(OUT, 'ffx2-bahamut-01-dresspheres-all-open.png') });
  console.log('FFX-2 dresspheres, grid and owned unfolded');
  await ctx.close();
} finally {
  await browser.close().catch(() => {});
}
process.exit(0);
