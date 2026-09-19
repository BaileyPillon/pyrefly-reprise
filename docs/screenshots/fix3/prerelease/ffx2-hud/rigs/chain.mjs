/**
 * Hostile test 2 — what the 1.45x reservation box did to the chip's placement.
 *
 * The builder inflated `.ffx2-chain-chip` to the pop's peak so the solver sees
 * the painted box. That is sound. But it hands `placeSlab` a box 45 % bigger in
 * BOTH axes (2.1x the area), and the natural anchor now dips BELOW the enemy's
 * head by half the reserve — so the enemy itself becomes an obstacle the chip's
 * own anchor collides with, and the solver evicts the chip off its §4.6 anchor
 * ("top-right of the enemy being chained").
 *
 * Measures, at every tier and viewport, in both FFX-2 chapters:
 *  - the placed box vs the §4.6 anchor (is it still top-right of the enemy?)
 *  - painted AND reserved box vs fighters and vs every HUD panel
 *  - the enemy-intent slab AFTER the chain lands, since `intentObstacles()`
 *    now feeds it a 2.1x-area obstacle and its own placement is steered by it
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, bootBattle, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });

const PROBE = (count) => {
  const r = (n) => +Number(n).toFixed(1);
  const hud = window.__pyrefly.battle()?.hud;
  const stage = window.__pyrefly.battle()?.stage;
  const st = window.__pyrefly.battleState();
  const enemy = Object.keys(st.combatants).find((k) => st.combatants[k].side === 'enemy' && st.combatants[k].hp > 0);
  hud?.onEvent({ type: 'chain', targetId: enemy, count, multiplier: 1.75 });
  const chip = document.querySelector('.ffx2-chain-chip');
  if (!chip) return { error: 'no chip' };
  const body = chip.querySelector('.ffx2chain__body');
  if (!body) return { error: 'no .ffx2chain__body' };
  body.style.animationDelay = '-0.09s';
  body.style.animationPlayState = 'paused';
  const painted = body.getBoundingClientRect();
  const reserved = chip.getBoundingClientRect();
  const overlay = chip.parentElement.getBoundingClientRect();

  let head = null;
  let feet = null;
  try {
    head = stage.project(enemy, 'head');
    feet = stage.project(enemy, 'feet');
  } catch {
    /* */
  }

  const box = (b) => ({ left: b.left, right: b.right, top: b.top, bottom: b.bottom });
  const ov = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0.5 && h > 0.5 ? { w: r(w), h: r(h) } : null;
  };

  const fighters = [];
  for (const id of Object.keys(st.combatants)) {
    const c = st.combatants[id];
    if (!c || c.hp <= 0) continue;
    let hd = null;
    let ft = null;
    try {
      hd = stage.project(id, 'head');
      ft = stage.project(id, 'feet');
    } catch {
      continue;
    }
    if (!hd || !ft) continue;
    const hgt = Math.abs(ft.y - hd.y);
    if (hgt <= 0) continue;
    const half = hgt * 0.28;
    fighters.push({ id, box: { left: hd.x - half, right: hd.x + half, top: Math.min(hd.y, ft.y), bottom: Math.max(hd.y, ft.y) } });
  }

  const PANELS = [
    ['intent', '.eint__panel'],
    ['intent-chip', '.eint__toggle'],
    ['advisor', '.mad__card'],
    ['gauges', '.ffx2hud__enemies'],
    ['guide', '.sgd__panel'],
    ['party', '.ffx2hud__party'],
    ['cmd', '.ffx2hud__command'],
    ['wheel', '.ffx2-sphere-wheel'],
  ];
  const panels = [];
  for (const [n, s] of PANELS) {
    const el = document.querySelector(s);
    if (!el) continue;
    const b = el.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) continue;
    panels.push({ n, box: box(b) });
  }

  const hit = (rect) => ({
    fighters: fighters.map((f) => ({ id: f.id, o: ov(rect, f.box) })).filter((x) => x.o),
    panels: panels.map((p) => ({ n: p.n, o: ov(rect, p.box) })).filter((x) => x.o),
  });

  // Motes burst outward from the body's centre by 26 grid px * scale.
  const motes = [...chip.querySelectorAll('.ffx2chain__motes i')].map((m) => {
    m.style.animationDelay = '-0.42s';
    m.style.animationPlayState = 'paused';
    const b = m.getBoundingClientRect();
    return { l: r(b.left), t: r(b.top), rt: r(b.right), bt: r(b.bottom) };
  });
  const moteOut = motes.length
    ? {
        top: r(Math.max(0, reserved.top - Math.min(...motes.map((m) => m.t)))),
        left: r(Math.max(0, reserved.left - Math.min(...motes.map((m) => m.l)))),
        right: r(Math.max(0, Math.max(...motes.map((m) => m.rt)) - reserved.right)),
        bottom: r(Math.max(0, Math.max(...motes.map((m) => m.bt)) - reserved.bottom)),
      }
    : null;

  return {
    count,
    enemy,
    anchor: head ? { x: r(head.x), y: r(head.y) } : null,
    feetY: feet ? r(feet.y) : null,
    reserved: { l: r(reserved.left), t: r(reserved.top), rt: r(reserved.right), bt: r(reserved.bottom), w: r(reserved.width), h: r(reserved.height) },
    painted: { l: r(painted.left), t: r(painted.top), rt: r(painted.right), bt: r(painted.bottom), w: r(painted.width), h: r(painted.height) },
    // §4.6: "top-right of the enemy being chained".
    anchorCheck: head
      ? {
          chipCentreX: r((reserved.left + reserved.right) / 2),
          rightOfEnemy: reserved.left >= head.x - 1,
          aboveEnemy: reserved.bottom <= head.y + 1,
          dx: r(reserved.left - head.x),
          dy: r(reserved.bottom - head.y),
        }
      : null,
    outsideOverlay: {
      top: r(overlay.top - painted.top),
      left: r(overlay.left - painted.left),
      right: r(painted.right - overlay.right),
      bottom: r(painted.bottom - overlay.bottom),
    },
    paintedHits: hit(box(painted)),
    reservedHits: hit(box(reserved)),
    moteOut,
    // The intent slab is placed with the chip as an obstacle — 2.1x the area now.
    intent: (() => {
      const el = document.querySelector('.eint__panel');
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { box: { l: r(b.left), t: r(b.top), w: r(b.width), h: r(b.height) }, hits: hit(box(b)) };
    })(),
  };
};

