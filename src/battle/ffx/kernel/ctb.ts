/**
 * FFX CTB kernels, part 1: the small functions the turn clock is built from.
 *
 * **Game case: FFX only** (FFX-2 times its turns with its own ATB gauge and is a different exe). Source:
 * FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, image base 0x400000. Spec:
 * `research/re-ffx-ctb-status.md`. Pure and deterministic, no DOM, no engine types (AGENTS.md rule 1); nothing in
 * the engine calls these yet. Part 2 is `./ctb-init.ts` (opening counters), part 3 `./ctb-scheduler.ts` (who acts
 * next and how the clock ticks); Threaten's and Haste/Slow's effect on the counter is in `./status-inflict.ts`.
 *
 * Exe addresses (all FFX.exe):
 * - 0x007909c0  tick speed of an Agility (record byte 0 of the CTB table, `./ctb-table.ts`)
 * - 0x00790990  pointer to that record (byte 1 is the opening-jitter bound)
 * - 0x0078c150  Haste halves, Slow doubles, clamp 0..255
 * - 0x0078d1d0  recovery after an action: HasteSlow(tickSpeed * max(rank, 1))
 * - 0x007895b0  the rank of an action (the last command's rank byte, 3 when absent or 0)
 * - 0x0078f000  the tie-break key of an actor; 0x0078d3e0 sorts the ready list by it
 * - 0x0078e1e0  CTB "damage": the counter plus a signed delta, clamped 0..255
 * - 0x007b20e0  action done: `CTB += recovery`, as a byte (the part this file models)
 * - 0x0078d530  revive: CTB is set to the base value of Chr+0x65d
 *
 * `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90). Counters are bytes; the arithmetic
 * is the exe's 32-bit arithmetic (truncating division, byte wrap where the exe stores a byte).
 */

import { CTB_ICV_BONUS, CTB_TICK_SPEED } from './ctb-table.ts';
import { div2 } from './int32.ts';
import { isMonsterChrId } from './rng.ts';

/** The number of slots in the battle character array the CTB code walks (chr ids 0..0x1e). */
export const CTB_CHR_SLOTS = 31;

// The Delay Attack / Delay Buster amount, Threaten cancelling delay, and delay immunity are steps of the per-hit
// pipeline and live with its other steps (their rules are in research/re-ffx-ctb-status.md section 5); they are
// re-exported here so the CTB code has one import point.
export { delayAttackCtb, delayImmunity, threatenIgnoresDelay } from './aftermath.ts';

/** `pp_Clamp(AGI, 1, 255)` on the signed 32-bit argument: the record number plus one. */
export function clampAgi(agi: number): number {
  const a = agi | 0;
  return a < 1 ? 1 : a > 255 ? 255 : a;
}

/** 0x007909c0. CTB ticks per rank point for an Agility (1..255; 0 and below read Agility 1, above 255 reads 255). */
export function tickSpeed(agi: number): number {
  return CTB_TICK_SPEED[clampAgi(agi) - 1] as number;
}

/** 0x00790990 byte 1. The inclusive bound of the opening jitter of a party member or aeon. */
export function icvBonus(agi: number): number {
  return CTB_ICV_BONUS[clampAgi(agi) - 1] as number;
}

/**
 * `Chr+0x65d`, the "base ICV": `tickSpeed * 3`, computed in byte arithmetic (the exe adds the byte to itself twice).
 * Set for every character at the start of a battle (0x0078ded0) and by the party refresh (0x007a89c0); a revive
 * puts it back into the counter ({@link reviveCtb}).
 */
export function chrBaseCtb(agi: number): number {
  return (tickSpeed(agi) * 3) & 0xff;
}

/**
 * 0x0078c150. `value / 2` (truncating toward zero) when the Haste counter is not zero, then `value * 2` when the
 * Slow counter is not zero, then clamp to 0..255. Both can apply (Haste then Slow gives a doubled half). The
 * counters are `Chr+0x613` / `Chr+0x614`, passed in by the caller as bytes: 255 (an equipment-given status)
 * counts like any other non-zero value.
 */
