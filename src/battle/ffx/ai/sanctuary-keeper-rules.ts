/**
 * **The Sanctuary Keeper's rules, as numbers and ids** (FFX only; the hidden Sanctuary Keeper chapter, number 39; `research/re-ffx-sanctuary-keeper.md`, "RE n"). The script is `./sanctuary-keeper.ts`; this file holds what it
 * reads, so each number has one home and one source. **Every number is the note's** (rule 6), read from the game's own file (`m128`) and run in the earlier lanes' Atel interpreter ("[bytes] [run]" there): nothing here is
 * an estimate of ours. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and `tests/unit/chapters/sanctuary-keeper-data.test.ts` pins the copies equal `data/ffx/sanctuary-keeper-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | The cycle | six turns, no randomness in the order: Photon Wings on the front line, Attack on the highest HP, Attack on a random one, Mana Breath on a random one, then two support turns | 4.2 |
 * | The support move | Curaga on itself by default; **Regen** (no Regen and HP under a quarter), **Esuna** (Poison or Darkness on it), **Protect** (Armor Break on it, no Protect), **the Reflect branch** (Reflect on it and HP under a half) replace it, each later one beating the one before | 4.2 |
 * | MAG | written to 180 for the support turn (Curaga's power comes from it) and 40 for the breath; the record's MAG is 40 | 4.2 |
 * | The phase lines | three quarters, one half and one quarter of the maximum HP (30,000, 20,000, 10,000): the phase (and the presentation's "area") rises 1, 2, 3 and never falls | 4.3 |
 * | The sweep fuse | a counted action (one whose damage class includes HP) adds one; Tail Sweep fires when the count exceeds 2 plus a draw modulo 5, then the count is 0 | 4.3 |
 * | Slow | with Slow on it, any hit makes it cast Haste on a front-line member who holds Reflect, else on itself | 4.3 |
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, targetable } from '../state.ts';
import { livingFrontLine, pickActor } from './game-rolls.ts';

/** The combatant and script ids (`data/ffx/sanctuary-keeper-ids.ts`). */
export const SK_ID = 'sanctuary-keeper';
export const SK_SCRIPT = 'sanctuary-keeper';

/** The move rows (the Keeper's three in `data/ffx/enemies/sanctuary-keeper-abilities.ts`; the rest are the player's own rows, used by their ids). */
export const SK_ROWS = {
  photonWings: 'sanctuary-photon-wings', // 0x6042
  manaBreath: 'sanctuary-mana-breath', // 0x6043
  tailSweep: 'sanctuary-tail-sweep', // 0x6044
  curaga: 'curaga', // 0x302D
  esuna: 'esuna', // 0x3033
  protect: 'protect', // 0x303B
  reflect: 'reflect', // 0x303C
  regen: 'regen', // 0x303E
  haste: 'haste', // 0x3036
} as const;

/** The `state.flags` keys the state lives in (`data/ffx/sanctuary-keeper-ids.ts` `SANCTUARY_FLAGS`). */
export const SK_CYCLE_FLAG = 'sk.cycle';
export const SK_PHASE_FLAG = 'sk.phase';
export const SK_COUNT_FLAG = 'sk.count';

/** The cycle states (RE 4.2): `v1` runs 0 to 5 and wraps. */
export const CYCLE_WINGS = 0;
export const CYCLE_ATTACK_HIGHEST = 1;
export const CYCLE_ATTACK_RANDOM = 2;
export const CYCLE_BREATH = 3;
export const CYCLE_SUPPORT_A = 4;
export const CYCLE_SUPPORT_B = 5;
export const CYCLE_LENGTH = 6;

/** MAG as the script writes it (RE 4.2): 180 for a support turn (Curaga's power is read from it), 40 for the breath (the record's own). */
export const SUPPORT_MAG = 180;
export const BREATH_MAG = 40;

/**
 * The phase lines (RE 4.3): the script saves three quarters, one half and one quarter of the actor's maximum HP at init (30,000, 20,000 and 10,000 of 40,000) and a hit, or its own turn start, compares the current HP
 * to them (strictly below). Integer division, as the script's.
 */
export function phaseLines(maxHp: number): readonly [number, number, number] {
  return [Math.floor((maxHp * 3) / 4), Math.floor(maxHp / 2), Math.floor(maxHp / 4)];
}

/** The phase from which each rule reads (RE 4.2): Regen from phase 3 (HP under a quarter), the Reflect branch from phase 2 (HP under a half). */
export const REGEN_PHASE = 3;
export const REFLECT_BRANCH_PHASE = 2;

