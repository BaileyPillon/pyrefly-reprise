/**
 * The independent oracle of `parity-ffx-engine-k-zanmato.test.ts` (re-parity lane FFX-K; **FFX only**): what a landed player Zanmato (command 0x30E2) does, written out
 * again from the note's prose (`research/re-ffx-zanmato-and-orders.md`, sections 2 to 4) in plain arithmetic, with NO import of the kernels, the adapters or the
 * engine. A mistake in how the engine hands the pick its world, in the executor's target list or in the order of the draws shows as a difference from this file.
 *
 * Section 2 (whom it hits): the legal set of the other side is every monster in the battle that is not removed, Targetable, not dead and at battle distance 1 or less
 * (the row's reach is 1). With none, nothing is drawn. With any, ONE draw on stream 5 picks one of the populated groups (the group byte, 0 to 7, ascending; rank
 * `value mod number of groups`) and the action's targets are every legal member of that group. Section 3 (what it does): Death at chance 255 lands whatever the
 * resistance byte is and whatever the monster record carries (no Slice rule, no Death-immunity rule): HP 0, the KO reset (every status and Auto-Life wiped), the monster
 * leaves; one Auto-Life revive (a quarter of the maximum) per holder that died. No miss, no damage, no HP to 1.
 */

/** A monster as the pick sees it. */
export interface OracleFoe {
  id: string;
  /** Formation order: the game's monster slot (ascending). */
  order: number;
  /** `Chr+0x504`, low three bits. */
  group: number;
  /** In the battle and not removed. */
  inBattle: boolean;
  targetable: boolean;
  dead: boolean;
  /** BattleDistance. */
  distance: number;
  /** Holds Auto-Life when the Zanmato lands. */
  autoLife?: boolean;
  maxHp: number;
}

/** The row's reach (`Cmd+0x1a` bit 7 and `Cmd+0x1b` bit 0): 1. */
export const ZANMATO_REACH = 1;

/** Section 2 step 1: the legal set, in ascending formation order. */
export function legalSet(foes: readonly OracleFoe[]): OracleFoe[] {
  return foes
    .filter((f) => f.inBattle && f.targetable && !f.dead && f.distance <= ZANMATO_REACH)
    .sort((a, b) => a.order - b.order);
}

/** Section 2 steps 2 and 3: the draw (a stream-5 draw happens exactly when the legal set is not empty) and the mask. `draw` is the raw 31-bit value the engine took. */
export function pick(foes: readonly OracleFoe[], draw: number | undefined): { draws: number; members: OracleFoe[] } {
  const legal = legalSet(foes);
  if (legal.length === 0) return { draws: 0, members: [] };
  const groups = [...new Set(legal.map((f) => f.group & 7))].sort((a, b) => a - b);
  // The raw draw is only read when there is one to read: the caller passes `undefined` when the engine made none (a failure the test reports by the count).
  const chosen = draw === undefined ? groups[0]! : groups[draw % groups.length]!;
  return { draws: 1, members: legal.filter((f) => (f.group & 7) === chosen) };
}

/** What the engine must show for one target the Zanmato landed on. */
export interface OracleOutcome {
  id: string;
  /** Standing after the action: false when it died and nothing stood it up. */
  alive: boolean;
  hp: number;
  /** Auto-Life revived it (one revive, a quarter of the maximum, at least 1). */
  revived: boolean;
}

/** Section 3: the end state of a target the Zanmato landed on. */
export function outcomeOf(f: OracleFoe): OracleOutcome {
  if (f.autoLife === true) return { id: f.id, alive: true, hp: Math.max(1, Math.floor(f.maxHp / 4)), revived: true };
  return { id: f.id, alive: false, hp: 0, revived: false };
}

/**
 * The streams of the whole action in the order the game takes them, once the script's roll (stream 17) is done: the group draw, then one status draw per target on the
 * user's own status stream (`statusStream`: the shared aeon stream 27 + 32).
 */
export function actionStreams(foes: readonly OracleFoe[], draw: number | undefined, statusStream: number): number[] {
  const { draws, members } = pick(foes, draw);
  return [...Array<number>(draws).fill(5), ...Array<number>(members.length).fill(statusStream)];
}
