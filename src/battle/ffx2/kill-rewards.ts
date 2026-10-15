/**
 * Kill rewards in the FFX-2 engine: the ledger a battle keeps, and what one knock-out pays into it (re-parity RC9, lane X2-C;
 * **FFX-2 only**; rules in `kernel/kill-rewards.ts`, the engine's units as the kernel's terms in `adapt/kill-rewards.ts`).
 *
 * The game pays a kill the moment the knock-out resolution runs for a character whose HP reached 0 (or who was Ejected), not at the end of
 * the battle: the roll adds the monster's EXP to the results total and to each owner's record, its gil (times the Gillionaire owners) to
 * the gil total, hands each owner her AP, and takes **one draw on stream 10, always**, then a draw on stream 11 when an item drops. A girl's
 * own knock-out runs the same routine with an empty row (it pays nothing and still takes the stream-10 draw). So a monster that is still
 * standing when the battle is won pays nothing (the Vegnagun Leg's three Nodes, which the fight never asks the party to kill), and a monster
 * killed twice (revived, then killed again) pays twice.
 *
 * The ledger lives on `BattleState.ffx2Rewards` (plain numbers: it is cloned with the state by the advisor's look-ahead and carries no
 * function). It is created at the first knock-out, so a battle with no knock-out has none and pays nothing. `rewardsOfBattle` reads it at
 * the end: the totals the results screen prints (EXP, gil, the items), the AP the best-paid girl was credited (the screen's "per
 * dressphere" number), and what each girl earned (`BattleResult.rewardsByMember`, for the per-girl lines a later screen can show).
 *
 * Open (the note's open questions, not guessed here): which result codes reach the teardown (a fled battle), which scripted departures set
 * the pay-nothing death kind, and whether the stats refresh after a mastery draws; see `docs/handoff/re-parity-rc9-x2-rewards.md`.
 */

import type { BattleResult, BattleState, FFX2RewardLedger, ItemDrop } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import type { Ffx2Unit } from './internal.ts';
import { apGain, killRoll, newRewardBuffer, rollbackEnd } from './kernel/kill-rewards.ts';
import { ABILITY_GAME_ID } from './adapt/game-ids.ts';
import { apOwnerOf, dropsOfLists, killRollDraw, ownerUnits, rewardOwnersOf, rewardVictimOf } from './adapt/kill-rewards.ts';

/** The ledger of a battle: created at its first knock-out. */
export function ledgerOf(state: BattleState): FFX2RewardLedger {
  state.ffx2Rewards ??= { buffer: newRewardBuffer(), pools: new Array<number>(9).fill(0), extraDrops: [] };
  return state.ffx2Rewards;
}

/** What a knock-out needs: the units, the generator and the state the ledger lives on (a resolve context carries all three). */
export interface KillEnv {
  units: readonly Ffx2Unit[];
  rng: BattleRng;
  state?: BattleState;
}

/**
 * Pay the knock-out of `victim` into the battle's ledger (the KO resolution's roll, 0x006246d0). `pays: false` is the death kind that
 * pays nothing (an enemy Ejected by Steal Will or by a Bribe, note FFX2-G03 section 4.1): the roll does not run, no draw is taken.
 * A battle with no state (a unit fixture) keeps no ledger and takes no draw.
 */
export function payKill(env: KillEnv, victim: Ffx2Unit, pays = true): void {
  if (env.state === undefined || !pays) return;
  const ledger = ledgerOf(env.state);
  const owners = ownerUnits(env.units);
  const row = rewardVictimOf(victim);
  const roll = killRoll(row, rewardOwnersOf(owners), ledger.buffer, killRollDraw(env.rng));
  for (const call of roll.apCalls) {
    const girl = owners[call.slot];
    if (girl === undefined) continue;
    ledger.pools[call.slot] = apGain(apOwnerOf(girl, call.slot, ledger.pools[call.slot] ?? 0), call.ap).pool;
  }
  // A monster with no game row (a hand-built test enemy) pays its authored drops outright: it has no drop byte to roll.
  if (victim.side === 'enemy' && victim.enemy?.ffx2Record?.kill === undefined) for (const drop of victim.enemy?.rewards.drops ?? []) ledger.extraDrops.push({ ...drop });
}

/** Does an Eject by this ability pay? Not when the command is Steal Will (0x30c7) or a Bribe (0x30f0): the death kind that clears the pay flag (note FFX2-G03 4.1; the two names are the note's reading). */
export function ejectPays(abilityId: string): boolean {
  const game = ABILITY_GAME_ID[abilityId];
  return game !== 0x30c7 && game !== 0x30f0;
}

/** What a won battle paid, as the result record carries it; `undefined` when nothing was paid. */
export interface BattleRewards {
  exp: number;
  gil: number;
  ap: number;
  drops: ItemDrop[];
  rewardsByMember: NonNullable<BattleResult['rewardsByMember']>;
}

/**
 * The battle's rewards at its end (the results screen's numbers). The teardown rolls back the EXP of a girl who is dead or Petrified
 * (0x00624450): her record goes back to what it was at the start; AP already spent stays. `ap` is the AP of the best-credited girl, which
 * is what the screen's "per dressphere" figure shows (all three are equal unless a girl wears Double AP or Triple AP).
 */
export function rewardsOfBattle(units: readonly Ffx2Unit[], state: BattleState): BattleRewards {
  const ledger = state.ffx2Rewards;
  const none: BattleRewards = { exp: 0, gil: 0, ap: 0, drops: [], rewardsByMember: {} };
  if (ledger === undefined) return none;
  const owners = ownerUnits(units);
  const buffer = structuredClone(ledger.buffer); // the teardown acts on the buffer; the live ledger is left as the battle made it
  rollbackEnd(buffer, owners.map((girl) => girl !== undefined && (!girl.alive || girl.statuses['petrify'] !== undefined)), owners.map((_, slot) => slot));
  const rewardsByMember: BattleRewards['rewardsByMember'] = {};
  let ap = 0;
  owners.forEach((girl, slot) => {
    if (girl === undefined) return;
    const record = buffer.rec[slot];
    rewardsByMember[girl.id] = { exp: record === undefined ? 0 : record.pend - record.snap, ap: ledger.pools[slot] ?? 0 };
    ap = Math.max(ap, ledger.pools[slot] ?? 0);
  });
  return { exp: buffer.exp, gil: buffer.gil, ap, drops: [...dropsOfLists(buffer.lists), ...ledger.extraDrops], rewardsByMember };
}
