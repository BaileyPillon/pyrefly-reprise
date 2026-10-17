/**
 * The hit-reaction kernels of FFX-2 (re-parity lane X2-A, slice 1; **FFX-2 only**): which reaction a hit starts, how fast
 * the target's animations run, and when the chain counter is cleared. Four pieces of the live build 25501027, each proven
 * against the exe in the emulator (note FFX2-G01, `x1`, `x3`, `x5`, `x6`; no game is run):
 *
 * - {@link interruptMask} (exe 0x00632610): the priority comparator. 20,000 vectors, 0 mismatches.
 * - {@link chooseReaction} (exe 0x006327d0): the result kind of a hit to the motion tag the target is asked to play. 30,000 vectors, 0 mismatches.
 * - {@link animationRatio} (exe 0x00632200): the speed of a character's animations. 20,000 vectors, 0 mismatches.
 * - {@link chainUpdate} (exe 0x00643d80): the per-step update that clears the chain counter. 3,000 worlds of 31 characters, 93,000 updates, 0 mismatches.
 *
 * `tests/unit/parity-ffx2-hit-reaction.test.ts` replays a sample of every vector set (`tests/fixtures/parity/ffx2/hit_reaction.json`) and,
 * when the proof folder is named, all of them. Pure and DOM-free; nothing here draws a random number. Numbers only: no decompiled code.
 */

/** The damage codes (`btl_dmg_*`) a hit result is classified into. */
export const ResultKind = {
  Nop: 0,
  Avoid: 1,
  Recover: 2,
  MagicInvalid: 3,
  PhysicalInvalid: 4,
  Hit: 5,
  Critical: 6,
  StatusRecover: 7,
  StatusHit: 8,
  StatusSet: 9,
  StatusClear: 10,
  Sleep: 11,
  WakeUp: 12,
} as const;

/** The motion tags a reaction asks for (the game's `_tag_motion_*`). */
export const MotionTag = {
  Wait: 2,
  WakeUp: 3,
  MagicInvalid: 23,
  PhysicalInvalid: 24,
  DefenseDamage: 25,
  DamageNormal: 26,
  DamageCritical: 27,
  Avoid: 30,
  Sleep: 63,
} as const;

/** The motion levels (classes) of a request: 3 is also the "no level" value the comparator reads. */
export const MotionClass = { Avoid: 3, Damage: 4 } as const;

/** What the comparator reads of a character: the level bytes E6D, E6E, E6F, E70, the queue count E66 and the status of the root. */
export interface InterruptState {
  /** `Chr+0xe6d`: the armour level of the command (row bit 30), or 1 under the forced-motion API. */
  e6d: number;
  /** `Chr+0xe6e`: row bit 31, never set in a shipped row. */
  e6e: number;
  /** `Chr+0xe6f`: the script flag (stat 358). */
  e6f: number;
  /** `Chr+0xe70`: the sequence level of the command. */
  e70: number;
  /** `Chr+0xe66`: the number of commands in the queue. */
  queueCount: number;
  /** The state byte of the current action record (the head of the root's queue). */
  actionState: number;
  /** The Stop counter (`Chr+0x43e`) is non-zero. */
  stopped: boolean;
  /** Petrify (status bit 1) is on. */
  petrified: boolean;
}

/**
 * `pp_interrupt_mask` (exe 0x00632610): bit 0 = the character's current command is armoured against a hit of `level1`, bit 1 = against
 * `level2`, bit 2 = the character is Stopped or Petrified. Levels are compared as signed integers; 3 means "none".
 */
export function interruptMask(s: InterruptState, level1: number, level2: number): number {
  let mask = 0;
  if (level1 !== 3 && (s.e6d > level1 || s.e6e > level1 || (s.e6f > level1 && s.queueCount !== 0 && s.actionState !== 1))) mask |= 1;
  if (level2 !== 3 && s.e70 > level2) mask |= 2;
  if (s.stopped || s.petrified) mask |= 4;
  return mask;
}

/** One character as the chooser reads it: the comparator's inputs plus the running tag, its class and the redirect. */
export interface ReactionTarget extends InterruptState {
  /** `Chr+0xe71`: set from the release of a charge command until the manager's start gate runs. */
  e71: number;
  /** `Chr+0xd30`: the hit ring's running tag (0xFFFFFFFF when empty). */
  runningTag: number;
  /** `Chr+0x663`: the actor's skip byte. */
  skip: number;
  /** `Chr+0xd40`: the class of the running entry. */
  runningClass: number;
  /** `Chr+0x2ed`: the character that animates for this one (summons, linked bodies). */
  redirect: number;
}

