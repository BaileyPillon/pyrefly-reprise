// A WHOLE FIGHT for a stepped capture: the stretch the jolt probe counts (motion-fluidity pass, lane L5; both games, tooling). PORTED from the curves lane's rec.mjs. Split out of fight.mjs (review round 2) so the
// jolt tool's identity stamp does not move when the clip factory's moment (fight.mjs, ab-pure.mjs) is edited: a jolt comparison is refused across tool ids, and a replicate set must keep one.
//
// Reads the game only through the debug API's reads (the menu flag, the screen, the log length) and presses keys the way a player does. The one write to the game's state is hit points: the fight keeps the
// party up (every 2 s of virtual time a party member under 60 percent HP is set back to full through `battleState()`, the curves lane's own method) so a long stretch of play is not ended by a defeat.
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
