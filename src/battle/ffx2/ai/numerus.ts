/**
 * The four heads of the Major Numerus, act 2 of the hidden chapter "The Fiend Arena Superbosses": Unum, Duo, Tria and Quattour (monster rows 330 to 333, scripts `m330` to `m333`), and the death rule they share.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll** (`research/re-ffx2-fiend-arena-superbosses.md` sections 2 and 3.2 to 3.5, decoded from the shipped sources and checked against the compiled workers by the
 * research lane: the sets of queued command ids and the `random() % 2` moduli are equal), in our own words. All four heads act at once, each on its own clock, each with its own counter. A poll is one call of the action
 * entry; every poll answers with one command. None of the four has a reaction, a menu or a targeted entry, and none has a time-out block.
 *
 * ```
 * Unum (counter = 0), seven polls:
 *   0  Radis Command on one girl            1  Sparkler on one girl                 2  Dispel on one girl
 *   3  some monster lacks Shell:  Shell on the monsters;   else Sparkler on one girl
 *   4  HP below max / 8:  White Highwind on the monsters;  else Sparkler on one girl
 *   5  Sparkler on one girl
 *   6  some monster lacks Protect:  Protect on the monsters;  else Sparkler on one girl           (then the counter is 0 again)
 *
 * Duo (counter = 0), nine polls; at each of the first eight a coin, random() mod 2: a one takes the FIRST move, a zero the SECOND:
 *   0  Black Sky / Bio      1  Flare on one / Break      2  Ultima / Confuse     3  Sleep / Demi       4  Berserk / Black Sky
 *   5  Blind / Flare on one 6  Ultima / Silence          7  Slowga / Demi        8  Venam Command on the party (no coin)
 *
 * Tria (counter = 0), six polls:
 *   0  Firaga / Holy on one      1  Blizzaga / Holy on one      2  Fulmen Command on the party (no coin)
 *   3  Thundaga / Holy on one    4  Waterga / Holy on one       5  Absorb on one girl (no coin)
 *
 * Quattour (counter = 0), nine polls, no random number at all:
 *   0 Fireworks   1 Mortis Command   2 Absorb on one   3 Meteor   4 Fireworks   5 Absorb on one   6 Ultima   7 Fireworks   8 Absorb on one
 * ```
 *
 * **The coin** [source, read for this stage]: the source writes `if (random() % 2) { first } else { second }`, so a value of 1 takes the first move of each pair as the research note lists it and a value of 0 the second.
 * **The death entry** [RE section 2]: when a head falls and the other three heads are at 0 HP, it sets the body and the pod (the game's slots 1 and 6) to 0 HP and plays the body's death row; the engine's standing rule for
 * parts already ends the fight when the fourth head falls, so the write changes no outcome: it makes the parts read 0 HP, as the Vegnagun Core's death entry does its Bulwarks, with no knock-out and no kill to pay.
 * The game's `getdeathreaction` guard is read as always true (nothing in the note says when it is not).
 *
 * **Targets.** The moves the source aims at the whole player group, `chr_all_ply`, are `all` here (the party, or the spread of a random-hit move) when the row is a party row, and ONE living girl when the row is a
 * single-target row (Break, Confuse, Sleep, Berserk, Blind, Silence, Dispel): the pick of the stage-1 data, the Farplane Cup's pick DU10 (the research note: "the engine picks one"). "A living girl" is `searchr(all players,
 * alive)`; the game's search is near-weighted and the engine has no positions for this chapter, so it is {@link searchUniform} (the paper preflight's E6, pick S2-1, the driver's, his to overturn; {@link aimed} holds the
 * choice). **The monster-side search** (Unum's Shell and Protect upkeep, `searchr(all monsters, no Shell)`) counts the living, existing heads: the body, the pod and the tail are parts, not monsters of the fight (the engine's
 * all-allies moves reach the four heads only, stage 1 T0 a), and a head that has fallen is not asked (the research note's open item U6, `[I]`; the alternative, the dead counted, would have Unum cast Shell at every
 * pass once one head fell). Like every search whose pick the script throws away, it still draws with two or more candidates ({@link spendSearchDraw}).
 *
 * **RNG** [RE section 3]: `random() mod 2` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates.
 */

