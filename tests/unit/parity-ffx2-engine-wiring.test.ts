/**
 * **Engine-level parity, FFX-2 hit / critical / damage / status / theft wiring** (re-parity W3; **FFX-2 only**).
 *
 * The kernel tests (`parity-ffx2-*.test.ts`) prove each function against the game's own machine code. This file proves
 * the WIRING: it drives the engine's own path, `resolveAbility`, on a few hundred generated situations and asserts
 * that what the engine does equals what the kernels return when they are run the way the game runs a command
 * (`helpers/ffx2WiringOracle.ts`, which imports nothing from `src/battle/ffx2/adapt/` or the resolver):
 *
 * 1. the engine takes its draws in the game's order and count (hit rolls per target, the random-target picks, then per
 *    strike the variance, the critical roll, the MP and ATB variances, every status roll, the shatter roll, the theft
 *    rolls) and takes none the game does not;
 * 2. the events (misses, damage amounts, critical flags, affinity labels, chain counters, MP moves, drains, KOs and
 *    revivals) equal the kernels', as do the units afterwards: HP, MP, KO and eject state, the status word 1 and group 2
 *    bytes, the chain counter, the stolen item and gil;
 * 3. an action visits its targets in ascending slot order, one strike each per hit event;
 * 4. an ability with no game row runs on a derived one and gets the same answer as the same words written out;
 * 5. the read-only odds the HUD and the advisor print are the kernels' own.
 *
 * The situations are written in the game's terms (stat bytes, signed stage steps, status bits, element byte masks), so a
 * wrong translation of an engine fact into a kernel input shows as a difference.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { FALLBACK_ABILITY_IDS, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { hitPercent, critPercent } from '../../src/battle/ffx2/hit.ts';
import { deriveRecord, resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';
import { atbPool } from '../../src/battle/ffx2/adapt/words.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import { engineRun, oracleRun, type Run } from './helpers/ffx2WiringOracle.ts';
import { STAGE, ScriptedRng, makeRng, randomSituation, wiringPool, engineUnit, randomSide, type Situation } from './helpers/ffx2WiringRig.ts';

const ALL: AbilityDef[] = [
  ...Object.values(data.ABILITIES),
  ...FALLBACK_ABILITY_IDS.map((id) => defaultAbilities.get(id) as AbilityDef),
];
const POOL = wiringPool(ALL);

function compare(sit: Situation, label: string): { engine: Run; oracle: Run } {
  const engine = engineRun(sit);
  const oracle = oracleRun(sit);
  expect(engine, label).toEqual(oracle);
  return { engine, oracle };
}

describe('the engine draws and decides what the kernels do, on generated situations', () => {
  it('there is a pool to draw from', () => {
    expect(POOL.length).toBeGreaterThan(120);
    for (const kind of ['single-enemy', 'single-ally', 'all-enemies', 'random-enemy']) {
      expect(POOL.some((a) => a.targeting === kind), kind).toBe(true);
    }
  });

  it('600 situations: the same draws in the same order, the same events and the same units afterwards', () => {
    const rng = makeRng(20261008);
    const seen = { dmg: 0, miss: 0, immune: 0, crit: 0, chain: 0, mp: 0, ko: 0, revive: 0, heal: 0, halved: 0, steal: 0, gil: 0, status: 0, kinds: new Set<string>(), abilities: new Set<string>() };
    for (let i = 0; i < 600; i++) {
      const sit = randomSituation(rng, POOL);
      const { oracle } = compare(sit, `situation ${i}: ${sit.def.id} (${sit.userSide} -> ${sit.targetSide})`);
      for (const t of oracle.tokens) {
        if (t.startsWith('dmg')) seen.dmg++;
        if (t.includes(':true:')) seen.crit++;
        if (t.endsWith(':evaded')) seen.miss++;
        if (t.endsWith(':immune')) seen.immune++;
        if (t.startsWith('chain') && !t.endsWith(':0')) seen.chain++;
        if (t.startsWith('mp')) seen.mp++;
        if (t.startsWith('ko')) seen.ko++;
        if (t.startsWith('revive')) seen.revive++;
        if (t.startsWith('heal')) seen.heal++;
      }
      if (Object.keys(oracle.flags).some((k) => k.startsWith('inventory'))) seen.steal++;
      if (oracle.flags['stolenGil'] !== undefined) seen.gil++;
      if (oracle.ends.some((e) => e.g1 !== 0 || e.g2.some((v) => v !== 0))) seen.status++;
      if ((sit.def.ffx2Record?.flagsTarget ?? 0) & 0x80 && sit.userSide === 'party' && sit.def.targeting.startsWith('all')) seen.halved++;
      seen.kinds.add(oracle.asked.join(','));
      seen.abilities.add(sit.def.id);
    }
    // The sample is wide enough to have exercised each branch.
    expect(seen.dmg).toBeGreaterThan(300);
    expect(seen.miss).toBeGreaterThan(20);
    expect(seen.immune).toBeGreaterThan(5);
    expect(seen.crit).toBeGreaterThan(5);
    expect(seen.chain).toBeGreaterThan(30);
    expect(seen.mp).toBeGreaterThan(5);
    expect(seen.ko).toBeGreaterThan(5);
    expect(seen.halved).toBeGreaterThan(5);
    expect(seen.status).toBeGreaterThan(100);
    expect(seen.kinds.size, `draw shapes seen: ${seen.kinds.size}`).toBeGreaterThan(40);
    expect(seen.abilities.size, `distinct commands seen: ${seen.abilities.size} of ${POOL.length}`).toBeGreaterThan(120);
    expect(seen.steal + seen.gil + seen.revive + seen.heal).toBeGreaterThan(0);
  });
});

describe('the draws of the common commands, in the game\'s order', () => {
  const by = (id: string): AbilityDef => POOL.find((a) => a.id === id) as AbilityDef;
  const base = (id: string, over: (s: Situation) => void = () => {}): Run => {
    const rng = makeRng(77);
    const sit = randomSituation(rng, [by(id)]);
    // A target nothing refuses and nothing evades, so the branch under test is the one that runs.
    for (const t of sit.targets) {
      Object.assign(t, { dead: false, g1: 0, g2: new Array<number>(24).fill(0), absorb: 0, nullMask: 0, half: 0, weak: 0, special: 0, resist1: new Array<number>(24).fill(0), resist2: new Array<number>(24).fill(0), chain: 0, eva: 0, hp: t.maxHp });
    }
    Object.assign(sit.user, { g1: 0, g2: new Array<number>(24).fill(0), luck: 90, acc: 255 });
    sit.hitsOverride = 0;
    over(sit);
    return compare(sit, id).engine;
  };

  it('a physical Attack-like command: hit roll, variance, critical roll, per target', () => {
    const run = base('x2-warrior-power-break', (s) => { s.userSide = 'party'; s.targetSide = 'enemy'; });
    expect(run.asked.slice(0, 3)).toEqual([100, 31, 99]);
  });

  it('a spell that always hits and cannot crit draws only the variance', () => {
    const run = base('x2-black-mage-fire');
    expect(run.asked.slice(0, 1)).toEqual([31]);
    expect(run.asked.includes(99)).toBe(false);
  });
});

describe('a command that is several game rows runs the one row the script picked (Russian Roulette)', () => {
  const roulette = (): AbilityDef => POOL.find((a) => a.id === 'x2-logos-russian-roulette') as AbilityDef;

  it('draws the pick first (1 in 5), and the cast carries exactly the chosen row\'s one status chance', () => {
    expect(roulette().ffx2Record?.pickOne?.length).toBe(5);
    const rng = makeRng(404);
    const seenRows = new Set<number>();
    for (let i = 0; i < 150; i++) {
      const sit = randomSituation(rng, [roulette()]);
      sit.userSide = 'enemy'; sit.targetSide = 'party';
      sit.targets = [randomSide(rng, 'party-target')];
      Object.assign(sit.targets[0] as object, { dead: false, g1: 0, hp: 5000, maxHp: 5000, g2: new Array<number>(24).fill(0), resist1: new Array<number>(24).fill(0), resist2: new Array<number>(24).fill(0), special: 0 });
      Object.assign(sit.user, { g1: 0, g2: new Array<number>(24).fill(0), level: 99 });
      Object.assign(sit.targets[0] as object, { level: 1 });
      const { engine, oracle } = compare(sit, `roulette ${i}`);
      expect(engine.asked[0], 'the pick is the first draw').toBe(4);
      seenRows.add((sit.raws[0] as number) % 5);
      // At most one of the five statuses ever lands in a cast (a union of the rows would land up to five).
      const gained = ['ko', 'curse', 'silence', 'petrify', 'poison'].filter((_, k) => ((engine.ends[0]?.g1 ?? 0) & [1, 0x100, 0x8, 0x2, 0x20][k]!) !== 0);
      expect(gained.length, `${gained.join(',')}`).toBeLessThanOrEqual(1);
      expect(oracle.asked[0]).toBe(4);
    }
    expect(seenRows.size).toBe(5);
  });
});

describe('an action visits its targets in ascending slot order, one strike each per hit event', () => {
  it('Scattershot-like multi-hit all-target rows alternate targets hit event by hit event', () => {
    const multi = POOL.find((a) => a.targeting === 'all-enemies' && (a.ffx2Record?.hits ?? 0) >= 2 && (a.ffx2Record?.flagsMisc ?? 1) !== 0 && (((a.ffx2Record?.flagsMisc ?? 0) >> 3) & 7) === 0 && ((a.ffx2Record?.flagsMisc ?? 0) & 0x4000) === 0);
    expect(multi, 'a multi-hit all-target row with accuracy formula 0').toBeDefined();
    const rng = makeRng(5);
    const sit = randomSituation(rng, [multi as AbilityDef]);
    sit.userSide = 'party'; sit.targetSide = 'enemy';
    sit.targets = [randomSide(rng, 'enemy-target'), randomSide(rng, 'enemy-target')];
    for (const t of sit.targets) Object.assign(t, { dead: false, g1: 0, hp: t.maxHp, special: 0, absorb: 0, nullMask: 0, resist1: new Array<number>(24).fill(0), resist2: new Array<number>(24).fill(0) });
    const { engine } = compare(sit, 'multi-hit');
    const order = engine.tokens.filter((t) => t.startsWith('dmg') || t.startsWith('miss')).map((t) => t.split(':')[1]);
    // t0 t1 t0 t1 ...: strike-major, target-minor (pp_action_hit_event).
    expect(order.slice(0, 4)).toEqual(['0', '1', '0', '1']);
  });

  it('a target that misses is reported once, however many hits were planned', () => {
    const attack = POOL.find((a) => (((a.ffx2Record?.flagsMisc ?? 0) >> 3) & 7) === 2 && (a.ffx2Record?.hits ?? 0) >= 2 && a.targeting === 'single-enemy');
    if (attack === undefined) return; // no such row in the pool: the next test covers the rule
    const rng = makeRng(8);
    const sit = randomSituation(rng, [attack]);
    sit.userSide = 'party'; sit.targetSide = 'enemy';
    Object.assign(sit.user, { acc: 0, luck: 0 });
    Object.assign(sit.targets[0] as object, { eva: 255, luck: 255, dead: false, g1: 0, hp: 5000, g2: new Array<number>(24).fill(0), chain: 0 });
    sit.raws = sit.raws.map(() => 100);
    const { engine } = compare(sit, 'evaded');
    expect(engine.tokens.filter((t) => t.startsWith('miss')).length).toBe(1);
  });
});

describe('a Bribe: accuracy formula 6 with the gil offered, then the reward (the game\'s row 0x30f0; no chapter reaches it)', () => {
  // The game's Bribe command: accuracy formula 6, the Bribe bit, no damage class. Lady Luck's Bribe is the ability of ours that stands
  // for it; no build of the seven chapters teaches it, so no data file attaches the row and it stays the no-op it always was. The
  // wiring (hit determination with `AbilityCommand.gilSpent`, the threshold stored on the target, the reward from the target's slot,
  // the wallet) is proved here on the row written out.
  const BRIBE_ROW = { id: 0x30f0, category: 0, flagsTarget: 0x13, flagsMisc: 0x5200036, flagsDamage: 0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0 };
  const bribe: AbilityDef = { ...(data.ABILITIES['x2-lady-luck-bribe'] as AbilityDef), ffx2Record: BRIBE_ROW };

  function bribeSituation(rng: ReturnType<typeof makeRng>): Situation {
    const sit = randomSituation(rng, [bribe]);
    sit.userSide = 'party';
    sit.targetSide = 'enemy';
    const target = sit.targets[0] as Situation['targets'][number];
    Object.assign(target, { dead: false, g1: 0, hp: target.maxHp, special: target.special & ~0x200, g2: new Array<number>(24).fill(0) });
    // An offer from nothing to seven times the target's maximum HP: the threshold runs from below zero to past 255.
    sit.gilSpent = Math.round(target.maxHp * rng.next() * 7);
    sit.wallet = rng.int(0, 200000);
    return sit;
  }

  it('300 situations: the same draws, the same hits and misses, the same item in the bag, the same wallet', () => {
    const rng = makeRng(30);
    let hits = 0, misses = 0, paid = 0, wallets = 0;
    for (let i = 0; i < 300; i++) {
      const sit = bribeSituation(rng);
      const { engine } = compare(sit, `bribe ${i}`);
      if (engine.tokens.some((t) => t.startsWith('miss'))) misses++;
      else hits++;
      if (engine.flags['inventory:x2-item-hi-potion'] !== undefined) paid++;
      if (engine.flags['gil'] !== sit.wallet) wallets++;
    }
    expect(hits).toBeGreaterThan(40);
    expect(misses).toBeGreaterThan(40);
    expect(paid).toBeGreaterThan(15); // a bribe that works pays the slot's item when the monster has one
    expect(wallets).toBeGreaterThan(100); // the offer left the wallet
  });

  it('a target immune to Bribe is not hit and pays nothing; an offer of 25 times its HP always works', () => {
    const rng = makeRng(31);
    for (let i = 0; i < 40; i++) {
      const sit = bribeSituation(rng);
      const target = sit.targets[0] as Situation['targets'][number];
      target.steal.rareCount = 1; // it holds an item to hand over
      sit.gilSpent = target.maxHp * 25;
      const works = compare(sit, `bribe 25x ${i}`).engine;
      expect(works.tokens.some((t) => t.startsWith('miss'))).toBe(false);
      expect(works.flags['inventory:x2-item-hi-potion']).toBeGreaterThan(0);
      target.special |= 0x200;
      const immune = compare(sit, `bribe immune ${i}`).engine;
      expect(immune.tokens).toContain('miss:0:immune');
      expect(immune.flags['inventory:x2-item-hi-potion']).toBeUndefined();
    }
  });

  it('what a bribe has been given so far counts toward the next one (the target remembers it)', () => {
    const rng = makeRng(32);
    const sit = bribeSituation(rng);
    const user = engineUnit(sit.user, 'u', 'party', 0);
    const target = engineUnit(sit.targets[0] as Situation['targets'][number], 't0', 'enemy', 0);
    const ctx = { units: [user, target], abilities: { get: () => undefined }, rng: new ScriptedRng([0, 1, 2, 3]), emit: () => {}, breaksDamageLimit: () => false } as never;
    resolveAbility(ctx, user, bribe, [target.id], { gilSpent: 1000 });
    expect(target.bribeAccumulated).toBe(1000);
    resolveAbility(ctx, user, bribe, [target.id], { gilSpent: 2500 });
    expect(target.bribeAccumulated).toBe(3500);
  });
});

describe('an ability with no game row runs on a derived one', () => {
  const derived: AbilityDef = {
    id: 'ours-slash', name: 'Ours', game: 'ffx2', category: 'skill', mpCost: 0, power: 20, formula: 'strength',
    damageType: 'physical', element: ['fire'], targeting: 'single-enemy', hits: 2, statusEffects: [{ status: 'poison', chance: 120, duration: 0 }], removesStatuses: [],
    flags: ['crit-eligible', 'affected-by-darkness'],
  };

  it('derives the words the engine always read from the flags', () => {
    const r = deriveRecord(derived);
    expect(r.flagsDamage & 0x7).toBe(0x5); // physical, can crit
    expect((r.flagsMisc >> 3) & 7).toBe(2); // a physical skill rolls the user's Accuracy
    expect(r.flagsMisc & 0x40).toBe(0x40); // Darkness applies
    expect(r.formula).toBe(0);
    expect(r.power).toBe(20);
    expect(r.hits).toBe(2);
    expect(r.element).toBe(1);
    expect(r.status1).toEqual({ 5: 120 });
    expect((deriveRecord({ ...derived, accuracy: 80 }).flagsMisc >> 3) & 7).toBe(1); // an accuracy byte: formula 1
    expect((deriveRecord({ ...derived, canMiss: false }).flagsMisc >> 3) & 7).toBe(0);
    expect((deriveRecord({ ...derived, damageType: 'magical', flags: [] }).flagsMisc >> 3) & 7).toBe(0); // rule 5: magic does not roll
    expect(deriveRecord({ ...derived, damageType: 'magical', flags: ['heals'], formula: 'healing' }).flagsDamage & 0x10).toBe(0x10);
    expect(deriveRecord({ ...derived, flags: ['drains'] }).flagsMisc & 0x100).toBe(0x100);
    expect(deriveRecord({ ...derived, targeting: 'random-enemy' }).flagsMisc & 0x4000).toBe(0x4000);
  });

  it('a derived cleanse strips a timed status whatever time it has left (the game subtracts the amount: 127, not 1)', () => {
    // Found by leaving one game row out of the measurement (Remedy's): the derived row carried an amount of 1, which only shaves a step off
    // a counter, so a derived Remedy left Slow and Stop standing. The game's own cleanse rows (Dispel, Esuna, Remedy) carry 127.
    const cleanse: AbilityDef = {
      id: 'ours-remedy', name: 'Ours', game: 'ffx2', category: 'item', mpCost: 0, power: 0, formula: 'none', damageType: 'other', element: ['none'],
      targeting: 'single-ally', hits: 1, statusEffects: [], removesStatuses: ['slow', 'stop', 'shell', 'berserk', 'str-up'], flags: ['removes-statuses'],
    };
    const r = deriveRecord(cleanse);
    expect(r.flagsDamage & 0x20).toBe(0x20);
    for (const slot of [0, 5, 6, 7]) expect(r.statusTime?.[slot], `slot ${slot}`).toBe(127);
    const rng = makeRng(61);
    const sit = randomSituation(rng, [{ ...cleanse, ffx2Record: undefined } as AbilityDef]);
    sit.userSide = 'party'; sit.targetSide = 'party';
    const target = sit.targets[0] as Situation['targets'][number];
    Object.assign(target, { dead: false, hp: target.maxHp, g1: 0x80, g2: new Array<number>(24).fill(0), resist1: new Array<number>(24).fill(0), resist2: new Array<number>(24).fill(0) });
    target.g2[0] = 60; target.g2[5] = 100; target.g2[6] = 125; target.g2[7] = 4; // Shell 60, Slow 100, Stop 125, STR +4
    const end = engineRun({ ...sit, def: cleanse }).ends[0]!;
    expect(end.g1 & 0x80, 'Berserk is gone').toBe(0);
    expect(end.g2[0], 'Shell is gone').toBe(0);
    expect(end.g2[5], 'Slow is gone').toBe(0);
    expect(end.g2[6], 'Stop is gone').toBe(0);
    expect(end.g2[7], 'the STR stage is back to 0').toBe(0);
  });

  it('is exactly the ability with those words written out as its record, on the same draws', () => {
    const rng = makeRng(31);
    const written: AbilityDef = { ...derived, id: 'written-slash', ffx2Record: deriveRecord(derived) };
    for (let i = 0; i < 60; i++) {
      const sit = randomSituation(rng, [written]);
      const viaRecord = engineRun(sit);
      const viaDerived = engineRun({ ...sit, def: { ...derived, id: 'written-slash' } });
      expect(viaDerived).toEqual(viaRecord);
    }
  });
});

describe('the generic Attack runs on the user\'s own row', () => {
  const attack = defaultAbilities.get('attack') as AbilityDef;

  it('a girl attacks on the row of the dressphere she wears; a monster on its own row', () => {
    const girl = aiUnit('girl', 'party');
    girl.dresspheres = { current: 'thief', owned: ['thief'], garmentGrid: {} as never, abilitiesLearned: {} };
    const thief = resolveCommand(attack, girl);
    expect(thief.source).toBe('record');
    expect(thief.record.hits).toBe(2); // the Thief strikes twice, power 8 each
    expect(thief.record.power).toBe(8);
    girl.dresspheres.current = 'warrior';
    expect(resolveCommand(attack, girl).record.hits).toBe(1);
    const monster = aiUnit('boss', 'enemy');
    expect(resolveCommand(attack, monster).source).toBe('derived'); // no monster row: the engine's own reading
    monster.enemy = { aiScriptId: '', formIndex: 0, forms: [], rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] }, ffx2Record: { row: 0, table: 1, acc: 95, resist1: {}, resist2: {}, special: 0, species: 0, zantetsu: 0, stealByte: 0, stealGil: 0, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0], plainAttack: { id: 0x41da, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0 } } };
    expect(resolveCommand(attack, monster).record.id).toBe(0x41da);
  });
});

describe('the ATB pool the Delay class reads (computed here, applied by batch W4)', () => {
  it('is the remaining charge and its total while the target charges, else the remaining recovery as both figures', () => {
    const u = aiUnit('u', 'enemy');
    u.atb.recovery = 40;
    expect(atbPool(u)).toEqual({ current: 40, max: 40 });
    u.atb.charging = { abilityId: 'x', totalTicks: 900, remainingTicks: 300 } as never;
    expect(atbPool(u)).toEqual({ current: 300, max: 900 });
    u.atb.charging = { abilityId: 'x', totalTicks: 0, remainingTicks: 0 } as never; // a charge with no length falls back to the recovery
    expect(atbPool(u)).toEqual({ current: 40, max: 40 });
  });
});

describe('the odds the HUD and the advisor print are the kernels\' own', () => {
  it('hitPercent and critPercent equal the frequency of the rolls over every value of the draw', () => {
    const rng = makeRng(404);
    const attack = POOL.find((a) => a.id === 'x2-warrior-power-break') as AbilityDef;
    let rolled = 0;
    for (let i = 0; i < 80; i++) {
      const sit = randomSituation(rng, [attack]);
      sit.userSide = 'party'; sit.targetSide = 'enemy';
      const user = engineUnit(sit.user, 'u', 'party', 0);
      const target = engineUnit(sit.targets[0]!, 't0', 'enemy', 0);
      const expectedHit = hitPercent(user, target, attack);
      // Count the hit determination over all 101 values of the roll.
      let landed = 0;
      for (let roll = 0; roll <= 100; roll++) {
        const probe = engineRun({ ...sit, raws: [roll, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], hitsOverride: 0 });
        if (!probe.tokens.some((t) => t.endsWith(':evaded'))) landed++;
      }
      expect(expectedHit).toBeCloseTo((100 * landed) / 101, 6);
      // The critical odds, from the situation's own fields (game terms): the row's rule is the Luck gap plus five a stage of
      // difference, rolled against 0..99, so the chance is that figure in points, cut to 0..100; Always Critical makes it 1.
      const row = attack.ffx2Record!;
      const t0 = sit.targets[0]!;
      const gap = sit.user.luck - t0.luck + 5 * ((sit.user.g2[STAGE.luck] as number) - (t0.g2[STAGE.luck] as number));
      const alwaysCrit = (sit.user.g1 & 0x8000) !== 0;
      const wantCrit = (row.flagsDamage & 4) === 0 ? 0 : alwaysCrit ? 1 : Math.max(0, Math.min(100, (row.flagsDamage & 8) !== 0 ? row.critByte : gap)) / 100;
      expect(critPercent(user, target, attack)).toBeCloseTo(100 * wantCrit, 9);
      rolled++;
    }
    expect(rolled).toBe(80);
  });
});
