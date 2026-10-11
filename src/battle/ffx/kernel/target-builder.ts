/**
 * FFX target builder: the hit count of every target, the random spread, Cover and the Reflect bounce of one action
 * (`pp_BtlBuildTargetHits`, VA 0x0078ba70; re-parity RC4 lane FFX-G; **FFX only**).
 *
 * Source and spec: `research/re-ffx-targeting.md` section 4.1. Proven against the game's own machine code on 68,000 vectors with every
 * draw (stream and order) compared (`tests/unit/parity-ffx-target-builder.test.ts`). Pure: the draws are a callback.
 *
 * The function takes the user, the command, the command id, the target mask the action carries and a running hit total, and works in
 * this order:
 *
 * 1. **Hit counts.** A random-spread command (misc bit 15) clears every count and then, for each of its hits, picks one target from the
 *    mask (stream 5, `value % candidates`, no draw with one candidate) and adds a hit to it; the total grows by the hit count once. Every
 *    other command gives every target in the mask the command's hit count and grows the total by it per target. Counts are bytes; mask
 *    bit 31 is ignored. **Every member of the mask is a target of the action, even a spread member no hit chose.**
 * 2. **Cover**, only for a physical command (damage kind 1) of single target type: each target in the mask other than the user is given
 *    to its cover (`findCover`); if that is someone else they replace the target in the mask, take the target's hit count (added to their
 *    own) and the target's goes to 0.
 * 3. **Reflect**, only for a reflectable command (misc bit 7), for each target left in the mask in ascending slot order: if it holds
 *    Reflect (the status counter, or the equipment bit) it is recorded as reflected, and
 *    - if it is on the **other side from the user**, the user takes over its hits and becomes the target, with no draw and no check;
 *    - if it is on the **user's own side** (an ally, or the user), the legal set of the **opposite** side for this user and command is
 *      built, one target is picked from it (stream 6, one draw with two or more candidates) and takes the hits; with none the hits are lost.
 *    The reflecting target's own count is zeroed. A bounce is never looked at again. Whoever ends up targeted is counted once more for
 *    every source that lands on it, gets the user as its last attacker and joins the final mask.
 *
 * Draw order inside one call, always: every spread pick (stream 5, in hit order), then the Reflect picks (stream 6, in the ascending
 * slot order of the reflecting targets). Cover draws nothing.
 */

import { bondAdd, type BondArray, findCover } from './cover.ts';
import { legalSet } from './legal-set.ts';
import {
  CMD_RANDOM_SPREAD,
  CMD_REFLECTABLE,
  type PickFn,
  SLOT_COUNT,
  type TargetCommand,
  type TargetWorld,
  TargetStream,
  field,
  hasBit,
  isMonsterSlot,
  pickOne,
} from './target-world.ts';

/** What the builder produced for one action. */
export interface BuiltTargets {
  /** Per slot, how many sources landed on it (0 for a slot that is not a target). */
  targeted: number[];
  /** Per slot, the hits it takes (bytes). */
  hits: number[];
  /** The final target mask. */
  mask: number;
  /** The running hit total after this action. */
  total: number;
  /** The mask of targets that reflected. */
  reflected: number;
  /** Cover happened / Reflect happened (the exe's two globals). */
  coverFlag: boolean;
  reflectFlag: boolean;
  /** The slots that took the user as their last attacker, ascending. */
  lastAttacker: number[];
  /** Each Cover: who covered whom (the holder's "attacker" and "covered" marks). */
  covers: Array<{ holder: number; covered: number }>;
  /** The covered targets whose `+0x6dd` byte was cleared. */
  clearedCovered: number[];
  /** Hits that bounced into nothing (a same-side holder with no legal opposite target), per reflecting slot. */
  lost: Array<{ holder: number; hits: number }>;
}

/** A byte. */
function b(v: number): number {
  return v & 0xff;
}

