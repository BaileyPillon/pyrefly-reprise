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
  const t0 = Date.now();
  const budgetMs = Number(process.env.MOTION_BUDGET_MS ?? spec.motion.budgetMs ?? 500000); // the hold on the shared recording slot is 10 minutes: stop by ourselves and still write the timeline
  // the party stands whole all through the run (MOTION_HEAL=0 turns it off): the fights are lethal and a KO'd actor has no turns and no victory pose; the hit and KO clips come from `hurtko`
  const healParty = () => page.evaluate(() => { const s = window.__pyrefly.battleState?.(); if (!s) return; const list = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants); for (const c of list) { if (c.side === 'enemy' || c.team === 'enemy' || c.isEnemy) continue; if (c.hp > 0) { c.hp = c.stats?.maxHp ?? c.hp; c.mp = c.stats?.maxMp ?? c.mp; } } }).catch(() => {});
  const heal = process.env.MOTION_HEAL !== '0';
  const POSE_EVERY = Math.max(1, Math.floor(Number(process.env.MOTION_POSE_EVERY ?? 2))); // the actor's pose is read every 2nd frame (rigs-v2 review m7, 2026-10-29: every 10th lost a key held under 10 frames, ready and attack are 5 to 11); MOTION_POSE_EVERY=1 reads every frame, =10 is the earlier rate
  let lastPoseAll = '';
  const watchPose = async () => { const p = await poseInfo().catch(() => null); if (p && p.pose !== lastPoseAll) { lastPoseAll = p.pose; marks.push({ n: st.frame, name: 'pose', pose: p.pose, life: p.life ?? null }); } }; // every change of the actor's pose, so a clip can be cut on the hit, the KO, the victory
  const step = async (n = 1) => { for (let i = 0; i < n; i++) { if (Date.now() - t0 > budgetMs) throw new Error('the time budget of the hold is used'); await st.step(); if (heal && st.frame % 15 === 0) await healParty(); if (st.frame % POSE_EVERY === 0) await watchPose(); if (st.frame % 2 === 0) { const r = await rectNow(); if (r) rects.push({ n: st.frame - 1, ...r }); } } };
  // a member's command menu is up exactly when the presenter has a pending menu (its queue is then idle). NOT `battlePresenter.playing`: that is a Promise field, and Boolean(Promise) is always true.
  const idleMenu = () => g.awaitingMenu();
  const waitMenu = async (max = 2400) => { for (let i = 0; i < max; i++) { if (await idleMenu()) return true; if (i % 200 === 199 && (await g.scr()) !== 'battle') return false; if (i === 600 || i === 1500) { const d = await page.evaluate(() => { const bs = window.__pyrefly.battle(); const pb = window.__pyrefly.snapshotState()?.screenState?.playback; return { screen: window.__pyrefly.snapshotState()?.screen ?? null, playback: pb ? { awaitingMenu: pb.awaitingMenu, played: pb.played } : null, pending: bs?.battlePresenter?.pendingMenu?.actorId ?? null, cur: bs?.battleEngine?.ctx?.rt?.currentActorId ?? null, overlays: [...document.querySelectorAll('[class*="dialog"],[class*="modal"],[class*="subtitle"],[class*="story"]')].filter((e) => e.offsetParent !== null).map((e) => e.className).slice(0, 4) }; }).catch((e) => String(e)); g.log('waitMenu: no menu after', i, 'steps:', JSON.stringify(d)); await input.press('Enter'); await step(6); } await step(); } return false; };
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

  const only = process.env.MOTION_TURNS; // e.g. MOTION_TURNS=none: only the idle and the victory (a short run for a clip the full run lacks); MOTION_TURNS=attack,cast
  const turns = only === undefined ? spec.motion.turns : spec.motion.turns.filter((x) => only.split(',').includes(x.name));
  for (const turn of turns) {
   try {
    // other members defend until the actor has the command menu
    for (let k = 0; k < 12 && (await g.curActor()) !== who; k++) {
      if (!(await waitMenu())) throw new Error('the battle ended before the actor got a turn');
      if ((await g.curActor()) === who) break;
      for (const key of spec.motion.others ?? ['KeyQ']) { await input.press(key); await step(14); } // the other members: DEFEND (FFX), or a plain attack (FFX-2 has no defend row)
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
          if (k === 0) g.log(`menu rows for ${turn.name} /${rx}/:`, JSON.stringify(m.rows), 'cursor', m.selected);
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
    const started = async () => (await actionEvents()).slice(logBefore).some((e) => e.type === 'action-start' && e.actorId === who);
    for (let k = 0; k < 10 && !(await started()); k++) { await input.press('Enter'); await step(14); } // as the cast mode does: confirm until the action has begun
    if (!(await started())) throw new Error(`the ${turn.name} was never confirmed`);
    mark(`${turn.name}-go`);
    const played = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.playback?.played ?? 0);
    const playedEnd = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.playback?.lastEvents ?? []).some((e) => (e.type ?? e) === 'action-end'));
    const playedBefore = await played();
    let ended = -1;
    for (let i = 0; i < 2400 && ended < 0; i++) {
      await step();
      if (i % 5 === 4 && (await played()) >= playedBefore + 5 && (await playedEnd())) ended = st.frame;
      // FFX-2 holds the ATB while ANY member's command menu is open (wait=hold), and a charged skill needs the clock: the other members take their turns (plain attack) while the actor's action plays out
      if (ended < 0 && i % 20 === 19 && (await g.awaitingMenu()) && (await g.curActor()) !== who) { for (const key of spec.motion.others ?? ['KeyQ']) { await input.press(key); await step(14); } }
    }
    if (ended < 0) throw new Error(`the ${turn.name} never finished playing`);
    await step(70);
    mark(`${turn.name}-end`);
   } catch (e) { errors.push({ turn: turn.name, at: st.frame, error: String(e).slice(0, 300) }); g.log('turn failed', turn.name, String(e).slice(0, 200)); const m = await menuRows(page).catch(() => null); if (m) { await input.press('Escape'); await step(10); await input.press('Escape'); await step(10); } }
  }

  if (spec.motion.victory !== false) {
    // the last blows: every enemy to 1 HP, then the party's own plain Attack (no summon, no strategy: the camera stays on the party); frames kept to the victory pose and past it
    await page.evaluate(() => {
      const s = window.__pyrefly.battleState();
      const list = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants);
      for (const c of list) {
        if (c.side === 'enemy' || c.team === 'enemy' || c.isEnemy) c.hp = 1;
        else if (c.hp > 0) { c.hp = c.stats?.maxHp ?? c.hp; c.mp = c.stats?.maxMp ?? c.mp; } // the party stands whole until its blows land
      }
    });
    mark('victory-start');
    let wonAt = -1;
    let left = 0;
    for (let i = 0; i < 6000; i++) {
      if (i % 4 === 0 && (await g.awaitingMenu())) {
        try {
          if ((await g.curActor()) === who) {
            for (const rx of ['^attack']) {
              for (let k = 0; k < 16; k++) {
                const m = await menuRows(page);
                if (!m) { await step(6); continue; }
                const want = m.rows.findIndex((r) => new RegExp(rx, 'i').test(r));
                if (want < 0 || want === m.selected) break;
                await input.press(want > m.selected ? 'ArrowDown' : 'ArrowUp');
                await step(8);
              }
              await input.press('Enter'); await step(14);
            }
            for (let tt = 0; tt < (spec.motion.targets ?? 1); tt++) { await input.press('Enter'); await step(14); }
          } else {
            for (const key of spec.motion.others ?? ['KeyQ']) { await input.press(key); await step(14); }
          }
          await step(20);
        } catch (e) { errors.push({ turn: 'victory', at: st.frame, error: String(e).slice(0, 200) }); }
      }
      await step();
      if (i % 10 === 9) {
        const p = await poseInfo().catch(() => ({ pose: null }));
        if (wonAt < 0 && /victory/i.test(String(p.pose))) { wonAt = st.frame; mark('victory-pose'); }
        if (wonAt >= 0 && st.frame - wonAt > 200) break;
        if (!left && (await g.scr()) !== 'battle') { left = st.frame; mark('battle-left'); }
        if (left && st.frame - left > 300) break; // the victory pose may play under the results screen: keep the frames for 5 s after the screen changed
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
  const idleMenu = () => g.awaitingMenu(); // the pending menu itself (see `motion`)
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