/** The chooser's arguments (exe 0x006327d0): the target, the result kind, the call's flag word `callFlags` (bit 0 = request nothing, bit 3 = the heavier clip; bits 1 and 2 go to the death start) and the result's flag word `resultFlags` (bit 3 = guard damage). */
export interface ChooserInput {
  kind: number;
  /** The fourth argument, passed through to the death start and to the request. */
  extra: number;
  callFlags: number;
  resultFlags: number;
  /** Use the redirect target as the animating character. */
  redirected: boolean;
  targetSlot: number;
  target: ReactionTarget;
  animator: ReactionTarget;
  /** The queue of the target holds a waiting record (state 1 or 2 with the +0x1c byte 0). */
  queuePending: boolean;
  /** What the death start would return (non-zero = it started). */
  deathStarted: number;
  /** What the tag request would return (non-zero = accepted). */
  requestAccepted: number;
}

/** What the chooser did, as the proof logs it. */
export interface ReactionPlan {
  /** The animating character's slot, or 0xFF when nothing was requested. */
  returned: number;
  /** The death start tried first: `[slot, extra, callFlags]`. */
  death: [number, number, number] | null;
  /** The tag request: `[slot, tag, class, flag 0x100 = flush the ring, 0, 1, extra]`. */
  request: [number, number, number, number, number, number, number] | null;
  /** The animator's freeze counter after the call (2 for a damage kind on an armoured, Stopped or Petrified animator). */
  freeze: number;
}

/** The tag, class and flag the chooser asks for, or null for "nothing" (kinds 0, 9 and above 0x11). `runningTag` and `skip` only matter for the re-request kinds. */
function wanted(i: ChooserInput): { tag: number; cls: number; flag: number; damageKind: boolean } | null {
  const a = i.animator;
  const guard = (i.resultFlags & 8) !== 0;
  switch (i.kind) {
    case ResultKind.Avoid:
      return { tag: MotionTag.Avoid, cls: MotionClass.Avoid, flag: 0x100, damageKind: false };
    case ResultKind.Recover:
    case ResultKind.StatusRecover:
    case ResultKind.StatusClear:
    case 17:
      return a.runningTag === MotionTag.Wait && a.skip === 0 ? { tag: MotionTag.Wait, cls: a.runningClass, flag: 0x100, damageKind: false } : null;
    case ResultKind.MagicInvalid:
      return { tag: MotionTag.MagicInvalid, cls: MotionClass.Damage, flag: 0x100, damageKind: true };
    case ResultKind.PhysicalInvalid:
      return { tag: MotionTag.PhysicalInvalid, cls: MotionClass.Damage, flag: 0x100, damageKind: true };
    case ResultKind.Hit:
    case ResultKind.StatusHit:
    case 13:
    case 14: {
      const heavy = (i.callFlags & 8) !== 0;
      return { tag: guard ? MotionTag.DefenseDamage : heavy ? MotionTag.DamageCritical : MotionTag.DamageNormal, cls: MotionClass.Damage, flag: 0x100, damageKind: true };
    }
    case ResultKind.Critical:
    case 15:
    case 16:
      return { tag: guard ? MotionTag.DefenseDamage : MotionTag.DamageCritical, cls: MotionClass.Damage, flag: 0x100, damageKind: true };
    case ResultKind.Sleep:
      return { tag: MotionTag.Sleep, cls: MotionClass.Damage, flag: 0x100, damageKind: false };
    case ResultKind.WakeUp:
      return a.runningTag === MotionTag.Sleep ? { tag: MotionTag.WakeUp, cls: MotionClass.Damage, flag: 0x100, damageKind: false } : null;
    default:
      return null;
  }
}

/**
 * `pp_hit_reaction_choose` (exe 0x006327d0). The death start is tried first, and only when the target's own mask has no armour bit
 * (or its E71 is set) and its queue holds no waiting record; if it starts, no reaction is asked. Otherwise the animator is asked for
 * the tag of the result kind: a miss asks for "avoid" (30), a magic- or physical-invalid result for 23 / 24, a hit for 26 (normal),
 * 27 (the heavier clip, when bit 3 of the call's flags is set) or 25 (the target is guarding), a critical for 27 or 25, sleep for 63,
 * a wake-up for 3 only while the running tag is 63. An animator whose mask has an armour bit or a stop bit is asked for nothing; for
 * a damage kind it gets a freeze counter of 2 instead (the two-step hit-stop). Kinds 13 to 16 are the reaction-only hits of the
 * motion signals.
 */
