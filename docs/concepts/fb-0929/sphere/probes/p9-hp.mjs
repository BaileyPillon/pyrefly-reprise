// Desktop: walk Tidus to an HP node, activate it, read the STATS tab, start the battle and read Tidus's max HP there.
import { open, shot, sleep, screen, toPrep, member, sg, NODE, NEIGH, bringIntoView } from './lib.mjs';

const url = process.argv[2] ?? 'https://baileypillon.github.io/pyrefly-reprise/';
const tag = process.argv[3] ?? 'live';
const { browser, page, logs } = await open(url);
const log = (...a) => console.log(...a);
await toPrep(page);
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click();
await sleep(900);
let me = await member(page);
const act0 = await page.evaluate(() => window.__pyrefly.app.current.chapter.buildRef.members[0].sphereGrid.activatedNodeIds.map(Number));
const pos = Number(me.pos);
const prev = new Map([[pos, null]]); const q = [pos]; let target = null;
while (q.length && target === null) {
  const cur = q.shift();
  for (const nb of NEIGH.get(cur)) {
    if (prev.has(nb) || /Lock/.test(NODE.get(nb).name)) continue;
    prev.set(nb, cur);
    if (!act0.includes(nb) && /^HP/.test(NODE.get(nb).name)) { target = nb; break; }
    q.push(nb);
  }
}
const path = []; for (let c = target; c !== pos; c = prev.get(c)) path.unshift(c);
const click = async (id) => { const p = await bringIntoView(page, id); await page.mouse.move(p.x, p.y); await sleep(100); await page.mouse.down(); await page.mouse.up(); await sleep(350); };
for (const id of path) { await click(id); await click(id); }
await sleep(2700);
log('before', JSON.stringify((await member(page)).stats), 'hp', (await member(page)).hp);
await click(target);
log('activate', (await sg(page)).caption);
me = await member(page);
log('after ', JSON.stringify(me.stats), 'hp', me.hp);
await shot(page, `p9-${tag}-hp-activated`);
await page.locator('#ui [data-action="prep:tab:stats"]').click(); await sleep(600);
log('STATS HP row', await page.evaluate(() => [...document.querySelectorAll('#ui *')].map((e) => e.textContent).find((t) => /^HP\s*\d/.test(t?.trim() ?? ''))?.replace(/\s+/g, ' ')));
await shot(page, `p9-${tag}-stats`);
await page.locator('#ui [data-action="prep:begin"]').last().click();
await sleep(1500);
for (let i = 0; i < 10 && (await screen(page)) !== 'battle'; i++) { await page.evaluate(() => window.__pyrefly.skipCutscene?.()); await sleep(1500); }
log('screen', await screen(page));
await page.evaluate(() => window.__pyrefly.frames(10));
const t = await page.evaluate(() => { const s = window.__pyrefly.battleState(); const all = s?.combatants; const c = Array.isArray(all) ? all.find((x) => x.id === 'tidus') : (all?.tidus ?? all?.get?.('tidus')); return c ? { hp: c.hp, maxHp: c.stats.maxHp, baseHp: c.stats.hp, str: c.stats.str } : Object.keys(s ?? {}); });
log('battle tidus', JSON.stringify(t));
await shot(page, `p9-${tag}-battle`);
await browser.close();
log(logs.filter((l) => !l.includes('studio background')).join('\n'));