export function hasteSlow(value: number, haste: number, slow: number): number {
  let v = value | 0;
  if ((haste | 0) !== 0) v = div2(v);
  if ((slow | 0) !== 0) v = (v + v) | 0;
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * 0x0078d1d0. The CTB an actor of Agility `agi` pays after an action of `rank`:
 * `hasteSlow(tickSpeed(agi) * max(rank, 1))`. A rank below 1 counts as 1 (signed compare); the product is a 32-bit
 * multiply, and the result is clamped to 0..255 by {@link hasteSlow}.
 */
export function delayForRank(agi: number, rank: number, haste: number, slow: number): number {
  const r = (rank | 0) < 1 ? 1 : rank | 0;
  return hasteSlow(Math.imul(tickSpeed(agi), r), haste, slow);
}

/** What 0x007895b0 does with the commands of an action: the rank byte it ends on. */
export const RANK_WHEN_ABSENT = 3;

/** Command ids that end the scan after being read: 0x3029, 0x305f, 0x311e (checked on the id after substitution). */
const ACTION_RANK_STOP_IDS: readonly number[] = [0x3029, 0x305f, 0x311e];

/**
 * 0x007895b0. The rank of an action, which the game stores in `Chr+0xde8` when it starts working out the action.
 *
 * An action holds up to two command ids (16-bit words; 0xff means "empty slot"). For each non-empty slot, in order:
 * if the user's flag byte `Chr+0x6de` is non-zero the id is replaced by 0x3028; the command record is looked up
 * (`rankOf` is that lookup: the record's rank byte `Cmd+0x24`, or `null` when the id resolves to no record); the
 * scan stops after ids 0x3029, 0x305f or 0x311e. The result is the rank byte of the LAST record found, and 3 when
 * no record was found or that byte is 0.
 */
export function actionRank(
  commandIds: readonly number[],
  substituteFlag: number,
  rankOf: (commandId: number) => number | null,
): number {
  let found: number | null = null;
  for (let k = 0; k < 2; k++) {
    let id = (commandIds[k] ?? 0xff) & 0xffff;
    if (id === 0xff) continue;
    if ((substituteFlag & 0xff) !== 0) id = 0x3028;
    const rank = rankOf(id);
    if (rank !== null) found = rank & 0xff;
    if (ACTION_RANK_STOP_IDS.includes(id)) break;
  }
  return found === null || found === 0 ? RANK_WHEN_ABSENT : found;
}

/**
 * 0x0078f000. The key that orders actors with the same CTB: the smaller key goes first.
 *
 * - party members and aeons (any id that is not a monster slot): `(255 - AGI) * 256 + chr id`, so a higher Agility
 *   goes first and equal Agility goes to the lower id (Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5,
 *   Rikku 6, Seymour 7, then the aeon slots 8..0x11);
 * - monsters (ids 0x14..0x1b): `chr id + 0x10000`, after every party member and aeon, in id order.
 */
export function tieKey(chrId: number, agi: number): number {
  if (isMonsterChrId(chrId)) return (chrId + 0x10000) | 0;
  return ((0xff - (agi & 0xff)) * 0x100 + chrId) | 0;
}

/**
 * 0x0078d3e0. The game's selection sort of the ready list (a list of chr ids, one byte each) by {@link tieKey},
 * ascending, strict `<` so the first of equal keys stays first. `agiOf` reads `Chr+0x5ac` of an id.
 */
export function sortReady(ids: readonly number[], agiOf: (chrId: number) => number): number[] {
  const list = ids.map((id) => id & 0xff);
  const n = list.length;
  for (let i = 0; i < n - 1; i++) {
    let best = i;
    let bestKey = tieKey(list[i] as number, agiOf(list[i] as number));
    for (let j = i + 1; j < n; j++) {
      const key = tieKey(list[j] as number, agiOf(list[j] as number));
      if (key < bestKey) {
        best = j;
        bestKey = key;
      }
    }
    if (best !== i) {
      const held = list[i] as number;
      list[i] = list[best] as number;
      list[best] = held;
    }
  }
  return list;
}

/**
 * 0x0078e1e0, the part that changes the counter. A hit record's CTB amount is applied with this: the byte counter
 * plus the signed amount, clamped to 0..255. A positive amount delays the target, a negative one hastens it.
 */
export function subCtb(ctb: number, delta: number): number {
  const v = ((ctb & 0xff) + (delta | 0)) | 0;
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * 0x007b20e0, the CTB line. When an action is finished the actor's counter grows by the recovery for the action's
 * rank (`Chr+0xde8`, see {@link delayForRank}); it is a byte add that wraps at 256 and is not clamped, though the
 * actor normally acts at 0 so the counter simply becomes the recovery.
 */
export function ctbAfterAction(ctb: number, recovery: number): number {
  return ((ctb & 0xff) + (recovery & 0xff)) & 0xff;
}

/**
 * 0x0078d530. A revived character's counter is set to `Chr+0x65d`, its base ICV (`3 * tickSpeed` as computed when
 * the battle started or the party was last refreshed), not recomputed from its present Agility. The same function
 * puts HP at 1 if it was below 1, clears the Death bit of `Chr+0x606`, and restores a permanent Auto-Life.
 */
export function reviveCtb(baseCtb: number): number {
  return baseCtb & 0xff;
}

/**
 * The script-hold condition of the scheduler (0x00790fb0): while a particular scene is running, or while one of six
 * commands is the one in progress, and a signed byte counter at VA 0x0112c9d1 is above 0, the scheduler does
 * nothing at all as soon as it finds an actor who is ready. The three inputs are `FUN_009da3b0()` (the value at VA
 * 0x00c64ca0), VA 0x0112c8d8 and VA 0x0112c9d1; what they stand for was not traced.
 */
export function scriptHoldActive(sceneValue: number, commandInProgress: number, holdCounter: number): boolean {
  const named = sceneValue === 0x1ad || [0x312c, 0x4125, 0x3022, 0x3108, 0x403c, 0x60bd].includes(commandInProgress);
  return named && (holdCounter << 24) >> 24 > 0;
}
