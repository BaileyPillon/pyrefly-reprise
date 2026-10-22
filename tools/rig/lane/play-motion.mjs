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

  // the actor's idle: whoever has the menu first, if it is not the actor, the actor stands in its idle for a while
  await step(30);
  if ((await g.curActor()) !== who) { mark('idle-start'); await step(240); mark('idle-end'); }

  for (const turn of spec.motion.turns) {
    // other members defend until the actor has the command menu
    for (let k = 0; k < 12 && (await g.curActor()) !== who; k++) {
      if (!(await waitMenu())) throw new Error('the battle ended before the actor got a turn');
      if ((await g.curActor()) === who) break;
      await input.press('KeyQ');
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
  await page.clock.resume();
  const events = await actionEvents();
  writeJson(path.join(o.out, 'timeline.json'), { actor: who, rig: o.rig, marks, rects, events });
  writeJson(path.join(o.out, 'window-log.json'), { ...meta, mode: 'motion', frames: st.frame, marks });
  writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
  g.log('motion run done:', st.frame, 'frames,', marks.length, 'marks; console errors', g.consoleErrors.length);
}