import type { Command, StatusId } from '../../common/types.ts';
import {
  DUO_SCRIPT_ID,
  FS_ABILITY as A,
  NUMERUS_HEAD_IDS,
  QUATTOUR_SCRIPT_ID,
  TRIA_SCRIPT_ID,
  UNUM_SCRIPT_ID,
  X2_NUMERUS_BODY_ID,
  X2_NUMERUS_POD_ID,
} from '../../../data/fiend-superbosses-ids.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { girls, lacking, maxHpDiv, scriptModCtx, searchUniform, spendSearchDraw } from './script-rolls.ts';

/** AI memory keys: one counter per head. */
export const UNUM_COUNT = 'fsUnumCount';
export const DUO_COUNT = 'fsDuoCount';
export const TRIA_COUNT = 'fsTriaCount';
export const QUATTOUR_COUNT = 'fsQuattourCount';
/** The loop lengths [RE sections 3.2 to 3.5]. */
export const UNUM_POLLS = 7;
export const DUO_POLLS = 9;
export const TRIA_POLLS = 6;
export const QUATTOUR_POLLS = 9;
/** Unum's White Highwind waits for his HP to fall below an eighth of his maximum [RE section 3.2]. */
export const UNUM_HEAL_BELOW_DIV = 8;
/** The coin: `random() mod 2`. */
export const COIN_MODULUS = 2;

/** Who a move is aimed at: one living girl (a search), or no target (the whole party, the spread of a random-hit move, or the monster side). */
export type Aim = 'girl' | 'all';
export interface Move {
  id: string;
  aim: Aim;
}
/** One poll: a single move, or a pair decided by the coin (a one takes the first, a zero the second). */
export type Beat = readonly [Move] | readonly [Move, Move];

const girl = (id: string): Move => ({ id, aim: 'girl' });
const all = (id: string): Move => ({ id, aim: 'all' });

/** Duo [RE section 3.3, source m331]. */
export const DUO_BEATS: readonly Beat[] = [
  [all(A.blackSky), all(A.bio)],
  [girl(A.flare), girl(A.break)],
  [all(A.ultima), girl(A.confuse)],
  [girl(A.sleep), all(A.demi)],
  [girl(A.berserk), all(A.blackSky)],
  [girl(A.blind), girl(A.flare)],
  [all(A.ultima), girl(A.silence)],
  [all(A.slowga), all(A.demi)],
  [all(A.venamCommand)],
];

/** Tria [RE section 3.4, source m332]: the -aga spell, or Holy on one girl. */
export const TRIA_BEATS: readonly Beat[] = [
  [all(A.firaga), girl(A.holy)],
  [all(A.blizzaga), girl(A.holy)],
  [all(A.fulmenCommand)],
  [all(A.thundaga), girl(A.holy)],
  [all(A.waterga), girl(A.holy)],
  [girl(A.absorb)],
];

