/**
 * **Engine-level parity, FFX gear** (re-parity RC4, lane FFX-C; **FFX only**).
 *
 * `parity-ffx-gear.test.ts` proves the gear kernel against the game's machine code. This file proves the WIRING: what the engine reads off a party
 * member's two pieces of gear, through its real setup (`buildBattle`), its real damage path (`resolveAbility`) and its real prep-screen views, equals what
 * the game's builder and gear loop make of the same gear. The oracle is written out again, by hand, from the ability NAMES (the table's numbers and the
 * kernel are not imported): a `strength-10` is +10 on the physical-dealt entry, a Ward 50, a Proof 255, a Curse Ward the Curse immunity, a piece of gear
 * carries a crit byte of 3.
 *
 * 1. the damage chain's party percent bytes are the SUM of the worn tiers (Strength +10 and +5 are 15), for the attacker and for the target;
 * 2. the engine's equipment crit is 3 per worn piece in every shipped build (all 56 members of the builds the chapters use: 6 each);
 * 3. the resistance bytes written at battle start are the game's sums, clamped to 255, and a Curse Ward is a full Curse immunity;
 * 4. the prep screens' maximum HP and MP are the builder's.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AutoAbilityId, FFXCombatant, FFXMemberBuild, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { cloneData } from '../../src/battle/common/clone.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, FFXEngine, effectivePool, resolveAbility } from '../../src/battle/ffx/index.ts';
import { critCheck } from '../../src/battle/ffx/kernel/crit.ts';
import { hitCheck } from '../../src/battle/ffx/kernel/hit.ts';
import { noStatusOutcome } from '../../src/battle/ffx/kernel/aftermath.ts';
import { calcHitDamage } from '../../src/battle/ffx/kernel/hitdamage.ts';
import { applyEquipmentToCombatant, equipmentCrit } from '../../src/battle/ffx/equipment.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { ScriptedRng, combatantOf, contextOf, makeRng, oracleInputs, randomSituation, wiringPool, type Situation } from './helpers/ffxEngineWiring.ts';

// ------------------------------------------------------------------------------------------------ the oracle, written from the names

type Family = 'strength' | 'magic' | 'defense' | 'magic-def' | 'hp' | 'mp';
const TIERS: Readonly<Record<Family, readonly number[]>> = {
  strength: [3, 5, 10, 20],
  magic: [3, 5, 10, 20],
  defense: [3, 5, 10, 20],
  'magic-def': [3, 5, 10, 20],
  hp: [5, 10, 20, 30],
  mp: [5, 10, 20, 30],
};

/** The percent a list of ability ids gives one family: the tiers named in the ids, added (each slot counts). */
function oracleSum(ids: readonly string[], family: Family): number {
  let sum = 0;
  for (const id of ids) {
    const m = new RegExp(`^${family}-(\\d+)$`).exec(id);
    if (m) sum += Number(m[1]);
  }
  return sum;
}

