/**
 * The Magus Sisters on the Road to the Farplane (Chapter XI). **FFX-2 only.**
 *
 * **Re-parity AI-FFX2-b (2026-10-10): the three scripts of the game**, `m171` Cindy, `m172` Sandy and `m173` Mindy
 * (`research/re-ffx2-ai-fallen-trema.md` section 3, rows M1 to M7), read in our own words. One script for three bodies, keyed by
 * the sister's id: the FFX-2 setup ignores `EnemyGroupDef.aiScriptId` (plan Review R2), so each sister ships the per-enemy id
 * `magus-sisters`, the Vegnagun Redoubt precedent.
 *
 * ## The handshake (3.1): only Cindy can finish Delta Attack
 *
 * Each sister has her own gauge. Mindy and Sandy each raise a flag when their gauge reaches 100; **Cindy** casts Delta Attack on
 * her first poll in which her own gauge is 100 or more **and** both flags are up. Her cast sets her gauge to 0, drops both flags
 * and raises both sisters' reset flags; at her next poll or reaction, whichever comes first, a sister with her reset flag up
 * sets her gauge to 0 and lowers it, then adds 5 as usual (so Mindy and Sandy show 5, not 0, at their next event). A flag drops
 * for good when its sister falls, so Delta Attack can never fire again after the first kill.
 *
 * ## What raises a gauge (3.4): every result, without a guard
 *
 * +5 at the top of each of her own polls (Cindy: after the Delta test) and +5 for every **result** applied to her
 * ({@link AiScript.onResult}): a girl's strike that lands, a girl's miss, a status or Dispel, a Regen tick that heals her, and
 * every cast **by Cindy on a sister** (the Guard puts +5 on each of the three, herself included; Regen +5 on its target; White
 * Highwind +5 on each), Cindy's own Absorb included (the drain reaches her as a result of its own). The reaction entry has no
 * guard here, so a sister's own doing counts.
 *
 * ## The rows
 *
 * - **Cindy**: Delta Attack (above) -> gauge + 5 and the turn counter + 1; counter >= 8 -> counter 0, Not-So-Mighty Guard on all
 *   the sisters -> else Cindy's, Sandy's and Mindy's HP each below max/4 (integer division, strict; a fallen sister counts as
 *   below) -> White Highwind on all the sisters, certain -> else `random() mod 5`: 0 Absorb (uniform girl), 1 Demi (the party),
 *   2 Regen (uniform living sister, herself included), 3 or 4 Camisade (uniform girl). The counter **starts at 7**, so her first
 *   poll is the Guard.
 * - **Sandy**: reset, + 5, flag, then `random() mod 3`: 0 Razzia, 1 or 2 Attack, each on a uniform girl (Razzia 1/3, Attack 2/3).
 * - **Mindy**: reset, + 5, flag, a uniform girl, then `random() mod 6`: 0 Firaga, 1 Blizzaga, 2 Thundaga, 3 Waterga, 4 or 5 Passado.
 *
 * **Timers** (kept in their current units; for the W4 merge): the Regen the Guard and Cindy's Regen put on a sister carries the
 * row's counter 50 (`data/ffx2/enemies/magus-sisters-abilities.ts`): 50 counts of 1,500 units at 95 a step, 790 steps = 26.4 s,
 * four ticks of Regen (M7). The thinking byte 30 is never read (M8); the only thinking is the 30 steps for every fallen girl.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc } from './fallen-aeons.ts';
import { maxHpDiv, pickGirl, pickUniform, scriptMod } from './script-rolls.ts';

export const SISTER_IDS = ['sandy', 'cindy', 'mindy'] as const;
/** Cindy's cycle length: the Guard comes when her turn counter reaches 8. */
export const CINDY_CYCLE = 8;
/** Cindy's turn counter at the start of the fight (`m171.src:36`): her first poll is the Guard. */
export const CINDY_START_COUNTER = 7;
export const DELTA_DISARMED_FLAG = 'deltaAttackDisarmed';
/** The `script-trigger` name emitted once, the turn the first sister falls. */
export const SISTERS_FIRST_DOWN = 'sisters-first-down';

/** AI memory: the sister's own flag (Mindy's and Sandy's: "my gauge reached 100"), her reset flag, Cindy's turn counter. */
export const FLAG = 'flag';
export const RESET = 'reset';
export const TURN = 'turn';

function sisters(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && (SISTER_IDS as readonly string[]).includes(u.id));
}

