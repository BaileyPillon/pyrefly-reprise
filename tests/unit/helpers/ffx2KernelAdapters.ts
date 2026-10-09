/**
 * Adapters between the emulator harness' FFX-2 vector records (`tests/fixtures/parity/ffx2/*.json`) and the
 * inputs and outputs of the kernels in `src/battle/ffx2/kernel/`.
 *
 * The harness describes a whole struct per vector (`attacker`, `cmd`, `result`, ...); a kernel takes only the
 * fields the game function reads, named for what they are. These functions do that translation and nothing
 * else, so a parity test is "adapt, run, compare". Game case: FFX-2 only.
 */

import type { CritInput } from '../../../src/battle/ffx2/kernel/crit.ts';
import type {
  HitAction,
  HitActionResult,
  HitAttacker,
  HitCommand,
  HitOptions,
  HitTarget,
} from '../../../src/battle/ffx2/kernel/hit.ts';
import { accuracyFormulaOf } from '../../../src/battle/ffx2/kernel/hit.ts';
import { isMonsterSlot } from '../../../src/battle/ffx2/kernel/rng.ts';
import type {
  StatusAttacker,
  StatusCommand,
  StatusOptions,
  StatusResult,
  StatusTarget,
} from '../../../src/battle/ffx2/kernel/status.ts';
import { expandVector } from './ffx2ParityFixture.ts';

type Bytes = number[];

const zeros = (): Bytes => new Array<number>(24).fill(0);
const s16 = (x: number): number => (x << 16) >> 16;

// ---------------------------------------------------------------------------------------------------
// hit_determine (exe 0x641500)
// ---------------------------------------------------------------------------------------------------

interface HitVectorTarget {
  id: number;
  ownerId?: number | 'id';
  sideTag: number;
  level: number;
  maxHp: number;
  luck: number;
  eva: number;
  flags3a7: number;
  resist404: number;
  resist405: number;
  resist40e: number;
  status: number;
  stop: number;
  evaStage: number;
  luckStage: number;
  flags650: number;
  resist66b: number;
  accum67c: number;
  reactD98: number;
  reactD99: number;
}

interface HitVectorIn {
  attackerId: number;
  attacker: { level: number; luck: number; acc: number; accStage: number; luckStage: number; status: number };
  action: { cmdId: number; round: number; maxRounds: number; amount: number; hitsOverride: number };
  cmd: { misc: number; damage: number; accuracy: number; power: number; hits: number };
  globals: { debugForceHit: number; debugForceMiss: number; aidCount: number };
  targets: Partial<HitVectorTarget>[];
  others: { id: number; status?: number; stop?: number }[];
}

export interface HitKernelCase {
  attacker: HitAttacker;
  command: HitCommand;
  action: HitAction;
  targets: HitTarget[];
  options: HitOptions;
  formula: number;
}

/** The harness' `hit_determine` input as the kernel's. `defaults` is the file's `defaults` object. */
export function hitCaseFromVector(defaults: Record<string, unknown>, sparse: Record<string, unknown>): HitKernelCase {
  const e = expandVector(defaults, sparse) as unknown as HitVectorIn;
  const targetDefaults = (defaults['target'] ?? {}) as Partial<HitVectorTarget>;
  const full: HitVectorTarget[] = e.targets.map((t) => ({ ...(targetDefaults as HitVectorTarget), ...t }) as HitVectorTarget);
  // The stop-state fields are read from the target's OWNER chr: another target, a listed extra chr, or itself.
  const holders = new Map<number, { status: number; stop: number }>();
  for (const o of e.others) holders.set(o.id, { status: o.status ?? 0, stop: o.stop ?? 0 });
  for (const t of full) holders.set(t.id, { status: t.status, stop: t.stop });
  const misc = e.cmd.misc;
  return {
    formula: accuracyFormulaOf(misc),
    attacker: {
      id: e.attackerId,
      level: e.attacker.level,
      luck: e.attacker.luck,
      acc: e.attacker.acc,
      accStage: e.attacker.accStage,
      luckStage: e.attacker.luckStage,
      darkness: (e.attacker.status & 0x10) !== 0,
    },
    command: {
      id: e.action.cmdId,
      formula: accuracyFormulaOf(misc),
      darknessApplies: (misc & 0x40) !== 0,
      accuracy: e.cmd.accuracy,
      power: e.cmd.power,
      hits: e.cmd.hits,
      physicalOnly: (e.cmd.damage & 3) === 1,
      randomTargets: (misc & 0x4000) !== 0,
    },
    action: {
      repeatCount: e.action.round,
      repeatLimit: e.action.maxRounds,
      amount: e.action.amount,
      hitsOverride: e.action.hitsOverride,
    },
    targets: full.map((t) => {
      const owner = holders.get(t.ownerId === undefined || t.ownerId === 'id' ? t.id : t.ownerId) ?? { status: 0, stop: 0 };
      return {
        id: t.id,
        level: t.level,
        luck: t.luck,
        eva: t.eva,
        evaStage: t.evaStage,
        luckStage: t.luckStage,
        asleep: (owner.status & 4) !== 0,
        petrified: (owner.status & 2) !== 0,
        stopped: owner.stop !== 0,
        evadesPhysical: (t.flags650 & 8) !== 0,
        inHitReaction: t.reactD98 !== 0 || t.reactD99 !== 0,
        // pp_is_aided_chr: a slot outside the monster range whose save index (sideTag) is 15 to 22.
        aided: !isMonsterSlot(t.id) && (t.sideTag - 0xf) >>> 0 < 8,
        maxHp: t.maxHp,
        accumulated: t.accum67c,
        bribeImmune: (t.flags3a7 & 1) !== 0,
        resistEject: t.resist40e,
        resistDeath: t.resist404,
        resistPetrify: t.resist405,
        resistSextic: t.resist66b,
      };
    }),
    options: {
      debugForceHit: e.globals.debugForceHit !== 0,
      debugForceMiss: e.globals.debugForceMiss !== 0,
      aidCount: e.globals.aidCount,
    },
  };
}

