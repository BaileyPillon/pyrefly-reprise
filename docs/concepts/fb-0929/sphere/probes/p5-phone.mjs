// Live or local, phone 390x844 by taps: reach the Sphere Grid tab and try it.
import { open, shot, sleep, screen, member, nodePoint, sg, NODE, NEIGH } from './lib.mjs';

const url = process.argv[2] ?? 'https://baileypillon.github.io/pyrefly-reprise/';
const tag = process.argv[3] ?? 'live';
const { browser, page, logs } = await open(url, { width: 390, height: 844, mobile: true });
const log = (...a) => console.log(...a);
const tapSel = async (sel, text) => {
  const loc = text ? page.locator(sel, { hasText: text }).first() : page.locator(sel).first();
  const box = await loc.boundingBox();
  if (!box) throw new Error(`no box for ${sel} ${text ?? ''}`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(900);
};
const dump = async () => {
  const els = await page.evaluate(() => [...document.querySelectorAll('#ui [data-action], #ui button, #ui [role=button], .ffxprep-sg__btn')]
    .filter((e) => e.getBoundingClientRect().width > 0)
    .map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName} [${e.getAttribute('data-action') ?? e.getAttribute('data-sg') ?? ''}] "${(e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}" @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  log(`--- ${await screen(page)}\n${els.join('\n')}`);
};
await shot(page, `p5-${tag}-01-title`);
await tapSel('#ui [data-action=confirm]', 'Tap');
if ((await screen(page)) !== 'chapter-select') { await dump(); await tapSel('#ui [data-action="briefing:skip"]'); }
await dump();
await shot(page, `p5-${tag}-02-select`);
// tap the Chapter I plate twice if needed (first tap may only select)
await tapSel('#ui [data-action=fe-card-0]');
if ((await screen(page)) === 'chapter-select') await tapSel('#ui [data-action=fe-card-0]');
for (let i = 0; i < 3 && (await screen(page)) !== 'party-prep'; i++) { await dump(); await tapSel('#ui [data-action]', /Skip|skip/); }
await dump();
await shot(page, `p5-${tag}-03-prep`);
const tab = page.locator('#ui [data-action="prep:tab:sphere-grid"]').first();
if (await tab.count()) { await tapSel('#ui [data-action="prep:tab:sphere-grid"]'); }
await sleep(800);
await dump();
await shot(page, `p5-${tag}-04-grid`);
const info = await page.evaluate(() => {
  const c = document.querySelector('.ffxprep-sg__canvas canvas');
  const r = c?.getBoundingClientRect();
  return { canvas: r && { x: r.x, y: r.y, w: r.width, h: r.height, bw: c.width, bh: c.height, ta: getComputedStyle(c).touchAction, pe: getComputedStyle(c).pointerEvents } };
});
log(JSON.stringify(info), JSON.stringify(await sg(page)));
const me = await member(page);
log('member', JSON.stringify(me));
if (info.canvas) {
  // tap a neighbour twice (select, then move)
  const nb = [...NEIGH.get(Number(me.pos))][1] ?? [...NEIGH.get(Number(me.pos))][0];
  const p = await nodePoint(page, nb);
  log('tap node', nb, NODE.get(nb).name, p);
  await page.touchscreen.tap(p.x, p.y); await sleep(500);
  log('after tap1', JSON.stringify(await sg(page)), JSON.stringify(await member(page)));
  await shot(page, `p5-${tag}-05-tap1`);
  await page.touchscreen.tap(p.x, p.y); await sleep(500);
  log('after tap2', JSON.stringify(await sg(page)), JSON.stringify(await member(page)));
  await shot(page, `p5-${tag}-06-tap2`);
  // one-finger drag to pan (touch): dispatch via CDP
  const cdp = await page.context().newCDPSession(page);
  const cx = info.canvas.x + info.canvas.w / 2; const cy = info.canvas.y + info.canvas.h / 2;
  const before = await page.evaluate(() => JSON.stringify(window.__sgRec?.tokens?.at(-1)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
  for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - k * 10, y: cy - k * 4 }] }); await sleep(30); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(400);
  const after = await page.evaluate(() => JSON.stringify(window.__sgRec?.tokens?.at(-1)));
  log('drag token before', before, 'after', after, 'scrollY', await page.evaluate(() => [window.scrollY, document.scrollingElement.scrollTop, document.querySelector('.prep__sheet')?.scrollTop]));
  await shot(page, `p5-${tag}-07-drag`);
}
await browser.close();
log(logs.filter((l) => !l.includes('studio background')).join('\n'));
