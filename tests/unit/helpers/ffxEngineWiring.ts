/**
 * Rig for `parity-ffx-engine-wiring.test.ts`: generated battle situations written in the GAME's terms (stat bytes,
 * stacks, status bits, element byte masks, auto-ability words), the engine's combatants built from them, and the kernel
 * inputs built from them again by an independent route, so a test can run the engine's own damage path and the
 * kernels side by side on the same draws.
 *
 * **Game case: FFX only.** Nothing here imports `src/battle/ffx/adapt/`: the oracle is written out again on purpose, so
 * a mistake in the adapter's translation of an engine fact into a kernel input shows as a difference.
 */

import { SeededRng, makeRng } from '../../../src/battle/common/rng.ts';
import type {
  AbilityDef,
  Affinity,
  BattleState,
  ElementId,
  EquipmentDef,
  FFXCombatant,
  FFXPlainAttack,
  StatusId,
  StatusInstance,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/index.ts';
import { tickSpeed as baseCtb } from '../../../src/battle/ffx/kernel/ctb.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import type { CritCheckInput } from '../../../src/battle/ffx/kernel/crit.ts';
import type { HitCheckInput } from '../../../src/battle/ffx/kernel/hit.ts';
import type { HitInput } from '../../../src/battle/ffx/kernel/hitdamage.ts';
import { fighter, stats } from '../ffx-fixtures.test.ts';

/** A stream whose `int(min, max)` hands out scripted RAW 31-bit values reduced the way the game reduces them, and logs each request. */
export class ScriptedRng extends SeededRng {
  readonly calls: Array<{ min: number; max: number; raw: number }> = [];
  private cursor = 0;

  constructor(private readonly raws: readonly number[]) {
    super(0);
  }

  override int(min: number, max: number): number {
    const raw = this.raws[this.cursor++ % this.raws.length] as number;
    this.calls.push({ min, max, raw });
    return min + (raw % (max - min + 1));
  }

  override next(): number {
    throw new Error('the FFX hit pipeline must draw through int()');
  }

  /** The kind of each draw: V a damage variance (0..31), P a percent roll (0..100), T Threaten's roll (0..99). */
  kinds(): string {
    return this.calls.map((c) => (c.max === 31 ? 'V' : c.max === 100 ? 'P' : c.max === 99 ? 'T' : `?${c.min}-${c.max}`)).join('');
  }
}

/** One side of a situation, in the game's terms. */
export interface SideSpec {
  str: number; mag: number; def: number; mdef: number; acc: number; eva: number; luck: number; agi: number;
  hp: number; mp: number; maxHp: number; maxMp: number; ctb: number;
  cheer: number; focus: number; aim: number; reflex: number; luckStack: number; jinx: number;
  zombie: boolean; powerBreak: boolean; magicBreak: boolean; armorBreak: boolean; mentalBreak: boolean;
  berserk: boolean; darkness: boolean; sleep: boolean; petrify: boolean;
  shield: boolean; boost: boolean; defend: boolean; sentinel: boolean; protect: boolean; shell: boolean;
  /** Nul-Blaze, Nul-Frost, Nul-Shock, Nul-Tide counters: 0 none, 1 or 2 charges, 255 a permanent one. */
  nul: [number, number, number, number];
  /** Byte masks over fire 1, ice 2, thunder 4, water 8, holy 0x10; disjoint, as the engine keeps one affinity per element. */
  absorb: number; nullMask: number; resist: number; weak: number;
  armored: boolean; immunePct: boolean; immunePhys: boolean; immuneMag: boolean; immuneAll: boolean; immuneDelay: boolean;
  magicBooster: boolean; alchemy: boolean; pierce: boolean; breakLimit: boolean;
  offPhys: number; offMag: number; defPhys: number; defMag: number;
  dmg9999: boolean; alwaysCrit: boolean; equipCrit: number; weaponElement: number;
}

export interface Situation {
  def: AbilityDef;
  user: SideSpec;
  target: SideSpec;
  userSide: 'party' | 'enemy';
  /** Raw 31-bit draws, as many as any hit can take. */
  raws: number[];
  power?: number;
  gilSpent?: number;
  timing?: { timeRemainingMs: number; timerMs: number };
  /** The user is an enemy with this plain-Attack record of its own (the generic Attack resolves on it). */
  plainAttack?: FFXPlainAttack;
  /** The command id the pipeline should see as the one being run, when it is not the record's own. */
  currentCommand?: number;
}

const ELEMENTS: ReadonlyArray<readonly [ElementId, number]> = [
  ['fire', 1], ['ice', 2], ['lightning', 4], ['water', 8], ['holy', 0x10],
];
const PERCENTS = [0, 3, 5, 10, 20] as const;

function pick<T>(rng: SeededRng, xs: readonly T[]): T {
  return rng.pick(xs);
}
const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;

/** A random side. Probabilities are tuned so the interesting statuses and masks show up in a few hundred situations. */
export function randomSide(rng: SeededRng, user: boolean): SideSpec {
  const bigStat = (): number => (chance(rng, 0.15) ? rng.int(200, 255) : rng.int(0, 120));
  const maxHp = user ? rng.int(100, 9999) : 99999;
  const maxMp = rng.int(50, 999);
  const disjoint = (): { absorb: number; nullMask: number; resist: number; weak: number } => {
    const out = { absorb: 0, nullMask: 0, resist: 0, weak: 0 };
    for (const [, bit] of ELEMENTS) {
      const roll = rng.next();
      if (roll < 0.1) out.weak |= bit;
      else if (roll < 0.18) out.resist |= bit;
      else if (roll < 0.22) out.nullMask |= bit;
      else if (roll < 0.28) out.absorb |= bit;
    }
    return out;
  };
  const aff = disjoint();
  return {
    str: bigStat(), mag: bigStat(), def: bigStat(), mdef: bigStat(),
    acc: rng.int(0, 255), eva: rng.int(0, 120), luck: rng.int(0, 60), agi: rng.int(1, 120),
    hp: user ? rng.int(1, maxHp) : maxHp, mp: rng.int(20, maxMp), maxHp, maxMp, ctb: rng.int(0, 90),
    cheer: chance(rng, 0.25) ? rng.int(1, 5) : 0, focus: chance(rng, 0.25) ? rng.int(1, 5) : 0,
    aim: chance(rng, 0.2) ? rng.int(1, 5) : 0, reflex: chance(rng, 0.2) ? rng.int(1, 5) : 0,
    luckStack: chance(rng, 0.2) ? rng.int(1, 5) : 0, jinx: chance(rng, 0.2) ? rng.int(1, 5) : 0,
    zombie: chance(rng, 0.12), powerBreak: chance(rng, 0.1), magicBreak: chance(rng, 0.1),
    armorBreak: chance(rng, 0.15), mentalBreak: chance(rng, 0.15), berserk: chance(rng, 0.15),
    darkness: chance(rng, 0.2), sleep: chance(rng, 0.08), petrify: chance(rng, 0.04),
    shield: chance(rng, 0.1), boost: chance(rng, 0.1), defend: chance(rng, 0.15), sentinel: chance(rng, 0.08),
    protect: chance(rng, 0.2), shell: chance(rng, 0.2),
    nul: [0, 1, 2, 3].map(() => (chance(rng, 0.1) ? pick(rng, [1, 2, 255]) : 0)) as [number, number, number, number],
    ...aff,
    armored: chance(rng, 0.2), immunePct: chance(rng, 0.1), immunePhys: chance(rng, 0.04),
    immuneMag: chance(rng, 0.04), immuneAll: chance(rng, 0.03), immuneDelay: chance(rng, 0.2),
    magicBooster: chance(rng, 0.25), alchemy: chance(rng, 0.25), pierce: chance(rng, 0.2), breakLimit: chance(rng, 0.25),
    offPhys: pick(rng, PERCENTS), offMag: pick(rng, PERCENTS), defPhys: pick(rng, PERCENTS), defMag: pick(rng, PERCENTS),
    dmg9999: chance(rng, 0.06), alwaysCrit: chance(rng, 0.08), equipCrit: chance(rng, 0.5) ? rng.int(0, 30) : 0,
    weaponElement: chance(rng, 0.2) ? pick(rng, [1, 2, 4, 8]) : 0,
  };
}

const AUTO_TIERS = (family: 'strength' | 'magic' | 'defense' | 'magic-def', pct: number): string | null =>
  pct === 0 ? null : `${family}-${pct}`;

/** The engine's combatant for a side. */
export function combatantOf(spec: SideSpec, id: string, side: 'party' | 'enemy'): FFXCombatant {
  const status = (s: StatusId, over: Partial<StatusInstance> = {}): [StatusId, StatusInstance] => [
    s,
    { id: s, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over },
  ];
  const on: Array<[StatusId, StatusInstance]> = [];
  const flag = (cond: boolean, s: StatusId): void => {
    if (cond) on.push(status(s));
  };
  flag(spec.zombie, 'zombie'); flag(spec.powerBreak, 'power-break'); flag(spec.magicBreak, 'magic-break');
  flag(spec.armorBreak, 'armor-break'); flag(spec.mentalBreak, 'mental-break'); flag(spec.berserk, 'berserk');
  flag(spec.darkness, 'darkness'); flag(spec.sleep, 'sleep'); flag(spec.petrify, 'petrify');
  flag(spec.shield, 'shield'); flag(spec.boost, 'boost'); flag(spec.defend, 'defend'); flag(spec.sentinel, 'sentinel');
  flag(spec.protect, 'protect'); flag(spec.shell, 'shell'); flag(spec.dmg9999, 'damage-9999');
  flag(spec.alwaysCrit, 'guaranteed-critical');
  for (const [s, v] of [['cheer', spec.cheer], ['focus', spec.focus], ['aim', spec.aim], ['reflex', spec.reflex], ['luck', spec.luckStack], ['jinx', spec.jinx]] as const) {
    if (v > 0) on.push(status(s, { stacks: v }));
  }
  const nulIds: StatusId[] = ['nulblaze', 'nulfrost', 'nulshock', 'nultide'];
  spec.nul.forEach((n, i) => {
    if (n === 255) on.push(status(nulIds[i] as StatusId, { permanent: true, charges: null }));
    else if (n > 0) on.push(status(nulIds[i] as StatusId, { charges: n }));
  });
  const affinities: Partial<Record<ElementId, Affinity>> = {};
  for (const [el, bit] of ELEMENTS) {
    if (spec.weak & bit) affinities[el] = 'weak';
    else if (spec.resist & bit) affinities[el] = 'resist';
    else if (spec.nullMask & bit) affinities[el] = 'immune';
    else if (spec.absorb & bit) affinities[el] = 'absorb';
  }
  const flags: FFXCombatant['immunityFlags'] = [];
  if (spec.armored) flags.push('armored');
  if (spec.immunePct) flags.push('immune-to-percentage-damage');
  if (spec.immunePhys) flags.push('immune-to-physical-damage');
  if (spec.immuneMag) flags.push('immune-to-magical-damage');
  if (spec.immuneAll) flags.push('immune-to-damage');
  if (spec.immuneDelay) flags.push('immune-to-delay');
  const autos = [
    spec.magicBooster ? 'magic-booster' : null, spec.alchemy ? 'alchemy' : null, spec.pierce ? 'piercing' : null,
    spec.breakLimit ? 'break-damage-limit' : null, AUTO_TIERS('strength', spec.offPhys), AUTO_TIERS('magic', spec.offMag),
    AUTO_TIERS('defense', spec.defPhys), AUTO_TIERS('magic-def', spec.defMag),
    spec.weaponElement === 1 ? 'firestrike' : spec.weaponElement === 2 ? 'icestrike' : spec.weaponElement === 4 ? 'lightningstrike' : spec.weaponElement === 8 ? 'waterstrike' : null,
  ].filter((x): x is string => x !== null);
  const weapon = { name: 'W', slots: 4, autoAbilities: autos, bonusCrit: spec.equipCrit } as unknown as EquipmentDef;
  const c = fighter({
    id,
    side,
    stats: stats({
      str: spec.str, mag: spec.mag, def: spec.def, mdef: spec.mdef, acc: spec.acc, eva: spec.eva, luck: spec.luck, agi: spec.agi,
      hp: spec.maxHp, mp: spec.maxMp, maxHp: spec.maxHp, maxMp: spec.maxMp,
    }),
    affinities,
    immunityFlags: flags,
    equipment: { weapon, armor: { name: 'A', slots: 1, autoAbilities: [] } },
  });
  c.hp = spec.hp;
  c.mp = spec.mp;
  c.statuses = Object.fromEntries(on);
  return c;
}

/** A battle context around two combatants, drawing from `rng`. */
export function contextOf(
  user: FFXCombatant,
  target: FFXCombatant,
  rng: SeededRng,
  ctbOfTarget: number,
  others: readonly FFXCombatant[] = [],
): { ctx: Ctx; events: Array<Record<string, unknown>> } {
  const everyone = [user, target, ...others];
  const combatants: Record<string, FFXCombatant> = Object.fromEntries(everyone.map((c) => [c.id, c]));
  const state: BattleState = {
    game: 'ffx', combatants,
    activeIds: everyone.filter((c) => c.side === 'party').map((c) => c.id),
    reserveIds: [], enemyIds: everyone.filter((c) => c.side === 'enemy').map((c) => c.id),
    aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0,
    finished: false, aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 99999,
    chained: false, overkilled: [], canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const c of everyone) rt.actors.set(c.id, makeActorRuntime(c));
  for (const c of [target, ...others]) rt.actors.get(c.id)!.ctb = ctbOfTarget;
  const events: Array<Record<string, unknown>> = [];
  const ctx: Ctx = {
    state, rt, rng: rng as never, content: new FFXContentRegistry(),
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      state.log.push(full as never);
      events.push(full as never);
    },
  };
  return { ctx, events };
}

