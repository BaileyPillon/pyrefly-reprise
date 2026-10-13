// Desktop (default 1600x900) captures of every prep tab in both games, by real keys, for the before/after identity proof.
// node shots-desktop.mjs --tag=before [--width=1600 --height=900] [--ids=seymour-flux,ffx2-bahamut]
import { launch, openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const TAG = String(args.tag ?? 'before');
const W = Number(args.width ?? 1600);
const H = Number(args.height ?? 900);
const IDS = String(args.ids ?? 'seymour-flux,ffx2-bahamut').split(',');
const OUT = join(OUT_ROOT, 'desktop', `${TAG}-${W}x${H}`);
mkdir(OUT);

const browser = await launch();
const log = [];
try {
  for (const id of IDS) {
    const { ctx, page, scr } = await openPrep(browser, { id, width: W, height: H, touch: false, dpr: 1 });
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.prep__tab')].map((e) => e.getAttribute('data-action').replace('prep:tab:', '')));
    log.push({ id, tabs });
    for (let t = 0; t < tabs.length; t++) {
      if (t > 0) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1100); await dismissCards(page, scr); await page.waitForTimeout(500); }
      const sel = await page.evaluate(() => document.querySelector('.prep__tab[aria-selected="true"]')?.getAttribute('data-action'));
      await page.screenshot({ path: join(OUT, `${id}-${String(t).padStart(2, '0')}-${tabs[t]}-m0.png`) });
      if (!['chapter', 'sphere-grid'].includes(tabs[t])) {
        for (let k = 0; k < 3; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(350); }
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(OUT, `${id}-${String(t).padStart(2, '0')}-${tabs[t]}-m3.png`) });
        for (let k = 0; k < 3; k++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(350); }
        await page.waitForTimeout(400);
      }
      console.log(id, t, tabs[t], sel);
    }
    log.push({ id, errors: page.errors });
    await ctx.close();
  }
} finally {
  await browser.close().catch(() => {});
}
console.log(JSON.stringify(log));
process.exit(0);
