/**
 * Rig for `parity-ffx2-engine-wiring.test.ts`: generated battle situations written in the GAME's terms (stat bytes,
 * signed stage steps, status word 1 bits, group 2 counters, element byte masks, special-flag words), and the engine's
 * units built from them. The oracle (`ffx2WiringOracle.ts`) builds the kernel inputs from the same situations by an
 * independent route.
 *
 * **Game case: FFX-2 only.** Nothing here imports `src/battle/ffx2/adapt/`: the two status-slot tables below are written
 * out again on purpose (`research/re-ffx2-hit-status.md` section 4), so a mistake in the adapter's translation of an
 * engine fact into a kernel input shows as a difference.
 */

import { SeededRng, makeRng } from '../../../src/battle/common/rng.ts';
import type { AbilityDef, ElementId, EnemyRewards, StatusId } from '../../../src/battle/common/types.ts';
import { TICKS_PER_DURATION_UNIT } from '../../../src/battle/ffx2/constants.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';

export { makeRng };

/** The engine's status ids by game slot (group 1: one bit each; group 2: the ids sharing a byte, a stage's Up then Down). */
export const G1: ReadonlyArray<StatusId | null> = [
  'ko', 'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'defend', 'eject',
  'max-hp-x2', 'max-mp-x2', 'spellspring', 'damage-9999', 'guaranteed-critical', 'pointless', 'itchy', 'auto-life',
  null, null, null, null, null,
];
export const G2: ReadonlyArray<readonly StatusId[]> = [
  ['shell'], ['protect'], ['reflect'], ['regen'], ['haste'], ['slow'], ['stop'],
  ['str-up', 'str-down'], ['mag-up', 'mag-down'], ['def-up', 'def-down'], ['mdef-up', 'mdef-down'],
  ['accu-up', 'accu-down'], ['eva-up', 'eva-down'], ['luck-up', 'luck-down'],
  ['doom'], ['null-physical'], ['null-magic'], ['invincible'],
  [], [], [], [], [], [],
];
/** Group 2 slots that hold a signed stage, and which stat each is. */
export const STAGE = { str: 7, mag: 8, def: 9, mdef: 10, acc: 11, eva: 12, luck: 13 } as const;

/** The element bits and the engine's element names. */
export const ELEMENT_BITS: ReadonlyArray<readonly [ElementId, number]> = [
  ['fire', 1], ['ice', 2], ['lightning', 4], ['water', 8], ['gravity', 0x10], ['holy', 0x20],
];

/** A stream whose `int(min, max)` hands out scripted RAW 31-bit values reduced the way the game reduces them. */
export class ScriptedRng extends SeededRng {
  /** The `max` of every `int(0, max)` the engine asked for, in order. */
  readonly asked: number[] = [];
  private cursor = 0;

  constructor(private readonly raws: readonly number[]) {
    super(0);
  }

  override int(min: number, max: number): number {
    if (min !== 0) throw new Error(`the FFX-2 kernels reduce from 0, not ${min}`);
    this.asked.push(max);
    const raw = this.raws[this.cursor++ % this.raws.length] as number;
    return raw % (max + 1);
  }

  override next(): number {
    throw new Error('the FFX-2 hit pipeline must draw through int()');
  }
}

/** One fighter, in the game's terms. */
export interface SideSpec {
  level: number;
  str: number; mag: number; def: number; mdef: number; acc: number; eva: number; luck: number;
  hp: number; maxHp: number; mp: number; maxMp: number;
  /** Status word 1 (`Chr+0x434`). */
  g1: number;
  /** The 24 group 2 bytes (`Chr+0x438`): a timed status's counter, a stage's signed step (slots 7 to 13). */
  g2: number[];
  /** Element byte masks, disjoint. */
  absorb: number; nullMask: number; half: number; weak: number;
  /** The special-flag word (bits 0, 6 and 9 only). */
  special: number;
  species: number;
  zantetsu: number;
  resist1: number[];
  resist2: number[];
  chain: number;
  breakLimit: boolean;
  /** The target is KO'd (its status word 1 has Death). */
  dead: boolean;
  /** An enemy's steal table: the steal byte out of 255, the stack sizes, the gil it holds. */
  steal: { byte: number; commonCount: number; rareCount: number; gil: number };
}

