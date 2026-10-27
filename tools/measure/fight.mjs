// Two scripted pieces of play for a stepped capture: ONE MOMENT (the attack the Hz matrix compares, and every kind of moment a clip card films) and A WHOLE FIGHT (the stretch the jolt probe counts), both by
// real key presses on the virtual clock (motion-fluidity pass, lane L5; both games, tooling). PORTED from the curves lane's rec.mjs, and widened after review M5 (a first version could film only "the first
// command and the first target, then play to the next menu").
//
// Both read the game only through the debug API's reads (the menu flag, the screen, the log length) and press keys the way a player does. The one write to the game's state is hit points: the fight keeps the
// party up (every 2 s of virtual time a party member under 60 percent HP is set back to full through `battleState()`, the curves lane's own method) so a long stretch of play is not ended by a defeat, and a
// card's `setup` can set a figure's hit points before the play starts (tools/measure/setup.mjs); both are recorded in the result.
import { findEvent } from '../../critic/runner/lib/ab-pure.mjs';
import { recordTick } from './channels.mjs';

/** In the page: every living party member under 60 percent HP back to full; returns how many were healed. */
const HEAL = () => {
  const q = window.__pyrefly.battleState();
  const l = Array.isArray(q.combatants) ? q.combatants : Object.values(q.combatants);
  let n = 0;
  for (const c of l) if (c.side === 'party' && c.hp > 0 && c.stats && c.hp < 0.6 * c.stats.maxHp) { c.hp = c.stats.maxHp; n++; }
  return n;
};
export const healParty = (page) => page.evaluate(HEAL);

const keyOf = (k) => (typeof k === 'string' ? { key: k } : k);

/**
 * One MOMENT from the first command menu: pre-roll, optionally leave the menu open (`holdMenuMs`: the ATB bars filling under an open menu, a stance held), then the keys (a command, a target, a spell's
 * submenu: each `"Enter"` or `{ key, afterMs }`, the wait after that key; `gapMs` between the others), then play on until the action is over (the next menu is awaiting), or for `turns` actions (the keys
 * pressed again at each command menu), or, with `until` ({ event, who, ordinal, afterMs }), until that battle-log event has happened (the last blow of a boss, a knock-out, a summon) plus `afterMs`; at
 * most `seconds` of virtual time. `keepAlive` heals the party as the whole-fight play does (a long run to an event). The default is exactly the first version's play: the first command, the first target, to the next menu.
 * @returns {{t0: number, confirmedAt: number, ended: 'menu'|'timeout'|'left-battle'|'event', frames: number, turns: number, untilAt: number|null}} `t0` is the virtual ms of the moment's start (the last key of the first turn)
 */
export async function playOneAttack({ g, stepper, acc, hz, keys = ['Enter', 'Enter'], seconds = 14, preRollMs = 500, gapMs = 250, tailMs = 400, onFrame = null, holdMenuMs = 0, turns = 1, until = null, keepAlive = false, maxTurns = 12 }) {
  const ticksFor = (ms) => Math.max(1, Math.round((ms / 1000) * hz));
  const tick = async () => { const st = await recordTick(stepper, g.page, acc); if (onFrame && st) await onFrame(st, acc.frames.length - 1); return st; }; // onFrame: a screenshot of the frame just drawn
  const wait = async (ms) => { for (let i = 0; i < ticksFor(ms); i++) await tick(); };
  acc.rec = true;
  await wait(preRollMs);
  if (holdMenuMs > 0) await wait(holdMenuMs);
  let t0 = stepper.ms, pressed = 0;
  const pressTurn = async () => {
    const list = keys.map(keyOf);
    for (const [k, spec] of list.entries()) {
      await g.press(spec.key);
      if (pressed === 0) t0 = stepper.ms; // the last key of the first turn is the moment's start
      if (spec.afterMs !== undefined) await wait(spec.afterMs);
      else if (k < list.length - 1) await wait(gapMs);
    }
    pressed++;
  };
  await pressTurn();
  const t1 = stepper.ms;
  let turnAt = t1, lastHeal = t1, ended = 'timeout', sawPlaying = false, untilAt = null;
  while (stepper.ms - t1 < seconds * 1000) {
    const st = await tick();
    if (!st) continue;
    if (st.screen !== 'battle') { ended = 'left-battle'; break; }
    if (keepAlive && stepper.ms - lastHeal > 2000) { lastHeal = stepper.ms; await healParty(g.page); }
    if (until) {
      if (untilAt === null) { const ev = findEvent(acc.events, until); if (ev) untilAt = ev.vt; }
      if (untilAt !== null && stepper.ms - untilAt >= (until.afterMs ?? 1000)) { ended = 'event'; break; }
    }
    if (st.playing) sawPlaying = true;
    if (sawPlaying && st.menu && !st.playing && stepper.ms - turnAt > 800) {
      if (pressed < turns || (until && untilAt === null && pressed < maxTurns)) { await pressTurn(); turnAt = stepper.ms; sawPlaying = false; } // the next command menu: the same keys again
      else if (!until) { ended = 'menu'; break; }
    }
  }
  await wait(until && ended === 'event' ? 1 : tailMs); // a tail, so the last beat has frames after it
  return { t0, confirmedAt: t1, ended, frames: acc.frames.length, turns: pressed, untilAt };
}

/**
 * A fight for `seconds` of virtual time, the player's turns taken by the first command and the first target.
 * @returns {{acted: number, healed: number, ended: 'time'|'left-battle', marks: Array<{f: number, what: string}>}}
 */
export async function playFight({ g, stepper, acc, hz, seconds = 45 }) {
  const marks = [];
  const mark = (what) => marks.push({ f: acc.frames.length, what });
  acc.rec = true;
  mark('fight start');
  let acted = 0, healed = 0, lastAct = -1e9, phase = 0, phaseAt = 0, ended = 'time';
  const total = Math.round(seconds * hz);
  for (let i = 0; i < total; i++) {
    const st = await recordTick(stepper, g.page, acc);
    if (i % Math.round(2 * hz) === 0) healed += (await healParty(g.page)) ?? 0;
    if (st && st.screen === 'cutscene') { if (i % 60 === 0) await g.press('Enter'); continue; }
    if (!st || st.screen !== 'battle') { ended = 'left-battle'; break; }
    if (phase === 0 && st.menu && i - lastAct > 0.6 * hz) { await g.press('Enter'); phase = 1; phaseAt = i; mark(`menu ${st.menuActor}: command`); }
    else if (phase === 1 && i - phaseAt >= 0.2 * hz) { await g.press('Enter'); phase = 2; phaseAt = i; mark(`menu ${st.menuActor}: target`); }
    else if (phase === 2 && i - phaseAt >= 0.5 * hz) { phase = 0; lastAct = i; acted++; }
    else if (phase === 2 && !st.menu && i - phaseAt >= 0.1 * hz) { phase = 0; lastAct = i; acted++; }
  }
  mark(`fight end (acted ${acted})`);
  return { acted, healed, ended, marks };
}
