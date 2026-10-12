/**
 * FFX legal targets and the auto-target mask: the sets a bounced spell, a Berserk swing, a Confuse swing and a Provoked swing are
 * aimed from (re-parity RC4 lane FFX-G; **FFX only**).
 *
 * Source and spec: `research/re-ffx-targeting.md` sections 4.4 to 4.6. Functions, with the vectors each was proven on (the real machine
 * code in an x86-32 emulator against an independent model, 0 mismatches; `tests/unit/parity-ffx-target-sets.test.ts`):
 *
 * | Function | VA | Vectors |
 * |---|---|---|
 * | {@link legalSet} (the legal target set of a side) | 0x00799820 | 28,000 |
 * | {@link commandReach} | 0x00799690 | every u16 value of the command word for 38 user ids |
 * | {@link groupPick} | 0x00799910 | 16,000 |
 * | {@link autoTargetMask} | 0x007996d0 | 28,000 |
 *
 * **The legal set** of a side (party-side slots, or the monsters) for a user and a command: the side's slots that are in battle and not
 * removed, less every slot that fails any of: Targetable is 0; the target class forbids this command (class 0 needs the command's
 * "ordinary actor" usage bit, class 1 the "event character" bit, class 2 never, and an "only targetable by" id other than 0xff and other
 * than this command's turns any non-zero class into never); its BattleDistance is above the command's reach and it is not the user; or it
 * has the dead flag and the command lacks bit 0x40 ("can target the dead").
 *
 * **The auto-target mask** of a user, a command and a side (the aim of a forced action): the side is the argument's, or, when the
 * argument is negative, the command's (opposite side when `Cmd+0x1a` bit 1 is set, own side when clear). For a party user a non-zero side
 * means "own side" (the party-side set) and zero means "monsters"; for a monster user it is the other way round. By the command's target
 * type: single, one candidate by the picker on stream 4; group, the group pick on stream 5; all, the whole set; self, the user alone.
 */

import {
  type PickFn,
  SLOT_COUNT,
  type TargetCommand,
  type TargetWorld,
  TargetStream,
  field,
  hasBit,
  isMonsterSlot,
  pickOne,
  s8,
} from './target-world.ts';

/** The side selectors the target chain uses: the party-side slots in battle, or the monsters in battle (not removed). */
export type Side = 'party' | 'monster';

/** `Cmd+0x1a/0x1b` as the u16 the exe reads. */
function cmdWord(cmd: TargetCommand): number {
  return (cmd.b1a | (cmd.b1b << 8)) & 0xffff;
}

/** The slots of one side that are in battle and not removed (selectors -14 and -15). */
export function sideMask(world: TargetWorld, side: Side): number {
  let mask = 0;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const c = world[i];
    if (c === undefined || (c.inBattle ?? 0) === 0 || (c.removed ?? 0) !== 0) continue;
    if (isMonsterSlot(i) === (side === 'monster')) mask |= 1 << i;
  }
  return mask >>> 0;
}

/** `Cmd` reach (0 to 3) for a user: the two bits at 7 and 8 of the command word, except that bit 0x200 gives reach 3 to the actors 4, 8 and 13. */
export function commandReach(user: number, cmd: TargetCommand): number {
  const word = cmdWord(cmd);
  if ((word & 0x200) !== 0 && (user === 4 || user === 8 || user === 0xd)) return 3;
  return (word >> 7) & 3;
}

/** The target class of a slot for this command: 2 when an "only targetable by" id other than this command's makes it a never-target, else the raw class byte. */
function targetClass(world: TargetWorld, slot: number, cmdId: number): number {
  const cls = s8(field(world, slot, 'tclass'));
  const only = field(world, slot, 'only') & 0xffff;
  if (cls !== 0 && only !== 0xff && only !== cmdId >>> 0) return 2;
  return cls;
}

/** The legal target set of `side` for a user, a command and its id (`pp_BtlLegalTargets`). */
export function legalSet(world: TargetWorld, user: number, side: Side, cmdId: number, cmd: TargetCommand): number {
  const mask = sideMask(world, side);
  const word = cmdWord(cmd);
  const reach = commandReach(user, cmd);
  let out = mask;
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (!hasBit(mask, i)) continue;
    let excluded = s8(field(world, i, 'targetable')) === 0;
    const cls = targetClass(world, i, cmdId);
    if (cls === 0) excluded = excluded || (word & 0x400) === 0;
    else if (cls === 1) excluded = excluded || (word & 0x800) === 0;
    else if (cls === 2) excluded = true;
    if (s8(field(world, i, 'far')) > reach && user !== i) excluded = true;
    const dead = field(world, i, 'dead') !== 0;
    if ((dead && (cmd.b1a & 0x40) === 0) || excluded) out &= ~(1 << i);
  }
  return out >>> 0;
}

/**
 * The group pick (`pp_BtlGroupPick`, 0x00799910): one populated enemy group (`Chr+0x504` and 7) among the mask's members, chosen by a
 * draw on stream 5 (one draw also when only one group is populated, none when the mask is empty), and the mask's members of that group.
 * `pick` is called with the populated group numbers, ascending, and returns the chosen one.
 */
export function groupPick(world: TargetWorld, mask: number, pick: PickFn): number {
  const populated = new Set<number>();
  for (let i = 0; i < SLOT_COUNT; i++) if (hasBit(mask, i)) populated.add(field(world, i, 'group') & 7);
  if (populated.size === 0) return 0;
  const groups = [...populated].sort((a, b) => a - b);
  const chosen = pick(TargetStream.Spread, groups);
  let out = 0;
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (hasBit(mask, i) && (field(world, i, 'group') & 7) === chosen) out |= 1 << i;
  }
  return out >>> 0;
}

/** Which side an auto-target reads for a user: the party-side set when the flag is on for a party user (or off for a monster user). */
function autoSide(user: number, side: number, cmd: TargetCommand): Side {
  let s = side;
  if (s < 0) s = ((~cmd.b1a & 0xff) >> 1) & 1;
  const flag = isMonsterSlot(user) ? (s & 0xff) === 0 : (s & 0xff) !== 0;
  return flag ? 'party' : 'monster';
}

/**
 * `pp_BtlAutoTarget(user, cmdId, side)` (0x007996d0): the target mask of a forced action. `side` 0 is "the opposite side" (Berserk),
 * 1 is "the user's own side, the user included" (Confuse), and a negative value reads the command's own bit.
 */
export function autoTargetMask(world: TargetWorld, user: number, cmdId: number, side: number, cmd: TargetCommand, pick: PickFn): number {
  const mask = legalSet(world, user, autoSide(user, side, cmd), cmdId, cmd);
  switch ((cmd.b1a >> 2) & 3) {
    case 0: {
      if (mask === 0) return 0;
      const out = pickOne(mask, TargetStream.Picker, pick);
      return (1 << (out & 31)) >>> 0;
    }
    case 1:
      return groupPick(world, mask, pick);
    case 2:
      return mask;
    default:
      return (1 << (user & 31)) >>> 0;
  }
}
