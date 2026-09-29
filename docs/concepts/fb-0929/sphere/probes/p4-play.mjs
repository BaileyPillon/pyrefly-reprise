// Live or local, desktop: play the Sphere Grid tab by mouse like a first-timer.
import { open, shot, sleep, screen, toPrep, member, nodePoint, sg, NODE, NEIGH } from './lib.mjs';

const url = process.argv[2] ?? 'https://baileypillon.github.io/pyrefly-reprise/';
const tag = process.argv[3] ?? 'live';
const { browser, page, logs } = await open(url);
const log = (...a) => console.log(...a);
await toPrep(page);
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click();
await sleep(1000);
let me = await member(page);
log('start', JSON.stringify(me));
const act0 = await page.evaluate(() => window.__pyrefly.app.current.chapter.buildRef.members[0].sphereGrid.activatedNodeIds.map(Number));
const pos = Number(me.pos);
for (const id of NEIGH.get(pos)) {
  const n = NODE.get(id);
  log(' nb', id, n.name, act0.includes(id) ? 'ACTIVATED' : '', [...NEIGH.get(id)].map((j) => `${j}:${NODE.get(j).name}${act0.includes(j) ? '*' : ''}`).join(', '));
}
const clickNode = async (id, label) => {
  const p = await nodePoint(page, id);
  await page.mouse.move(p.x, p.y);
  await sleep(150);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(500);
  const s = await sg(page);
  const m = await member(page);
  log(`click ${label} node ${id} (${NODE.get(id).name}) @${p.x.toFixed(0)},${p.y.toFixed(0)} -> sLv ${m.sLv} pos ${m.pos} act ${m.act} | ${s.caption} | roster ${s.roster}`);
  return m;
};
// Nearest dormant, activatable node by BFS (not through closed locks).
const isLock = (id) => /Lock/.test(NODE.get(id).name);
const isEmpty = (id) => /Empty/.test(NODE.get(id).name);
const prev = new Map([[pos, null]]);
const queue = [pos];
let target = null;
while (queue.length && target === null) {
  const cur = queue.shift();
  for (const nb of NEIGH.get(cur)) {
    if (prev.has(nb) || isLock(nb)) continue;
    prev.set(nb, cur);
    if (!act0.includes(nb) && !isEmpty(nb)) { target = nb; break; }
    queue.push(nb);
  }
}
const path = [];
for (let c = target; c !== pos; c = prev.get(c)) path.unshift(c);
log('target', target, NODE.get(target).name, 'path', path.map((id) => `${id}:${NODE.get(id).name}`).join(' > '));
const p0 = await nodePoint(page, path[0]);
await page.mouse.move(p0.x, p0.y); await sleep(300);
log('hover first step', JSON.stringify(await sg(page)));
await shot(page, `p4-${tag}-hover`);
let i = 0;
for (const id of path) {
  await clickNode(id, `select#${i}`);
  if (i === 0) await shot(page, `p4-${tag}-select`);
  await clickNode(id, `move#${i}`);
  if (i === 0) await shot(page, `p4-${tag}-moved`);
  i++;
}
await sleep(2800);
const statsBefore = me.stats;
await clickNode(target, 'activate');
await sleep(150);
await shot(page, `p4-${tag}-activate`);
me = await member(page);
log('after', JSON.stringify(me));
log('stat diff', JSON.stringify(Object.fromEntries(Object.keys(me.stats).filter((k) => me.stats[k] !== statsBefore[k]).map((k) => [k, `${statsBefore[k]}->${me.stats[k]}`]))));
// STATS tab
await page.locator('#ui [data-action="prep:tab:stats"]').click();
await sleep(700);
log('STATS tab', await page.evaluate(() => document.querySelector('.prep__sheet, .prep__body')?.textContent?.replace(/\s+/g, ' ').slice(0, 900)));
await shot(page, `p4-${tag}-stats-after`);
// Back to grid: is the state still there?
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click();
await sleep(700);
log('grid again', JSON.stringify(await sg(page)), JSON.stringify(await member(page)));
await browser.close();
log(logs.filter((l) => !l.includes('studio background')).join('\n'));