/** The kernel's answer in the shape of the vector's `out`. */
export function hitOutputLikeVector(r: HitActionResult, formula: number): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ret: r.mask,
    results: r.targets.map((t) => t.result),
    hitCount: r.hitCount,
    missCount: r.missCount,
    immuneCount: r.noEffectCount,
    hitsPlanned: r.hitsPlanned,
    perTargetHits: r.perTargetHits,
    // one entry per target that reached the compare (an immune target does not)
    trace: r.targets
      .filter((t) => !t.immune)
      .map((t) => ({ t: t.id, roll: t.roll ?? 0, threshold: t.threshold ?? 0, forceHit: t.forceHit ? 1 : 0, forceMiss: t.forceMiss ? 1 : 0 })),
  };
  if (formula === 6) out['accum'] = r.targets.map((t) => [t.bribe?.accumulated ?? 0, t.bribe?.threshold ?? 0]);
  return out;
}

/** The part of the vector's `out` the kernel reproduces (the file also carries nothing else). */
export function hitExpectedOut(out: Record<string, unknown>): Record<string, unknown> {
  const trace = (out['trace'] as Record<string, number>[]).map((x) => ({
    t: x['t'],
    roll: x['roll'],
    threshold: x['threshold'],
    forceHit: x['forceHit'],
    forceMiss: x['forceMiss'],
  }));
  return { ...out, trace };
}

// ---------------------------------------------------------------------------------------------------
// dmg_crit (exe 0x617210)
// ---------------------------------------------------------------------------------------------------

interface CritVectorIn {
  attacker: { id: number; luck: number; status: number; luckStage: number };
  target: { luck: number; luckStage: number };
  cmd: { damageFlags: number; critBonus: number };
  flagsIn: number;
  damage: number;
  globals: { debugAlwaysCrit: number };
}

export function critCaseFromVector(
  defaults: Record<string, unknown>,
  sparse: Record<string, unknown>,
): { input: CritInput; damage: number; flagsIn: number; debugForceCrit: boolean } {
  const e = expandVector(defaults, sparse) as unknown as CritVectorIn;
  return {
    input: {
      canCrit: (e.cmd.damageFlags & 4) !== 0,
      fixedChance: (e.cmd.damageFlags & 8) !== 0,
      critByte: e.cmd.critBonus,
      attackerSlot: e.attacker.id,
      attackerLuck: e.attacker.luck,
      attackerLuckStage: e.attacker.luckStage,
      targetLuck: e.target.luck,
      targetLuckStage: e.target.luckStage,
      alwaysCritical: (e.attacker.status & 0x8000) !== 0,
    },
    damage: e.damage,
    flagsIn: e.flagsIn,
    debugForceCrit: e.globals.debugAlwaysCrit !== 0,
  };
}

// ---------------------------------------------------------------------------------------------------
// status_roll_g1 (exe 0x619230) and status_roll_g2 (exe 0x619700)
// ---------------------------------------------------------------------------------------------------

interface StatusGlobals {
  debugForceLand: number;
  debugForceFail: number;
  stopActive: number;
  stopValue: number;
  stopTarget: number;
}

/** The scripted "check stop" gate: the roll function's last argument, or the helper's globals matching the target. */
function stopGateOf(g: StatusGlobals, targetId: number, argument: number): boolean {
  return argument !== 0 || ((g.stopActive & 0xff) !== 0 && s16(g.stopValue) + 1 !== 0 && targetId === (g.stopTarget & 0xff));
}

export interface StatusKernelCase {
  attacker: StatusAttacker;
  target: StatusTarget;
  command: StatusCommand;
  start: StatusResult;
  options: StatusOptions;
}

const dwordsToBytes = (d: number[]): Bytes => d.flatMap((x) => [x & 0xff, (x >>> 8) & 0xff, (x >>> 16) & 0xff, (x >>> 24) & 0xff]);

