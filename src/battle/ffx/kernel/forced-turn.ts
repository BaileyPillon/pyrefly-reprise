/**
 * FFX forced turns: what a Berserk, Confused or Provoked actor does with its turn (`pp_BtlConfuseBerserkTurn`, VA 0x00799ac0, and
 * `pp_BtlProvokeTurn`, VA 0x00799d50; re-parity RC4 lane FFX-G; **FFX only**).
 *
 * Source and spec: `research/re-ffx-targeting.md` section 4.6. Proven against the game's machine code (23,000 + 23,000 vectors, 0
 * mismatches: `tests/unit/parity-ffx-target-forced.test.ts`).
 *
 * **The turn start** (the exe's caller, read only) tries the three in this order, after Regen's tick and Doom's, and only for an actor
 * that is not asleep: Provoke (permanent bit 0x400), then Berserk (0x200), then Confuse (0x100). After a Berserk or Confuse call, and
 * after a Provoke call that returns non-zero, the actor neither runs its script nor opens a menu. Each call queues the actor's **default
 * attack** (`Chr+0x6c6`) with a target set:
 *
 * - **Berserk** aims at the opposite side (the legal set of the other party); **Confuse** at its own side, **the actor included**. Both
 *   go through the auto-target (`legal-set.ts#autoTargetMask`), so a single-target default attack picks one candidate with stream 4
 *   (none drawn with one), a group-target one picks a populated group with stream 5, an all-target one takes the whole set. When the
 *   attack id is 0 or the set is empty the turn is dropped: the record that is queued is empty (command 0xff, no targets).
 * - **Provoke**: first the provoker is tested, and a provoker who is not in battle, has the dead flag or is Petrified has the Provoke
 *   bit cleared and nothing is queued (the call returns 0 and the script runs), also for an actor that keeps control of its script;
 *   only after that test passes does a non-zero "keeps control when Provoked" byte make the actor ignore the forced attack (the bit
 *   stays set, the call returns 0). Otherwise the legal set of the **provoker's** side is built for the default attack; when it does
 *   not hold the provoker the record is empty; else a single or self default attack goes to the provoker alone, a group one to the legal
 *   members of the provoker's group, an all-target one to the whole set. No draw anywhere.
 */

import { PermBit } from './status-types.ts';
import { autoTargetMask, legalSet } from './legal-set.ts';
import { type PickFn, type TargetCommand, type TargetWorld, field, hasBit, s16, SLOT_COUNT } from './target-world.ts';

/**
 * What a forced turn queued. `ret` is the exe's return value: -1 a forced action, -2 a dropped (empty) record, 0 nothing queued (the
 * Provoke call only). `command` is the queued command id (0xff when dropped) and `mask` its target mask.
 */
export interface ForcedTurn {
  ret: -2 | -1 | 0;
  command: number;
  mask: number;
}

/** The record both forced turns write: an empty one when the attack id is 0 or the mask has no target. */
function forcedRecord(cmdId16: number, mask: number): ForcedTurn {
  if (cmdId16 === 0 || (mask | 0) < 1) return { ret: -2, command: 0xff, mask: 0 };
  return { ret: -1, command: cmdId16 & 0xffff, mask: mask >>> 0 };
}

/**
 * `pp_BtlConfuseBerserkTurn`: the default attack of `userSlot`, aimed by the auto-target mask. `side` 0 is Berserk (the opposite side),
 * 1 is Confuse (the actor's own side).
 */
export function confuseBerserkTurn(world: TargetWorld, userSlot: number, side: 0 | 1, cmd: TargetCommand, pick: PickFn): ForcedTurn {
  const cmdId = s16(field(world, userSlot, 'defAtk'));
  const mask = autoTargetMask(world, userSlot, cmdId >>> 0, side, cmd, pick);
  return forcedRecord(cmdId, mask);
}

/** The result of the Provoke turn: what it queued, and the permanent word afterwards (the bit is cleared when the provoker is gone). */
export interface ProvokeTurn extends ForcedTurn {
  perm: number;
}

/** `pp_BtlProvokeTurn` for the actor in `userSlot`. */
export function provokeTurn(world: TargetWorld, userSlot: number, cmd: TargetCommand): ProvokeTurn {
  const actor = world[userSlot] ?? {};
  const perm = actor.perm ?? 0;
  const provoker = (actor.provokedBy ?? 0) & 0xff;
  const cmdId = s16(actor.defAtk ?? 0);
  const p = provoker < SLOT_COUNT ? (world[provoker] ?? {}) : {};
  if ((p.inBattle ?? 0) === 0 || (p.dead ?? 0) !== 0 || (p.stoned ?? 0) !== 0) {
    return { ret: 0, command: 0, mask: 0, perm: perm & ~PermBit.Provoke & 0xffff };
  }
  if ((actor.keeps ?? 0) !== 0) return { ret: 0, command: 0, mask: 0, perm };
  const legal = legalSet(world, userSlot, (provoker >= 0x14 && provoker <= 0x1b) ? 'monster' : 'party', cmdId >>> 0, cmd);
  let mask = 0;
  if (hasBit(legal, provoker)) {
    switch ((cmd.b1a >> 2) & 3) {
      case 0:
      case 3:
        mask = (1 << provoker) >>> 0;
        break;
      case 1: {
        const group = field(world, provoker, 'group') & 7;
        for (let i = 0; i < SLOT_COUNT; i++) {
          if (hasBit(legal, i) && (field(world, i, 'group') & 7) === group) mask |= 1 << i;
        }
        break;
      }
      default:
        mask = legal;
    }
  }
  return { ...forcedRecord(cmdId, mask), perm };
}