export function chooseReaction(i: ChooserInput): ReactionPlan {
  if (i.kind === 0x12) return { returned: 0xff, death: null, request: null, freeze: 0 };
  const t = i.target;
  const animatorSlot = i.redirected ? t.redirect : i.targetSlot;
  const maskTarget = interruptMask(t, 0, 0);
  const maskAnimator = interruptMask(i.animator, 0, 0);
  const gate = t.e71 !== 0 ? 0 : maskTarget;
  let death: ReactionPlan['death'] = null;
  let deathStarted = 0;
  if ((gate & ~4) === 0 && !i.queuePending) {
    death = [i.targetSlot, i.extra, i.callFlags];
    deathStarted = animatorSlot !== i.targetSlot ? 0 : i.deathStarted;
    if (animatorSlot === i.targetSlot && deathStarted !== 0) return { returned: i.targetSlot, death, request: null, freeze: 0 };
  }
  const ask = wanted(i);
  if ((maskAnimator & ~2) !== 0) return { returned: deathStarted !== 0 ? animatorSlot : 0xff, death, request: null, freeze: ask?.damageKind ? 2 : 0 };
  if (ask !== null && (i.callFlags & 1) === 0) {
    return { returned: i.requestAccepted !== 0 ? animatorSlot : 0xff, death, request: [animatorSlot, ask.tag, ask.cls, ask.flag, 0, 1, i.extra], freeze: 0 };
  }
  return { returned: deathStarted !== 0 ? animatorSlot : 0xff, death, request: null, freeze: 0 };
}

/** What the speed ratio reads. `motion` is the motion id being played; `freezeTest` asks for the hit-stop rule. */
export interface RatioInput {
  motion: number;
  freezeTest: boolean;
  /** The global battle-pause test is set. */
  paused: boolean;
  /** The animating character: its motion-type word (`Chr+0x758`, bit 0x2000 = not stopped by hits), freeze counter, battle and party flags, fixed-ratio override. */
  self: { motionType: number; freeze: number; inBattle: boolean; partyFlag: boolean; fixedOn: number; fixedRatio: number };
  /** The root character: status word 1, the Stop byte, Haste, Slow, the override and the base ratio (0x100 = 1.0). */
  root: { status1: number; stop: number; haste: boolean; slow: boolean; fixedOn: number; fixedRatio: number; base: number };
}

/**
 * `pp_motion_speed_ratio` (exe 0x00632200): the animation speed in 8.8 fixed point (0x100 = 1.0) as `base * factor / 8`. Petrify or Stop: 0.
 * The hit-stop (a positive freeze counter on a character without the not-stopped bit, when asked): 0. Haste: factor 16, so **0x200
 * = 2.0**. Slow: factor 4 (0x80 = 0.5) **only for motion ids 0x10 to 0x2a** (the stance loops: idle, weak, guard); every attack, cast,
 * damage and movement motion keeps 1.0. A character out of battle or without the party flag under the pause gets 0. A fixed override
 * on the animating character, else on the root, replaces the result.
 */
export function animationRatio(i: RatioInput): number {
  let factor = 8;
  if ((i.root.status1 & 2) !== 0 || i.root.stop !== 0) factor = 0;
  else if (i.freezeTest && (i.self.motionType & 0x2000) === 0 && i.self.freeze > 0) factor = 0;
  else if (i.root.haste) factor = 0x10;
  else if (i.root.slow && i.motion - 0x10 >= 0 && i.motion - 0x10 <= 0x1a) factor = 4;
  if ((!i.self.inBattle || !i.self.partyFlag) && i.paused) factor = 0;
  if (i.self.fixedOn === 1) return i.self.fixedRatio;
  if (i.root.fixedOn === 1) return i.root.fixedRatio;
  return (i.root.base * factor) >> 3;
}

/** One character as the per-step update reads it. */
export interface ChainUpdateState {
  /** `Chr+0x5ad`: the chain counter. */
  chain: number;
  /** `Chr+0xd98`: damage-level tag requests in flight (queued or running). */
  damageInFlight: number;
  /** `Chr+0xd58`: the freeze counter. */
  freeze: number;
  /** The character's owner (ids 3 to 8 read girl 0 to 2) is Stopped or Petrified. */
  stoppedOrPetrified: boolean;
}

/**
 * The per-step character update (exe 0x00643d80), as far as the chain goes: the freeze counter falls by one if positive, THEN the chain
 * counter is set to 0 if the character is Stopped or Petrified, or has no damage tag in flight and a zero freeze counter. So the chain
 * lives exactly as long as the reaction: the hit machine's entry stays in flight while the damage clip plays.
 */
export function chainUpdate(s: ChainUpdateState): { chain: number; freeze: number } {
  const freeze = s.freeze > 0 ? s.freeze - 1 : s.freeze;
  const cleared = s.stoppedOrPetrified || (s.damageInFlight === 0 && freeze === 0);
  return { chain: cleared ? 0 : s.chain, freeze };
}

/** Result kinds that keep an existing chain alive without raising the counter: the reaction runs, no HP number is applied (note FFX2-G01 section 5). */
export function keepsChainAlive(kind: number): boolean {
  return kind === ResultKind.MagicInvalid || kind === ResultKind.PhysicalInvalid || kind === ResultKind.StatusHit || (kind >= 13 && kind <= 16);
}
