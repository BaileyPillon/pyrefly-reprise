/**
 * **A ready painting that is not the figure** (PR-0517; method check 3.5; pc-residues lane; FFX-2's dresses, both games' plumbing). The engine side of `tools/pose-identity.mjs`: a figure listed in
 * `src/data/art/readyIdentity.ts` keeps the IDLE painting through the menu and the attack's wind-up (the ready STATE stays), wherever the stance look plays (review M5: the pack on, a pack chapter or
 * `?swapscope=all`, a stance word that is not `today`; `?readyid=today` switches it off alone), and nobody else changes.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { READY_IDENTITY_FAILS } from '../../src/data/art/readyIdentity.ts';
import type { CombatantId } from '../../src/battle/common/types.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { readyHeldOnIdle, readyIdOffFromSearch, setReadyIdOff } from '../../src/engine/motion/ReadyIdentity.ts';
import { menuStance, openingPose, stanceOnIdle } from '../../src/engine/motion/StanceSwap.ts';
import { resetSwapLog, swapLog } from '../../src/engine/motion/SwapLog.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { setStanceMode, setSwapScope, stanceNow } from '../../src/engine/motion/SwapSwitch.ts';

const CH4 = 'ffx2-bahamut'; // a pack chapter (FFX-2 Chapter IV): the stance look plays here
const ELSEWHERE = 'ffx2-vegnagun-shuyin'; // FFX-2 Chapter V: outside the pack, the stance look is release 66's

/** The page as release 67 plays it in Chapter IV: a pack chapter, the stance look on (`v1a`, the default; `v3` keeps both paintings). */
function playing(stance: 'v1a' | 'v1b' | 'v3' = 'v1a'): void {
  setDemoChapter(CH4);
  setStanceMode(stance);
}

afterEach(() => {
  setReadyIdOff(null);
  setStanceMode(null);
  setSwapScope(null);
  setDemoChapter(undefined);
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
    playing();
    expect(readyHeldOnIdle('rikku-dark-knight')).toBe(false);
  });

  it('holds only an art subject that is listed, never an unknown one or a missing one', () => {
    playing();
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
    playing();
    expect(readyHeldOnIdle('paine-warrior')).toBe(true);
    setReadyIdOff(true);
    expect(readyHeldOnIdle('paine-warrior')).toBe(false);
  });
});

describe('where the hold plays (review M5: the today words give release 66, and the hold shares the picks scope)', () => {
  it('not with the stance look at today: ?stance=today, ?pack=off, a phone and a tablet all read stanceNow() = today, and a listed dress keeps its ready painting', () => {
    setDemoChapter(CH4);
    setStanceMode('today');
    expect(stanceNow()).toBe('today');
    for (const art of ['paine-warrior', 'yuna-white-mage', 'rikku-warrior']) expect(readyHeldOnIdle(art)).toBe(false);
  });

  it('and the menu and the wind-up of a listed dress are release 66\'s ready painting there (the A/B "one build, only the stance word changed" film)', () => {
    setDemoChapter(CH4);
    setStanceMode('today');
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior' });
    menuStance(ctx, 'paine' as CombatantId);
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready', 'ready']);
    expect(stanceOnIdle(ctx, 'paine' as CombatantId)).toBe(false);
  });

  it('not in a chapter outside the pack (Chapter V), however the stance word reads; ?swapscope=all brings the hold with the picks (MF-22)', () => {
    setDemoChapter(ELSEWHERE);
    setStanceMode('v1a');
    expect(stanceNow()).toBe('today'); // the stance look is release 66's here
    expect(readyHeldOnIdle('paine-warrior')).toBe(false);
    setSwapScope('all');
    expect(stanceNow()).toBe('v1a');
    for (const art of ['paine-warrior', 'yuna-white-mage', 'rikku-warrior']) expect(readyHeldOnIdle(art)).toBe(true);
  });

  it('in a pack chapter under every look that is not today (v1a, v1b, v3), and ?readyid=today alone turns it off', () => {
    for (const stance of ['v1a', 'v1b', 'v3'] as const) {
      playing(stance);
      expect(readyHeldOnIdle('yuna-white-mage')).toBe(true);
      setReadyIdOff(true);
      expect(readyHeldOnIdle('yuna-white-mage')).toBe(false);
      setReadyIdOff(null);
    }
  });
});

describe('the menu and the wind-up', () => {
  it('a listed figure asks for the ready STATE on the idle painting at the menu and at the wind-up, under v3 (the look that keeps both paintings for everyone else)', () => {
    playing('v3');
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
    playing('v3');
    const { ctx, actors } = ctxOf({ rikku: 'rikku-gunner' });
    menuStance(ctx, 'rikku' as CombatantId);
    openingPose(ctx, 'rikku' as CombatantId, 'ready', true);
    expect(actors['rikku']!.asked).toEqual(['ready', 'ready']);
  });

  it('a listed figure\'s attack that has no wind-up, and her spells and items, are the plain request they always were', () => {
    playing('v3');
    const { ctx, actors } = ctxOf({ yuna: 'yuna-white-mage' });
    openingPose(ctx, 'yuna' as CombatantId, 'cast', false);
    openingPose(ctx, 'yuna' as CombatantId, 'attack', false);
    expect(actors['yuna']!.asked).toEqual(['cast', 'attack']);
  });

  it('?readyid=today brings the ready painting back for a listed figure', () => {
    playing('v3');
    setReadyIdOff(true);
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior' });
    menuStance(ctx, 'paine' as CombatantId);
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready', 'ready']);
  });

  it('with the stance already on the idle painting (v1a, the release 67 default), a listed figure\'s wind-up joins it; everyone else\'s wind-up is still the ready painting', () => {
    playing('v1a');
    const { ctx, actors } = ctxOf({ paine: 'paine-warrior', rikku: 'rikku-gunner' });
    openingPose(ctx, 'paine' as CombatantId, 'ready', true);
    openingPose(ctx, 'rikku' as CombatantId, 'ready', true);
    expect(actors['paine']!.asked).toEqual(['ready/idle']);
    expect(actors['rikku']!.asked).toEqual(['ready']);
  });
});