/** Quattour [RE section 3.5, source m333]: no coin. */
export const QUATTOUR_BEATS: readonly Beat[] = [
  [all(A.fireworks)],
  [all(A.mortisCommand)],
  [girl(A.absorb)],
  [all(A.meteor)],
  [all(A.fireworks)],
  [girl(A.absorb)],
  [all(A.ultima)],
  [all(A.fireworks)],
  [girl(A.absorb)],
];

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** A move as a command: a living girl picked by the search (see the header, pick S2-1), or no target. */
function aimed(ctx: AiContext, party: readonly Ffx2Unit[], move: Move): Command {
  if (move.aim === 'all') return use(move.id, []);
  const pick = searchUniform(ctx.rng, party);
  return use(move.id, pick ? [pick.id] : []);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The death rule
// ---------------------------------------------------------------------------------------------------------------------------------

/** Whether every head except `selfId` is at 0 HP (a head the formation does not hold counts as down: Unum alone is a single-head fight, RE section 8 U3). */
export function otherHeadsDown(units: readonly Ffx2Unit[], selfId: string): boolean {
  return NUMERUS_HEAD_IDS.filter((id) => id !== selfId).every((id) => {
    const head = units.find((u) => u.id === id);
    return head === undefined || head.hp <= 0;
  });
}

/**
 * The heads' death entry (the same in all four): when the other three heads are at 0 HP the body and the pod go to 0 HP. The store runs no knock-out routine, as the setter does not (`ai/vegnagun-body.ts`): the part
 * stands at 0 HP, alive, with no `ko` event and no kill to pay. A part the formation does not hold is skipped.
 */
export function numerusDeathEntry(ctx: AiContext): void {
  if (!otherHeadsDown(ctx.units, ctx.self.id)) return;
  for (const id of [X2_NUMERUS_BODY_ID, X2_NUMERUS_POD_ID]) {
    const part = ctx.units.find((u) => u.id === id);
    if (part !== undefined) part.hp = 0;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The three heads that read a table
// ---------------------------------------------------------------------------------------------------------------------------------

/** A head whose loop is a table of polls (Duo, Tria, Quattour): the counter picks the beat, a pair is settled by the coin, and the counter returns to 0 after the last. */
function loopScript(id: string, key: string, beats: readonly Beat[]): AiScript {
  return {
    id,
    decide(ctx) {
      const party = girls(ctx);
      if (party.length === 0) return null;
      const self = ctx.self;
      const count = mem(self, key);
      const beat = beats[count] ?? (beats[beats.length - 1] as Beat);
      setMem(self, key, count >= beats.length - 1 ? 0 : count + 1);
      const move = beat.length === 1 ? beat[0] : scriptModCtx(ctx, COIN_MODULUS) !== 0 ? beat[0] : beat[1];
      return aimed(ctx, party, move);
    },
    onDeath: numerusDeathEntry,
  };
}

export const x2NumerusDuoScript: AiScript = loopScript(DUO_SCRIPT_ID, DUO_COUNT, DUO_BEATS);
export const x2NumerusTriaScript: AiScript = loopScript(TRIA_SCRIPT_ID, TRIA_COUNT, TRIA_BEATS);
export const x2NumerusQuattourScript: AiScript = loopScript(QUATTOUR_SCRIPT_ID, QUATTOUR_COUNT, QUATTOUR_BEATS);

// ---------------------------------------------------------------------------------------------------------------------------------
// Unum
// ---------------------------------------------------------------------------------------------------------------------------------

/** The monsters of the fight on Unum's side: the living, existing heads (the parts are not monsters of the fight; see the header). */
export function monsterSide(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && u.flags.isPart !== true);
}

/** `searchr(all monsters, no <status>) != nothing`: some monster of the side lacks the status. The search's pick is thrown away, but with two or more candidates it still draws. */
export function someMonsterLacks(ctx: AiContext, status: StatusId): boolean {
  const lackers = lacking(monsterSide(ctx), status);
  spendSearchDraw(ctx.rng, lackers.length);
  return lackers.length > 0;
}

/** Unum, one poll. */
export const x2NumerusUnumScript: AiScript = {
  id: UNUM_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    const count = mem(self, UNUM_COUNT);
    setMem(self, UNUM_COUNT, count >= UNUM_POLLS - 1 ? 0 : count + 1);
    switch (count) {
      case 0:
        return aimed(ctx, party, girl(A.radisCommand));
      case 1:
      case 5:
        return aimed(ctx, party, girl(A.sparkler));
      case 2:
        return aimed(ctx, party, girl(A.dispel));
      case 3:
        return someMonsterLacks(ctx, 'shell') ? use(A.shell, []) : aimed(ctx, party, girl(A.sparkler));
      case 4:
        return self.hp < maxHpDiv(self, UNUM_HEAL_BELOW_DIV) ? use(A.whiteHighwind, []) : aimed(ctx, party, girl(A.sparkler));
      default:
        return someMonsterLacks(ctx, 'protect') ? use(A.protect, []) : aimed(ctx, party, girl(A.sparkler));
    }
  },
  onDeath: numerusDeathEntry,
};

/** The four scripts of act 2, for the registry (`./index.ts`). */
export const numerusScripts: readonly AiScript[] = [x2NumerusUnumScript, x2NumerusDuoScript, x2NumerusTriaScript, x2NumerusQuattourScript];