function sister(ctx: AiContext, id: (typeof SISTER_IDS)[number]): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.side === 'enemy' && u.id === id);
}

/** A sister's flag is up while she is standing (a fall lowers it for good). */
function flagUp(unit: Ffx2Unit | undefined): boolean {
  return unit !== undefined && unit.alive && mem(unit, FLAG) === 1;
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

const MINDY_SPELLS = ['x2-mindy-firaga', 'x2-mindy-blizzaga', 'x2-mindy-thundaga', 'x2-mindy-waterga'] as const;

/**
 * The steps Sandy and Mindy repeat at the top of every poll and every reaction (`m172.src:84-95,113-124`, `m173.src:84-95,127-138`):
 * a raised reset flag zeroes the gauge and drops, the gauge gains 5, and a gauge of 100 or more raises the sister's flag.
 */
export function gaugeStep(unit: Ffx2Unit): void {
  if (mem(unit, RESET) === 1) {
    setMem(unit, AC, 0);
    setMem(unit, RESET, 0);
  }
  bumpAc(unit, 5);
  if (acOf(unit) >= AC_OVERDRIVE) setMem(unit, FLAG, 1);
}

/** What one result does to a sister (3.4): Cindy's only line is "gauge + 5"; Sandy and Mindy repeat the gauge steps. */
function react(unit: Ffx2Unit): void {
  if (unit.id === 'cindy') bumpAc(unit, 5);
  else gaugeStep(unit);
}

function sandyTurn(ctx: AiContext): Command {
  gaugeStep(ctx.self);
  const id = scriptMod(ctx, 3) === 0 ? 'x2-sandy-razzia' : 'x2-sandy-attack';
  return use(id, pickGirl(ctx));
}

function mindyTurn(ctx: AiContext): Command {
  gaugeStep(ctx.self);
  const target = pickGirl(ctx);
  const roll = scriptMod(ctx, 6);
  const id = roll < 4 ? (MINDY_SPELLS[roll] ?? 'x2-mindy-firaga') : 'x2-mindy-passado';
  return use(id, target);
}

/** Cindy, Sandy and Mindy each below a quarter of their own maximum (integer division, strict); a fallen sister counts as below. */
function allBelowQuarter(ctx: AiContext): boolean {
  return SISTER_IDS.every((id) => {
    const unit = sister(ctx, id);
    return unit === undefined || unit.hp < maxHpDiv(unit, 4);
  });
}

function cindyTurn(ctx: AiContext): Command {
  const self = ctx.self;
  const mindy = sister(ctx, 'mindy');
  const sandy = sister(ctx, 'sandy');
  if (acOf(self) >= AC_OVERDRIVE && flagUp(mindy) && flagUp(sandy)) {
    setMem(self, AC, 0);
    for (const other of [mindy, sandy]) {
      if (other === undefined) continue;
      setMem(other, FLAG, 0);
      setMem(other, RESET, 1);
    }
    return use('x2-magus-delta-attack', []);
  }
  bumpAc(self, 5);
  const turn = mem(self, TURN, CINDY_START_COUNTER) + 1;
  if (turn >= CINDY_CYCLE) {
    setMem(self, TURN, 0);
    return use('x2-cindy-not-so-mighty-guard', []);
  }
  setMem(self, TURN, turn);
  if (allBelowQuarter(ctx)) return use('x2-cindy-white-highwind', []);
  const roll = scriptMod(ctx, 5);
  if (roll === 0) return use('x2-cindy-absorb', pickGirl(ctx));
  if (roll === 1) return use('x2-cindy-demi', []);
  if (roll === 2) {
    const living = ctx.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed).sort((a, b) => a.slot - b.slot);
    const target = pickUniform(ctx, living);
    return use('x2-cindy-regen', target === undefined ? [] : [target.id]);
  }
  return use('x2-cindy-camisade', pickGirl(ctx));
}

export const magusSistersScript: AiScript = {
  id: 'magus-sisters',
  decide(ctx) {
    if (ctx.self.id === 'cindy') return cindyTurn(ctx);
    return ctx.self.id === 'mindy' ? mindyTurn(ctx) : sandyTurn(ctx);
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
    react(ctx.self); // a Regen tick that heals her is a result like any other (3.4)
  },
  onResult(ctx) {
    react(ctx.self); // no guard: every result counts, her own and her allies' included
  },
};
