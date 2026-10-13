/**
 * Rig for `parity-ffx2-auto-engine.test.ts` (re-parity X2-D; **FFX-2 only**): a real engine with Chapter XIII's three girls re-dressed from
 * a small loadout table, and a probe that plays one command through the engine's own path (`performCommand`, which ends in the
 * after-action hooks, the girls' counters and the battle-end check). The loadouts are written in the game's terms (which statuses the
 * kept set and the SOS set hold, which ability word bits the girl has); nothing here imports `adapt/auto-*` or the layer, so a wrong
 * pairing in the adapter shows as a difference.
 */

import type { BattleRng } from '../../../src/battle/common/streams.ts';
import type { AbilityDef, BattleSetup, Command, FFX2MemberBuild, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { performCommand } from '../../../src/battle/ffx2/execute.ts';
import type { EventDraft, Ffx2EngineOptions, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON } from '../../../src/data/ffx2/enemies/trema.ts';
import { group } from './tremaDrive.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

/** One girl's loadout and what the note says it makes (statuses in the engine's ids; word 0 as the bits the abilities set). */
export interface Loadout {
  name: string;
  dressphere?: string;
  learned?: Record<string, string[]>;
  accessories?: string[];
  /** Statuses the kept set holds, the SOS set holds. */
  kept: StatusId[];
  sos: StatusId[];
  /** Ability word 0 (Counterattack 4, Evade & Counter 8, Magic Counter 0x10). */
  word0: number;
}

const BERSERKER = 'berserker';
const CA = 'x2-berserker-counterattack';
const MC = 'x2-berserker-magic-counter';
const EC = 'x2-berserker-evade-and-counter';

/** The loadouts under test. The statuses are note FFX2-G04 section 3.4's, written out by hand. */
export const LOADOUTS: Readonly<Record<string, Loadout>> = {
  plain: { name: 'plain', kept: [], sos: [], word0: 0 },
  warriorSos: { name: 'Warrior with SOS Protect', dressphere: 'warrior', learned: { warrior: ['x2-warrior-sentinel', 'x2-warrior-sos-protect'] }, kept: [], sos: ['protect'], word0: 0 },
  warriorNoSentinelRow: { name: 'Warrior who knows only the prerequisite', dressphere: 'warrior', learned: { warrior: ['x2-warrior-sentinel'] }, kept: [], sos: [], word0: 0 },
  samuraiSos: { name: 'Samurai with SOS Critical', dressphere: 'samurai', learned: { samurai: ['x2-samurai-fireworks', 'x2-samurai-sos-critical'] }, kept: [], sos: ['guaranteed-critical'], word0: 0 },
  wrongSphere: { name: 'SOS Protect learned, a Gunner worn', dressphere: 'gunner', learned: { warrior: ['x2-warrior-sentinel', 'x2-warrior-sos-protect'] }, kept: [], sos: [], word0: 0 },
  catNip: { name: 'Cat Nip', accessories: ['cat-nip'], kept: [], sos: ['berserk', 'damage-9999', 'slow'], word0: 0 },
  wallAndMoon: { name: 'Wall Ring and Moon Bracer', accessories: ['wall-ring', 'moon-bracer'], kept: ['shell'], sos: ['shell', 'protect'], word0: 0 },
  regenHaste: { name: 'Regen Bangle and Haste Bangle', accessories: ['regen-bangle', 'haste-bangle'], kept: [], sos: ['regen', 'haste'], word0: 0 },
  bloodlust: { name: 'Bloodlust', accessories: ['bloodlust'], kept: ['poison', 'berserk'], sos: [], word0: 0 },
  wringShining: { name: 'Wring and Shining Bracer', accessories: ['wring', 'shining-bracer'], kept: ['poison', 'haste', 'protect'], sos: [], word0: 0 },
  mascotAuto: { name: 'Mascot with Auto-Shell and Auto-Protect', dressphere: 'mascot', learned: { mascot: ['x2-mascot-auto-shell', 'x2-mascot-auto-protect'] }, kept: ['shell', 'protect'], sos: [], word0: 0 },
  luckyCritical: { name: 'Lady Luck with Critical', dressphere: 'lady-luck', learned: { 'lady-luck': ['x2-lady-luck-luck', 'x2-lady-luck-felicity', 'x2-lady-luck-critical'] }, kept: ['guaranteed-critical'], sos: [], word0: 0 },
  slowAndSpeed: { name: 'Shmooth Shailing and Speed Bracer', accessories: ['shmooth-shailing', 'speed-bracer'], kept: ['slow', 'haste'], sos: [], word0: 0 },
  ragnarok: { name: 'Ragnarok', accessories: ['ragnarok'], kept: ['spellspring'], sos: [], word0: 0 },
  berserkerCa: { name: 'Berserker, Counterattack', dressphere: BERSERKER, learned: { [BERSERKER]: [CA] }, kept: [], sos: [], word0: 0x4 },
  berserkerMc: { name: 'Berserker, Counterattack and Magic Counter', dressphere: BERSERKER, learned: { [BERSERKER]: [CA, MC] }, kept: [], sos: [], word0: 0x14 },
  berserkerEc: { name: 'Berserker, all three', dressphere: BERSERKER, learned: { [BERSERKER]: [CA, MC, EC] }, kept: [], sos: [], word0: 0x1c },
  berserkerEcSkipsMc: { name: 'Berserker who knows Evade & Counter but not Magic Counter', dressphere: BERSERKER, learned: { [BERSERKER]: [CA, EC] }, kept: [], sos: [], word0: 0x4 },
  warriorWithCounters: { name: 'Warrior who learned the Berserker counters', dressphere: 'warrior', learned: { [BERSERKER]: [CA, MC, EC] }, kept: [], sos: [], word0: 0 },
};

/** The statuses any loadout can make: the ones the oracle looks at. */
export const LAYER_STATUSES: readonly StatusId[] = ['shell', 'protect', 'regen', 'haste', 'slow', 'guaranteed-critical', 'spellspring', 'poison', 'berserk', 'damage-9999', 'pointless'];

/** The tests' HP is large enough for any strike of the pool to leave a girl standing; a third of it is 33,333 (33,333 * 3 is not below 99,999). */
export const BIG = 99999;
export const THIRD = 33333;

/** The pool: abilities with a game row whose HP class always shows an event, that inflict no status and need no dead target. */
export const POOL: AbilityDef[] = Object.values(data.ABILITIES).filter((a) => {
  const r = a.ffx2Record;
  if (r === undefined) return false;
  if ((r.damageClass & 1) === 0 || ((r.flagsDamage & 3) !== 1 && (r.flagsDamage & 3) !== 2)) return false;
  if ((r.flagsMisc & 0x40000) !== 0) return false; // needs a dead target
  if (a.minigame || a.statusEffects.length > 0 || a.extra?.['sequence'] !== undefined) return false;
  if (r.status1 !== undefined && Object.keys(r.status1).length > 0) return false;
  if (r.status2 !== undefined && Object.keys(r.status2).length > 0) return false;
  return true;
});

/** A physical, single-target, status-free command that never misses (accuracy formula 0): the plain blow of these tests. */
export const PLAIN_BLOW = POOL.find((a) => (a.ffx2Record!.flagsDamage & 3) === 1 && (a.ffx2Record!.flagsTarget & 0xc) === 0 && ((a.ffx2Record!.flagsMisc >> 3) & 7) === 0) as AbilityDef;

/** A status instance as a command would have put it on (a clock-less one: the tests never advance the clock). */
export function instanceOf(id: StatusId): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** Engine plus a way to play a command through its own path. */
export class Probe extends FFX2Engine {
  /** Play `command` as `actor` through `performCommand` (the charge already paid) and return the events it and its counters made. */
  act(actor: Ffx2Unit, command: Command): EventDraft[] {
    const from = this.drafts.length;
    performCommand(this.env(), actor, command, true);
    return this.drafts.slice(from);
  }

  /** Run `n` logic steps (the ATB process, the casts coming due and the status clocks) and return the events they made. Nobody is asked for a command. */
  steps(n: number): EventDraft[] {
    const from = this.drafts.length;
    for (let i = 0; i < n; i++) this.runLogicStep();
    return this.drafts.slice(from);
  }

  /** The units, the streams and the draw count the tests read. */
  get all(): Ffx2Unit[] {
    return this.units;
  }

  get streams(): BattleRng {
    return this.rng;
  }

  unit(id: string): Ffx2Unit {
    const u = this.units.find((x) => x.id === id);
    if (!u) throw new Error(`no unit ${id}`);
    return u;
  }
}

/** Chapter XIII's three girls (Yuna, Rikku, Paine) re-dressed, against Paragon, on a real engine. */
export function board(loadouts: Partial<Record<'yuna' | 'rikku' | 'paine', Loadout>>, seed = 1, extra: Partial<Ffx2EngineOptions> = {}): Probe {
  const members: FFX2MemberBuild[] = viaInfinitoBuild.members.map((m) => {
    const l = loadouts[m.id as 'yuna' | 'rikku' | 'paine'];
    const copy: FFX2MemberBuild = structuredClone(m);
    if (l === undefined) return { ...copy, accessories: [], abilitiesLearned: {} };
    return {
      ...copy,
      currentDressphere: l.dressphere ?? 'gunner',
      owned: [...new Set([l.dressphere ?? 'gunner', 'gunner', 'warrior'])],
      abilitiesLearned: Object.fromEntries(Object.entries(l.learned ?? {}).map(([k, v]) => [k, { learned: [...v], ap: 0 }])),
      accessories: [...(l.accessories ?? [])],
    };
  });
  const engine = new Probe(ffx2Options(extra));
  const setup: BattleSetup = {
    game: 'ffx2',
    party: { ...viaInfinitoBuild, members: members as [FFX2MemberBuild, FFX2MemberBuild, FFX2MemberBuild] },
    enemies: group(CLOISTER_PARAGON),
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  return engine;
}

/** A tiny stand-in rng for tests that need none. */
export type { BattleRng };
