/**
 * The Leblanc Syndicate (Chateau Leblanc, FFX-2 Chapter 2) — engine and data.
 *
 * Acceptance cases A4-A9 and A11 of `docs/plans/chapter-leblanc-review.md` §9.
 * A1 / A2 / A3 (the seeded win, the credible-mistake loss and the lose
 * verifier) are in `tests/unit/strategy-ffx2-leblanc.test.ts`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. The last `describe` block is
 * the both-games absence test `critic/CHECKS.md` CHK-021 asks for.
 *
 * Every claim here is **run**, not grepped [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, StatusId } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../../src/battle/ffx2/index.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import type { ResolveContext } from '../../../src/battle/ffx2/resolve.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import {
  LEBLANC_ACT_I,
  LEBLANC_ACT_II,
  LEBLANC_ACT_III,
  LEBLANC_CHAIN_ORDER,
} from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ormiAbilities, logosAbilities, goonAbilities } from '../../../src/data/ffx2/enemies/leblanc-syndicate-abilities.ts';
import { leblancAbilities } from '../../../src/data/ffx2/enemies/leblanc-syndicate-leblanc-abilities.ts';
import { FFX_ABILITIES } from '../../../src/data/ffx/index.ts';

const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));

const SYNDICATE_ABILITIES: AbilityDef[] = [
  ...ormiAbilities,
  ...logosAbilities,
  ...leblancAbilities,
  ...goonAbilities,
];

function ability(id: string): AbilityDef {
  const found = REGISTRY.get(id);
  if (!found) throw new Error(`${id} is not in the shipped ability table`);
  return found;
}

/** A bare resolve context: two units, the real ability table, a seeded RNG. */
function ctxFor(units: Ffx2Unit[], seed = 1): { ctx: ResolveContext; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  const ctx: ResolveContext = {
    units,
    abilities: REGISTRY,
    rng: new SeededRng(seed),
    emit: (e: unknown) => events.push(e as BattleEvent),
    breaksDamageLimit: () => false,
  };
  return { ctx, events };
}

function damageTo(events: BattleEvent[], targetId: string): number {
  return events
    .filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === targetId)
    .reduce((a, e) => a + e.amount, 0);
}

