// r39-judg J: Swordplay zone and sweep per tier, by real keys.
// Setup hook (labelled, as r38-bushido's check): gauge 100 and every Swordplay unlocked for Tidus.
// Everything else is a real key press: the command menu, the Overdrive list, the target, the Enter in the gold zone.
import { launch, ready, until, phase, writeJson, BASE, SCRATCH } from './lib.mjs';
import { readMinigame } from 'file:///D:/pyrefly-r39-judg/critic/runner/lib/route-minigame.mjs';
import { playMinigame } from 'file:///D:/pyrefly-r39-judg/critic/runner/lib/route-minigame.mjs';
import { readRows } from 'file:///D:/pyrefly-r39-judg/critic/runner/lib/route-ui.mjs';

const TAG = process.env.TAG ?? 'before';
const OUT = process.env.OUT ?? `${SCRATCH}/swordplay-${TAG}`;
const WANT = (process.env.WANT ?? 'Spiral Cut,Slice & Dice,Energy Rain,Blitz Ace').split(',');
const CHAPTER = process.env.CHAPTER ?? 'yunalesca';
const url = `${BASE}?coach=off`;

const { browser, page, errors } = await launch({ width: 1600, height: 900 });
const log = [];
const note = (...a) => { const s = a.join(' '); console.log(s); log.push(s); };
const input = { press: (k) => page.keyboard.press(k) };

await ready(page, url);
await page.evaluate((id) => { const P = window.__pyrefly; P.setMuted(true); P.markCoachSeen?.(); P.setSeed(1); void P.gotoChapter(id, { skipCutscenes: true }); }, CHAPTER);

const want = [...WANT];
const plays = [];
let turns = 0;
while (want.length && turns < 80) {
  turns++;
  const p = await until(page, () => phase(page), (v) => v.startsWith('command:'), 60000, 'a command menu').catch(async (e) => {
    const st = await page.evaluate(() => ({ screen: window.__pyrefly.screen(), outcome: window.__pyrefly.battleState()?.outcome ?? null, phase: window.__pyrefly.battle()?.presenter?.snapshot().phase ?? null }));
    note('STUCK', JSON.stringify(st));
    await page.screenshot({ path: `${OUT}/stuck.png` });
    throw e;
  });
  await page.waitForTimeout(500);
  const actor = p.split(':')[1];
  await page.evaluate(() => {
    const all = window.__pyrefly.battleState().combatants;
    const c = all['tidus'];
    if (!c?.overdrive) return;
    c.overdrive.gauge = 100;
    c.overdrive.unlockedOverdriveIds = ['spiral-cut', 'slice-and-dice', 'energy-rain', 'blitz-ace'];
    // keep the fight going between plays (labelled hook): the enemies are topped up to full HP
    for (const e of Object.values(all)) if (e.stats?.hp) e.hp = Math.max(e.hp, e.stats.hp); // enemies and party both at full HP, so the fight outlasts four plays
  });
  const choose = async (re) => {
    for (let i = 0; i < 16; i++) {
      const rows = await readRows(page);
      const sel = rows.find((r) => r.sel);
      if (sel && re.test(sel.label)) return sel.label;
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(140);
    }
    throw new Error('row not found ' + re);
  };
  if (actor === 'tidus' && turns > 1) {
    const name = want[0];
    await page.waitForTimeout(300);
    await choose(/overdrive/i);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const nameRe = new RegExp('^' + name.replace(/[&]/g, '.'), 'i');
    if (!(await readMinigame(page)).up) {
      await choose(nameRe);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      if (!(await readMinigame(page)).up) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
    }
    await until(page, () => readMinigame(page), (m) => m.up, 20000, 'the overlay');
    const m0 = await readMinigame(page);
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '-');
    // the geometry the player sees: the gold zone's start and width (percent of the bar), the bar's pixels, the marker's speed
    const geom = await page.evaluate(async () => {
      const bar = document.querySelector('.ffx-mg [data-role="bar"]');
      const cur = document.querySelector('.ffx-mg [data-role="cursor"]');
      const zone = bar.querySelector('.ig-minigame__zone');
      const out = {
        zoneStartPct: parseFloat(bar.style.getPropertyValue('--ig-zone-start')),
        zoneWidthPct: parseFloat(bar.style.getPropertyValue('--ig-zone-width')),
        barPx: bar.getBoundingClientRect().width,
        zonePx: zone.getBoundingClientRect().width,
        samples: [],
      };
      const t0 = performance.now();
      while (performance.now() - t0 < 320) { out.samples.push([performance.now(), parseFloat(cur.style.left) || 0]); await new Promise((r) => requestAnimationFrame(() => r())); }
      return out;
    });
    // speed: percent of the bar per second over the longest monotonic stretch (the bar is a ping-pong; a full crossing is travelMs)
    let best = null; let run = []; let dir = 0;
    const flush = () => { if (run.length > 3 && (!best || run.length > best.length)) best = run; run = []; dir = 0; };
    for (const smp of geom.samples) {
      if (run.length) {
        const d = Math.sign(smp[1] - run[run.length - 1][1]);
        if (d !== 0 && dir !== 0 && d !== dir) { const keep = run[run.length - 1]; flush(); run = [keep]; }
        if (d !== 0) dir = d;
      }
      run.push(smp);
    }
    flush();
    const pctPerSec = best ? Math.abs(best[best.length - 1][1] - best[0][1]) / ((best[best.length - 1][0] - best[0][0]) / 1000) : null;
    geom.sweepMs = pctPerSec ? Math.round(100 / pctPerSec * 1000) : null;
    geom.windowMs = geom.sweepMs ? Math.round(geom.sweepMs * geom.zoneWidthPct / 100) : null;
    delete geom.samples;
    note(`OVERLAY ${name}: title=${m0.title} zone ${geom.zoneStartPct}% + ${geom.zoneWidthPct}% (${geom.zonePx.toFixed(1)} of ${geom.barPx.toFixed(1)} px) sweep ~${geom.sweepMs} ms window ~${geom.windowMs} ms timer-ring=${m0.timer}`);
    const box = await page.evaluate(() => { const r = document.querySelector('.ffx-mg.ig-minigame').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    await page.screenshot({ path: `${OUT}/${slug}-full.png` });
    await page.screenshot({ path: `${OUT}/${slug}-overlay.png`, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 1600 - Math.max(0, box.x)), height: Math.min(box.height, 900 - Math.max(0, box.y)) } });
    const rec = {};
    const played = await playMinigame({ page, input, rec, turn: turns, shot: async () => {}, leadMs: Number(process.env.LEAD ?? 18) });
    note('PLAYED', name, JSON.stringify({ attempts: played?.attempts?.length, pressLog: played?.pressLog, engine: played?.engine }));
    plays.push({ name, overlay: m0, geom, played });
    want.shift();
    await page.waitForTimeout(1500);
  } else {
    await choose(/^attack/i);
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await until(page, () => phase(page), (v) => !v.startsWith('command:'), 20000, 'the attack leaves the menu');
  }
  const over = await page.evaluate(() => (window.__pyrefly.battleState()?.outcome ?? null));
  if (over) { note('battle ended', over); break; }
}
writeJson(`${OUT}/run.json`, { tag: TAG, url, plays, errors, log });
note('console errors:', JSON.stringify(errors));
await browser.close();