const WARD_STATUS: Readonly<Record<string, string>> = {
  death: 'ko', zombie: 'zombie', stone: 'petrify', poison: 'poison', sleep: 'sleep', silence: 'silence', dark: 'darkness', slow: 'slow', confuse: 'confuse', berserk: 'berserk',
};
const RIBBON = ['zombie', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow'];
const AEON_RIBBON = [...RIBBON, 'ko', 'power-break', 'magic-break', 'armor-break', 'mental-break'];

/** The resistance bytes and the full immunities a list of ids gives: bytes added, clamped to 255; an extra-immunity ability is 255. */
function oracleResist(ids: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (status: string, byte: number): void => {
    out[status] = Math.min(255, (out[status] ?? 0) + byte);
  };
  for (const id of ids) {
    const ward = /^(death|zombie|stone|poison|sleep|silence|dark|slow|confuse|berserk)-ward$/.exec(id);
    const proof = /^(death|zombie|stone|poison|sleep|silence|dark|slow|confuse|berserk)proof$/.exec(id);
    if (ward) add(WARD_STATUS[ward[1] as string] as string, 50);
    else if (proof) add(WARD_STATUS[proof[1] as string] as string, 255);
    else if (id === 'ribbon') { for (const s of RIBBON) add(s, 255); out['doom'] = 255; }
    else if (id === 'aeon-ribbon') {
      for (const s of AEON_RIBBON) add(s, 255);
      for (const s of ['scan', 'eject', 'defend', 'guard', 'sentinel', 'doom']) out[s] = 255;
    } else if (id === 'curse-ward' || id === 'curseproof') out['curse'] = 255;
  }
  return out;
}

const RESIST_IDS: AutoAbilityId[] = [
  ...(['death', 'zombie', 'stone', 'poison', 'sleep', 'silence', 'dark', 'slow', 'confuse', 'berserk'] as const).flatMap((s) => [`${s}-ward`, s === 'stone' ? 'stoneproof' : `${s}proof`]),
  'curse-ward', 'curseproof', 'ribbon', 'aeon-ribbon',
] as AutoAbilityId[];

// ------------------------------------------------------------------------------------------------ 1. the damage chain reads the sum

const POOL: AbilityDef[] = [...wiringPool(ALL_ABILITIES), ...wiringPool(CORE_ABILITIES.map((a) => ({ ...a })))];
const PERCENT_FAMILIES = ['strength', 'magic', 'defense', 'magic-def'] as const;
const isPercentId = (id: string): boolean => PERCENT_FAMILIES.some((f) => new RegExp(`^${f}-\\d+$`).test(id));

/** A random spread of 0 to 3 tiers of one family (a tier may repeat: the same ability on two slots). */
function tiersOf(rng: ReturnType<typeof makeRng>, family: Family): number[] {
  const n = rng.int(0, 3);
  return Array.from({ length: n }, () => rng.pick(TIERS[family]));
}

interface GearSpread {
  user: Record<'strength' | 'magic', number[]>;
  target: Record<'defense' | 'magic-def', number[]>;
}

/** Give a generated situation's user and target tier spreads of their own, written both ways: the sum for the oracle, the abilities for the engine. */
function withSpread(rng: ReturnType<typeof makeRng>, sit: Situation): { spread: GearSpread } {
  const spread: GearSpread = {
    user: { strength: tiersOf(rng, 'strength'), magic: tiersOf(rng, 'magic') },
    target: { defense: tiersOf(rng, 'defense'), 'magic-def': tiersOf(rng, 'magic-def') },
  };
  const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
  sit.user.offPhys = sum(spread.user.strength);
  sit.user.offMag = sum(spread.user.magic);
  sit.target.defPhys = sum(spread.target.defense);
  sit.target.defMag = sum(spread.target['magic-def']);
  return { spread };
}

function setSpread(c: FFXCombatant, kinds: Readonly<Record<string, readonly number[]>>): void {
  const eq = (c.equipment as NonNullable<FFXCombatant['equipment']>).weapon;
  eq.autoAbilities = [
    ...eq.autoAbilities.filter((id) => !isPercentId(id)),
    ...Object.entries(kinds).flatMap(([family, tiers]) => tiers.map((t) => `${family}-${t}` as AutoAbilityId)),
  ];
}

describe('the damage chain reads the SUM of the worn tiers (engine against the kernel, with the oracle\'s bytes)', () => {
  it('400 situations: the engine\'s first hit equals the kernel\'s, with Strength / Magic / Defense / Magic Def spread over up to three slots each', () => {
    const rng = makeRng(20261011);
    let compared = 0;
    let stacked = 0;
    for (let i = 0; i < 400; i++) {
      const sit = randomSituation(rng, POOL);
      if (sit.userSide !== 'party' || sit.def.record === undefined) continue;
      const { spread } = withSpread(rng, sit);
      const targetSide = sit.def.targeting === 'single-ally' ? sit.userSide : 'enemy';
      const user = combatantOf(sit.user, 'u', sit.userSide);
      const target = combatantOf(sit.target, 't', targetSide);
      setSpread(user, spread.user);
      setSpread(target, spread.target);
      const engineRng = new ScriptedRng(sit.raws);
      const { ctx, events } = contextOf(user, target, engineRng, sit.target.ctb);
      resolveAbility(ctx, user, sit.def, [target.id], { ...(sit.power !== undefined ? { power: sit.power } : {}), ...(sit.timing ? { timing: sit.timing } : {}), hits: 1 });
      const hit = events.find((e) => e['type'] === 'damage' && e['targetId'] === target.id && e['amount'] !== 0);

      let cursor = 0;
      const draw = (): number => sit.raws[cursor++ % sit.raws.length] as number;
      const inp = oracleInputs(sit, { hp: sit.target.hp, mp: sit.target.mp, ctb: sit.target.ctb, sleep: sit.target.sleep });
      inp.input.record.nul = { blaze: sit.target.nul[0], frost: sit.target.nul[1], shock: sit.target.nul[2], tide: sit.target.nul[3] };
      const out = calcHitDamage(inp.input, {
        draw,
        hit: () => hitCheck(inp.hit, draw),
        crit: () => critCheck(inp.crit, 0, draw).crit,
        status: () => {
          if (sit.target.petrify) draw();
          return noStatusOutcome(inp.input.record.perm, inp.input.record.extra);
        },
      });
      const classes = sit.def.record.damageClass;
      const wantAmount = out.outcome === 'hit' && (classes & 1) !== 0 ? out.amounts[0] : 0;
      if (wantAmount === 0 || out.outcome !== 'hit') {
        expect(hit, `situation ${i}: ${sit.def.id} (the kernel deals nothing)`).toBeUndefined();
        continue;
      }
      expect(hit, `situation ${i}: ${sit.def.id}`).toBeDefined();
      expect(hit?.['amount'], `situation ${i}: ${sit.def.id} amount`).toBe(wantAmount);
      expect(hit?.['crit'], `situation ${i}: ${sit.def.id} crit`).toBe((out.resultMask & 0x100) !== 0);
      compared += 1;
      if ((sit.def.damageType === 'physical' && (spread.user.strength.length > 1 || spread.target.defense.length > 1)) ||
        (sit.def.damageType === 'magical' && (spread.user.magic.length > 1 || spread.target['magic-def'].length > 1))) stacked += 1;
    }
    expect(compared).toBeGreaterThan(80);
    expect(stacked).toBeGreaterThan(25); // enough of them put two or more tiers of the family the hit reads
  });
});

// ------------------------------------------------------------------------------------------------ 2. the crit of the shipped builds


describe('equipment crit in the shipped builds', () => {
  it('every party member the chapters field wears a weapon and an armour and has a crit of 6 (3 per piece), as the game\'s template rows do', async () => {
    await registerBattleContent();
    let members = 0;
    for (const chapter of CHAPTERS) {
      if (chapter.buildRef.game !== 'ffx') continue;
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(1);
      engine.init(setupForChapter(chapter, 1));
      for (const c of Object.values(engine.state().combatants) as FFXCombatant[]) {
        if (c.side !== 'party') continue;
        expect(c.equipment, `${chapter.id}: ${c.id}`).toBeDefined();
        expect(equipmentCrit(c), `${chapter.id}: ${c.id}`).toBe(6);
        members += 1;
      }
    }
    expect(members).toBeGreaterThan(55);
  });

  it('a member with a weapon only has 3; a piece the data gives a crit byte of its own keeps it', () => {
    const lone = { side: 'party', equipment: { weapon: { name: 'W', slots: 1, autoAbilities: [] } } } as unknown as FFXCombatant;
    expect(equipmentCrit({ ...lone, equipment: { weapon: { name: 'W', slots: 1, autoAbilities: [] }, armor: { name: 'A', slots: 1, autoAbilities: [], bonusCrit: 0 } } } as FFXCombatant)).toBe(3);
    expect(equipmentCrit({ ...lone, equipment: undefined } as FFXCombatant)).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ 3. the resistances at battle start

/** A chapter's party with every member in the given gear, run through the real setup. */
function battleWith(gear: (member: FFXMemberBuild, index: number) => { weapon: AutoAbilityId[]; armor: AutoAbilityId[] }): Record<string, FFXCombatant> {
  const chapter = CHAPTERS.find((c) => c.id === 'seymour-flux');
  if (chapter === undefined || chapter.buildRef.game !== 'ffx') throw new Error('no chapter to borrow a party from');
  const setup = setupForChapter(chapter, 1);
  const party = cloneData(setup.party) as FFXPartyBuild;
  party.members.forEach((m, i) => {
    const g = gear(m, i);
    m.equipment = { weapon: { ...m.equipment.weapon, autoAbilities: g.weapon }, armor: { ...m.equipment.armor, autoAbilities: g.armor } };
  });
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(1);
  engine.init({ ...setup, party });
  return engine.state().combatants as unknown as Record<string, FFXCombatant>;
}

describe('the resistance bytes written at battle start are the game\'s sums', () => {
  it('300 random gear sets: bytes added and clamped to 255, the Ribbons\' lists, Curse Ward and Curseproof the same full immunity', async () => {
    await registerBattleContent();
    const rng = makeRng(20261013);
    let clamped = 0;
    let summed = 0;
    for (let round = 0; round < 50; round++) {
      const chosen: AutoAbilityId[][] = [];
      const combatants = battleWith((_m, i) => {
        const n = rng.int(0, 7);
        const ids = Array.from({ length: n }, () => rng.pick(RESIST_IDS));
        chosen[i] = ids;
        return { weapon: ids.slice(0, 4), armor: ids.slice(4) };
      });
      const members = Object.values(combatants).filter((c) => c.side === 'party');
      expect(members.length).toBeGreaterThanOrEqual(6);
      members.forEach((c, i) => {
        const want = oracleResist(chosen[i] ?? []);
        const got = Object.fromEntries(Object.entries(c.immunities).filter(([, v]) => (v as number) > 0));
        expect(got, `round ${round}: ${c.id} wears ${JSON.stringify(chosen[i])}`).toEqual(want);
        for (const v of Object.values(want)) if (v === 255) clamped += 1;
        for (const v of Object.values(want)) if (v === 100 || v === 150) summed += 1;
      });
    }
    expect(clamped).toBeGreaterThan(50);
    expect(summed).toBeGreaterThan(5); // two or three Wards of one status
  });

  it('hand-worked: two Death Wards are 100, a Ward and a Proof 255, a Curse Ward a full Curse immunity (255, the bit the status step reads)', async () => {
    await registerBattleContent();
    const c = battleWith(() => ({ weapon: ['death-ward', 'death-ward', 'stone-ward'], armor: ['stoneproof', 'curse-ward'] }));
    const tidus = Object.values(c).find((x) => x.side === 'party') as FFXCombatant;
    expect(tidus.immunities['ko']).toBe(100); // 50 + 50
    expect(tidus.immunities['petrify']).toBe(255); // 50 + 255 = 305, clamped
    expect(tidus.immunities['curse']).toBe(255); // a Curse Ward is not "half": the same bit as Curseproof
  });

  it('the sum is taken over a byte the combatant already had (nothing is lowered, nothing replaced), and clamps at 255', () => {
    const c = { side: 'party', immunities: { poison: 100, doom: 10 }, affinities: {}, equipment: { weapon: { name: 'W', slots: 2, autoAbilities: ['poison-ward', 'poisonproof'] }, armor: { name: 'A', slots: 1, autoAbilities: ['ribbon'] } } } as unknown as FFXCombatant;
    applyEquipmentToCombatant(c);
    expect(c.immunities['poison']).toBe(255); // 100 + 50 + 255 + 255, clamped
    const d = { side: 'party', immunities: { sleep: 100 }, affinities: {}, equipment: { weapon: { name: 'W', slots: 1, autoAbilities: ['sleep-ward'] }, armor: { name: 'A', slots: 1, autoAbilities: [] } } } as unknown as FFXCombatant;
    applyEquipmentToCombatant(d);
    expect(d.immunities['sleep']).toBe(150); // 100 + 50
  });

  it('an Auto-Haste gives no Slow resistance of its own (the game\'s record has no resistance byte)', async () => {
    await registerBattleContent();
    const c = battleWith(() => ({ weapon: ['auto-haste'], armor: [] }));
    const tidus = Object.values(c).find((x) => x.side === 'party') as FFXCombatant;
    expect(tidus.immunities['slow'] ?? 0).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ 4. the prep screens' maxima

describe('the prep screens\' maximum HP and MP are the builder\'s', () => {
  it('base + trunc(base * sum / 100) with the sum of the worn tiers, capped; Break HP / MP Limit lift the caps', () => {
    const rng = makeRng(20261014);
    for (let i = 0; i < 400; i++) {
      const ids: string[] = [];
      for (let k = 0; k < rng.int(0, 6); k++) ids.push(`${rng.pick(['hp', 'mp'] as const)}-${rng.pick([5, 10, 20, 30] as const)}`);
      const breakHp = rng.next() < 0.3;
      const breakMp = rng.next() < 0.3;
      if (breakHp) ids.push('break-hp-limit');
      if (breakMp) ids.push('break-mp-limit');
      const base = { hp: rng.int(1, 12000), mp: rng.int(0, 1500) };
      const bearer = {
        stats: { hp: base.hp, mp: base.mp, str: 1, def: 1, mag: 1, mdef: 1, agi: 1, luck: 1, eva: 1, acc: 1, maxHp: base.hp, maxMp: base.mp },
        equipment: { weapon: { name: 'W', slots: 4, autoAbilities: ids.slice(0, 4) as AutoAbilityId[] }, armor: { name: 'A', slots: 4, autoAbilities: ids.slice(4) as AutoAbilityId[] } },
      };
      const wantHp = Math.min(base.hp + Math.trunc((base.hp * oracleSum(ids, 'hp')) / 100), breakHp ? 99999 : 9999);
      const wantMp = Math.min(base.mp + Math.trunc((base.mp * oracleSum(ids, 'mp')) / 100), breakMp ? 9999 : 999);
      expect(effectivePool(bearer, 'hp'), `${JSON.stringify(ids)} on ${base.hp}`).toBe(wantHp);
      expect(effectivePool(bearer, 'mp'), `${JSON.stringify(ids)} on ${base.mp}`).toBe(wantMp);
    }
  });
});
