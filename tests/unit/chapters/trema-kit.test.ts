/**
 * Chapter XIII — the sourced kit the method check found missing (E5): the status half of the
 * accessories (Auto-Wall, Ribbon), Soul Spring, Three / Twin Stars, Stamina Tonic, the Valiant
 * Lustre grid, and the kit options that wear them. **Split_Infinity's kit (`'sourced-kit'`) ships**
 * (Bailey, 2026-09-25, "Trema: 1 and 3 at 3 s"); TR11 a and the other kits stay built and OFF.
 * Each through the real engine or resolver [hard rule 3]. **FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine, garmentGridRegistryFrom, activeGateBonuses, gateStatTotal } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { MAX_HP_CAP, RIBBON_IMMUNE, doubledMaxHp } from '../../../src/battle/ffx2/kit.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import {
  TREMA_KIT_OPTIONS, tremaBuildFor, viaInfinitoOneLustreKitBuild, viaInfinitoRibbonKitBuild, viaInfinitoSourcedKitBuild,
} from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { FFX2_TREMA, TREMA_KIT_OPTION } from '../../../src/data/chapter-ffx2-trema.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA, cloisterTremaGroup } from '../../../src/data/ffx2/enemies/trema.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ABILITY_REGISTRY } from '../helpers/tremaUnits.ts';
import { group, newEngine } from '../helpers/tremaDrive.ts';

function start(party: FFX2PartyBuild, link = CLOISTER_PARAGON, seed = 1): { engine: FFX2Engine; setup: BattleSetup; unit: (id: string) => Ffx2Unit } {
  const engine = newEngine();
  const setup: BattleSetup = { game: 'ffx2', party, enemies: group(link), triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  const unit = (id: string) => engine.state().combatants[id] as unknown as Ffx2Unit;
  return { engine, setup, unit };
}

function ctx(units: Ffx2Unit[], seed = 1) {
  const events: Array<{ type: string; [k: string]: unknown }> = [];
  return {
    events,
    ctx: { units, abilities: ABILITY_REGISTRY, rng: new SeededRng(seed), emit: (e: unknown) => { events.push(e as { type: string }); }, breaksDamageLimit: () => false },
  };
}

describe('the sourced kit ships: Split_Infinity\'s clear is the chapter\'s build', () => {
  it('the chapter builds with the sourced kit, and every option but NightMare185\'s keeps TR10\'s line-up', () => {
    expect(TREMA_KIT_OPTION).toBe('sourced-kit');
    expect(FFX2_TREMA.buildRef).toBe(viaInfinitoSourcedKitBuild);
    expect(tremaBuildFor('tr11-a')).toBe(viaInfinitoBuild);
    // 'nightmare-kit' (option 4) is three Dark Knights by its source: `trema-options.test.ts`.
    for (const option of TREMA_KIT_OPTIONS.filter((o) => o !== 'nightmare-kit')) {
      const b = tremaBuildFor(option);
      expect(b.members.map((m) => [m.id, m.currentDressphere, m.level])).toEqual([
        ['yuna', 'dark-knight', 99], ['rikku', 'alchemist', 99], ['paine', 'dark-knight', 99],
      ]);
      for (const entry of b.inventory) expect(data.ITEMS[entry.itemId], entry.itemId).toBeDefined();
    }
  });

  it('no shipped build of another chapter wears the new accessories or carries the new items', () => {
    const fresh = ['defense-bracer', 'adamantite', 'ribbon', 'moon-bracer', 'shining-bracer'];
    const items = ['x2-soul-spring', 'x2-three-stars', 'x2-twin-stars', 'x2-stamina-tonic'];
    for (const b of [bevelleBuild, farplaneBuild, chateauBuild, viaInfinitoBuild]) {
      for (const m of b.members) expect(m.accessories.filter((a) => fresh.includes(a))).toEqual([]);
      expect(b.inventory.filter((i) => items.includes(i.itemId))).toEqual([]);
      for (const m of b.members) expect(m.garmentGrid.id).not.toBe('valiant-lustre');
    }
  });
});

describe('accessories\' status half (kit.ts)', () => {
  it('Defense Bracer and Adamantite keep Protect and Shell on from the first event, and Genesis leaves them', () => {
    const { unit } = start(viaInfinitoSourcedKitBuild);
    for (const id of ['yuna', 'rikku', 'paine']) {
      expect(unit(id).statuses.protect?.ticksRemaining).toBeNull();
      expect(unit(id).statuses.shell?.ticksRemaining).toBeNull();
      expect(unit(id).autoStatuses).toEqual(['protect', 'shell']);
    }
    const units = Object.values(start(viaInfinitoSourcedKitBuild).engine.state().combatants) as unknown as Ffx2Unit[];
    const { ctx: c, events } = ctx(units);
    resolveAbility(c, units.find((u) => u.id === 'paragon')!, data.ABILITIES['paragon-genesis']!, []);
    for (const u of units.filter((x) => x.side === 'party' && x.alive)) {
      expect(u.statuses.protect).toBeDefined();
      expect(u.statuses.shell).toBeDefined();
    }
    expect(events.some((e) => e.type === 'status-remove' && (e.status === 'protect' || e.status === 'shell'))).toBe(false);
  });

  it('the preset (TR11 a) starts with no status at all, as before', () => {
    const { unit } = start(viaInfinitoBuild);
    for (const id of ['yuna', 'rikku', 'paine']) {
      expect(unit(id).statuses).toEqual({});
      expect(unit(id).autoStatuses).toBeUndefined();
      expect(unit(id).immunities).toEqual({});
    }
  });

  it('a Ribbon blocks §2.8\'s twelve, and Paragon\'s Itchy attack does not land on her', () => {
    const { engine, unit } = start(viaInfinitoRibbonKitBuild);
    const rikku = unit('rikku');
    for (const s of RIBBON_IMMUNE) expect(rikku.immunities[s]).toBe(255);
    expect(rikku.immunities.ko).toBeUndefined();
    const units = Object.values(engine.state().combatants) as unknown as Ffx2Unit[];
    const { ctx: c } = ctx(units);
    resolveAbility(c, unit('paragon'), data.ABILITIES['paragon-attack-itchy']!, ['rikku']);
    expect(rikku.statuses.itchy).toBeUndefined();
    resolveAbility(c, unit('paragon'), data.ABILITIES['paragon-attack-itchy']!, ['yuna']);
    expect(unit('yuna').statuses.itchy).toBeDefined(); // no Ribbon on Yuna
  });
});

describe('the new items (ffx2-combat-core §5.5)', () => {
  it('Soul Spring drains HP and the same MP from Trema, and his Spellspring does not stop it', () => {
    const { engine, unit } = start(viaInfinitoSourcedKitBuild, CLOISTER_TREMA);
    const units = Object.values(engine.state().combatants) as unknown as Ffx2Unit[];
    const trema = unit('trema');
    const rikku = unit('rikku');
    rikku.hp = 100;
    const { ctx: c, events } = ctx(units);
    resolveAbility(c, rikku, data.ABILITIES['x2-item-soul-spring']!, ['trema']);
    const hit = events.find((e) => e.type === 'damage' && e.targetId === 'trema') as { amount: number } | undefined;
    const mp = events.find((e) => e.type === 'mp-damage' && e.targetId === 'trema') as { amount: number } | undefined;
    expect(hit?.amount).toBeGreaterThanOrEqual(937);
    expect(hit?.amount).toBeLessThanOrEqual(1058);
    expect(mp?.amount).toBe(Math.min(999, hit!.amount));
    expect(trema.mp).toBe(999 - mp!.amount);
    expect(rikku.hp).toBe(100 + hit!.amount);
  });

  it('Three Stars puts Spellspring on the party, and Darkness then costs no HP', () => {
    const { engine, unit } = start(viaInfinitoSourcedKitBuild, CLOISTER_TREMA);
    const units = Object.values(engine.state().combatants) as unknown as Ffx2Unit[];
    const { ctx: c, events } = ctx(units);
    resolveAbility(c, unit('rikku'), data.ABILITIES['x2-item-three-stars']!, []);
    for (const id of ['yuna', 'rikku', 'paine']) expect(unit(id).statuses.spellspring).toBeDefined();
    const before = unit('yuna').hp;
    events.length = 0;
    resolveAbility(c, unit('yuna'), data.ABILITIES['x2-dark-knight-darkness']!, []);
    expect(events.some((e) => e.type === 'damage' && e.targetId === 'yuna')).toBe(false);
    expect(unit('yuna').hp).toBe(before);
  });

  it('Stamina Tonic doubles the ceiling (cap 9,999), not current HP; it survives a spherechange and the seam into Trema', () => {
    expect(doubledMaxHp(5355)).toBe(MAX_HP_CAP);
    expect(doubledMaxHp(2553)).toBe(5106);
    expect(doubledMaxHp(10710)).toBe(10710); // already above the cap: kept (trema-bench #4)
    const { engine, setup, unit } = start(viaInfinitoSourcedKitBuild);
    const units = Object.values(engine.state().combatants) as unknown as Ffx2Unit[];
    const { ctx: c } = ctx(units);
    const paine = unit('paine');
    const hp = paine.hp;
    resolveAbility(c, unit('rikku'), data.ABILITIES['x2-item-stamina-tonic']!, []);
    expect(paine.stats.maxHp).toBe(MAX_HP_CAP); // Dark Knight Lv 99, 5,355 x2, capped
    expect(paine.hp).toBe(hp);
    expect(unit('rikku').stats.maxHp).toBe(MAX_HP_CAP); // Adamantite's 5,106, doubled and capped
    paine.hp = paine.stats.maxHp;
    const next = setupForNextLink(setup, cloisterTremaGroup, engine.state() as BattleState, 2);
    const trema = newEngine();
    trema.setSeed(next.seed);
    trema.init(next);
    const carried = trema.state().combatants['paine'] as unknown as Ffx2Unit;
    expect(carried.stats.maxHp).toBe(MAX_HP_CAP);
    expect(carried.hp).toBe(MAX_HP_CAP);
  });

  it('Carnival Cancan\'s max-hp-x2 stays inert, as it always was (its dance end is not modelled)', () => {
    const { unit } = start(viaInfinitoBuild);
    const yuna = unit('yuna');
    const max = yuna.stats.maxHp;
    applyStatus(yuna, { status: 'max-hp-x2', chance: 254, duration: 0 }, 'yuna', 'x2-songstress-carnival-cancan');
    expect(yuna.stats.maxHp).toBe(max);
  });
});

describe('Valiant Lustre (+60 / +60 with every gate; [verified: 2 sources])', () => {
  it('Equip Def / MDef +20; Yellow and Blue Def +20 each, Red and Green MDef +20 each', () => {
    const grid = garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)).get('valiant-lustre')!;
    expect(grid.nodes).toBe(5);
    expect(gateStatTotal(activeGateBonuses(grid, []))).toEqual({ def: 20, mdef: 20 });
    expect(gateStatTotal(activeGateBonuses(grid, ['yellow', 'blue']))).toEqual({ def: 60, mdef: 20 });
    expect(gateStatTotal(activeGateBonuses(grid, ['yellow', 'blue', 'red', 'green']))).toEqual({ def: 60, mdef: 60 });
  });

  it('the kit\'s Dark Knight starts at Def 151 + 20 and the Alchemist at 52 + 120 + 20; one Lustre dresses Yuna only', () => {
    const { unit } = start(viaInfinitoSourcedKitBuild);
    expect(unit('yuna').stats.def).toBe(171);
    expect(unit('rikku').stats.def).toBe(192);
    const one = start(viaInfinitoOneLustreKitBuild);
    expect(one.unit('yuna').stats.def).toBe(171);
    expect(one.unit('paine').stats.def).toBe(151);
  });
});
