// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import type { AtbSnapshot, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';

function girl(id: string, name: string, hp: number, maxHp: number): FFX2Combatant {
  return {
    id,
    name,
    side: 'party',
    spriteKey: id,
    stats: { hp: maxHp, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp, maxMp: 100 },
    hp,
    mp: 80,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 10,
    dresspheres: {
      current: 'gunner',
      owned: ['gunner'],
      garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  };
}

function baseState(): BattleState {
  const fast = girl('rikku', 'Rikku', 900, 1000);
  const slow = girl('paine', 'Paine', 200, 2000); // 10% of max -> critical
  return {
    game: 'ffx2',
    combatants: { rikku: fast, paine: slow },
    activeIds: ['rikku', 'paine'],
    reserveIds: [],
    enemyIds: [],
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };
}

function snapshotFor(fastRequired: number, slowRequired: number): AtbSnapshot {
  return {
    elapsedMs: 0,
    bars: [
      { actorId: 'rikku', fill: 0.5, required: fastRequired, ready: false, charge: null, state: 'normal' },
      { actorId: 'paine', fill: 0.2, required: slowRequired, ready: false, charge: null, state: 'normal' },
    ],
  };
}

describe('FFX2BattleHud', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
  });

  it('draws a shorter ATB track for the lower `required` (faster) bar', () => {
    hud.sync(baseState(), snapshotFor(4000, 28000));
    const tracks = root.querySelectorAll<HTMLElement>('.ffx2atb__track');
    expect(tracks.length).toBe(2);
    const fastWidth = parseFloat(tracks[0]!.style.width);
    const slowWidth = parseFloat(tracks[1]!.style.width);
    expect(fastWidth).toBeLessThan(slowWidth);
    // Clamped to `.ig-stat__od`'s own [24, 53.33] range (53.33 = the shared
    // layer's unoverridden width, so a slow-enough bar matches it exactly).
    expect(fastWidth).toBeGreaterThanOrEqual(24);
    expect(slowWidth).toBeLessThanOrEqual(53.34);
  });

  it('marks a below-33%-max HP value as critical, per the §4.9 threshold correction', () => {
    hud.sync(baseState(), snapshotFor(16000, 16000));
    const hpEls = root.querySelectorAll<HTMLElement>('.ig-stat__value:not(.ig-stat__value--mp)');
    expect(hpEls[0]!.className).not.toContain('crit'); // Rikku: 900/1000 = 90%
    expect(hpEls[1]!.className).toContain('ffx2-hp--crit'); // Paine: 200/2000 = 10%
  });

  it('ignores a TurnPreview[] preview (FFX-only) instead of throwing', () => {
    expect(() => hud.sync(baseState(), [])).not.toThrow();
  });

  it('pops a chain counter and clears it on a count of 0', async () => {
    hud.sync(baseState(), snapshotFor(16000, 16000));
    await hud.onEvent({ seq: 1, type: 'chain', targetId: 'rikku', count: 3, multiplier: 1.55 });
    const popup = root.querySelector('.ig-damage');
    expect(popup?.textContent).toContain('3');
    expect(popup?.textContent).toContain('CHAIN');

    await hud.onEvent({ seq: 2, type: 'chain', targetId: 'rikku', count: 0, multiplier: 1.4 });
    expect(root.querySelector('.ig-damage')).toBeNull();
  });

  it('shows a two-stage telegraph banner for a boss charge', async () => {
    await hud.onEvent({ seq: 1, type: 'charge', enemyId: 'bahamut', name: 'Mega Flare', turnsLeft: 1, stage: 2 });
    const banner = root.querySelector('.ffx2hud__telegraph');
    expect(banner?.hasAttribute('hidden')).toBe(false);
    expect(banner?.className).toContain('--s2');
    expect(banner?.textContent).toContain('Mega Flare');
  });

  it('rejects openMinigame for a kind FFX-2 does not own', async () => {
    await expect(hud.openMinigame('tidus-timing', {})).rejects.toThrow();
  });

  it('toggles visibility', () => {
    hud.setVisible(false);
    expect(root.querySelector('.ffx2hud')?.hasAttribute('hidden')).toBe(true);
    hud.setVisible(true);
    expect(root.querySelector('.ffx2hud')?.hasAttribute('hidden')).toBe(false);
  });
});