// ---------------------------------------------------------------- the oracle: kernel inputs from the spec

const PERM = { zombie: 0x02, petrify: 0x04, powerBreak: 0x10, magicBreak: 0x20, armorBreak: 0x40, mentalBreak: 0x80, berserk: 0x200 } as const;
const FORMULA: Readonly<Record<string, number>> = {
  none: 0, strength: 1, 'piercing-strength': 2, magic: 3, 'piercing-magic': 4, 'percent-current': 5, 'fixed-no-variance': 6,
  healing: 7, 'percent-total': 8, fixed: 9, ctb: 0xd, 'special-magic': 0xf, 'user-max-hp': 0x10, gil: 0x15, 'deal-9999': 0x17, lancet: 4,
};

export function permOf(s: SideSpec): number {
  let w = 0;
  if (s.zombie) w |= PERM.zombie;
  if (s.petrify) w |= PERM.petrify;
  if (s.powerBreak) w |= PERM.powerBreak;
  if (s.magicBreak) w |= PERM.magicBreak;
  if (s.armorBreak) w |= PERM.armorBreak;
  if (s.mentalBreak) w |= PERM.mentalBreak;
  if (s.berserk) w |= PERM.berserk;
  return w;
}

/** The kernels' three inputs for one hit, with the target's running totals as they stand. */
export interface Live {
  hp: number;
  mp: number;
  ctb: number;
  sleep: boolean;
}