interface G1VectorIn {
  attackerId: number;
  weaponChances: Bytes | null;
  attackerLevel: number;
  targetId: number;
  resist: Bytes | null;
  targetLevel: number;
  targetStatus: number;
  immuneMask: number;
  cmd: { weaponFlag: number; damageFlags: number; chances: Bytes };
  result: { flagB: number; status34: number; stage38: number[]; cleanse50: number };
  classFlags: number;
  blockMask: number;
  stopFlag: number;
  globals: StatusGlobals;
}

export function status1CaseFromVector(defaults: Record<string, unknown>, sparse: Record<string, unknown>): StatusKernelCase {
  const e = expandVector(defaults, sparse) as unknown as G1VectorIn;
  return {
    attacker: {
      id: e.attackerId,
      level: e.attackerLevel,
      weaponChance1: e.weaponChances ?? zeros(),
      weaponChance2: zeros(),
      weaponAmount2: zeros(),
    },
    target: {
      id: e.targetId,
      level: e.targetLevel,
      status1: e.targetStatus,
      resist1: e.resist ?? zeros(),
      resist2: zeros(),
      protectMask: e.immuneMask,
      actionState: e.blockMask,
      activeBytes: zeros(),
      layerB: zeros(),
      layerD: zeros(),
    },
    command: {
      chance1: e.cmd.chances,
      chance2: zeros(),
      amount2: zeros(),
      cleanse: (e.cmd.damageFlags & 0x20) !== 0,
      usesWeapon: (e.cmd.weaponFlag & 1) !== 0,
    },
    start: {
      secondaryLayer: e.result.flagB !== 0,
      statusSet: e.result.status34,
      counters: dwordsToBytes(e.result.stage38),
      layerCSet: e.result.cleanse50,
      layerCBytes: zeros(),
      flags: e.classFlags,
    },
    options: {
      stopGate: stopGateOf(e.globals, e.targetId, e.stopFlag),
      debugForceLand: e.globals.debugForceLand !== 0,
      debugForceFail: e.globals.debugForceFail !== 0,
    },
  };
}

interface G2VectorIn {
  attackerId: number;
  targetId: number;
  attacker: { level: number; weaponChances: Bytes; weaponAmounts: Bytes };
  target: { level: number; status: number; resist: Bytes; stages: Bytes; at500: Bytes; at574: Bytes };
  cmd: { weaponFlag: number; damageFlags: number; chances: Bytes; amounts: Bytes };
  result: { flagB: number; status34: number; stages: Bytes; second: Bytes };
  classFlags: number;
  blockMask: number;
  stopFlag: number;
  damage: number[];
  globals: StatusGlobals;
}

export function status2CaseFromVector(
  defaults: Record<string, unknown>,
  sparse: Record<string, unknown>,
): StatusKernelCase & { damage: number[] } {
  const e = expandVector(defaults, sparse) as unknown as G2VectorIn;
  return {
    attacker: {
      id: e.attackerId,
      level: e.attacker.level,
      weaponChance1: zeros(),
      weaponChance2: e.attacker.weaponChances,
      weaponAmount2: e.attacker.weaponAmounts,
    },
    target: {
      id: e.targetId,
      level: e.target.level,
      status1: e.target.status,
      resist1: zeros(),
      resist2: e.target.resist,
      protectMask: 0,
      actionState: e.blockMask,
      activeBytes: e.target.stages,
      layerB: e.target.at500,
      layerD: e.target.at574,
    },
    command: {
      chance1: zeros(),
      chance2: e.cmd.chances,
      amount2: e.cmd.amounts,
      cleanse: (e.cmd.damageFlags & 0x20) !== 0,
      usesWeapon: (e.cmd.weaponFlag & 1) !== 0,
    },
    start: {
      secondaryLayer: e.result.flagB !== 0,
      statusSet: e.result.status34,
      counters: e.result.stages,
      layerCSet: 0,
      layerCBytes: e.result.second,
      flags: e.classFlags,
    },
    options: {
      stopGate: stopGateOf(e.globals, e.targetId, e.stopFlag),
      debugForceLand: e.globals.debugForceLand !== 0,
      debugForceFail: e.globals.debugForceFail !== 0,
    },
    damage: e.damage,
  };
}

/** The statuses that reached the `roll < threshold` compare, in the vector's `trace` shape. */
export function statusTraceLikeVector(
  log: readonly { index: number; roll: number | null; chance: number; resist: number }[],
  attackerLevel: number,
  targetLevel: number,
): { i: number; roll: number | null; threshold: number }[] {
  const levels = Math.imul(attackerLevel - targetLevel, 5);
  return log
    .filter((e) => e.roll !== null && e.chance !== 0xff && e.chance !== 0xfe && e.resist !== 0xff)
    .map((e) => ({ i: e.index, roll: e.roll, threshold: (levels - e.resist + e.chance) | 0 }));
}