/**
 * Build the targets of an action. `bond` (the Tidus counters) is changed in place when Tidus covers a monster's blow on a party slot.
 */
export function buildTargetHits(
  world: TargetWorld,
  bond: BondArray,
  user: number,
  cmdId: number,
  maskIn: number,
  totalIn: number,
  cmd: TargetCommand,
  pick: PickFn,
): BuiltTargets {
  const hits: number[] = new Array<number>(SLOT_COUNT).fill(0);
  const targeted: number[] = new Array<number>(SLOT_COUNT).fill(0);
  let total = totalIn >>> 0;
  let mask = maskIn >>> 0;

  // 1. Hit counts.
  if ((cmd.misc & CMD_RANDOM_SPREAD) !== 0) {
    if (cmd.hits > 0) {
      for (let n = 0; n < cmd.hits; n++) {
        const out = pickOne(mask, TargetStream.Spread, pick);
        if (out !== 0xff) hits[out] = b((hits[out] ?? 0) + 1);
      }
    }
    total = (total + cmd.hits) >>> 0;
  } else {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!hasBit(mask, i)) continue;
      hits[i] = b(cmd.hits);
      total = (total + cmd.hits) >>> 0;
    }
  }

  // 2. Cover: a physical command of single target type.
  const covers: BuiltTargets['covers'] = [];
  const clearedCovered: number[] = [];
  let coverFlag = false;
  if ((cmd.b20 & 3) === 1 && (cmd.b1a & 0xc) === 0) {
    let newMask = 0;
    const original = mask;
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!hasBit(original, i)) continue;
      const cover = i === user ? i : findCover(world, bond, user, i);
      newMask |= 1 << cover;
      if (cover === i) continue;
      coverFlag = true;
      covers.push({ holder: cover, covered: i });
      hits[cover] = b((hits[cover] ?? 0) + (hits[i] ?? 0));
      hits[i] = 0;
      clearedCovered.push(i);
      // Tidus covering a monster's blow on a party slot below 8 counts toward that slot's counter.
      if (cover === 0 && i < 8 && isMonsterSlot(user)) bondAdd(bond, i, 1);
    }
    mask = newMask >>> 0;
  }

  // 3. Reflect: a reflectable command.
  const reflectable = (cmd.misc & CMD_REFLECTABLE) !== 0;
  const userIsMonster = isMonsterSlot(user);
  let outMask = 0;
  let reflected = 0;
  const lastAttacker: number[] = [];
  const lost: BuiltTargets['lost'] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (!hasBit(mask, i)) continue;
    let landing = i;
    const holdsReflect = field(world, i, 'reflect') !== 0 || (field(world, i, 'autoTemp') & 0x20) !== 0;
    if (reflectable && holdsReflect) {
      reflected |= 1 << i;
      if (userIsMonster === isMonsterSlot(i)) {
        // The holder is on the user's own side: the spell goes to a random member of the opposite side.
        const candidates = legalSet(world, user, isMonsterSlot(i) ? 'party' : 'monster', cmdId, cmd);
        landing = pickOne(candidates, TargetStream.Reflect, pick);
        if (landing !== 0xff) hits[landing] = b((hits[landing] ?? 0) + (hits[i] ?? 0));
        else lost.push({ holder: i, hits: hits[i] ?? 0 });
        hits[i] = 0;
      } else {
        // The holder is on the other side: the spell goes back to the user, always.
        landing = user;
        hits[user] = b((hits[user] ?? 0) + (hits[i] ?? 0));
        hits[i] = 0;
      }
    }
    if (landing !== 0xff) {
      targeted[landing] = b((targeted[landing] ?? 0) + 1);
      outMask |= 1 << landing;
      lastAttacker.push(landing);
    }
  }

  return {
    targeted,
    hits,
    mask: outMask >>> 0,
    total,
    reflected: reflected >>> 0,
    coverFlag,
    reflectFlag: reflected !== 0,
    lastAttacker,
    covers,
    clearedCovered,
    lost,
  };
}
