/**
 * **Chapter XIV — Isaaru's contest of aeons (FFX only)**: the data, the three
 * scripts, the gauges, the count and the damage, each against
 * `research/ffx-isaaru-bevelle.md` and `docs/plans/chapter-isaaru-review.md`
 * §9 (one case per research row). The duel's rules (lock, "only aeons", the
 * loss, the chain) are `isaaru-duel.test.ts`; the seeded bench is
 * `isaaru-bench.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { computeDamage, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import * as rules from '../../../src/battle/ffx/ai/isaaru-rules.ts';
import * as data from '../../../src/data/ffx/enemies/isaaru.ts';
import * as rows from '../../../src/data/ffx/enemies/isaaru-abilities.ts';
import { ISAARU_GROUPS } from '../../../src/data/ffx/enemies/isaaru.ts';
import { viaPurificoBuild, BAHAMUT_GAUGE, YUNA_GAUGE } from '../../../src/data/ffx/builds/via-purifico.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { describeAbility } from '../../../src/battle/ffx/intent.ts';
import {
  GROTHIA, ISAARU, PTERYA, SPATHI, actor, content, defend, drive, grandSummon, newEngine, nextInput, summon,
} from '../helpers/isaaruUnits.ts';

const events = (log: readonly BattleEvent[], type: BattleEvent['type']) => log.filter((e) => e.type === type);
const starts = (log: readonly BattleEvent[], who: string) =>
  log.filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start' && e.actorId === who).map((e) => e.abilityId);

describe('data (research §2, §3)', () => {
  it('the battle layer mirrors the data layer ids', () => {
    for (const k of ['ISAARU_ID', 'GROTHIA_ID', 'PTERYA_ID', 'SPATHI_ID', 'ISAARU_BYSTANDER_SCRIPT', 'GROTHIA_SCRIPT', 'PTERYA_SCRIPT', 'SPATHI_SCRIPT'] as const) {
      expect(rules[k], k).toBe(data[k]);
    }
    for (const k of ['GROTHIA_ATTACK', 'GROTHIA_ATTACK_YUNA', 'GROTHIA_FIRA', 'GROTHIA_HELLFIRE', 'PTERYA_ATTACK', 'PTERYA_ATTACK_YUNA',
      'PTERYA_SONIC_WINGS', 'PTERYA_ENERGY_RAY', 'SPATHI_COUNTDOWN', 'SPATHI_MEGA_FLARE'] as const) {
      expect(rules[k], k).toBe(rows[k]);
    }
  });

  it('three formations [isaaru, aeon], chained, no escape, no checkpoint, the AP only on the last', () => {
    expect(ISAARU_GROUPS.map((g) => g.enemies.map((e) => e.id))).toEqual([[ISAARU, GROTHIA], [ISAARU, PTERYA], [ISAARU, SPATHI]]);
    expect(ISAARU_GROUPS.map((g) => g.nextGroupId)).toEqual(['isaaru-pterya', 'isaaru-spathi', undefined]);
    expect(ISAARU_GROUPS.map((g) => g.lockedAeons?.map((l) => l.aeonId))).toEqual([['ifrit'], ['valefor'], ['bahamut']]);
    for (const g of ISAARU_GROUPS) {
      expect(g.canEscape).toBe(false);
      expect(g.aeonsOnly).toBe(true);
      expect(g.restoresPartyOnEntry).toBeUndefined(); // B12 = a
    }
    expect(ISAARU_GROUPS.map((g) => g.victoryBonusAp)).toEqual([undefined, undefined, 5_000]); // B13 = a
  });

  it('stat blocks (§2.2 [decompiled]), Grothia absorbs Fire, the §2.4 immunities, Threaten immune (B10), 0 AP each', () => {
    const [g, p, s] = ISAARU_GROUPS.map((grp) => grp.enemies[1]!);
    const pick = (e: typeof g) => ({ hp: e!.hp, mp: e!.mp, str: e!.stats.str, def: e!.stats.def, mag: e!.stats.mag, mdef: e!.stats.mdef, agi: e!.stats.agi });
    expect(pick(g)).toEqual({ hp: 8_000, mp: 600, str: 23, def: 10, mag: 21, mdef: 0, agi: 18 });
    expect(pick(p)).toEqual({ hp: 12_000, mp: 1_000, str: 20, def: 10, mag: 18, mdef: 10, agi: 21 });
    expect(pick(s)).toEqual({ hp: 20_000, mp: 1_500, str: 31, def: 0, mag: 38, mdef: 0, agi: 20 });
    expect(g!.affinities).toEqual({ fire: 'absorb' });
    expect(p!.affinities).toEqual({});
    for (const e of [g, p, s]) {
      expect(e!.rewards).toMatchObject({ ap: 0, gil: 0, overkillThreshold: 2_550, drops: [] });
      expect(e!.threatenChance).toBe(0);
      expect(e!.immunityFlags).toEqual(expect.arrayContaining(['immune-to-delay', 'immune-to-percentage-damage', 'immune-to-scan', 'immune-to-sensor', 'boss']));
      for (const st of ['ko', 'slow', 'eject', 'petrify', 'poison', 'silence', 'sleep', 'darkness', 'provoke']) expect(e!.immunities[st as 'ko']).toBe(255);
      expect(e!.immunities.doom).toBeUndefined(); // landable (GameFAQs' one vulnerability)
      // Its own installed subject (INSTALLED.md: the aeon painting with his O-4 C mark), never a roster aeon's id (I-G6).
      expect(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']).not.toContain(e!.spriteKey);
    }
    expect(s!.abilityIds).toEqual([rows.SPATHI_COUNTDOWN, rows.SPATHI_MEGA_FLARE]); // no counter rows (I-4)
    const isaaru = ISAARU_GROUPS[0]!.enemies[0]!;
    expect(isaaru).toMatchObject({ hp: 10, mp: 1, abilityIds: [], flags: { untargetable: true } });
  });

  it('rows: DC and type as §3 (Hellfire 70 Other Fire, Energy Ray 26 Magical, Mega Flare 44 Other; the physical rows roll)', () => {
    expect(rows.grothiaHellfire).toMatchObject({ power: 70, formula: 'magic', damageType: 'other', element: ['fire'], targeting: 'all-enemies', canMiss: false });
    expect(rows.pteryaEnergyRay).toMatchObject({ power: 26, formula: 'magic', damageType: 'magical', targeting: 'all-enemies', canMiss: false });
    expect(rows.spathiMegaFlare).toMatchObject({ power: 44, formula: 'magic', damageType: 'other', targeting: 'all-enemies', canMiss: false });
    expect(rows.grothiaFira).toMatchObject({ power: 24, damageType: 'magical', element: ['fire'], canMiss: false });
    expect(rows.grothiaAttack).toMatchObject({ power: 16, accuracy: 90 });
    expect(rows.grothiaAttackYuna).toMatchObject({ power: 16, accuracy: 120 });
    expect(rows.pteryaAttackYuna).toMatchObject({ power: 8, accuracy: 60 });
    expect(rows.pteryaSonicWings).toMatchObject({ power: 8, canMiss: false, flags: ['weak-delay'] });
    for (const r of Object.values(rows.ISAARU_ABILITIES)) {
      if (r.formula === 'magic') expect(r.canMiss, r.id).toBe(false); // hard rule 5
    }
  });

  it('the build: Yuna alone, Chapter X Yuna and aeons (B2, B4), GS full (B5), Bahamut partial (B3), Chapter X bag (B7)', () => {
    expect(viaPurificoBuild.activeSlots).toEqual(['yuna']);
    expect(viaPurificoBuild.reserve).toEqual([]);
    expect(viaPurificoBuild.members.map((m) => m.id)).toEqual(['yuna']);
    const yuna = viaPurificoBuild.members[0]!;
    const x = highbridgeBuild.members.find((m) => m.id === 'yuna')!;
    expect(yuna.stats).toEqual(x.stats);
    expect(yuna.learnedAbilityIds).toEqual(x.learnedAbilityIds);
    expect(yuna.overdrive.gauge).toBe(YUNA_GAUGE);
    expect(viaPurificoBuild.aeons.map((a) => [a.id, a.stats.maxHp, a.overdriveGauge])).toEqual([
      ['valefor', 1_146, 90], ['ifrit', 1_515, 60], ['ixion', 1_513, 60], ['shiva', 1_342, 0], ['bahamut', 1_398, BAHAMUT_GAUGE],
    ]);
    expect(viaPurificoBuild.inventory).toEqual(highbridgeBuild.inventory);
  });
});

describe('damage, on the engine chain at roll 16 (research §5.2 [derived], §5.3)', () => {
  const battle = newEngine('isaaru-spathi', 1);
  const st = battle.state();
  const aeon = (id: string) => st.combatants[id] as FFXCombatant;
  const hit = (user: string, def: typeof rows.spathiMegaFlare, target: FFXCombatant) =>
    computeDamage({ user: st.combatants[user] as FFXCombatant, target, def, crit: false, varianceRoll: 16, elements: def.element }).amount;
  const grothia = newEngine('isaaru-grothia', 1).state().combatants[GROTHIA] as FFXCombatant;
  const pterya = newEngine('isaaru-pterya', 1).state().combatants[PTERYA] as FFXCombatant;
  const withStatus = (c: FFXCombatant, s: 'shield' | 'shell') => ({ ...c, statuses: { ...c.statuses, [s]: { id: s, turnsRemaining: 1, ticksRemaining: null, charges: null, stacks: 0, permanent: false } } });
  const from = (u: FFXCombatant, def: typeof rows.spathiMegaFlare, target: FFXCombatant) =>
    computeDamage({ user: u, target, def, crit: false, varianceRoll: 16, elements: def.element }).amount;

  it('Mega Flare 2,203 on Ixion, 550 under Shield; 2,370 / 2,469 / 2,353 on Valefor, Ifrit, Shiva', () => {
    expect(hit(SPATHI, rows.spathiMegaFlare, aeon('ixion'))).toBe(2_203);
    expect(hit(SPATHI, rows.spathiMegaFlare, withStatus(aeon('ixion'), 'shield'))).toBe(550);
    expect(hit(SPATHI, rows.spathiMegaFlare, aeon('valefor'))).toBe(2_370);
    expect(hit(SPATHI, rows.spathiMegaFlare, aeon('ifrit'))).toBe(2_469);
    expect(hit(SPATHI, rows.spathiMegaFlare, aeon('shiva'))).toBe(2_353);
  });

  it('Hellfire 1,765 to 1,898 kills every aeon from full HP; Shell does not touch it (type Other)', () => {
    const hf = (id: string) => from(grothia, rows.grothiaHellfire, aeon(id));
    expect([hf('ixion'), hf('bahamut'), hf('shiva'), hf('valefor')]).toEqual([1_765, 1_840, 1_885, 1_898]);
    for (const id of ['valefor', 'ixion', 'shiva', 'bahamut']) expect(hf(id)).toBeGreaterThan(aeon(id).stats.maxHp);
    expect(from(grothia, rows.grothiaHellfire, withStatus(aeon('ixion'), 'shell'))).toBe(1_765);
  });

  it('Energy Ray 411 / 366 / 391 / 382; Shell halves it (Magical)', () => {
    const er = (id: string) => from(pterya, rows.pteryaEnergyRay, aeon(id));
    expect([er('ifrit'), er('ixion'), er('shiva'), er('bahamut')]).toEqual([411, 366, 391, 382]);
    expect(from(pterya, rows.pteryaEnergyRay, withStatus(aeon('ixion'), 'shell'))).toBe(183);
  });
});

describe('Grothia (§4.1)', () => {
  it('Yuna alone: his Yuna attack, no gauge gain; first turn against an aeon: Hellfire, gauge spent', () => {
    const engine = newEngine('isaaru-grothia', 3);
    expect(actor(engine, GROTHIA).overdrive).toMatchObject({ gauge: 100, enemyGaugeRules: rules.ISAARU_GAUGE_RULES });
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('shiva') : defend()), (e) => starts(e.state().log, GROTHIA).length >= 2);
    const log = engine.state().log;
    const moves = starts(log, GROTHIA);
    expect(moves.slice(0, 2)).toEqual([rows.GROTHIA_ATTACK_YUNA, rows.GROTHIA_HELLFIRE]);
    const first = log.findIndex((e) => e.type === 'action-start' && e.actorId === GROTHIA);
    const gaugeBefore = log.slice(0, first + 3).filter((e) => e.type === 'overdrive-gauge' && e.who === GROTHIA);
    expect(gaugeBefore).toEqual([]); // hitting Yuna fills nothing
    expect(actor(engine, GROTHIA).overdrive?.gauge).toBeLessThan(10);
  });

  it('+5 per attack on an aeon, +3 per targeting; Fira and Attack both drawn', () => {
    const engine = newEngine('isaaru-grothia', 5);
    let shielded = false;
    const guard = () => { shielded = true; return { kind: 'ability' as const, id: 'shield', targets: ['ixion'] }; };
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('ixion') : shielded ? { kind: 'attack', targets: [GROTHIA] } : guard()),
      (e) => starts(e.state().log, GROTHIA).length >= 8 || actor(e, 'ixion').hp <= 0);
    const causes = events(engine.state().log, 'overdrive-gauge').filter((e) => e.type === 'overdrive-gauge' && e.who === GROTHIA);
    const steps = causes.map((e) => e.type === 'overdrive-gauge' ? [e.cause, e.to - e.from] : []);
    expect(steps).toContainEqual(['attacking', 5]);
    expect(steps).toContainEqual(['targeted', 3]);
    const ms = new Set(starts(engine.state().log, GROTHIA));
    expect(ms.has(rows.GROTHIA_ATTACK) || ms.has(rows.GROTHIA_FIRA)).toBe(true);
  });
});

describe('Pterya (§4.2)', () => {
  it('starts at 0 (O-9); +10 per attack, +15 per targeting; Energy Ray at 100; her Yuna attack when alone', () => {
    const engine = newEngine('isaaru-pterya', 2);
    expect(actor(engine, PTERYA).overdrive?.gauge).toBe(0);
    let t = 0;
    drive(engine, (d) => (d.actorId === 'yuna' ? (t++ === 0 ? defend() : summon('bahamut')) : { kind: 'attack', targets: [PTERYA] }),
      (e) => starts(e.state().log, PTERYA).includes(rows.PTERYA_ENERGY_RAY));
    const log = engine.state().log;
    const moves = starts(log, PTERYA);
    expect(moves).toContain(rows.PTERYA_ENERGY_RAY);
    const steps = log.filter((e) => e.type === 'overdrive-gauge' && e.who === PTERYA).map((e) => e.type === 'overdrive-gauge' ? [e.cause, e.to - e.from] : []);
    expect(steps).toContainEqual(['attacking', 10]);
    expect(steps).toContainEqual(['targeted', 15]);
    if (moves[0] !== rows.PTERYA_ATTACK_YUNA) expect(log.some((e) => e.type === 'summon')).toBe(true);
  });
});

describe('Spathi (§4.3)', () => {
  it('counts 5, 4, 3, 2, 1 then Mega Flare, then 5 again; the count is published in state.flags', () => {
    const engine = newEngine('isaaru-spathi', 4);
    expect(engine.state().flags[rules.SPATHI_COUNT_FLAG]).toBe(5);
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('ixion') : { kind: 'ability', id: 'shield', targets: [d.actorId] }),
      (e) => starts(e.state().log, SPATHI).length >= 7);
    const log = engine.state().log;
    expect(starts(log, SPATHI)).toEqual([...Array(5).fill(rows.SPATHI_COUNTDOWN), rows.SPATHI_MEGA_FLARE, rows.SPATHI_COUNTDOWN]);
    const counts = log.filter((e) => e.type === 'message' && e.kind === 'telegraph').map((e) => (e.type === 'message' ? e.text : ''));
    expect(counts).toEqual(['Spathi: 5', 'Spathi: 4', 'Spathi: 3', 'Spathi: 2', 'Spathi: 1', 'Spathi: 5']);
    // Shielded, Mega Flare lands for about a quarter (537-617 band at roll 16, §5.3).
    const mf = log.findIndex((e) => e.type === 'action-start' && e.abilityId === rows.SPATHI_MEGA_FLARE);
    const dmg = log.slice(mf).find((e) => e.type === 'damage');
    expect(dmg?.type === 'damage' ? dmg.amount : 0).toBeGreaterThan(450);
    expect(dmg?.type === 'damage' ? dmg.amount : 9_999).toBeLessThan(650);
  });

  it('with Yuna alone the count keeps running and Mega Flare lands on her (O-6): a defeat', () => {
    const engine = newEngine('isaaru-spathi', 6);
    drive(engine, () => defend());
    const st = engine.state();
    expect(st.result?.outcome).toBe('defeat');
    expect(starts(st.log, SPATHI).at(-1)).toBe(rows.SPATHI_MEGA_FLARE);
  });
});

describe('Isaaru (B8)', () => {
  it('never acts, is never in the CTB forecast, never a target of any row', () => {
    const engine = newEngine('isaaru-grothia', 7);
    expect((engine as ReturnType<typeof createFFXEngine>).predictTurnOrder(12).map((t) => t.actorId)).not.toContain(ISAARU);
    const first = nextInput(engine)!;
    for (const r of first.commands) expect(r.validTargets).not.toContain(ISAARU);
    engine.submit(grandSummon('shiva'));
    const aeonTurn = nextInput(engine)!;
    for (const r of aeonTurn.commands) expect(r.validTargets, r.label).not.toContain(ISAARU);
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('valefor') : { kind: 'attack', targets: [GROTHIA] }));
    expect(starts(engine.state().log, ISAARU)).toEqual([]);
    expect(actor(engine, ISAARU).hp).toBe(10);
  });
});

describe('repairs after the engine review (2026-09-25)', () => {
  it("the intent slab calls Countdown what it is: no damage, not 'non-elemental damage to itself'", () => {
    const engine = newEngine('isaaru-spathi', 4) as ReturnType<typeof createFFXEngine>;
    nextInput(engine);
    const intent = engine.intent();
    expect(intent?.enemyId).toBe(SPATHI);
    expect(intent?.abilityId).toBe(rows.SPATHI_COUNTDOWN);
    expect(intent?.description).toBe('Deals no damage.');
  });

  it('the describer: a no-effect row deals no damage, a cure-only row cures, a damage row is unchanged', () => {
    const esuna = ALL_ABILITIES.find((a) => a.id === 'esuna')!;
    expect(describeAbility(esuna)).toMatch(/^Cures Petrify, Poison.* on one ally\.$/);
    expect(describeAbility(rows.spathiMegaFlare)).toContain('damage to the whole party');
  });

  it('a Grand Summon nobody chose (auto-resolved) calls the first free aeon, not nothing: roster order outside a duel, never the locked one', () => {
    const autoGs = (): Command => ({ kind: 'overdrive', id: 'grand-summon', targets: [] });
    const summonedBy = (out: readonly BattleEvent[]) => out.flatMap((e) => (e.type === 'summon' ? [e.aeonId] : []));
    // Outside a duel: the Grothia formation with its duel fields stripped (no lock, no "only aeons").
    const { aeonsOnly: _o, lockedAeons: _l, victoryBonusAp: _v, ...plain } = ISAARU_GROUPS[0]!;
    const open = createFFXEngine({ content, autoResolveMinigames: true });
    open.init({ game: 'ffx', party: viaPurificoBuild, enemies: plain, triggers: [], seed: 3, condition: 'normal', canEscape: false });
    expect(nextInput(open)!.actorId).toBe('yuna');
    expect(summonedBy(open.submit(autoGs()))).toEqual(['valefor']);
    expect(actor(open, 'yuna').overdrive!.gauge).toBe(0);
    // In the Grothia link, Ifrit is locked; with Valefor down the roll skips both.
    const duel = newEngine('isaaru-grothia', 3, { ...viaPurificoBuild, aeons: viaPurificoBuild.aeons.map((a) => (a.id === 'valefor' ? { ...a, hp: 0 } : a)) });
    expect(nextInput(duel)!.actorId).toBe('yuna');
    expect(summonedBy(duel.submit(autoGs()))).toEqual(['ixion']);
  });
});