export interface Situation {
  def: AbilityDef;
  user: SideSpec;
  targets: SideSpec[];
  /** The user is a girl (her hits are the player's) or a monster (scripted). */
  userSide: 'party' | 'enemy';
  /** Where the targets stand (the user's own side for a heal). */
  targetSide: 'party' | 'enemy';
  raws: number[];
  gilSpent: number;
  hitsOverride: number;
  /** The party's gil (the battle's `gil` flag), when the situation has a wallet: a Bribe spends what it offers. */
  wallet?: number;
}

const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;
const pick = <T>(rng: SeededRng, xs: readonly T[]): T => rng.pick(xs);

/** A random fighter. Probabilities are tuned so the interesting statuses and masks show up in a few hundred situations. */
export function randomSide(rng: SeededRng, role: 'user' | 'party-target' | 'enemy-target'): SideSpec {
  const big = (): number => (chance(rng, 0.12) ? rng.int(200, 255) : rng.int(0, 130));
  const maxHp = role === 'enemy-target' ? rng.int(2000, 99999) : rng.int(200, 9999);
  const maxMp = rng.int(50, 999);
  const g2 = new Array<number>(24).fill(0);
  for (const slot of [0, 1, 6, 15, 16, 17]) if (chance(rng, slot === 6 ? 0.05 : 0.12)) g2[slot] = rng.int(1, 125);
  for (const slot of [4, 5]) if (chance(rng, 0.08)) g2[slot] = rng.int(1, 125);
  if (g2[4] !== 0) g2[5] = 0;
  for (let s = 7; s <= 13; s++) if (chance(rng, 0.2)) g2[s] = rng.int(-10, 10);
  let g1 = 0;
  const flag = (bit: number, p: number): void => { if (chance(rng, p)) g1 |= bit; };
  flag(0x2, 0.04); flag(0x4, 0.06); flag(0x10, 0.15); flag(0x80, 0.12); flag(0x200, 0.12);
  flag(0x4000, 0.05); flag(0x8000, 0.06); flag(0x40, 0.05); flag(0x8, 0.05); flag(0x20, 0.05);
  if (chance(rng, 0.5)) g1 &= ~0x2; // petrify rarer still
  const el = { absorb: 0, nullMask: 0, half: 0, weak: 0 };
  for (const [, bit] of ELEMENT_BITS) {
    const roll = rng.next();
    if (roll < 0.12) el.weak |= bit;
    else if (roll < 0.22) el.half |= bit;
    else if (roll < 0.27) el.nullMask |= bit;
    else if (roll < 0.33) el.absorb |= bit;
  }
  // A resist byte only for a slot the engine has a status for (G1 has 19, G2 has 18).
  const resist = (slots: number): number[] =>
    new Array<number>(24).fill(0).map((_, k) => (k < slots && chance(rng, 0.18) ? pick(rng, [255, 255, 30, 60, 100, 140, 10]) : 0));
  const dead = role !== 'user' && chance(rng, 0.07);
  return {
    level: rng.int(1, 60),
    str: big(), mag: big(), def: big(), mdef: big(), acc: rng.int(0, 255), eva: rng.int(0, 130), luck: rng.int(0, 90),
    hp: dead ? 0 : role === 'user' ? rng.int(1, maxHp) : chance(rng, 0.3) ? rng.int(1, maxHp) : maxHp, maxHp,
    mp: rng.int(0, maxMp), maxMp,
    g1: dead ? (g1 & 0x4000) | 1 : g1,
    g2: dead ? new Array<number>(24).fill(0) : g2,
    ...el,
    special: (chance(rng, 0.2) ? 1 : 0) | (chance(rng, 0.15) ? 0x40 : 0) | (chance(rng, 0.1) ? 0x200 : 0),
    species: role === 'enemy-target' && chance(rng, 0.3) ? rng.int(0, 0xffff) : 0,
    zantetsu: role === 'enemy-target' && chance(rng, 0.3) ? rng.int(0, 255) : 0,
    resist1: resist(19),
    resist2: resist(18),
    chain: chance(rng, 0.3) ? rng.int(1, 8) : 0,
    breakLimit: chance(rng, 0.25),
    dead,
    steal: { byte: chance(rng, 0.8) ? rng.int(1, 255) : 0, commonCount: rng.int(1, 4), rareCount: rng.int(0, 3), gil: chance(rng, 0.85) ? rng.int(10, 5000) : 0 },
  };
}

