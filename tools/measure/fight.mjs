// Scripted play for a stepped capture: ONE MOMENT (the attack the Hz matrix compares, and every kind of moment a clip card films; the whole fight the jolt probe counts is in fight-whole.mjs), by
// real key presses on the virtual clock (motion-fluidity pass, lane L5; both games, tooling). PORTED from the curves lane's rec.mjs, and widened after review M5 (a first version could film only "the first
// command and the first target, then play to the next menu").
//
// Both read the game only through the debug API's reads (the menu flag, the screen, the log length) and press keys the way a player does. The one write to the game's state is hit points: the fight keeps the
// party up (every 2 s of virtual time a party member under 60 percent HP is set back to full through `battleState()`, the curves lane's own method) so a long stretch of play is not ended by a defeat, and a
// card's `setup` can set a figure's hit points before the play starts (tools/measure/setup.mjs); both are recorded in the result.
import { findBeatFrame, findEvent, isActing } from '../../critic/runner/lib/ab-pure.mjs';
import { recordTick } from './channels.mjs';
import { healParty } from './fight-whole.mjs';

export { healParty, playFight } from './fight-whole.mjs'; // the whole-fight play lives in its own file (the jolt tool's identity)

const keyOf = (k) => (typeof k === 'string' ? { key: k } : k);

/**
 * One MOMENT from the first command menu: pre-roll, optionally leave the menu open (`holdMenuMs`: the ATB bars filling under an open menu, a stance held), then the keys (a command, a target, a spell's
 * submenu: each `"Enter"` or `{ key, afterMs }`, the wait after that key; `gapMs` between the others), then play on until the action is over (the next menu is awaiting), or for `turns` actions (the keys
 * pressed again at each command menu), or, with `until` ({ event, who, ordinal, afterMs } or { beat: { actor, kind, ... }, afterMs }), until that battle-log event or that VISUAL beat (a figure's life state
 * becoming 'down': the log says a knock-out in the instant of the key press, the picture a second or two later) has happened (the last blow of a boss, a knock-out, a summon) plus `afterMs`; at
 * most `seconds` of virtual time. When the screen leaves the battle after the event was seen (the victory), that still ends the play by the event. `keepAlive` heals the party as the whole-fight play does (a long run to an event). The default is exactly the first version's play: the first command, the first target, to the next menu.
 * @returns {{t0: number, confirmedAt: number, ended: 'menu'|'timeout'|'left-battle'|'event', frames: number, turns: number, untilAt: number|null, pressAt: number[], retried: number, pressedTurns: number}} `t0` is the virtual ms of the moment's start (the last key of the first turn)
 */
export async function playOneAttack({ g, stepper, acc, hz, keys = ['Enter', 'Enter'], seconds = 14, preRollMs = 500, gapMs = 250, tailMs = 400, onFrame = null, holdMenuMs = 0, turns = 1, until = null, keepAlive = false, maxTurns = 12 }) {
  const ticksFor = (ms) => Math.max(1, Math.round((ms / 1000) * hz));
  const tick = async () => { const st = await recordTick(stepper, g.page, acc); if (onFrame && st) await onFrame(st, acc.frames.length - 1); return st; }; // onFrame: a screenshot of the frame just drawn
  const wait = async (ms) => { for (let i = 0; i < ticksFor(ms); i++) await tick(); };
  acc.rec = true;
  await wait(preRollMs);
  if (holdMenuMs > 0) await wait(holdMenuMs);
  let t0 = stepper.ms, pressed = 0;
  const pressAt = []; // the virtual ms each turn's LAST key was pressed: the window of a card of `turns` turns ends after the action that turn started, not after whatever played first
  const pressKeys = async (again) => {
    const list = keys.map(keyOf);
    for (const [k, spec] of list.entries()) {
      await g.press(spec.key);
      if (pressed === 0) t0 = stepper.ms; // the last key of the first turn is the moment's start
      if (k === list.length - 1) { if (again) pressAt[pressAt.length - 1] = stepper.ms; else pressAt.push(stepper.ms); }
      if (spec.afterMs !== undefined) await wait(spec.afterMs);
      else if (k < list.length - 1) await wait(gapMs);
    }
  };
  const pressTurn = async () => { await pressKeys(false); pressed++; };
  await pressTurn();
  const t1 = stepper.ms;
  let retried = 0, acted = 0; // `acted`: the turns whose keys STARTED an action (a turn whose keys were ignored is pressed, not played)
  let turnAt = t1, lastHeal = t1, ended = 'timeout', sawPlaying = false, untilAt = null, retries = 0;
  while (stepper.ms - t1 < seconds * 1000) {
    const st = await tick();
    if (until && untilAt === null) {
      if (until.beat) { const j = findBeatFrame(acc.frames, until.beat, Math.max(0, acc.frames.findIndex((f) => f.vt >= t0))); if (j >= 0) untilAt = acc.frames[j].vt; }
      else { const ev = findEvent(acc.events, until); if (ev) untilAt = ev.vt; }
    }
    if (!st) { if (until && untilAt !== null && stepper.ms - untilAt >= (until.afterMs ?? 1000)) { ended = 'event'; break; } continue; } // no battle to read (it ended): the play still ends by the event it was waiting for
    if (st.screen !== 'battle') { ended = untilAt !== null ? 'event' : 'left-battle'; break; }
    if (keepAlive && stepper.ms - lastHeal > 2000) { lastHeal = stepper.ms; await healParty(g.page); }
    if (until && untilAt !== null && stepper.ms - untilAt >= (until.afterMs ?? 1000)) { ended = 'event'; break; }
    if (isActing(st)) { if (!sawPlaying) acted++; sawPlaying = true; } // the phase, not `playing`: that stays true while the next menu is open (the first real card)
    if (sawPlaying && st.menu && !isActing(st) && stepper.ms - turnAt > 800) {
      if (pressed < turns || (until && untilAt === null && pressed < maxTurns)) { await wait(preRollMs); await pressTurn(); turnAt = stepper.ms; sawPlaying = false; retries = 0; } // the next command menu, once it has opened (a player cannot press the frame it appears: the first real three-turn card's keys were ignored and it sat 29 s at its second menu): the same keys again
      else if (!until) { ended = 'menu'; break; }
    } else if (!sawPlaying && st.menu && !isActing(st) && stepper.ms - turnAt > 2000 && retries < 2) {
      retries++; await pressKeys(true); turnAt = stepper.ms; // the keys started no action: a player presses again (at most twice a turn; the result says how often)
      retried++;
    }
  }
  await wait(until && ended === 'event' ? 1 : tailMs); // a tail, so the last beat has frames after it
  return { t0, confirmedAt: t1, ended, frames: acc.frames.length, turns: acted, pressedTurns: pressed, untilAt, pressAt, retried };
}

