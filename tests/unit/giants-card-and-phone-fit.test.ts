/**
 * r3942-stage wave 2, **FFX-2 only** (AGENTS.md rule 14; Bailey, 2026-10-08, "go with C and restart the giants build"): the two pieces of the giants that live outside CHAPTER FRAMING.
 *
 * 1. **The enemy-intent card stands clear of a giant.** `intentBoard.ts` `fighterBoxes` takes a giant's body for the slab as its whole painted silhouette (the options study found
 *    the head-to-feet estimate left the card on 20 percent of Bahamut (his pick, option 3) and 35 percent of Anima (her pick, option 4; 42 at her real size)); every other fighter keeps the estimate.
 * 2. **The upright phone's slice fit holds a giant whole, below the boss gauge and the intent strip.** `ShotRules.fitPhone` (A-12) reads a giant at `min` 1 (an enemy otherwise
 *    0.75, and left out when wider than the slice) and reserves {@link GIANT_PHONE_TOP} of the frame's height under the strip; FFX (CTB) and every other fiend are unchanged.
 */
import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { GIANT_PHONE_TOP } from '../../src/engine/ShotRules.ts';
import { FFX2_GIANT_SHARE } from '../../src/data/ffx2/fiend-stature.ts';
import { GIANT_BODY_RECT, fighterBoxes } from '../../src/ui/ffx2/intentBoard.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

const state = (party: string[], enemies: string[]): BattleState =>
  ({
    combatants: Object.fromEntries([...party.map((id) => [id, { hp: 100, side: 'party' }]), ...enemies.map((id) => [id, { hp: 100, side: 'enemy' }])]),
  }) as unknown as BattleState;

/** A projector that puts a fighter's head at y 200 and its feet at y 500 (a 300 px figure, x by id). */
const project = (id: string, anchor: 'head' | 'chest' | 'feet' = 'head') => ({ x: id === 'yuna' ? 300 : 900, y: anchor === 'feet' ? 500 : 200 });
const painted = (id: string) => (id === 'bahamut' || id === 'x2-shiva' ? { x: 480, y: 60, w: 600, h: 620 } : null);

describe('the intent card avoids a giant as its whole painted silhouette (FFX-2 only)', () => {
  it('the table of giants is the three picks, keyed by their combatant ids', () => {
    expect([...GIANT_BODY_RECT].sort()).toEqual(Object.keys(FFX2_GIANT_SHARE).sort());
    expect([...GIANT_BODY_RECT].sort()).toEqual(['bahamut', 'paragon', 'x2-anima']);
  });

  it('Bahamut\'s box is his painted rectangle, a soft obstacle that ranks below the girls', () => {
    const boxes = fighterBoxes(state(['yuna'], ['bahamut']), project, painted);
    expect(boxes).toHaveLength(2);
    const [girl, boss] = boxes;
    expect(boss).toEqual({ left: 480, right: 1080, top: 60, bottom: 680, soft: true, party: false });
    // the girl keeps the head-to-feet estimate: the box is centred on her head's x, a body half-width either side
    expect(girl!.party).toBe(true);
    expect(girl!.top).toBe(200);
    expect(girl!.bottom).toBe(500);
    expect((girl!.left + girl!.right) / 2).toBeCloseTo(300, 6);
  });

  it('keeps the estimate when no painted box is known (the stage has not measured it yet) or the stage has none to give', () => {
    for (const fn of [undefined, () => null, () => ({ x: 0, y: 0, w: 0, h: 0 })]) {
      const [boss] = fighterBoxes(state([], ['bahamut']), project, fn);
      expect(boss!.top).toBe(200);
      expect(boss!.bottom).toBe(500);
      expect(boss!.right - boss!.left).toBeLessThan(300);
    }
  });

  it('is for the three giants only: a fiend that is no giant keeps the estimate even when the stage can measure its painting', () => {
    const [boss] = fighterBoxes(state([], ['x2-shiva']), project, painted);
    expect(boss!.top).toBe(200);
    expect(boss!.bottom).toBe(500);
  });

  it('a party member with a giant\'s id is no giant (the box is for the enemy side)', () => {
    const [mine] = fighterBoxes(state(['bahamut'], []), project, painted);
    expect(mine!.party).toBe(true);
    expect(mine!.top).toBe(200);
  });

  it('a downed giant has no box', () => {
    const s = state([], ['bahamut']);
    (s.combatants['bahamut'] as { hp: number }).hp = 0;
    expect(fighterBoxes(s, project, painted)).toEqual([]);
  });
});