function engineOptions() {
  return {
    abilities: REGISTRY,
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

// ---------------------------------------------------------------------------

describe('the data the research fixes', () => {
  it('ships every published Act III stat exactly [§3.1-3.3]', () => {
    const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
    const by = Object.fromEntries((group?.enemies ?? []).map((e) => [e.id, e]));

    expect(by['leblanc']?.level).toBe(23);
    expect(by['leblanc']?.stats).toMatchObject({ hp: 1380, mp: 460, str: 33, def: 10, mag: 32, mdef: 62, agi: 53, eva: 22, luck: 16 });
    expect(by['logos']?.level).toBe(21);
    expect(by['logos']?.stats).toMatchObject({ hp: 989, mp: 70, str: 17, def: 4, mag: 28, mdef: 18, agi: 49, eva: 40, luck: 10 });
    // §3.3 — Evasion is **absent** from Ormi's record and ships as 0.
    expect(by['ormi']?.level).toBe(19);
    expect(by['ormi']?.stats).toMatchObject({ hp: 1344, mp: 45, str: 53, def: 84, mag: 26, mdef: 16, agi: 42, eva: 0, luck: 4 });

    // G8 resolved: 1,344 / 989, never GamerGuides' Act II numbers.
    expect(by['ormi']?.stats.hp).not.toBe(1840);
    expect(by['logos']?.stats.hp).not.toBe(1432);
    // Total pool, §2.
    const total = (group?.enemies ?? []).reduce((a, e) => a + e.stats.hp, 0);
    expect(total).toBe(3713);
  });

  it('ships the Act I and Act II pools, and never mixes the records [§2, §12]', () => {
    const one = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I];
    const two = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II];
    expect((one?.enemies ?? []).reduce((a, e) => a + e.stats.hp, 0)).toBe(2039);
    expect((two?.enemies ?? []).reduce((a, e) => a + e.stats.hp, 0)).toBe(3272);

    const ormiI = one?.enemies.find((e) => e.id === 'ormi-entrance');
    expect(ormiI?.stats).toMatchObject({ hp: 1640, def: 120, mdef: 4 });
    const ormiII = two?.enemies.find((e) => e.id === 'ormi-logos-room');
    expect(ormiII?.stats).toMatchObject({ hp: 1840, def: 121, mdef: 8 });
    const logosII = two?.enemies.find((e) => e.id === 'logos-room');
    expect(logosII?.stats).toMatchObject({ hp: 1432, def: 4, eva: 38 });
  });

  it('G1: no Syndicate stat block or action carries an Accuracy byte [§5.1, E-G1]', () => {
    for (const id of LEBLANC_CHAIN_ORDER) {
      for (const e of data.ENEMY_GROUPS_BY_ID[id]?.enemies ?? []) {
        expect(e.stats.acc, `${e.id} stat block`).toBe(0);
      }
    }
    for (const a of SYNDICATE_ABILITIES) {
      // An explicit byte short-circuits the ENEMY_BASE_ACCURACY fallback and
      // makes the action never connect — the exact Chapter 4 defect §5 Q6
      // records. Leaving it undefined is what routes it to the baseline.
      expect(a.accuracy, `${a.id}`).toBeUndefined();
    }
  });

  it('Leblanc alone is Break-immune where the boys are not [§3.1]', () => {
    const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
    const by = Object.fromEntries((group?.enemies ?? []).map((e) => [e.id, e]));
    for (const s of ['str-down', 'def-down', 'luck-down'] as StatusId[]) {
      expect(by['leblanc']?.immunities[s]).toBe(255);
      expect(by['logos']?.immunities[s] ?? 0).toBe(0);
      expect(by['ormi']?.immunities[s] ?? 0).toBe(0);
    }
    // …and MAG Down / MDEF Down land on her, which is the Mental Break answer.
    expect(by['leblanc']?.immunities['mag-down'] ?? 0).toBe(0);
    expect(by['leblanc']?.immunities['mdef-down'] ?? 0).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe('A4 — Huggles reproduces the published band', () => {
  function huggles(seed: number, targetStatuses: StatusId[] = []): number {
    const ormi = aiUnit('ormi', 'enemy', 1344);
    const girl = aiUnit('yuna', 'party', 9999);
    for (const s of targetStatuses) applyStatus(girl, { status: s, chance: 255, duration: 255 });
    const { ctx, events } = ctxFor([ormi, girl], seed);
    resolveAbility(ctx, ormi, ability('x2-ormi-huggles'), [girl.id]);
    return damageTo(events, girl.id);
  }

  it('lands inside 1,110-1,254 on every seed that connects [§4.1 — the one exact reconstruction]', () => {
    const totals = Array.from({ length: 30 }, (_, i) => huggles(i + 1)).filter((t) => t > 0);
    expect(totals.length).toBeGreaterThan(20);
    for (const total of totals) {
      expect(total).toBeGreaterThanOrEqual(1110);
      expect(total).toBeLessThanOrEqual(1254);
    }
  });

  it('is unreducible: Protect and Sentinel change nothing [§4.2, damageType `other`]', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const bare = huggles(seed);
      expect(huggles(seed, ['protect'])).toBe(bare);
      expect(huggles(seed, ['defend'])).toBe(bare);
    }
  });
});

// ---------------------------------------------------------------------------

describe('A5 — No Love Lost', () => {
  function leblancTurns(count: number, withHenchmen: boolean): Array<string | null> {
    const self = aiUnit('leblanc', 'enemy', 1380);
    self.level = 23;
    const others = withHenchmen
      ? [aiUnit('ormi', 'enemy', 1344, 1), aiUnit('logos', 'enemy', 989, 2)]
      : [aiUnit('ormi', 'enemy', 1344, 1)];
    return aiHarness(self, others, 'ffx2-leblanc').run(count);
  }

  it('fires on her 3rd, 11th and 19th turn — and only then [§4.5, §5.3]', () => {
    const picks = leblancTurns(20, true);
    const firing = picks.map((p, i) => (p === 'x2-nll-1' ? i + 1 : 0)).filter(Boolean);
    expect(firing).toEqual([3, 11, 19]);
  });

  it('never fires once a henchman is down — the fight teaching its own target priority [§5.4]', () => {
    const picks = leblancTurns(20, false);
    expect(picks).not.toContain('x2-nll-1');
  });

  it('turn 1 and turn 5 are Not-So-Mighty Guard, turn 2 is Fan Slap [§5.3]', () => {
    const picks = leblancTurns(6, true);
    expect(picks[0]).toBe('x2-leblanc-not-so-mighty-guard');
    expect(picks[1]).toBe('x2-leblanc-fan-slap');
    expect(picks[4]).toBe('x2-leblanc-not-so-mighty-guard');
  });

  it('the `25 + uses` failsafe forces Not-So-Mighty Guard [§5.3]', () => {
    // Four uses by turn 27, so `turn > 25 + uses` opens at turn 30. The two
    // overrides are listed in the source in this order, so a later `[8x - 5]`
    // turn (35, 43 …) still takes No Love Lost rather than the failsafe.
    const picks = leblancTurns(40, true);
    expect(picks[29]).toBe('x2-leblanc-not-so-mighty-guard');
    for (let turn = 30; turn <= 40; turn++) {
      expect([picks[turn - 1], turn]).toEqual([
        turn % 8 === 3 ? 'x2-nll-1' : 'x2-leblanc-not-so-mighty-guard',
        turn,
      ]);
    }
  });

  it('E5 — one action, three stages, resolved from one turn [preflight E5]', () => {
    const leblanc = aiUnit('leblanc', 'enemy', 1380);
    const party = [aiUnit('yuna', 'party', 900), aiUnit('rikku', 'party', 900, 1), aiUnit('paine', 'party', 900, 2)];
    const { ctx, events } = ctxFor([leblanc, ...party], 7);
    resolveAbility(ctx, leblanc, ability('x2-nll-1'), []);

    // Stage 1: eight constant hits. Stage 2: one on each girl. Stage 3: a
    // fraction of one girl's remaining HP. Twelve damage events, one action.
    const hits = events.filter((e) => e.type === 'damage');
    expect(hits.length).toBe(12);
    const total = party.reduce((a, g) => a + (900 - g.hp), 0);
    expect(total).toBeGreaterThan(400);
    // §4.5's design read: a spectacle, not an execution.
    for (const g of party) expect(g.alive).toBe(true);
  });

  it('a sequenced stage does not recurse [the guard in resolve.ts]', () => {
    const leblanc = aiUnit('leblanc', 'enemy', 1380);
    const girl = aiUnit('yuna', 'party', 9999);
    const { events } = ctxFor([leblanc, girl], 3);
    const looping: AbilityDef = { ...ability('x2-nll-2'), extra: { flat: 106, sequence: ['x2-nll-2'] } };
    const { ctx } = ctxFor([leblanc, girl], 3);
    resolveAbility(ctx, leblanc, looping, [girl.id]);
    expect(events.length).toBe(0); // the unused context stays empty
    expect(girl.hp).toBeGreaterThan(9999 - 300); // two resolutions at most, not infinite
  });
});

// ---------------------------------------------------------------------------

describe('A6 / A7 — Russian Roulette and Eject', () => {
  const SIX: StatusId[] = ['ko', 'eject', 'petrify', 'silence', 'curse', 'poison'];

  function roulette(seed: number): StatusId[] {
    const logos = aiUnit('logos', 'enemy', 989);
    const girl = aiUnit('yuna', 'party', 9999);
    const { ctx, events } = ctxFor([logos, girl], seed);
    resolveAbility(ctx, logos, ability('x2-logos-russian-roulette'), [girl.id]);
    return events
      .filter((e): e is Extract<BattleEvent, { type: 'status-add' }> => e.type === 'status-add')
      .map((e) => e.status)
      .filter((s) => SIX.includes(s));
  }

  it('lands exactly one of the six, never zero and never two, over 200 rolls [§4.3]', () => {
    const seen = new Set<StatusId>();
    for (let seed = 1; seed <= 200; seed++) {
      const landed = roulette(seed);
      expect(landed.length, `seed ${seed}`).toBe(1);
      seen.add(landed[0] as StatusId);
    }
    // All six are reachable — it is a roulette, not a coin.
    expect([...seen].sort()).toEqual([...SIX].sort());
  });

  it('A7 — an ejected girl leaves the battle: untargetable, no cure, gauge stopped', () => {
    const logos = aiUnit('logos', 'enemy', 989);
    const girl = aiUnit('yuna', 'party', 9999);
    const ejectOnly: AbilityDef = {
      ...ability('x2-logos-russian-roulette'),
      statusEffects: [{ status: 'eject', chance: 254, duration: 0 }],
      extra: { flat: 200 },
    };
    const { ctx } = ctxFor([logos, girl], 1);
    resolveAbility(ctx, logos, ejectOnly, [girl.id]);

    expect(girl.removed).toBe(true);
    expect(girl.alive).toBe(true); // she is gone, not dead — no Phoenix Down answers it
    expect(girl.statuses['eject']).toBeDefined();
    // `targeting.ts::isTargetable` already reads the flag, so she cannot be
    // aimed at by anything, friendly or otherwise.
    const { ctx: ctx2, events } = ctxFor([logos, girl], 2);
    resolveAbility(ctx2, logos, ability('x2-logos-double-shot'), [girl.id]);
    expect(events.length).toBe(0);
  });

  it('A7 — all three ejected is a defeat, because `results.ts` already reads `removed`', async () => {
    const { battleOutcome, emptyState } = await import('../../../src/battle/ffx2/results.ts');
    const party = [aiUnit('yuna', 'party'), aiUnit('rikku', 'party', 1000, 1), aiUnit('paine', 'party', 1000, 2)];
    const enemy = aiUnit('leblanc', 'enemy', 1380);
    const units = [...party, enemy];
    expect(battleOutcome(units, emptyState())).toBe(null);
    for (const g of party) g.removed = true;
    expect(battleOutcome(units, emptyState())).toBe('defeat');
  });
});

// ---------------------------------------------------------------------------

describe('A8 — the three defensive shapes are measurable', () => {
  function hit(attacker: Partial<Ffx2Unit['stats']>, defender: string, abilityId: string): number {
    const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
    const def = group?.enemies.find((e) => e.id === defender);
    if (!def) throw new Error(defender);
    const target: Ffx2Unit = { ...aiUnit(defender, 'enemy', def.stats.maxHp), stats: { ...def.stats }, level: def.level ?? 20 };
    const girl = aiUnit('yuna', 'party', 1000);
    girl.level = 22;
    girl.stats = { ...girl.stats, ...attacker };
    let total = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const fresh: Ffx2Unit = { ...target, hp: def.stats.maxHp, statuses: {}, chainCount: 0, chainWindowTicks: 0 };
      const { ctx, events } = ctxFor([girl, fresh], seed);
      resolveAbility(ctx, girl, ability(abilityId), [fresh.id]);
      total += damageTo(events, fresh.id);
    }
    return Math.round(total / 24);
  }

  it('Fira into Ormi beats a Warrior sword into Ormi, and the ordering is the lesson [§6.2]', () => {
    const fira = hit({ mag: 71, acc: 110, luck: 26 }, 'ormi', 'x2-black-mage-fira');
    const sword = hit({ str: 60, acc: 102, luck: 12 }, 'ormi', 'x2-warrior-attack');
    expect(fira).toBeGreaterThan(sword * 2);
  });

  it('Leblanc is the inverse: her MDef 62 blunts magic where her Def 10 does not blunt a sword [§6.2]', () => {
    const fira = hit({ mag: 71, acc: 110, luck: 26 }, 'leblanc', 'x2-black-mage-fira');
    const firaOrmi = hit({ mag: 71, acc: 110, luck: 26 }, 'ormi', 'x2-black-mage-fira');
    expect(fira).toBeLessThan(firaOrmi);
  });
});

// ---------------------------------------------------------------------------

describe('A11 — act chain integrity', () => {
  it('the three acts link in order and none of them can be escaped [§2]', () => {
    expect(data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I]?.nextGroupId).toBe(LEBLANC_ACT_II);
    expect(data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]?.nextGroupId).toBe(LEBLANC_ACT_III);
    expect(data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]?.nextGroupId).toBeUndefined();
    for (const id of LEBLANC_CHAIN_ORDER) {
      expect(data.ENEMY_GROUPS_BY_ID[id]?.canEscape).toBe(false);
    }
  });

  it('every enemy resolves an AI script that is not the idle fallback', () => {
    const engine = new FFX2Engine(engineOptions());
    for (const id of LEBLANC_CHAIN_ORDER) {
      const group = data.ENEMY_GROUPS_BY_ID[id];
      if (!group) throw new Error(id);
      engine.setSeed(11);
      engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed: 11, condition: 'normal', canEscape: false });
      const actions: string[] = [];
      for (let i = 0; i < 400 && actions.length < 6; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
        if (d.kind === 'resolved') continue;
        if (d.kind !== 'player-input') break;
        engine.submit({ kind: 'defend', targets: [] } as Command);
        for (const e of engine.state().log) {
          if (e.type === 'action-start' && !engine.state().activeIds.includes(e.actorId)) actions.push(e.abilityId ?? '');
        }
      }
      expect(actions.length, id).toBeGreaterThan(0);
      // `idleScript` returns null and emits nothing, so a half-wired formation
      // would show up here as silence.
      expect(actions.every((a) => typeof a === 'string'), id).toBe(true);
    }
  });

  it('every ability every enemy names is in the shipped table (hard rule 4, in miniature)', () => {
    for (const id of LEBLANC_CHAIN_ORDER) {
      for (const e of data.ENEMY_GROUPS_BY_ID[id]?.enemies ?? []) {
        for (const a of e.abilityIds) expect(REGISTRY.get(a as string), `${e.id} -> ${a}`).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------

describe('A9 — the both-games absence tests (rule 14, CHK-021)', () => {
  it('`statusRollOneOf` and `sequence` appear on no FFX ability', () => {
    for (const a of Object.values(FFX_ABILITIES) as AbilityDef[]) {
      expect(a.extra?.['statusRollOneOf'], a.id).toBeUndefined();
      expect(a.extra?.['sequence'], a.id).toBeUndefined();
    }
  });

  it('the eject-removes-a-character rule is FFX-2 only, and it moves no shipped chapter', () => {
    // FFX has its own Eject — Kimahri's Ronso Rage `shooting-star` — and it is
    // handled in FFX's own resolver (`src/battle/ffx/abilities.ts`). The rule
    // added here lives in `src/battle/ffx2/resolve.ts` and every FFX ability is
    // an FFX ability, so no FFX battle ever reaches it.
    for (const a of Object.values(FFX_ABILITIES) as AbilityDef[]) expect(a.game, a.id).toBe('ffx');

    // Inside X-2 it is **not** Russian Roulette's private rule: five party
    // abilities already set `eject` and were, until now, painting an EJT chip
    // on a fiend that kept fighting. This pins the whole set, so a sixth
    // cannot appear unnoticed.
    const setters = (Object.values(data.ABILITIES) as AbilityDef[])
      .filter((a) => a.statusEffects.some((s) => s.status === 'eject'))
      .map((a) => a.id)
      .sort();
    expect(setters).toEqual([
      'x2-berserker-eject',
      'x2-logos-russian-roulette',
      'x2-mascot-pupu-platter',
      'x2-thief-steal-will',
      'x2-trainer-carrier-flurry',
      'x2-trainer-kogoro-strike',
    ]);

    // And every enemy in the two shipped X-2 chapters is Eject-immune, so
    // those chapters' seeded evidence cannot have moved.
    for (const id of ['ffx2-bahamut', 'vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin']) {
      for (const e of data.ENEMY_GROUPS_BY_ID[id]?.enemies ?? []) {
        expect(e.immunities['eject'], `${id}/${e.id}`).toBe(255);
      }
    }
  });

  it('the Syndicate ids appear in no FFX data path', () => {
    const ffxIds = new Set(Object.keys(FFX_ABILITIES));
    for (const a of SYNDICATE_ABILITIES) expect(ffxIds.has(a.id), a.id).toBe(false);
  });

  it('the chapter is deliberately NOT registered — chapter select still shows Coming', async () => {
    const encounters = await import('../../../src/data/encounters.ts');
    const ids = encounters.CHAPTERS.map((c) => c.enemyGroupRef.id);
    for (const id of LEBLANC_CHAIN_ORDER) expect(ids).not.toContain(id);
  });
});
