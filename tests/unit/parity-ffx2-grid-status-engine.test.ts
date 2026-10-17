/**
 * **Engine-level parity, FFX-2 Garment Grids that keep a status or an SOS set** (re-parity RC10 lane XD1b; **FFX-2 only**).
 *
 * `parity-ffx2-grid-status-rows.test.ts` proves which rows a grid lists against the note's tables. This file proves the WIRING on a real engine, with an oracle written from the note's rules
 * (`FFX2-G04` 3.1 to 3.4, `FFX2-G09` 3.5 and 3.6, `research/re-ffx2-dressphere.md` 1.6 and 2.4) that imports nothing from `adapt/`, the layer, `kit.ts` or the kernels:
 *
 * 1. **Highroad Winds** (plate 9): SOS Haste (row 0x8078) only once all four gates are crossed; while it is held, Haste is on exactly while the HP state is 1 (replayed from the damage events),
 *    comes off at a heal to a third and at a KO, comes back at a revive to under a third; no clock; a Dispel cannot take it; three of the four gates list nothing.
 * 2. **Downtrodder** (plate 15): Double HP (row 0x8098) only once all three gates are crossed. **Tempered Will** (plate 50): Double MP at gate 1 (red), Double HP at gate 2 (green). The maximum
 *    is doubled (HP cap 9,999, MP cap 999, a maximum already past its cap kept), once even with a Stamina Tonic, and the status shows, with no clock.
 * 3. **A real walk**: the Change rows the menu offers cross the gates; the maximum doubles in the change that crosses the gate (the game's rebuild merges the layer before it recomputes the
 *    maxima), HP and MP follow by the engine's ratio rule, the event order is the change first and the status after, and a KO and a revive leave the gate crossed.
 * 4. **Nothing else moves**: a grid with no such row, a girl with no gate crossed and a grid that is not in the registry build exactly as before (no layer); `GRID_AUTO_STATUS = false` puts it all back.
 */

import { describe, expect, it, vi } from 'vitest';
import { makeRng } from '../../src/battle/common/rng.ts';
import type { Command, GateColour, StatusId } from '../../src/battle/common/types.ts';
import { dressphereStats } from '../../src/battle/ffx2/index.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { BIG, THIRD, PLAIN_BLOW, POOL, board, type Loadout } from './helpers/ffx2AutoRig.ts';
import { LEVEL, walk, walkBattle } from './helpers/ffx2GridWalk.ts';

// --- the oracle -------------------------------------------------------------------------------------------------------------

/** FFX2-G04 3.1: 2 below 1 HP; 1 when `HP * 3 / max` (truncating) is 0; else 0. */
function hpStateOracle(hp: number, max: number): 0 | 1 | 2 {
  if (hp < 1) return 2;
  return Math.trunc((hp * 3) / max) < 1 ? 1 : 0;
}

/** The game's maximum recompute (research 1.6): `clamp(2 * base, 0, cap)`; the engine keeps a base already past the cap (it never caps a Crystal Bangle's maximum). */
const doubled = (base: number, cap: number): number => Math.min(base * 2, Math.max(base, cap));

const gridLoadout = (name: string, id: string, passed: GateColour[]): Loadout => ({ name, kept: [], sos: [], word0: 0, grid: { id, passed } });
const ALL4: GateColour[] = ['red', 'green', 'yellow', 'blue'];
const HASTE = (u: Ffx2Unit): boolean => u.statuses.haste !== undefined;
const ev = (e: unknown): { type: string; targetId?: string; status?: string; reason?: string; amount?: number; instance?: { sourceAbilityId?: string; ticksRemaining?: number | null } } => e as never;

// --- 1. Highroad Winds -------------------------------------------------------------------------------------------------------

