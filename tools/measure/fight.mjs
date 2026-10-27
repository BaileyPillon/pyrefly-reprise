// Two scripted pieces of play for a stepped capture: ONE ATTACK (the moment the Hz matrix compares) and A WHOLE FIGHT (the stretch the jolt probe counts), both by real key presses on the virtual clock
// (motion-fluidity pass, lane L5; both games, tooling). PORTED from the curves lane's rec.mjs.
//
// Both read the game only through the debug API's reads (the menu flag, the screen, the log length) and press keys the way a player does. The fight keeps the party up (every 2 s of virtual time a
// party member under 60 percent HP is set back to full through `battleState()`, the curves lane's own method) so a long stretch of play is not ended by a defeat; that is recorded in the result as
// `healed`, and is the only write to the game's state. Menu handling: when a menu is awaiting, press Enter (the command), wait 0.2 s, press Enter (the target): the first command and the first target.
import { recordTick } from './channels.mjs';

/**
 * One attack from the first command menu: pre-roll, the command, the target, then play on until the next menu is awaiting (the action is over) or `seconds` have passed.
 * @returns {{t0: number, confirmedAt: number, ended: 'menu'|'timeout'|'left-battle', frames: number}} `t0` is the virtual ms of the moment's start (the second key press)
 */
export async function playOneAttack({ g, stepper, acc, hz, keys = ['Enter', 'Enter'], seconds = 14, preRollMs = 500, gapMs = 250, tailMs = 400, onFrame = null }) {
  const ticksFor = (ms) => Math.max(1, Math.round((ms / 1000) * hz));
  const tick = async () => { const st = await recordTick(stepper, g.page, acc); if (onFrame && st) await onFrame(st, acc.frames.length - 1); return st; }; // onFrame: a screenshot of the frame just drawn
  acc.rec = true;
  for (let i = 0; i < ticksFor(preRollMs); i++) await tick();
  let t0 = stepper.ms;
  for (const [k, key] of keys.entries()) {
    await g.press(key);
    t0 = stepper.ms; // the last key is the moment's start
    if (k < keys.length - 1) for (let i = 0; i < ticksFor(gapMs); i++) await tick();
  }
  const t1 = stepper.ms;
  let ended = 'timeout';
  let sawPlaying = false;
  while (stepper.ms - t1 < seconds * 1000) {
    const st = await tick();
    if (!st) continue;
    if (st.screen !== 'battle') { ended = 'left-battle'; break; }
    if (st.playing) sawPlaying = true;
    if (sawPlaying && st.menu && !st.playing && stepper.ms - t1 > 800) { ended = 'menu'; break; }
  }
  for (let i = 0; i < ticksFor(tailMs); i++) await tick(); // a tail, so the last beat has frames after it
  return { t0, confirmedAt: t1, ended, frames: acc.frames.length };
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
    if (i % Math.round(2 * hz) === 0) healed += (await g.page.evaluate(() => { const q = window.__pyrefly.battleState(); const l = Array.isArray(q.combatants) ? q.combatants : Object.values(q.combatants); let n = 0; for (const c of l) if (c.side === 'party' && c.hp > 0 && c.stats && c.hp < 0.6 * c.stats.maxHp) { c.hp = c.stats.maxHp; n++; } return n; })) ?? 0;
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