/**
 * How many of the Bribe item a monster of this spec hands over at the top of the reward formula (0 = it has none to give). Derived from
 * the spec's steal counts so that the generated situations of the other tests keep their draws; the engine side lays it on
 * `rewards.bribe`, the oracle side on the first of the two bribe slots.
 */
export function bribeCountOf(spec: SideSpec): number {
  return spec.steal.rareCount === 0 ? 0 : spec.steal.commonCount + spec.steal.rareCount;
}

/** The Bribe item of the generated monsters (the engine's own id; the game's id is the slot's item number, 1 here). */
export const BRIBE_ITEM = 'x2-item-hi-potion';

/** The targetings whose pool the oracle can name from the situation alone (the rest are covered by unit tests). */
const POOL_TARGETING = ['single-enemy', 'single-ally', 'single-any', 'all-enemies', 'random-enemy'];

/** The abilities worth generating: a record the kernels read and nothing the engine scripts around the kernels. */
export function wiringPool(all: readonly AbilityDef[]): AbilityDef[] {
  return all.filter((a) => {
    const r = a.ffx2Record;
    if (r === undefined || !POOL_TARGETING.includes(a.targeting)) return false;
    const x = a.extra ?? {};
    if (a.flags.includes('destroys-user') || x['hpCostPercent'] !== undefined) return false;
    if (x['sequence'] !== undefined || x['cannotKill'] === true || x['noChain'] === true) return false;
    if (r.status1?.[11] !== undefined || r.status1?.[12] !== undefined) return false; // HP x2 / MP x2 move the pools (kit.ts)
    return !['scan', 'libra', 'sensor'].some((w) => a.id.endsWith(w));
  });
}

/** A whole situation. */
export function randomSituation(rng: SeededRng, pool: readonly AbilityDef[]): Situation {
  const def = pick(rng, pool);
  const userSide = chance(rng, 0.65) ? 'party' : 'enemy';
  const ally = def.targeting === 'single-ally';
  const targetSide: 'party' | 'enemy' = ally ? userSide : userSide === 'party' ? 'enemy' : 'party';
  const count = def.targeting.startsWith('single') ? 1 : rng.int(1, 3);
  const allowDead = def.flags.includes('can-target-dead') || def.flags.includes('misses-if-target-alive');
  const targets = Array.from({ length: count }, () => {
    const t = randomSide(rng, targetSide === 'enemy' ? 'enemy-target' : 'party-target');
    if (!allowDead && t.dead) { t.dead = false; t.hp = Math.max(1, t.maxHp); t.g1 &= ~1; }
    return t;
  });
  return {
    def,
    user: randomSide(rng, 'user'),
    targets,
    userSide,
    targetSide,
    raws: Array.from({ length: 200 }, () => rng.int(0, 0x7fffffff)),
    gilSpent: chance(rng, 0.5) ? rng.int(0, 90000) : 0,
    hitsOverride: def.minigame !== undefined ? rng.int(1, 12) : 0,
  };
}