describe('the phone slice fit (A-12) holds a giant whole and below the strip (FFX-2 only)', () => {
  type Subject = { actor: unknown; min: number; shared?: boolean; giant?: boolean };
  function phoneSetup(enemy: string, ffx2: boolean) {
    const stage = new FakeStage(['yuna', 'rikku'], [enemy]);
    (stage.actors.get(enemy) as unknown as { name: string }).name = enemy; // a stage actor is named by its combatant id (`PaintedActor`)
    for (const id of ['yuna', 'rikku']) (stage.actors.get(id) as unknown as { name: string }).name = id;
    const fitted: Array<{ rig: string; slice: number; subjects: Subject[]; top: number | undefined }> = [];
    (stage.camera as { fitSlice?: unknown }).fitSlice = (rig: string, slice: number, subjects: Subject[], top?: number) => {
      fitted.push({ rig, slice, subjects, top });
      return true;
    };
    const overlay = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => 0.42 };
    const moments = new BattleMoments({ stage, moments: overlay, sleep: noSleep, speed: () => 'normal' });
    moments.shots.ffx2Framing = ffx2;
    return { stage, moments, fitted };
  }
  const minOf = (subjects: Subject[], stage: FakeStage, id: string): number | undefined => subjects.find((s) => s.actor === stage.actors.get(id))?.min;

  it.each(['bahamut', 'paragon', 'x2-anima'])('%s is fitted whole (min 1) and the fit keeps its head below the gauge and the strip', async (giant) => {
    const { stage, moments, fitted } = phoneSetup(giant, true);
    await moments.battleStart({ partyIds: ['yuna', 'rikku'] });
    // The fit every fight had before the giants first (the next link starts from it: `FrameFit.LinkFits`), then the giant's own.
    expect(fitted).toHaveLength(2);
    const [ordinary, own] = fitted as [typeof fitted[number], typeof fitted[number]];
    expect(minOf(ordinary.subjects, stage, giant)).toBe(0.75);
    expect(ordinary.subjects.some((s) => s.giant === true)).toBe(false);
    expect(ordinary.top).toBe(0);
    expect(minOf(own.subjects, stage, giant)).toBe(1);
    expect(own.subjects.find((s) => s.actor === stage.actors.get(giant))?.giant).toBe(true);
    expect(minOf(own.subjects, stage, 'yuna')).toBe(1);
    expect(own.subjects.find((s) => s.actor === stage.actors.get('yuna'))?.giant).toBeUndefined();
    expect(own.top).toBeGreaterThanOrEqual(GIANT_PHONE_TOP);
  });

  it('the girls are the same figures in both fits, whole and read at the shared height', async () => {
    const { stage, moments, fitted } = phoneSetup('paragon', true);
    await moments.battleStart({ partyIds: ['yuna', 'rikku'] });
    for (const f of fitted) for (const id of ['yuna', 'rikku']) expect(f.subjects.find((s) => s.actor === stage.actors.get(id))).toMatchObject({ min: 1, shared: true });
  });

  it('GIANT_PHONE_TOP is the share the options sheet\'s phone picture keeps: the figure\'s top about 100 px down a 520 px field, under the gauge and the strip\'s first line', () => {
    // Measured at 390x844 (r3942-stage, handoff): 0.19 puts the whole figure below the gauge with only the crown of Bahamut's horns and the tips of Anima's under the strip's second line
    // (5.7 and 5.2 percent of their pixels; live 15 percent and 46 percent of Bahamut's head). 0.26 (the strip's whole height) moved the figure 10 px and pushed the girls under the guide card.
    expect(GIANT_PHONE_TOP).toBe(0.19);
    expect(GIANT_PHONE_TOP * 520).toBeGreaterThan(60); // below the gauge (y 10 to 52) and the rail
    expect(GIANT_PHONE_TOP * 520).toBeLessThan(130); // the strip's bottom at two lines: the picture the pick was made on keeps the crown under it
  });

  it('another fiend of FFX-2 keeps its 0.75 and the fit reserves nothing, in one fit', async () => {
    const { stage, moments, fitted } = phoneSetup('x2-shiva', true);
    await moments.battleStart({ partyIds: ['yuna', 'rikku'] });
    expect(fitted).toHaveLength(1);
    expect(minOf(fitted[0]!.subjects, stage, 'x2-shiva')).toBe(0.75);
    expect(fitted[0]!.subjects.some((s) => s.giant === true)).toBe(false);
    expect(fitted[0]!.top).toBe(0);
  });

  it('the same ids on an FFX stage (CTB, no FFX-2 framing) are no giants: FFX\'s own Bahamut keeps 0.75 and nothing is reserved', async () => {
    const { stage, moments, fitted } = phoneSetup('bahamut', false);
    await moments.battleStart({ partyIds: ['yuna', 'rikku'] });
    expect(fitted).toHaveLength(1);
    expect(minOf(fitted[0]!.subjects, stage, 'bahamut')).toBe(0.75);
    expect(fitted[0]!.subjects.some((s) => s.giant === true)).toBe(false);
    expect(fitted[0]!.top).toBe(0);
  });
});
