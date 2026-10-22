/**
 * **The motion recording** (the conference-demo motion program, 2026-10-22; both games, shared plumbing): one scripted session of the REAL battle, from a party member's own point of view, with every frame kept
 * and a timeline of what happened when, so the clips (`tools/rig/lane/party/clips.py`) can be cut from it: the actor idling while another member has the menu, its menu opening (the READY pose), its basic
 * ATTACK from the menu to the end of the action, an ITEM, a skill (CAST), and the VICTORY pose when the last enemy falls. Real key presses everywhere (the menu is navigated by the row labels in the DOM);
 * the other members DEFEND (Q) on their turns; the clock is the page's own, stepped 60 Hz. The hit and KO clips come from the `hurtko` mode (its ring is the same frame folder shape).
 *
 *   --mode motion  [--rig on|off]  (via record.mjs: `--modes motion --off`)
 *
 * The registry entry's `motion` says what to press: `{ "turns": [ { "name": "attack", "rows": ["attack"] }, { "name": "item", "rows": ["item|use", "*"] }, { "name": "cast", "rows": ["skill|special|ability|magic|spell", "*"] } ],
 * "targets": 1 }`: each `rows` entry is a case-insensitive regex for the row to choose (`*`: whatever the cursor is on), then Enter; `targets` Enters after the rows confirm the target.
 * Writes `frames/f<n>.jpg` (every frame from the first menu), `timeline.json` ({marks: [{n, name, ...}], rects: [{n, x, y, w, h}], events}) and `window-log.json`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prepare } from './play-modes.mjs';

const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 1));

/** In the page: the labels of the visible command rows and which one the cursor is on (`.ig-cmd`, FFX and FFX-2 stacks alike), or null when no menu is up. */
const menuRows = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ig-cmd')].filter((el) => el.offsetParent !== null);
  if (!rows.length) return null;
  const label = (el) => (el.querySelector('.ffx-cmd__label, .ig-cmd__label, [class*="label"]')?.textContent ?? el.textContent ?? '').trim();
  return { rows: rows.map(label), selected: rows.findIndex((el) => el.classList.contains('ig-cmd--selected')) };
});

export async function motion(g, spec, o) {
  if (!spec.motion?.turns?.length) throw new Error(`lane: ${o.subject} has no \`motion\` script in lane-subjects.json`);
  const { st, poseInfo, meta } = await prepare(g, spec, o);
  const { input, page } = g;
  const who = spec.actor;
  const marks = [];
  const rects = [];
  const mark = (name, extra = {}) => { marks.push({ n: st.frame, name, ...extra }); g.log(`mark ${name} at frame ${st.frame}`); };
  const rectNow = () => page.evaluate((id) => { try { const r = window.__pyrefly.battle().stage.projectRect(id); return r ? { x: r.x, y: r.y, w: r.w, h: r.h } : null; } catch { return null; } }, who);
  const step = async (n = 1) => { for (let i = 0; i < n; i++) { await st.step(); if (st.frame % 2 === 0) { const r = await rectNow(); if (r) rects.push({ n: st.frame - 1, ...r }); } } };
  const playing = () => page.evaluate(() => Boolean(window.__pyrefly.battle()?.battlePresenter?.playing));
  const idleMenu = async () => (await g.awaitingMenu()) && !(await playing());
  const waitMenu = async (max = 4000) => { for (let i = 0; i < max; i++) { if (await idleMenu()) return true; if (i % 200 === 199 && (await g.scr()) !== 'battle') return false; await step(); } return false; };
  const actionEvents = () => page.evaluate(() => window.__pyrefly.battleLog().map((e) => ({ type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, abilityId: e.abilityId ?? null })));

  const finish = async () => {
    try { await page.clock.resume(); } catch { /* done */ }
    const events = await actionEvents().catch(() => []);
    writeJson(path.join(o.out, 'timeline.json'), { actor: who, rig: o.rig, marks, rects, events, errors });
    writeJson(path.join(o.out, 'window-log.json'), { ...meta, mode: 'motion', frames: st.frame, marks });
    writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
    g.log('motion run done:', st.frame, 'frames,', marks.length, 'marks, errors', errors.length, '; console errors', g.consoleErrors.length);
  };
  const errors = [];
  try {
  // the actor's idle: whoever has the menu first, if it is not the actor, the actor stands in its idle for a while
  await step(30);
  if ((await g.curActor()) !== who) { mark('idle-start'); await step(240); mark('idle-end'); }

  for (const turn of spec.motion.turns) {
   try {
    // other members defend until the actor has the command menu
    for (let k = 0; k < 12 && (await g.curActor()) !== who; k++) {
      if (!(await waitMenu())) throw new Error('the battle ended before the actor got a turn');
      if ((await g.curActor()) === who) break;
      for (const k of spec.motion.others ?? ['KeyQ']) { await input.press(k); await step(14); } // the other members: DEFEND (FFX), or a plain attack (FFX-2 has no defend row)
      await step(20);
      for (let i = 0; i < 3000 && !(await idleMenu()); i++) await step();
      await step(20);
    }
    if ((await g.curActor()) !== who) throw new Error(`${who} never got a turn for ${turn.name}`);
    mark(`${turn.name}-menu`);
    await step(60); // the menu up: the READY pose
    const logBefore = (await actionEvents()).length;
    for (const rx of turn.rows) {
      if (rx !== '*') {
        let hit = false;
        for (let k = 0; k < 16 && !hit; k++) {
          const m = await menuRows(page);
          if (!m) { await step(6); continue; }
          const want = m.rows.findIndex((r) => new RegExp(rx, 'i').test(r));
          if (want < 0) throw new Error(`no row matching /${rx}/ among ${JSON.stringify(m.rows)}`);
          if (want === m.selected) { hit = true; break; }
          await input.press(want > m.selected ? 'ArrowDown' : 'ArrowUp');
          await step(8);
        }
        if (!hit) throw new Error(`could not put the cursor on /${rx}/`);
      }
      await input.press('Enter');
      await step(14);
    }
    for (let t = 0; t < (spec.motion.targets ?? 1); t++) { await input.press('Enter'); await step(14); }
    mark(`${turn.name}-go`);
    let ended = -1;
    for (let i = 0; i < 2400 && ended < 0; i++) {
      await step();
      if (i % 6 === 5) {
        const ev = (await actionEvents()).slice(logBefore);
        if (ev.some((e) => e.type === 'action-end') && !(await playing())) ended = st.frame;
      }
    }
    if (ended < 0) throw new Error(`the ${turn.name} never finished playing`);
    await step(70);
    mark(`${turn.name}-end`);
   } catch (e) { errors.push({ turn: turn.name, at: st.frame, error: String(e).slice(0, 300) }); g.log('turn failed', turn.name, String(e).slice(0, 200)); const m = await menuRows(page).catch(() => null); if (m) { await input.press('Escape'); await step(10); await input.press('Escape'); await step(10); } }
  }

  if (spec.motion.victory !== false) {
    // the last blow: every enemy to 1 HP, the strongest plain strategy to finish at normal speed, frames kept to the victory pose and past it
    await page.evaluate((id) => {
      const s = window.__pyrefly.battleState();
      const list = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants);
      for (const c of list) if (c.side === 'enemy' || c.team === 'enemy' || c.isEnemy) c.hp = 1;
      window.__pyrefly.autoBattle('intended');
    }, who);
    mark('victory-start');
    let wonAt = -1;
    for (let i = 0; i < 9000; i++) {
      await step();
      if (i % 30 === 29) {
        const p = await poseInfo();
        if (wonAt < 0 && p.pose === 'victory') { wonAt = st.frame; mark('victory-pose'); }
        if (wonAt >= 0 && st.frame - wonAt > 200) break;
        if ((await g.scr()) !== 'battle') { mark('battle-left'); break; }
      }
    }
    mark('victory-end');
  }
  } catch (e) { errors.push({ at: st.frame, error: String(e).slice(0, 300) }); g.log('motion run failed', String(e).slice(0, 300)); } finally { await finish(); }
}