/** The engine's unit for a spec. `side` decides the slot ranges the engine keeps apart. */
export function engineUnit(spec: SideSpec, id: string, side: 'party' | 'enemy', slot: number): Ffx2Unit {
  const unit = aiUnit(id, side, spec.maxHp, slot);
  unit.level = spec.level;
  unit.stats = {
    hp: spec.hp, mp: spec.mp, str: spec.str, def: spec.def, mag: spec.mag, mdef: spec.mdef,
    agi: 40, luck: spec.luck, eva: spec.eva, acc: spec.acc, maxHp: spec.maxHp, maxMp: spec.maxMp,
  };
  unit.hp = spec.hp;
  unit.mp = spec.mp;
  unit.alive = !spec.dead;
  const put = (status: StatusId, stacks: number, counter: number | null): void => {
    unit.statuses[status] = {
      id: status, turnsRemaining: null, ticksRemaining: counter === null ? null : counter * TICKS_PER_DURATION_UNIT,
      charges: null, stacks, permanent: false,
    };
  };
  G1.forEach((status, i) => { if (status !== null && ((spec.g1 >>> i) & 1) !== 0) put(status, 0, null); });
  G2.forEach((ids, i) => {
    const v = spec.g2[i] as number;
    if (ids.length === 0 || v === 0) return;
    if (i >= STAGE.str && i <= STAGE.luck) put(v > 0 ? (ids[0] as StatusId) : (ids[1] as StatusId), Math.abs(v), null);
    else put(ids[0] as StatusId, 0, v);
  });
  for (const [element, bit] of ELEMENT_BITS) {
    if ((spec.absorb & bit) !== 0) unit.affinities[element] = 'absorb';
    else if ((spec.nullMask & bit) !== 0) unit.affinities[element] = 'immune';
    else if ((spec.half & bit) !== 0) unit.affinities[element] = 'resist';
    else if ((spec.weak & bit) !== 0) unit.affinities[element] = 'weak';
  }
  G1.forEach((status, i) => { if (status !== null && (spec.resist1[i] as number) > 0) unit.immunities[status] = spec.resist1[i] as number; });
  G2.forEach((ids, i) => { for (const status of ids) if ((spec.resist2[i] as number) > 0) unit.immunities[status] = spec.resist2[i] as number; });
  if (spec.chain > 0) { unit.chainCount = spec.chain; unit.chainWindowTicks = 1000; }
  if (side === 'enemy') {
    const rewards: EnemyRewards = {
      ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [],
      ...(spec.steal.byte > 0
        ? { steal: { baseChance: 0, stealRate: spec.steal.byte, common: { itemId: 'x2-item-potion', count: spec.steal.commonCount, chance: 255 }, rare: { itemId: spec.steal.rareCount > 0 ? 'x2-item-ether' : '', count: spec.steal.rareCount, chance: 255 } } }
        : {}),
      ...(spec.steal.gil > 0 ? { stolenGil: spec.steal.gil } : {}),
      ...(bribeCountOf(spec) > 0 ? { bribe: { item: { itemId: BRIBE_ITEM, count: bribeCountOf(spec) }, immune: false } } : {}),
    };
    unit.enemy = {
      aiScriptId: '', formIndex: 0, forms: [], rewards,
      ffx2Record: { row: 0, table: 1, acc: spec.acc, resist1: {}, resist2: {}, special: spec.special, species: spec.species, zantetsu: spec.zantetsu, stealByte: spec.steal.byte, stealGil: spec.steal.gil, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0] },
    };
  } else {
    if ((spec.special & 1) !== 0) unit.immunityFlags.push('immune-to-percentage-damage');
    if ((spec.special & 0x40) !== 0) unit.immunityFlags.push('immune-to-delay');
    if ((spec.special & 0x200) !== 0) unit.immunityFlags.push('immune-to-bribe');
  }
  return unit;
}
