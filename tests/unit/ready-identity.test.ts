/**
 * **A ready painting that is not the figure** (PR-0517; method check 3.5; pc-residues lane; FFX-2's dresses, both games' plumbing). The engine side of `tools/pose-identity.mjs`: a figure listed in
 * `src/data/art/readyIdentity.ts` keeps the IDLE painting through the menu and the attack's wind-up (the ready STATE stays), in every look, and nobody else changes.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { READY_IDENTITY_FAILS } from '../../src/data/art/readyIdentity.ts';
import type { CombatantId } from '../../src/battle/common/types.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { readyHeldOnIdle, readyIdOffFromSearch, setReadyIdOff } from '../../src/engine/motion/ReadyIdentity.ts';
import { menuStance, openingPose, stanceOnIdle } from '../../src/engine/motion/StanceSwap.ts';
import { resetSwapLog, swapLog } from '../../src/engine/motion/SwapLog.ts';
import { setStanceMode } from '../../src/engine/motion/SwapSwitch.ts';

afterEach(() => {
  setReadyIdOff(null);
  setStanceMode(null);
  resetSwapLog();
});

class Actor {
  readonly asked: string[] = [];
  setPose(name: string, opts?: { paint?: string }): void {
    this.asked.push(opts?.paint ? `${name}/${opts.paint}` : name);
  }
}

function ctxOf(arts: Record<string, string>): { ctx: EventCtx; actors: Record<string, Actor> } {
  const actors: Record<string, Actor> = {};
  for (const id of Object.keys(arts)) actors[id] = new Actor();
  const stage = { actor: (id: CombatantId) => actors[id], artOf: (id: CombatantId) => arts[id] };
  return { ctx: { stage } as unknown as EventCtx, actors };
}

describe('the list', () => {
  it('names the three ready paintings the identity measure fails, each with the sha of the painting it measured', () => {
    expect(Object.keys(READY_IDENTITY_FAILS).sort()).toEqual(['paine-warrior', 'rikku-warrior', 'yuna-white-mage']);
    for (const row of Object.values(READY_IDENTITY_FAILS)) {
      expect(row.sha).toMatch(/^[0-9a-f]{16}$/);
      expect(row.ratio).toBeGreaterThanOrEqual(2.5);
    }
  });

  it('Rikku Dark Knight, the other girl of PR-0517, is not on it: her ready painting keeps her palette (the measure passes it)', () => {
    expect(readyHeldOnIdle('rikku-dark-knight')).toBe(false);
  });

  it('holds only an art subject that is listed, never an unknown one or a missing one', () => {
    expect(readyHeldOnIdle('paine-warrior')).toBe(true);
    expect(readyHeldOnIdle('paine-gunner')).toBe(false);
    expect(readyHeldOnIdle('tidus')).toBe(false);
    expect(readyHeldOnIdle(undefined)).toBe(false);
    expect(readyHeldOnIdle('toString')).toBe(false); // an inherited name is no row
  });
});

describe('?readyid', () => {
  it('today switches the hold off; anything else leaves it on', () => {
    expect(readyIdOffFromSearch('?readyid=today')).toBe(true);
    expect(readyIdOffFromSearch('?readyid=on')).toBe(false);
    expect(readyIdOffFromSearch('')).toBe(false);
    expect(readyIdOffFromSearch(undefined)).toBe(false);
    setReadyIdOff(true);
    expect(readyHeldOnIdle('paine-warrior')).toBe(false);
  });
});

describe('the menu and the wind-up', () => {
  it('a listed figure asks for the ready STATE on the idle painting at the menu and at the wind-up, in today\'s look (no ?stance word)', () => {
    setStanceMode('today');
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior', rikku: 'rikku-gunner' });
    menuStance(ctx, 'paine' as CombatantId);
    expect(actors['paine']!.asked).toEqual(['ready/idle']);
    expect(stanceOnIdle(ctx, 'paine' as CombatantId)).toBe(true);
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready/idle', 'ready/idle']);
    expect(stanceOnIdle(ctx, 'paine' as CombatantId)).toBe(false); // the action took over, as for everyone
    expect(swapLog().reasons.map((r) => `${r.pose}:${r.reason}:${r.paint ?? ''}`)).toEqual(['ready:menu:idle', 'ready:wind-up:idle']);
  });

  it('a figure not on the list is exactly what it was: the ready painting at the menu and at the wind-up', () => {
    setStanceMode('today');
    const { ctx, actors } = ctxOf({ rikku: 'rikku-gunner' });
    menuStance(ctx, 'rikku' as CombatantId);
    openingPose(ctx, 'rikku' as CombatantId, 'ready', true);
    expect(actors['rikku']!.asked).toEqual(['ready', 'ready']);
  });

  it('a listed figure\'s attack that has no wind-up, and her spells and items, are the plain request they always were', () => {
    setStanceMode('today');
    const { ctx, actors } = ctxOf({ yuna: 'yuna-white-mage' });
    openingPose(ctx, 'yuna' as CombatantId, 'cast', false);
    openingPose(ctx, 'yuna' as CombatantId, 'attack', false);
    expect(actors['yuna']!.asked).toEqual(['cast', 'attack']);
  });

  it('?readyid=today brings the ready painting back for a listed figure', () => {
    setStanceMode('today');
    setReadyIdOff(true);
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior' });
    menuStance(ctx, 'paine' as CombatantId);
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready', 'ready']);
  });

  it('with the stance already on the idle painting (v1a, the release 67 default), a listed figure\'s wind-up joins it; everyone else\'s wind-up is still the ready painting', () => {
    setStanceMode('v1a');
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior', rikku: 'rikku-gunner' });
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    openingPose(ctx, 'rikku' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready/idle']);
    expect(actors['rikku']!.asked).toEqual(['ready']);
  });
});