/** The sweep fuse (RE 4.3): it fires when the count exceeds `SWEEP_FUSE_BASE + (GetRandomValue() mod SWEEP_FUSE_MODULUS)`, so on the 3rd to the 7th counted action. */
export const SWEEP_FUSE_BASE = 2;
export const SWEEP_FUSE_MODULUS = 5;

/** A `state.flags` number, or `fallback`. */
export function flagNumber(ctx: Pick<Ctx, 'state'>, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** The phase (and the area index) now, 0 to 3. */
export function phaseOf(ctx: Pick<Ctx, 'state'>): number {
  return flagNumber(ctx, SK_PHASE_FLAG);
}

/**
 * The phase moves (RE 4.3 item 3, run by `onHit` and by `preTurn`): below three quarters the phase becomes 1 (once), then below a half 2 (once), then below a quarter 3. One hit can run several blocks. The phase never falls,
 * so a heal back over a line leaves it where it was. Returns the new phase.
 */
export function advancePhase(ctx: Pick<Ctx, 'state'>, self: FFXCombatant): number {
  const [three, half, quarter] = phaseLines(self.stats.maxHp);
  let phase = phaseOf(ctx);
  if (self.hp < three && phase === 0) phase = 1;
  if (self.hp < half && phase === 1) phase = 2;
  if (self.hp < quarter) phase = 3;
  ctx.state.flags[SK_PHASE_FLAG] = phase;
  return phase;
}

/** `findMatchingChr(front line, HP, 0, Lowest)`: the living, targetable actor with the least current HP; a tie is drawn. */
export function lowestHpLiving(ctx: Ctx): FFXCombatant | undefined {
  const pool = livingFrontLine(ctx);
  const low = pool.reduce((best, c) => Math.min(best, c.hp), Number.POSITIVE_INFINITY);
  return pickActor(ctx, pool.filter((c) => c.hp === low));
}

/** A front-line actor that holds Reflect (living and targetable: `findMatchingChr`'s filters), picked at random when there are several. */
export function reflectHolder(ctx: Ctx): FFXCombatant | undefined {
  return pickActor(ctx, livingFrontLine(ctx).filter((c) => has(c, 'reflect') && isAlive(c) && targetable(c)));
}

/** A support move the script has picked: the player's row and who it is aimed at. */
export interface SupportMove {
  readonly id: string;
  readonly targets: CombatantId[];
}

/**
 * **The support move of the turn** (RE 4.2 step 2): Curaga on itself, replaced in order by Regen, Esuna, Protect and the Reflect branch, **each replacing the one before** (so the last that applies wins).
 *
 * - Regen: it has none and the phase is 3 (HP under a quarter).
 * - Esuna: Poison or Darkness is on it.
 * - Protect: Armor Break is on it and Protect is not.
 * - The Reflect branch (Reflect is on it and the phase is 2 or 3, HP under a half): if a front-line character holds Reflect, **the pending move, whatever it now is, is aimed at that character**, so the spell bounces off
 *   (the holder is on the other side from the Keeper, and the target builder sends a reflected spell back to its caster, always); otherwise the pending move becomes **Reflect on the lowest-HP front-line member**,
 *   so that a later support turn can bounce.
 *
 * It is worked out on every turn, even the ones the cycle then discards it on (states 0 to 3), because the picks draw (stream 4, with two or more candidates) in the game's order.
 */
export function supportMoveOf(ctx: Ctx, self: FFXCombatant): SupportMove {
  const phase = phaseOf(ctx);
  let move: SupportMove = { id: SK_ROWS.curaga, targets: [self.id] };
  if (!has(self, 'regen') && phase >= REGEN_PHASE) move = { id: SK_ROWS.regen, targets: [self.id] };
  if (has(self, 'poison') || has(self, 'darkness')) move = { id: SK_ROWS.esuna, targets: [self.id] };
  if (has(self, 'armor-break') && !has(self, 'protect')) move = { id: SK_ROWS.protect, targets: [self.id] };
  if (has(self, 'reflect') && phase >= REFLECT_BRANCH_PHASE) {
    const holder = reflectHolder(ctx);
    if (holder !== undefined) move = { id: move.id, targets: [holder.id] };
    else {
      const weakest = lowestHpLiving(ctx);
      move = weakest === undefined ? move : { id: SK_ROWS.reflect, targets: [weakest.id] };
    }
  }
  return move;
}
