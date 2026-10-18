/**
 * The engine's units as the battle-end kernel's characters (re-parity RC8, lane X2-K; **FFX-2 only**).
 *
 * `kernel/battle-end.ts` is the game's evaluation (exe 0x0061ef70) over the game's characters: who exists, who is flagged party, the dead byte, the
 * in-battle byte, the status word, HP. This module is the one place the engine's {@link Ffx2Unit}s become those characters and the kernel's result code
 * becomes the engine's outcome. The choices it makes are the engine's, each named so a reader can find them:
 *
 * - **Party slots.** Every unit of the party side is a slot (a build has three). `exists` and `party` are true; the dead byte is `!alive`; the in-battle byte is
 *   `!removed` (an ejected girl is out of the battle and alive: result 3, not a loss); the status word carries Death (bit 0, the `ko` status) and Petrify (bit 1).
 * - **Monsters.** Every unit of the enemy side. **A part is not "present"** (`flags.isPart`): the game requires every present, in-battle, not-dead monster to be
 *   Petrified or gone, and how its scripts take the Leg's Nodes and the Experiment's parts out of that test is not in the sources (FFX2-G10 open question 9, rule 6);
 *   the engine's standing rule is that parts never gate victory (`results.ts`), so they are fed as not present.
 * - **The rewarded-knock-out byte** is passed as set: the evaluation then answers 2 for a win. The note does not say which kills set it (open question 11); 2 and 4 are
 *   both wins, so the choice moves nothing.
 * - **The result byte** (`0xDF84B5`) is the preset the kernel returns unchanged: the committed code once the machine has set it, else 1 when the story's fail
 *   clock has run (`flags.badEnding`, the Vegnagun head's cannon: a defeat, as before).
 * - **Codes onto outcomes.** 1 (the party is gone) and 3 (nobody left in the battle, but a girl alive: an escape or an ejection) are `defeat`, 2 and 4 are `victory`.
 *   Result 3 is **not** turned into `escape`: what the story does with it is unread (G10 open questions 11 and 12, lane XK3), and the engine has ended such a
 *   fight as a defeat since the first build, so the story flow does not move.
 * - **Queued work** (the machine's drain test) is a charge in flight whose owner is not asleep, petrified or Stopped (the game's own exclusion, G06 3.5 and G10 10.2),
 *   a command held for a chain lock, and a suspended timed input; **running work** is a command in its action time.
 */

import type { BattleState } from '../../common/types.ts';
import type { Ffx2Unit } from '../internal.ts';
import { BattleEndCode, evaluateBattleEnd, type EndChar } from '../kernel/battle-end.ts';
import { stopStateOf } from '../atb-engine.ts';
import { Ffx2AtbState } from '../kernel/atb-gauge.ts';

const DEATH = 1;
const PETRIFY = 2;

/** The status word the evaluation reads: bit 0 Death, bit 1 Petrify. */
function statusBits(u: Ffx2Unit): number {
  return (u.statuses['ko'] !== undefined ? DEATH : 0) | (u.statuses['petrify'] !== undefined ? PETRIFY : 0);
}

/** The kernel's characters for the units of a battle, reused call to call (the evaluation runs after every logic step and every action). */
export interface EndBuffers {
  party: EndChar[];
  monsters: EndChar[];
}

/** An empty buffer pair. */
export function newEndBuffers(): EndBuffers {
  return { party: [], monsters: [] };
}

const blank = (): EndChar => ({ exists: true, party: false, dead: false, inBattle: true, status: 0, hp: 0 });

/** Fill `buf` from the units: every party-side unit is a slot; every enemy-side unit is a monster, and a part is not present. */
function fillBuffers(units: readonly Ffx2Unit[], buf: EndBuffers): void {
  let p = 0;
  let m = 0;
  for (const u of units) {
    if (u.side === 'party') {
      const c = buf.party[p] ?? (buf.party[p] = blank());
      c.exists = true;
      c.party = true;
      p += 1;
      load(c, u);
    } else if (u.side === 'enemy') {
      const c = buf.monsters[m] ?? (buf.monsters[m] = blank());
      c.exists = u.flags.isPart !== true;
      c.party = false;
      m += 1;
      load(c, u);
    }
  }
  buf.party.length = p;
  buf.monsters.length = m;
}

/** The fields the evaluation reads: the dead byte is `!alive`, the in-battle byte is `!removed`, the status word carries Death and Petrify, and HP. */
function load(c: EndChar, u: Ffx2Unit): void {
  c.dead = !u.alive;
  c.inBattle = !u.removed;
  c.status = statusBits(u);
  c.hp = u.hp;
}

/**
 * The battle-end evaluation for these units: 0 to keep playing, else the game's result code. `resultByte` is the committed result, once the machine has set it
 * (0 before); the story's fail clock presets a defeat. `buf` is scratch the caller may keep between calls.
 */
export function evaluateEnd(units: readonly Ffx2Unit[], state: BattleState, resultByte = 0, buf: EndBuffers = newEndBuffers()): number {
  fillBuffers(units, buf);
  const preset = resultByte !== 0 ? resultByte : state.flags['badEnding'] === true ? BattleEndCode.PartyGone : 0;
  return evaluateBattleEnd({ preset, frozen: 0, killed: 1, clockGate: false }, buf.party, buf.monsters);
}

/** The engine's outcome for a result code: `null` while it is 0. See the header for why 3 is a defeat. */
export function outcomeOfEnd(code: number): 'victory' | 'defeat' | null {
  if (code === 0) return null;
  return code === BattleEndCode.WonRewarded || code === BattleEndCode.Won ? 'victory' : 'defeat';
}

/** Does this unit's queue count for the drain test? The game leaves out a character that is asleep, petrified or Stopped. */
function countsAsQueued(u: Ffx2Unit): boolean {
  return stopStateOf(u) === 0;
}

/**
 * Queued commands (exe 0x0062c390): casts on the purple bar whose owner is not asleep, petrified or Stopped, plus a command held for a chain lock and a
 * suspended timed input (both are confirmed commands the engine keeps outside the units).
 */
export function queuedWork(units: readonly Ffx2Unit[], held: boolean, awaiting: boolean): number {
  let n = held ? 1 : 0;
  if (awaiting) n += 1;
  for (const u of units) if (u.atb.charging !== null && countsAsQueued(u)) n += 1;
  return n;
}

/** Running work (exe 0x00644cc0): a command in its action time (the E4 estimate, `action-time.ts`; off unless a formation sets it). An idle wait is not a command. */
export function runningWork(units: readonly Ffx2Unit[]): number {
  let n = 0;
  for (const u of units) {
    if (u.gauge.executing > 0 && u.atb.charging === null && u.gauge.state === Ffx2AtbState.Executing && u.gauge.idleWait !== true) n += 1;
  }
  return n;
}

/** Which side the queued work belongs to, for the window's counters. */
export function inFlightSides(units: readonly Ffx2Unit[]): { party: number; enemy: number } {
  const out = { party: 0, enemy: 0 };
  for (const u of units) {
    if (u.atb.charging === null || !countsAsQueued(u)) continue;
    if (u.side === 'party') out.party += 1;
    else out.enemy += 1;
  }
  return out;
}