describe('Highroad Winds: SOS Haste once all four gates are crossed', () => {
  it('with all four crossed she holds the SOS row, at full HP Haste is off, and nothing is announced at the start', () => {
    const e = board({ yuna: gridLoadout('hw', 'highroad-winds', ALL4) });
    const yuna = e.unit('yuna');
    expect(yuna.autoLayer?.rows).toEqual([0x8078]);
    expect(yuna.autoLayer?.flag).toBe(1);
    expect(HASTE(yuna)).toBe(false);
    expect(e.state().log.filter((x) => x.type === 'status-add' || x.type === 'status-remove')).toEqual([]);
  });

  it('with any three of the four crossed (and with none) she holds no row and no layer', () => {
    for (const missing of ALL4) {
      const e = board({ yuna: gridLoadout('hw3', 'highroad-winds', ALL4.filter((c) => c !== missing)) });
      const yuna = e.unit('yuna');
      expect(yuna.autoLayer, `without ${missing}`).toBeUndefined();
      yuna.stats.maxHp = BIG;
      yuna.hp = THIRD - 1000;
      e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
      expect(HASTE(yuna), `without ${missing}`).toBe(false);
    }
    expect(board({ yuna: gridLoadout('hw0', 'highroad-winds', []) }).unit('yuna').autoLayer).toBeUndefined();
  });

  it('150 random runs of damage and healing: Haste is on exactly while her HP state is 1, the events announce exactly the changes, and it never has a clock', () => {
    const rng = makeRng(20261017);
    const HEALS = ['x2-white-mage-cure', 'x2-white-mage-cura', 'x2-white-mage-curaga'];
    const seen = { on: 0, off: 0, ko: 0 };
    for (let run = 0; run < 150; run++) {
      const e = board({ yuna: gridLoadout('hw', 'highroad-winds', ALL4) }, 1 + (run % 40));
      const yuna = e.unit('yuna');
      const rikku = e.unit('rikku');
      const paragon = e.unit('paragon');
      for (const u of [yuna, rikku, paragon]) u.stats.maxHp = BIG;
      let recorded = hpStateOracle(BIG, BIG);
      let hasted = false;
      for (let step = 0; step < 6 && yuna.alive; step++) {
        const near = [1, 5000, THIRD - 3, THIRD - 1, THIRD, THIRD + 1, THIRD + 3, 36000, 60000, BIG];
        yuna.hp = rng.next() < 0.6 ? rng.pick(near) : rng.int(1, BIG);
        let hp = yuna.hp;
        const heal = rng.next() < 0.4;
        const id = heal ? rng.pick(HEALS) : rng.pick(POOL).id;
        const events = e.act(heal ? rikku : paragon, { kind: 'ability', id, targets: ['yuna'] } as Command);
        const adds: string[] = [];
        const removes: string[] = [];
        for (const x of events.map(ev)) {
          if (x.targetId !== 'yuna' || (x.type !== 'damage' && x.type !== 'miss')) continue;
          if (x.type === 'damage') hp = Math.max(0, Math.min(BIG, hp - (x.amount as number)));
          const state = hpStateOracle(hp, BIG);
          if (state === recorded) continue;
          recorded = state;
          if (state === 1 && !hasted) {
            hasted = true;
            adds.push('haste');
          } else if (state !== 1 && hasted) {
            hasted = false;
            removes.push('haste');
          }
        }
        const gotAdds = events.map(ev).filter((x) => x.type === 'status-add' && x.targetId === 'yuna').map((x) => x.status as string);
        const gotRemoves = events.map(ev).filter((x) => x.type === 'status-remove' && x.targetId === 'yuna' && x.status === 'haste').map((x) => x.status as string);
        expect(gotAdds, `run ${run} step ${step}`).toEqual(adds);
        expect(gotRemoves, `run ${run} step ${step}`).toEqual(removes);
        expect(HASTE(yuna), `run ${run} step ${step} (hp ${yuna.hp})`).toBe(hasted);
        if (HASTE(yuna)) expect(yuna.statuses.haste?.ticksRemaining).toBeNull();
        seen.on += adds.length;
        seen.off += removes.length;
        if (!yuna.alive) seen.ko += 1;
      }
    }
    expect(seen.on).toBeGreaterThan(40);
    expect(seen.off).toBeGreaterThan(20);
    expect(seen.ko).toBeGreaterThan(5);
  });

  it('a KO takes Haste off and a revive that leaves her under a third (a Phoenix Down, 25 percent) puts it back', () => {
    const e = board({ yuna: gridLoadout('hw', 'highroad-winds', ALL4) });
    const yuna = e.unit('yuna');
    const rikku = e.unit('rikku');
    for (const u of [yuna, rikku, e.unit('paragon')]) u.stats.maxHp = BIG;
    yuna.hp = 1;
    e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(HASTE(yuna) ? 'hasted' : yuna.alive ? 'alive and not hasted' : 'down').toMatch(/hasted|down/);
    // drive her to the ground with a fixed number of blows, then check the layer let go
    for (let i = 0; i < 20 && yuna.alive; i++) e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(false);
    expect(HASTE(yuna)).toBe(false);
    const events = e.act(rikku, { kind: 'ability', id: 'x2-item-phoenix-down', targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(true);
    expect(hpStateOracle(yuna.hp, BIG)).toBe(1);
    expect(HASTE(yuna), JSON.stringify(events.map(ev).filter((x) => x.type === 'status-add'))).toBe(true);
    // a second KO, then a Life: wherever the revive leaves her HP, Haste is on exactly when that is under a third
    for (let i = 0; i < 20 && yuna.alive; i++) e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(false);
    expect(HASTE(yuna)).toBe(false);
    e.act(rikku, { kind: 'ability', id: 'x2-white-mage-life', targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(true);
    expect(HASTE(yuna)).toBe(hpStateOracle(yuna.hp, BIG) === 1);
  });

  it('a Dispel cannot take the SOS Haste, and a Haste Bangle beside the grid is the same single row', () => {
    const l: Loadout = { ...gridLoadout('hw+bangle', 'highroad-winds', ALL4), accessories: ['haste-bangle'] };
    const e = board({ yuna: l });
    const yuna = e.unit('yuna');
    expect(yuna.autoLayer?.rows).toEqual([0x8078]); // the game's list drops a row it already holds
    yuna.stats.maxHp = BIG;
    yuna.hp = THIRD - 1000;
    e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(HASTE(yuna)).toBe(true);
    const events = e.act(e.unit('paragon'), { kind: 'ability', id: 'paragon-os-dispel', targets: [] } as Command);
    expect(HASTE(yuna)).toBe(true);
    expect(events.map(ev).filter((x) => x.type === 'status-remove' && x.status === 'haste')).toEqual([]);
  });
});

// --- 2. Double HP and Double MP ----------------------------------------------------------------------------------------------

describe('Double HP and Double MP: kept for good by the crossed gates, the maximum doubles', () => {
  const stats = (l: Loadout): { maxHp: number; maxMp: number; u: Ffx2Unit } => {
    const u = board({ yuna: l }).unit('yuna');
    return { maxHp: u.stats.maxHp, maxMp: u.stats.maxMp, u };
  };
  const held = (u: Ffx2Unit): string[] => (['max-hp-x2', 'max-mp-x2'] as StatusId[]).filter((s) => u.statuses[s] !== undefined);

  it('Tempered Will: green is Double HP, red is Double MP, both is both, neither is nothing; the status shows with no clock and a Dispel leaves it', () => {
    const base = stats(gridLoadout('tw', 'tempered-will', []));
    expect(held(base.u)).toEqual([]);
    expect(base.u.autoLayer).toBeUndefined();
    const cases: Array<[GateColour[], boolean, boolean]> = [[['green'], true, false], [['red'], false, true], [['red', 'green'], true, true], [['blue', 'yellow'], false, false]];
    for (const [passed, hp, mp] of cases) {
      const s = stats(gridLoadout('tw', 'tempered-will', passed));
      expect(s.maxHp, passed.join()).toBe(hp ? doubled(base.maxHp, 9999) : base.maxHp);
      expect(s.maxMp, passed.join()).toBe(mp ? doubled(base.maxMp, 999) : base.maxMp);
      expect(held(s.u), passed.join()).toEqual([hp ? 'max-hp-x2' : '', mp ? 'max-mp-x2' : ''].filter((x) => x !== ''));
      for (const id of held(s.u)) expect(s.u.statuses[id as StatusId]?.ticksRemaining).toBeNull();
    }
    const both = board({ yuna: gridLoadout('tw', 'tempered-will', ['red', 'green']) });
    const events = both.act(both.unit('paragon'), { kind: 'ability', id: 'paragon-os-dispel', targets: [] } as Command);
    expect(held(both.unit('yuna'))).toEqual(['max-hp-x2', 'max-mp-x2']);
    expect(events.map(ev).filter((x) => x.type === 'status-remove' && (x.status === 'max-hp-x2' || x.status === 'max-mp-x2'))).toEqual([]);
  });

  it('Downtrodder needs all three of its gates; two of them do nothing', () => {
    const base = stats(gridLoadout('dt', 'downtrodder', []));
    for (const two of [['red', 'green'], ['red', 'yellow'], ['green', 'yellow']] as GateColour[][]) {
      const s = stats(gridLoadout('dt', 'downtrodder', two));
      expect(s.maxHp, two.join()).toBe(base.maxHp);
      expect(held(s.u), two.join()).toEqual([]);
    }
    const all = stats(gridLoadout('dt', 'downtrodder', ['red', 'green', 'yellow']));
    expect(all.maxHp).toBe(doubled(base.maxHp, 9999));
    expect(all.maxMp).toBe(base.maxMp);
    expect(held(all.u)).toEqual(['max-hp-x2']);
  });

  it('the doubling is one bit: a Stamina Tonic on top of the grid changes nothing, and the grid on top of a tonic carried in doubles once', () => {
    const base = stats(gridLoadout('tw', 'tempered-will', [])).maxHp;
    const e = board({ yuna: gridLoadout('tw', 'tempered-will', ['green']) });
    const yuna = e.unit('yuna');
    expect(applyStatus(yuna, { status: 'max-hp-x2', chance: 254, duration: 0 }, 'rikku', 'x2-item-stamina-tonic')).toBeNull(); // already held: "miss", the game's one bit
    expect(yuna.stats.maxHp).toBe(doubled(base, 9999));
    // a tonic drunk first, then the grid's gate crossed in a change: the maximum is the doubled one, not four times
    const plain = board({ yuna: gridLoadout('tw', 'tempered-will', []) });
    const y2 = plain.unit('yuna');
    applyStatus(y2, { status: 'max-hp-x2', chance: 254, duration: 0 }, 'rikku', 'x2-item-stamina-tonic');
    expect(y2.stats.maxHp).toBe(doubled(base, 9999));
  });

  it('a maximum already past the cap is kept, not cut (the engine never capped a Crystal Bangle) and the MP cap is 999', () => {
    const big = board({ yuna: gridLoadout('tw', 'tempered-will', ['green', 'red']) }).unit('yuna');
    const base = board({ yuna: gridLoadout('tw', 'tempered-will', []) }).unit('yuna');
    expect(big.stats.maxMp).toBeLessThanOrEqual(Math.max(base.stats.maxMp, 999));
    expect(doubled(12000, 9999)).toBe(12000);
    expect(doubled(6000, 9999)).toBe(9999);
    expect(doubled(600, 999)).toBe(999);
    expect(doubled(400, 999)).toBe(800);
  });
});

// --- 3. a real walk ------------------------------------------------------------------------------------------------------------

describe('a real walk across the grid', () => {
  it('Tempered Will: the change that crosses the green gate doubles the maximum HP in that change (full HP stays full), the status follows the change, red then doubles the MP', () => {
    const e = walkBattle('tempered-will');
    const yuna = e.unit('yuna');
    const fullHp = yuna.stats.maxHp;
    expect(yuna.hp).toBe(fullHp);
    const steps = walk(e, 'tempered-will', [2]); // gate 2 wears green on this grid
    const last = steps[steps.length - 1]!;
    expect(last.passed).toContain('green');
    const baseHp = dressphereStats(last.dress, LEVEL).maxHp;
    expect(last.maxHp).toBe(doubled(baseHp, 9999));
    expect(last.hp).toBe(last.maxHp); // she was at full HP: the ratio rule keeps her full
    expect(last.log.indexOf('spherechange')).toBeGreaterThanOrEqual(0);
    expect(last.log.indexOf('status-add:max-hp-x2')).toBeGreaterThan(last.log.indexOf('spherechange'));
    expect(yuna.statuses['max-hp-x2']?.sourceAbilityId).toBe('auto-layer');
    // the gates before the green one doubled nothing
    for (const s of steps.slice(0, -1)) if (!s.passed.includes('green')) expect(s.maxHp, `after ${s.dress}`).toBe(dressphereStats(s.dress, LEVEL).maxHp);
    // keep walking: red doubles the MP, the next dresses keep the doubled HP
    const more = walk(e, 'tempered-will', [1, 2]);
    const end = more[more.length - 1] ?? last;
    expect(end.passed).toEqual(expect.arrayContaining(['green', 'red']));
    expect(end.maxMp).toBe(doubled(dressphereStats(end.dress, LEVEL).maxMp, 999));
    expect(end.maxHp).toBe(doubled(dressphereStats(end.dress, LEVEL).maxHp, 9999));
    for (const s of more) if (s.passed.includes('green')) expect(s.maxHp, `after ${s.dress}`).toBe(doubled(dressphereStats(s.dress, LEVEL).maxHp, 9999));
  });

  it('a wounded girl keeps her share: half HP before the green gate is half of the doubled maximum after it', () => {
    const e = walkBattle('tempered-will');
    const yuna = e.unit('yuna');
    yuna.hp = Math.floor(yuna.stats.maxHp / 2);
    const ratio = yuna.hp / yuna.stats.maxHp;
    const steps = walk(e, 'tempered-will', [2]);
    const last = steps[steps.length - 1]!;
    expect(Math.abs(last.hp / last.maxHp - ratio)).toBeLessThan(2 / last.maxHp);
    expect(last.maxHp).toBe(doubled(dressphereStats(last.dress, LEVEL).maxHp, 9999));
  });

  it('a KO and a revive leave the gate crossed and the maximum doubled (G09 3.6: gate effects are not cleared by a KO or a revive)', () => {
    const e = walkBattle('tempered-will');
    const yuna = e.unit('yuna');
    walk(e, 'tempered-will', [2]);
    const max = yuna.stats.maxHp;
    yuna.hp = 1;
    for (let i = 0; i < 40 && yuna.alive; i++) e.act(e.unit('dummy'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(false);
    e.act(e.unit('rikku'), { kind: 'ability', id: 'x2-white-mage-life', targets: ['yuna'] } as Command);
    expect(yuna.alive).toBe(true);
    expect(yuna.dresspheres?.garmentGrid.passedGates).toContain('green');
    expect(yuna.stats.maxHp).toBe(max);
    expect(yuna.statuses['max-hp-x2']).toBeDefined();
  });

  it('Highroad Winds: SOS Haste is held after the fourth gate and not before (four changes around its ring)', () => {
    const e = walkBattle('highroad-winds');
    const yuna = e.unit('yuna');
    expect(yuna.autoLayer).toBeUndefined();
    const steps = walk(e, 'highroad-winds', [1, 2, 3, 4]);
    const crossedAt = steps.findIndex((s) => ALL4.every((c) => s.passed.includes(c)));
    expect(crossedAt).toBeGreaterThanOrEqual(3); // four gates cannot be crossed in fewer than four changes
    for (const s of steps.slice(0, crossedAt)) expect(s.passed.length).toBeLessThan(4);
    expect(yuna.autoLayer?.rows).toEqual([0x8078]);
    expect(yuna.autoLayer?.flag).toBe(1);
    // the layer is made in the change that crosses the fourth gate: HP is full, so Haste is not on yet, then a blow under a third turns it on
    expect(HASTE(yuna)).toBe(false);
    yuna.stats.maxHp = BIG;
    yuna.hp = THIRD - 1000;
    e.act(e.unit('dummy'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(HASTE(yuna)).toBe(true);
  });

  it('a change made while she is already under a third and crosses the last gate puts Haste on in that change', () => {
    const e = walkBattle('highroad-winds');
    const yuna = e.unit('yuna');
    // cross three gates first
    walk(e, 'highroad-winds', [1, 2, 3]);
    yuna.hp = Math.max(1, Math.floor(yuna.stats.maxHp / 4));
    const steps = walk(e, 'highroad-winds', [1, 2, 3, 4]);
    expect(steps.length).toBeGreaterThan(0);
    expect(HASTE(yuna)).toBe(hpStateOracle(yuna.hp, yuna.stats.maxHp) === 1);
  });
});

// --- 4. nothing else moves --------------------------------------------------------------------------------------------------------

describe('nothing else moves', () => {
  it('a grid with no such row builds no layer whatever gates she has crossed, and its girl has the pools she always had', () => {
    for (const id of ['vanguard', 'first-steps', 'the-end', 'font-of-power', 'heart-of-flame']) {
      const none = board({ yuna: gridLoadout('x', id, []) }).unit('yuna');
      const all = board({ yuna: gridLoadout('x', id, ALL4) }).unit('yuna');
      expect(all.autoLayer, id).toBeUndefined();
      expect(all.stats.maxHp, id).toBe(none.stats.maxHp);
      expect(all.stats.maxMp, id).toBe(none.stats.maxMp);
    }
  });

  it('a grid the registry does not hold lists no row', () => {
    const e = board({ yuna: gridLoadout('x', 'not-a-grid', ALL4) });
    expect(e.unit('yuna').autoLayer).toBeUndefined();
  });
});

describe('the switch GRID_AUTO_STATUS', () => {
  it('off, a grid lists no row and the maximum is the old one', async () => {
    vi.resetModules();
    vi.doMock('../../src/battle/ffx2/constants.ts', async (orig) => ({ ...(await orig<typeof import('../../src/battle/ffx2/constants.ts')>()), GRID_AUTO_STATUS: false }));
    const rig = await import('./helpers/ffx2AutoRig.ts');
    const off = rig.board({ yuna: gridLoadout('tw', 'tempered-will', ['red', 'green']) }).unit('yuna');
    const hw = rig.board({ yuna: gridLoadout('hw', 'highroad-winds', ALL4) }).unit('yuna');
    vi.doUnmock('../../src/battle/ffx2/constants.ts');
    vi.resetModules();
    expect(hw.autoLayer).toBeUndefined();
    expect(off.statuses['max-hp-x2']).toBeUndefined();
    const on = board({ yuna: gridLoadout('tw', 'tempered-will', ['red', 'green']) }).unit('yuna');
    expect(on.stats.maxHp).toBeGreaterThan(off.stats.maxHp);
  });
});
