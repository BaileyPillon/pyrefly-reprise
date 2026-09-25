/**
 * The Magus Sisters on the Road to the Farplane (Chapter XI). **FFX-2 only.**
 *
 * One script for three bodies, keyed by the sister's id: the FFX-2 setup
 * ignores `EnemyGroupDef.aiScriptId` (plan Review R2), so each sister ships the
 * per-enemy id `magus-sisters` — the Vegnagun Redoubt precedent.
 *
 * [ffx2-fallen-aeons §4.2, `[verified: 2 sources — SinirothX and the wiki pages]`]:
 *
 * ```
 * Sandy:  3/4 Normal Attack, 1/4 Razzia
 * Mindy:  1/3 Passado, 1/6 each of Firaga / Blizzaga / Thundaga / Waterga
 * Cindy:  turn 1 Not-So-Mighty Guard; turns 2–8 "Action 1"; then back to turn 1
 *         Action 1: if all three sisters are alive and all are below 1/4 of max HP -> White Highwind
 *                   else 1/4 each Camisade / Absorb / Demi / Regen
 * Each sister's AC += 5 when her turn passes, when she is attacked, and when Regen heals her.
 * Cindy's AC += 5 more when she uses Absorb.
 * When all three sisters are alive and every AC >= 100: all ACs = 0, Delta Attack.
 * ```
 *
 * - **The cycle repeats** (Not-So-Mighty Guard again on turns 9, 17, ...):
 *   SinirothX only; the wiki says turn 1 and turns 2–8 and stops there (plan
 *   Review R1, correction 4). `[SinirothX]`
 * - **The first kill disarms Delta Attack for good** `[verified: 4 sources]`:
 *   the condition needs all three alive, and nothing here revives a sister.
 *   `state.flags.deltaAttackDisarmed` records the moment for the story layer.
 * - **Who casts Delta Attack**: the sister whose turn finds the condition met.
 * - **Which sister Regen goes on**: not in the sources; a random living sister,
 *   herself included. `[estimate]`
 * - "Attacked" follows FA8 (see `./fallen-aeons.ts`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, attackedHooks, bumpAc, randomGirl } from './fallen-aeons.ts';

export const SISTER_IDS = ['sandy', 'cindy', 'mindy'] as const;
/** Cindy's cycle length: 1 guard turn + 7 "Action 1" turns. */
export const CINDY_CYCLE = 8;
export const DELTA_DISARMED_FLAG = 'deltaAttackDisarmed';
/** The `script-trigger` name emitted once, the turn the first sister falls. */
export const SISTERS_FIRST_DOWN = 'sisters-first-down';

function sisters(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && (SISTER_IDS as readonly string[]).includes(u.id));
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

const MINDY_SPELLS = ['x2-mindy-firaga', 'x2-mindy-blizzaga', 'x2-mindy-thundaga', 'x2-mindy-waterga'] as const;

function sandyTurn(ctx: AiContext): Command {
  const id = ctx.rng.int(0, 3) < 3 ? 'x2-sandy-attack' : 'x2-sandy-razzia';
  return use(id, randomGirl(ctx));
}

function mindyTurn(ctx: AiContext): Command {
  const roll = ctx.rng.int(0, 5); // sixths
  const id = roll < 2 ? 'x2-mindy-passado' : (MINDY_SPELLS[roll - 2] ?? 'x2-mindy-firaga');
  return use(id, randomGirl(ctx));
}

function cindyTurn(ctx: AiContext, all: Ffx2Unit[]): Command {
  const self = ctx.self;
  const turn = mem(self, 'turn');
  setMem(self, 'turn', turn + 1);
  if (turn % CINDY_CYCLE === 0) return use('x2-cindy-not-so-mighty-guard', []);
  const living = all.filter((s) => s.alive && !s.removed);
  if (living.length === 3 && living.every((s) => s.hp * 4 < s.stats.maxHp)) {
    return use('x2-cindy-white-highwind', []);
  }
  const roll = ctx.rng.int(0, 3);
  if (roll === 0) return use('x2-cindy-camisade', randomGirl(ctx));
  if (roll === 1) {
    bumpAc(self, 5); // "Cindy's AC += 5 more when she uses Absorb"
    return use('x2-cindy-absorb', randomGirl(ctx));
  }
  if (roll === 2) return use('x2-cindy-demi', []);
  return use('x2-cindy-regen', [ctx.rng.pick(living).id]);
}

export const magusSistersScript: AiScript = {
  id: 'magus-sisters',
  decide(ctx) {
    const self = ctx.self;
    const all = sisters(ctx);
    const living = all.filter((s) => s.alive && !s.removed);
    if (living.length === 3 && living.every((s) => acOf(s) >= AC_OVERDRIVE)) {
      for (const s of living) setMem(s, AC, 0);
      return use('x2-magus-delta-attack', []);
    }
    const command =
      self.id === 'cindy' ? cindyTurn(ctx, all) : self.id === 'mindy' ? mindyTurn(ctx) : sandyTurn(ctx);
    bumpAc(self, 5); // "when her turn passes"
    return command;
  },
  onTurnResolved(ctx) {
    if (ctx.flags[DELTA_DISARMED_FLAG] === true) return;
    if (!sisters(ctx).some((s) => !s.alive)) return;
    ctx.flags[DELTA_DISARMED_FLAG] = true;
    // The first sister's fall, for Paine's callout (FA16 a; `src/story/scripts/ffx2-fallen-aeons.ts`):
    // which sister falls first is the player's choice, so no one-combatant story trigger can carry it.
    ctx.emit({ type: 'script-trigger', name: SISTERS_FIRST_DOWN, payload: { who: ctx.self.id } });
  },
  onRegen(ctx) {
    bumpAc(ctx.self, 5); // "and when Regen heals her"
  },
  ...attackedHooks(5),
};
