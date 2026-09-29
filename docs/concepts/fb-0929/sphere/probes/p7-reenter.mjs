// Desktop: open a lock with a key sphere, then switch tabs / leave and re-enter, and see whether it stays open.
import { open, shot, sleep, screen, toPrep, member, nodePoint, sg, NODE, NEIGH, bringIntoView } from './lib.mjs';

const url = process.argv[2] ?? 'https://baileypillon.github.io/pyrefly-reprise/';
const tag = process.argv[3] ?? 'live';
const { browser, page, logs } = await open(url);
const log = (...a) => console.log(...a);
await toPrep(page);
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click();
await sleep(1000);
let me = await member(page);
const pos = Number(me.pos);
const routeUnlocked = await page.evaluate(() => 0);
const isLock = (id) => /Lock/.test(NODE.get(id).name);
const lockLv = (id) => Number(/(\d)/.exec(NODE.get(id).name)?.[1]);
// BFS over non-lock nodes to a node next to a lock (level 1 or 2, keys held).
const prev = new Map([[pos, null]]);
const q = [pos];
let stand = null; let lock = null;
while (q.length && !stand) {
  const cur = q.shift();
  const adjLock = [...NEIGH.get(cur)].find((n) => isLock(n) && lockLv(n) <= 2);
  if (adjLock !== undefined) { stand = cur; lock = adjLock; break; }
  for (const nb of NEIGH.get(cur)) { if (prev.has(nb) || isLock(nb)) continue; prev.set(nb, cur); q.push(nb); }
}
const path = [];
for (let c = stand; c !== pos; c = prev.get(c)) path.unshift(c);
log('lock', lock, NODE.get(lock).name, 'stand', stand, 'path', path.join('>'), 'sLv', me.sLv);
const click = async (id) => {
  const p = await bringIntoView(page, id);
  await page.mouse.move(p.x, p.y); await sleep(120);
  await page.mouse.down(); await page.mouse.up(); await sleep(400);
};
for (const id of path) { await click(id); await click(id); }
me = await member(page);
log('at', me.pos, 'sLv', me.sLv, JSON.stringify(await sg(page)));
await click(lock);
log('lock selected', JSON.stringify(await sg(page)));
await click(lock);
log('lock acted', JSON.stringify(await sg(page)), 'K pouch', JSON.stringify((await member(page)).pouch));
await shot(page, `p6-${tag}-lock-opened`);
await sleep(2800);
// Hover the lock now
const hover = async (id) => { const p = await bringIntoView(page, id); await page.mouse.move(p.x - 30, p.y - 30); await sleep(100); await page.mouse.move(p.x, p.y); await sleep(250); return (await sg(page)).caption; };
log('hover lock (same mount):', await hover(lock));
// Leave the prep screen (ESC BACK) and come back in
await page.locator('#ui [data-action="prep:back"]').first().click(); await sleep(1200);
log('after back', await screen(page));
await page.locator('#ui [data-action=fe-card-0]').first().click(); await sleep(1500);
for (let i = 0; i < 4 && (await screen(page)) !== 'party-prep'; i++) { await page.keyboard.press('Escape'); await sleep(900); }
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click(); await sleep(900);
log('re-entered', JSON.stringify(await member(page)));
log('hover lock (after leaving and re-entering):', await hover(lock));
await shot(page, `p6-${tag}-lock-after-tab`);
await click(lock); // select (cursor)
log('click lock after tab', JSON.stringify(await sg(page)));
await click(lock);
log('click lock again', JSON.stringify(await sg(page)), 'K pouch', JSON.stringify((await member(page)).pouch));
await shot(page, `p6-${tag}-lock-reopen`);
await browser.close();
log(logs.filter((l) => !l.includes('studio background')).join('\n'));
