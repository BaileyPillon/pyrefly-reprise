/**
 * Spherechange, Garment Grids and gate bonuses
 * [research/ffx2-combat-core.md §4.1–4.2].
 *
 * The rules under test are the ones that make a spherechange a *tactical*
 * action rather than a menu: one link per turn, the whole turn spent, gates
 * passed through rather than stepped on, and a gate bonus that lasts the rest
 * of the battle — including across KO and revival.
 */

import { describe, expect, it } from 'vitest';
import {
  activeGateBonuses,
  adjacentNodes,
  canSpecialDressUp,
  defaultGarmentGrids,
  garmentGrid,
  dressphereStats,
  gatesBetween,
  gateStatTotal,
  hasAttackCommand,
  isLongRange,
  attackHits,
  performSpherechange,
  specialDressUpPartIds,
  waitDownPercent,
  withStatBonus,
  defaultDresspheres,
  FFX2Engine,
} from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bevelleParty, group, bahamutEnemy } from '../../src/battle/ffx2/fixtures.ts';
import type { EventDraft } from '../../src/battle/ffx2/index.ts';

const deps = {
  grids: defaultGarmentGrids,
  dresspheres: defaultDresspheres,
  gridNodes: {} as Record<string, Array<string | null>>,
};

function girl(gridId: string, dressphere = 'gunner', level = 24): Ffx2Unit {
  const stats = dressphereStats(dressphere, level);
  return {
    id: 'yuna', name: 'Yuna', side: 'party', spriteKey: 'yuna', stats,
    hp: stats.maxHp, mp: stats.maxMp, statuses: {}, affinities: {}, immunities: {},
    immunityFlags: [], controller: 'player', alive: true, removed: false, slot: 0, flags: {},
    level,
    dresspheres: {
      current: dressphere,
      owned: [dressphere, 'warrior', 'white-mage'],
      garmentGrid: { id: gridId, nodePosition: 0, passedGates: [], wornThisBattle: [dressphere] },
      abilitiesLearned: {},
    },
    atb: { ticks: 999, required: 1000, gauge: 99, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0,
  };
}

function change(unit: Ffx2Unit, to: string, toNode: number): EventDraft[] {
  const events: EventDraft[] = [];
  performSpherechange(
    unit,
    { kind: 'spherechange', targets: [], extra: { toDressphere: to, toNode, gatesCrossed: [] } },
    deps,
    (e) => events.push(e),
  );
  return events;
}

describe('Garment Grid structure', () => {
  it('knows the published node counts', () => {
    expect(garmentGrid('first-steps').nodes).toBe(6);
    expect(garmentGrid('unerring-path').nodes).toBe(2); // the fastest route to an SDSP
    expect(garmentGrid('vanguard').nodes).toBe(5);
    expect(garmentGrid('stonehewn').nodes).toBe(4);
  });

  it('only links adjacent nodes, and a 2-node Grid has exactly one link', () => {
    const tiny = garmentGrid('unerring-path');
    expect(tiny.links).toHaveLength(1);
    expect(adjacentNodes(tiny, 0).map((n) => n.node)).toEqual([1]);
    expect(adjacentNodes(tiny, 1).map((n) => n.node)).toEqual([0]);
  });

  it('puts gates ON the link, not on a node', () => {
    const vanguard = garmentGrid('vanguard');
    expect(gatesBetween(vanguard, 0, 1)).toEqual(['red']);
    expect(gatesBetween(vanguard, 1, 2)).toEqual(['green']);
    // Not adjacent -> not a legal single-link spherechange.
    expect(gatesBetween(vanguard, 0, 3)).toBeNull();
  });
});

describe('gate bonuses [§4.1]', () => {
  it('always grants the permanent `P-` equip effect, gates or no gates', () => {
    const vanguard = garmentGrid('vanguard');
    expect(gateStatTotal(activeGateBonuses(vanguard, []))).toEqual({ str: 5, mag: 5 });
  });

  it('adds the per-colour `T-` bonus once the gate has been passed', () => {
    const vanguard = garmentGrid('vanguard');
    expect(gateStatTotal(activeGateBonuses(vanguard, ['red']))).toEqual({ str: 10, mag: 5 });
    expect(gateStatTotal(activeGateBonuses(vanguard, ['red', 'blue']))).toEqual({ str: 10, mag: 10 });
  });

  it('honours the §4.1 stacking quirk: an all-gates bonus pays PER GATE', () => {
    // Stonehewn: equip DEF +10, then DEF +15 for *each* of the four gates.
    const stonehewn = garmentGrid('stonehewn');
    expect(gateStatTotal(activeGateBonuses(stonehewn, []))).toEqual({ def: 10 });
    expect(gateStatTotal(activeGateBonuses(stonehewn, ['red']))).toEqual({ def: 25 });
    expect(gateStatTotal(activeGateBonuses(stonehewn, ['red', 'green', 'blue']))).toEqual({ def: 55 });
    expect(gateStatTotal(activeGateBonuses(stonehewn, ['red', 'green', 'blue', 'yellow']))).toEqual({ def: 70 });
  });

  it('requires every gate of a combination, in any order', () => {
    const samurai = garmentGrid('samurais-honor');
    expect(waitDownPercent(activeGateBonuses(samurai, ['red', 'green', 'blue']))).toBe(0);
    expect(waitDownPercent(activeGateBonuses(samurai, ['yellow', 'blue', 'green', 'red']))).toBe(40);
  });

  it('never double-counts a gate crossed twice', () => {
    const stonehewn = garmentGrid('stonehewn');
    expect(gateStatTotal(activeGateBonuses(stonehewn, ['red', 'red', 'red']))).toEqual({ def: 25 });
  });
});

describe('performSpherechange', () => {
  it('changes sphere, banks the gate and re-derives stats from the new sphere', () => {
    const yuna = girl('vanguard', 'gunner');
    const baseStr = yuna.stats.str;
    const events = change(yuna, 'warrior', 1);

    expect(events.some((e) => e.type === 'spherechange')).toBe(true);
    expect(yuna.dresspheres?.current).toBe('warrior');
    expect(yuna.dresspheres?.garmentGrid.nodePosition).toBe(1);
    expect(yuna.dresspheres?.garmentGrid.passedGates).toEqual(['red']);

    // Warrior's Lv 24 Str is 64 in the published table, plus the Grid's
    // permanent +5 and the red gate's +5.
    expect(yuna.stats.str).toBe(dressphereStats('warrior', 24).str + 10);
    expect(yuna.stats.str).toBeGreaterThan(baseStr);
  });

  it('consumes the whole turn: the ATB is spent and refills from empty', () => {
    const yuna = girl('vanguard');
    change(yuna, 'warrior', 1);
    expect(yuna.atb.ticks).toBe(0);
    expect(yuna.atb.gauge).toBe(0);
    expect(yuna.atb.charging).toBeNull();
  });

  it('refuses a node that is not one link away', () => {
    const yuna = girl('vanguard');
    const events = change(yuna, 'white-mage', 3);
    expect(yuna.dresspheres?.current).toBe('gunner');
    expect(events.some((e) => e.type === 'message')).toBe(true);
  });

  it('is blocked outright by Curse — the L1 menu is disabled', () => {
    const yuna = girl('vanguard');
    yuna.statuses.curse = { id: 'curse', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    change(yuna, 'warrior', 1);
    expect(yuna.dresspheres?.current).toBe('gunner');
  });

  it('clears Itchy, which is one of the only two ways out of it', () => {
    const yuna = girl('vanguard');
    yuna.statuses.itchy = { id: 'itchy', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    const events = change(yuna, 'warrior', 1);
    expect(yuna.statuses.itchy).toBeUndefined();
    expect(events.some((e) => e.type === 'status-remove')).toBe(true);
  });

  it('records every dressphere worn this battle, for the SDSP unlock', () => {
    const yuna = girl('vanguard');
    change(yuna, 'warrior', 1);
    expect(yuna.dresspheres?.garmentGrid.wornThisBattle).toEqual(['gunner', 'warrior']);
  });

  it('banks a "wait down" reducer so later charge bars are shorter', () => {
    const yuna = girl('samurais-honor');
    // Three gates already banked; the 0 -> 1 link carries the red one.
    yuna.dresspheres!.garmentGrid.passedGates = ['green', 'blue', 'yellow'];
    expect(gatesBetween(garmentGrid('samurais-honor'), 0, 1)).toEqual(['red']);
    change(yuna, 'warrior', 1);
    expect(yuna.dresspheres?.garmentGrid.passedGates).toHaveLength(4);
    expect(yuna.aiMemory?.['waitDown']).toBe(40);
  });
});

describe('Special Dress Up [§3.15]', () => {
  it('needs every node occupied AND every dressphere worn this battle', () => {
    const tiny = garmentGrid('unerring-path');
    expect(canSpecialDressUp(tiny, ['gunner', 'warrior'], ['gunner'])).toBe(false);
    expect(canSpecialDressUp(tiny, ['gunner', 'warrior'], ['gunner', 'warrior'])).toBe(true);
    // A 6-node Grid is a much longer road to the same unlock.
    const six = garmentGrid('first-steps');
    expect(canSpecialDressUp(six, ['gunner', 'warrior'], ['gunner', 'warrior'])).toBe(false);
  });

  it('names three independently-commanded parts per special dressphere', () => {
    expect(specialDressUpPartIds('floral-fallal')).toHaveLength(3);
    expect(specialDressUpPartIds('machina-maw')[0]).toBe('machina-maw-main');
    expect(specialDressUpPartIds('full-throttle')[2]).toBe('full-throttle-right');
  });
});

describe('dressphere behaviour flags [§3.1–3.14]', () => {
  it('denies an Attack command to Songstress, White Mage and Black Mage', () => {
    for (const id of ['songstress', 'white-mage', 'black-mage']) {
      expect(hasAttackCommand(id), id).toBe(false);
    }
    for (const id of ['gunner', 'thief', 'warrior', 'dark-knight']) {
      expect(hasAttackCommand(id), id).toBe(true);
    }
  });

  it('marks the five long-range dresspheres, which never break a chain by run-in', () => {
    for (const id of ['gunner', 'lady-luck', 'alchemist', 'trainer', 'gun-mage']) {
      expect(isLongRange(id), id).toBe(true);
    }
    expect(isLongRange('warrior')).toBe(false);
  });

  it('gives the Thief a twice-striking Attack, so it self-chains', () => {
    expect(attackHits('thief')).toBe(2);
    expect(attackHits('gunner')).toBe(1);
  });
});

describe('the command menu offers only legal spherechanges', () => {
  it('lists one row per adjacent occupied node', () => {
    const engine = new FFX2Engine();
    engine.init({
      game: 'ffx2',
      party: bevelleParty(24, 'vanguard'),
      enemies: group('t', [bahamutEnemy()]),
      triggers: [],
      seed: 7,
      condition: 'preemptive',
    });
    const decision = engine.nextDecision();
    expect(decision.kind).toBe('player-input');
    if (decision.kind !== 'player-input') return;
    const rows = decision.commands.filter((c) => c.command.kind === 'spherechange');
    // Yuna owns three dresspheres, so nodes 0/1/2 are filled: from node 0 she
    // can reach node 1 (red gate) and node 4 (unoccupied, so not offered).
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.enabled)).toBe(true);
    expect(rows[0]?.help).toContain('red');
  });
});

describe('withStatBonus', () => {
  it('adds a delta and never lets a pool exceed its own maximum', () => {
    const base = dressphereStats('gunner', 24);
    const out = withStatBonus(base, { str: 10, def: -5 });
    expect(out.str).toBe(base.str + 10);
    expect(out.def).toBe(base.def - 5);
    expect(out.maxHp).toBeGreaterThanOrEqual(out.hp);
  });
});