export function oracleInputs(sit: Situation, live: Live): { hit: HitCheckInput; crit: CritCheckInput; input: HitInput } {
  const running: [number, number, number] = [live.hp, live.mp, live.ctb];
  const { def, user, target } = sit;
  const rec = def.record;
  if (!rec) throw new Error(`the oracle needs the game's record for ${def.id}`);
  const flagsMisc = rec.flagsMisc; // Delay Attack and Buster included: the hit kernel applies them (re-parity W2)
  const power = sit.power ?? def.power;
  const usesWeapon = (flagsMisc & 0x40000) !== 0;
  const elementOf = (els: readonly ElementId[]): number => els.reduce((m, e) => m | (ELEMENTS.find(([n]) => n === e)?.[1] ?? 0), 0);
  const cmdElement = elementOf(def.element);
  const perm = permOf(target);
  const extra = (target.shield ? 0x40 : 0) | (target.boost ? 0x80 : 0) | (target.defend ? 0x800 : 0) | (target.sentinel ? 0x2000 : 0);
  const accuracy = def.accuracy ?? 0;
  const timer = sit.timing?.timerMs ?? 0;
  return {
    hit: {
      cmd: { flagsMisc, accuracy },
      user: { acc: user.acc, luck: user.luck, darkness: user.darkness ? 1 : 0, aim: user.aim, luckStack: user.luckStack },
      target: { status: perm, eva: target.eva, luck: target.luck, reflex: target.reflex, jinx: target.jinx },
      rec: { sleep: live.sleep ? 1 : 0, status: perm },
      counterKind: 0,
    },
    crit: {
      cmd: { flagsDamage: rec.flagsDamage, critBonus: def.bonusCrit ?? 0 },
      user: { luck: user.luck, luckStack: user.luckStack, equipmentCrit: user.equipCrit, buffFlags: user.alwaysCrit ? 0x10 : 0 },
      target: { luck: target.luck, jinx: target.jinx },
    },
    input: {
      user: {
        id: 0, str: user.str, mag: user.mag, cheer: user.cheer, focus: user.focus, maxHp: user.maxHp, maxMp: user.maxMp,
        hp: user.hp, mp: user.mp, perm: permOf(user),
        autoA: (user.magicBooster ? 0x40 : 0) | (user.alchemy ? 0x200 : 0) | (user.pierce ? 0x2000 : 0),
        autoB: user.breakLimit ? 0x800 : 0, buffFlags: user.dmg9999 ? 0x08 : 0, defaultAttack: 0x3000,
        currentCommand: sit.currentCommand ?? rec.id, bonusFlag: 0,
        weapon: { formula: FORMULA[def.formula] as number, power, element: usesWeapon ? user.weaponElement : 0 },
        partyDealt: { phys: user.offPhys, mag: user.offMag },
        scale: timer > 0 ? { a: Math.min(sit.timing!.timeRemainingMs, timer), b: timer } : null,
      },
      target: {
        id: 0xff, saveCounter: 0, def: target.def, mdf: target.mdef, cheer: target.cheer, focus: target.focus,
        maxHp: target.maxHp, maxMp: target.maxMp, baseCtb: baseCtb(target.agi) * 3, runningHp: running[0], runningMp: running[1], runningCtb: running[2],
        extra,
        special: (target.armored ? 1 : 0) | (target.immunePct ? 2 : 0) | (target.immunePhys ? 0x20 : 0) | (target.immuneMag ? 0x40 : 0) | (target.immuneAll ? 0x80 : 0),
        delayImmune: target.immuneDelay, tickSpeed: baseCtb(target.agi), overkillThreshold: 0x7fffffff,
        affinity: { absorb: target.absorb, null: target.nullMask, resist: target.resist, weak: target.weak },
        partyTaken: { phys: target.defPhys, mag: target.defMag },
      },
      cmd: {
        id: rec.id, type: rec.type, flagsMisc, flagsDamage: rec.flagsDamage, damageClass: rec.damageClass,
        formula: FORMULA[def.formula] as number, power, element: cmdElement,
      },
      record: {
        perm, extra: (target.shield ? 0x40 : 0) | (target.boost ? 0x80 : 0) | (target.defend ? 0x800 : 0) | (target.sentinel ? 0x2000 : 0),
        shell: target.shell ? 1 : 0, protect: target.protect ? 1 : 0,
        nul: { blaze: target.nul[0], frost: target.nul[1], shock: target.nul[2], tide: target.nul[3] },
      },
      gilOffered: sit.gilSpent ?? 0,
    },
  };
}