async function main() {
  const browser = await launch();
  const report = { rows: [], failures: [] };
  const fail = (m) => {
    report.failures.push(m);
    console.log('  FAIL ' + m);
  };

  const VPS = (process.env.VPS ?? '1280x720,1600x900,2000x1000,2560x1440').split(',');
  for (const [chapter, name] of [
    ['ffx2-bahamut', 'ch4'],
    ['ffx2-vegnagun-shuyin', 'ch5'],
  ]) {
    for (const vps of VPS) {
      const [w, h] = vps.split('x').map(Number);
      const { ctx, page } = await newPage(browser, w, h);
      await bootBattle(page, chapter);
      console.log(`== ${name} ${vps}`);
      for (const count of [3, 7, 12, 22]) {
        const r = await page.evaluate(PROBE, count);
        if (r.error) {
          fail(`${name} ${vps} count ${count}: ${r.error}`);
          continue;
        }
        const out = Object.entries(r.outsideOverlay).filter(([, v]) => v > 0.5);
        console.log(
          `  count ${String(count).padStart(2)}: reserved ${r.reserved.w}x${r.reserved.h}@(${r.reserved.l},${r.reserved.t}) painted ${r.painted.w}x${r.painted.h}@(${r.painted.l},${r.painted.t})` +
            ` anchor(${r.anchor?.x},${r.anchor?.y}) dx=${r.anchorCheck?.dx} dy=${r.anchorCheck?.dy} rightOfEnemy=${r.anchorCheck?.rightOfEnemy} aboveEnemy=${r.anchorCheck?.aboveEnemy}` +
            (out.length ? ` OUTSIDE ${JSON.stringify(out)}` : '') +
            (r.paintedHits.fighters.length ? ` PAINTED-ON-FIGHTER ${JSON.stringify(r.paintedHits.fighters)}` : '') +
            (r.paintedHits.panels.length ? ` PAINTED-ON-PANEL ${JSON.stringify(r.paintedHits.panels)}` : '') +
            (r.reservedHits.fighters.length ? ` RESERVED-ON-FIGHTER ${JSON.stringify(r.reservedHits.fighters)}` : '') +
            (r.reservedHits.panels.length ? ` RESERVED-ON-PANEL ${JSON.stringify(r.reservedHits.panels)}` : '') +
            (r.moteOut && Object.values(r.moteOut).some((v) => v > 0.5) ? ` MOTES-OUT ${JSON.stringify(r.moteOut)}` : ''),
        );
        if (out.length) fail(`${name} ${vps} count ${count}: painted outside overlay ${JSON.stringify(out)}`);
        if (r.paintedHits.fighters.length) fail(`${name} ${vps} count ${count}: painted on fighter ${JSON.stringify(r.paintedHits.fighters)}`);
        if (r.paintedHits.panels.length) fail(`${name} ${vps} count ${count}: painted on panel ${JSON.stringify(r.paintedHits.panels)}`);
        if (r.anchorCheck && !(r.anchorCheck.rightOfEnemy && r.anchorCheck.aboveEnemy)) {
          fail(
            `${name} ${vps} count ${count}: chip is NOT top-right of the chained enemy (§4.6) — box left ${r.reserved.l} vs enemy head x ${r.anchor.x} (dx ${r.anchorCheck.dx}), box bottom ${r.reserved.bt} vs head y ${r.anchor.y} (dy ${r.anchorCheck.dy})`,
          );
        }
        if (r.intent?.hits.fighters.length) fail(`${name} ${vps} count ${count}: enemy-intent slab on fighter after the chain ${JSON.stringify(r.intent.hits.fighters)}`);
        report.rows.push({ chapter: name, vp: vps, ...r });
        if (count === 22 || count === 3) {
          await page.screenshot({ path: path.join(OUT, `chain-${name}-${w}x${h}-count${count}.png`), timeout: 180000 });
        }
      }
      await ctx.close();
    }
  }

  fs.writeFileSync(path.join(OUT, 'chain.json'), JSON.stringify(report, null, 1));
  console.log('\n==== ' + (report.failures.length ? `${report.failures.length} FAILURES` : 'chain matrix green') + ' ====');
  for (const m of report.failures) console.log(' - ' + m);
  await browser.close();
}
main();