/**
 * `menuprobe`: what the command menu of each member looks like (top rows, and the rows behind each group), so a `motion` script can name its rows. Reaches the first menu, then for each of the first turns writes the rows
 * (and, for every row, what Enter opens, backed out with Escape), has the member DEFEND (Q) and goes on. Writes `menus.json`. No frames, no rig involved (use --rig off).
 */
export async function menuprobe(g, spec, o) {
  const { st } = await prepare(g, spec, { ...o, shoot: false });
  const { input, page } = g;
  st.recording = false;
  const idleMenu = async () => (await g.awaitingMenu()) && !(await page.evaluate(() => Boolean(window.__pyrefly.battle()?.battlePresenter?.playing)));
  const out = [];
  for (let turn = 0; turn < 7; turn++) {
    for (let i = 0; i < 3000 && !(await idleMenu()); i++) await st.step(false);
    await st.steps(30, false);
    const who = await g.curActor();
    const top = await menuRows(page);
    const rec = { turn, who, top, groups: {} };
    if (top) {
      for (let r = 0; r < top.rows.length; r++) {
        const m = await menuRows(page);
        const sel = m?.selected ?? 0;
        const press = r - sel;
        for (let k = 0; k < Math.abs(press); k++) { await input.press(press > 0 ? 'ArrowDown' : 'ArrowUp'); await st.steps(6, false); }
        await input.press('Enter');
        await st.steps(16, false);
        const sub = await menuRows(page);
        const sameAsTop = sub && JSON.stringify(sub.rows) === JSON.stringify(top.rows);
        rec.groups[top.rows[r]] = sameAsTop ? 'target or action (the list did not change)' : sub;
        await input.press('Escape');
        await st.steps(16, false);
        for (let k = 0; k < 3; k++) { const mm = await menuRows(page); if (mm && JSON.stringify(mm.rows) === JSON.stringify(top.rows)) break; await input.press('Escape'); await st.steps(12, false); }
      }
    }
    rec.dom = await page.evaluate(() => [...document.querySelectorAll('[class*="cmd"]')].slice(0, 12).map((e) => e.className));
    out.push(rec);
    g.log('turn', turn, who, JSON.stringify(rec.top));
    for (const k of spec.motion?.others ?? ['KeyQ']) { await input.press(k); await st.steps(14, false); }
    await st.steps(40, false);
    writeJson(path.join(o.out, 'menus.json'), out);
    if ((await g.scr()) !== 'battle') break;
  }
  writeJson(path.join(o.out, 'menus.json'), out);
  await page.clock.resume();
}