/**
 * The abilities a random situation may use: recorded, damaging, single-target, nothing scripted, no revival.
 *
 * This pool is the DAMAGE oracle's (W1): each copy keeps the game's record words but not its status payload (the chance, duration,
 * extra-word, stage and buff bytes) or a shatter chance, so a hit's only draws are the hit roll, the variances and the critical roll.
 * The statuses of a hit are proven in `parity-ffx-engine-status.test.ts`. (A Petrified target still costs the status step's one
 * shatter draw, which the damage test's oracle spends as well.)
 */
export function wiringPool(all: readonly AbilityDef[]): AbilityDef[] {
  return all
    .filter(
      (a) =>
        a.record !== undefined &&
        a.formula !== 'none' &&
        (a.record.damageClass & 7) !== 0 &&
        (a.targeting === 'single-enemy' || a.targeting === 'single-ally' || a.targeting === 'single-any') &&
        !a.flags.includes('can-target-dead') &&
        !a.flags.includes('destroys-user') &&
        a.extra?.['script'] === undefined &&
        a.extra?.['statsFrom'] === undefined &&
        a.extra?.['opensSubmenu'] === undefined &&
        a.extra?.['stealRoll'] === undefined &&
        a.hits >= 1 &&
        a.hits <= 3,
    )
    .map((a) => {
      const copy: AbilityDef = {
        ...a,
        statusEffects: [],
        removesStatuses: [],
        flags: a.flags.filter((f) => f !== 'removes-statuses' && f !== 'shatter' && f !== 'weak-delay' && f !== 'strong-delay'),
        ...(a.extra?.['restoresPool'] !== undefined ? { extra: { restoresPool: a.extra['restoresPool'] } } : { extra: {} }),
      };
      delete copy.shatterChance;
      if (a.record) {
        const { id, type, flagsMisc, flagsDamage, damageClass, rank } = a.record;
        copy.record = { id, type, flagsMisc, flagsDamage, damageClass, ...(rank !== undefined ? { rank } : {}) };
      }
      return copy;
    });
}

/** A random situation for one ability of the pool. */
export function randomSituation(rng: SeededRng, pool: readonly AbilityDef[]): Situation {
  const def = pool[rng.int(0, pool.length - 1)] as AbilityDef;
  const userSide = def.category === 'enemy' ? 'enemy' : 'party';
  const sit: Situation = {
    def,
    userSide,
    user: randomSide(rng, true),
    target: randomSide(rng, false),
    raws: Array.from({ length: 24 }, () => rng.int(0, 0x7fffffff)),
  };
  if (chance(rng, 0.2)) sit.power = rng.int(1, 70);
  if (def.formula === 'gil') sit.gilSpent = rng.int(10, 5000);
  if (def.category === 'overdrive' && chance(rng, 0.5)) {
    const timerMs = pick(rng, [2200, 3000, 4000]);
    sit.timing = { timerMs, timeRemainingMs: rng.int(0, timerMs) };
  }
  return sit;
}

export { makeRng };
