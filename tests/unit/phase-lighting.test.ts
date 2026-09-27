/**
 * D-224 (Bailey, 2026-09-26: "I'll go with all of your recommendations"):
 * phase lighting option A, on canon triggers only.
 * - The presenter hands the stage's lighting port a phase only on the canon
 *   beats (research/ffx-vs-ffx2-presentation.md §9 row 4), in both games, and
 *   nothing on any other event.
 * - The look tweens over about 1.5 s, at most three changes start a second,
 *   REDUCE FLASHES lands it at once, and a charge ladder's look is transient.
 * Game case per trigger: FFX (Flux, Mortiorchis, Yunalesca, Anima, Evrae),
 * FFX-2 (Bahamut's countdown, Vegnagun's links); the mechanism is both.
 */
import { describe, expect, it } from 'vitest';
import { Scene } from 'three';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { PHASE_GRADES, PHASE_TRIGGERS, phaseCue, phaseForFlags, phaseForFormation, type PhaseCue } from '../../src/engine/phaseCanon.ts';
import { PhaseLighting, type GradeTarget } from '../../src/engine/PhaseLighting.ts';
import type { ScenePalette } from '../../src/engine/Renderer.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

type Ev = BattleEvent;
const ev = (e: Record<string, unknown>): Ev => ({ seq: 0, ...e }) as unknown as Ev;

function cues(events: Ev[]): PhaseCue[] {
  const memo = {};
  return events.map((e) => phaseCue(e, memo)).filter((c) => c !== null);
}

describe('phase lighting: the canon triggers (D-224)', () => {
  it('FFX: Flux\'s Reflect, the Mortiorchis ladder and its payload, Yunalesca\'s forms, Anima', () => {
    expect(
      cues([
        ev({ type: 'action-start', actorId: 'seymour-flux', abilityId: 'reflect', targets: ['seymour-flux'] }),
        ev({ type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 }),
        ev({ type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', turnsLeft: 1, stage: 2 }),
        ev({ type: 'action-start', actorId: 'mortiorchis', abilityId: 'total-annihilation', targets: [] }),
        ev({ type: 'action-end', actorId: 'mortiorchis' }),
        ev({ type: 'form-change', enemyId: 'yunalesca', formIndex: 1, name: 'Yunalesca' }),
        ev({ type: 'form-change', enemyId: 'yunalesca', formIndex: 2, name: 'Yunalesca' }),
        ev({ type: 'part-restored', partId: 'anima-macalania', hp: 18000 }),
      ]),
    ).toEqual(['flux-reflect', 'mortiorchis-charge', 'mortiorchis-imminent', 'restore', 'yunalesca-2', 'yunalesca-3', 'anima']);
    expect(phaseForFlags({ 'airship.range': 'far' })).toBe('evrae-far');
    expect(phaseForFlags({ 'airship.range': 'near' })).toBe('base');
    expect(phaseForFlags({})).toBeNull();
  });

  it("FFX-2: Bahamut's countdown and Mega Flare, and Vegnagun's links", () => {
    expect(
      cues([
        ev({ type: 'charge', enemyId: 'ffx2-bahamut', name: '5', turnsLeft: 5, stage: 1 }),
        ev({ type: 'charge', enemyId: 'ffx2-bahamut', name: '2', turnsLeft: 2, stage: 2 }),
        ev({ type: 'action-start', actorId: 'ffx2-bahamut', abilityId: 'mega-flare', targets: [] }),
        ev({ type: 'action-end', actorId: 'ffx2-bahamut' }),
      ]),
    ).toEqual(['bahamut-countdown', 'bahamut-imminent', 'restore']);
    expect(phaseForFormation(['vegnagun-tail'])).toBe('base');
    expect(phaseForFormation(['vegnagun-leg', 'node-a'])).toBe('vegnagun-leg');
    expect(phaseForFormation(['vegnagun-body', 'bulwark-r'])).toBe('vegnagun-body');
    expect(phaseForFormation(['vegnagun-head'])).toBe('vegnagun-head');
    expect(phaseForFormation(['shuyin'])).toBeNull();
  });

  it('nothing else turns the light: other actions, other charges, other forms, the same beat by someone else', () => {
    expect(
      cues([
        ev({ type: 'action-start', actorId: 'tidus', abilityId: 'reflect', targets: ['tidus'] }),
        ev({ type: 'action-start', actorId: 'seymour-flux', abilityId: 'flare-self', targets: [] }),
        ev({ type: 'charge', enemyId: 'braskas-final-aeon', name: 'x', turnsLeft: 1, stage: 1 }),
        ev({ type: 'form-change', enemyId: 'seymour-natus', formIndex: 1, name: 'x' }),
        ev({ type: 'part-restored', partId: 'bulwark-r', hp: 1 }),
        ev({ type: 'action-end', actorId: 'yuna' }),
        ev({ type: 'damage', targetId: 'tidus', amount: 5, hitIndex: 0, hitCount: 1 }),
      ]),
    ).toEqual([]);
  });

  it('every trigger names its game and a source, and every phase has a look', () => {
    for (const [id, t] of Object.entries(PHASE_TRIGGERS)) {
      expect(['ffx', 'ffx2'], id).toContain(t.game);
      expect(t.cite.length, id).toBeGreaterThan(15);
      expect(PHASE_GRADES, id).toHaveProperty(id);
    }
  });

  it('the presenter hands a canon beat to the stage\'s lighting port', async () => {
    const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux', 'mortiorchis']);
    const seen: PhaseCue[] = [];
    (stage as unknown as { lighting: { cue(c: PhaseCue): void } }).lighting = { cue: (c) => void seen.push(c) };
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve() });
    await presenter.play([
      ev({ seq: 1, type: 'action-start', actorId: 'seymour-flux', command: { kind: 'ability', abilityId: 'reflect', targets: ['seymour-flux'] }, abilityId: 'reflect', abilityName: 'Reflect', targets: ['seymour-flux'] }),
      ev({ seq: 2, type: 'action-end', actorId: 'seymour-flux' }),
    ]);
    expect(seen).toEqual(['flux-reflect']);
  });
});

class FakeGrade implements GradeTarget {
  palette: ScenePalette | null = { name: 'test', exposure: 1, gain: [1, 1, 1], vignette: 0.4 };
  applied: ScenePalette[] = [];
  applyPalette(p: ScenePalette): void {
    this.applied.push(p);
  }
  get exposure(): number {
    return this.applied.at(-1)?.exposure ?? 1;
  }
}

function lit(reduce = false) {
  const grade = new FakeGrade();
  const bounces: number[] = [];
  const L = new PhaseLighting({
    scene: new Scene(),
    grade,
    figures: () => [{ setBounceLight: (_c: number | string, s: number) => void bounces.push(s), setRimLight: () => undefined }],
    partyCentre: () => ({ x: 0, z: 0 }),
    baseRim: { color: 0xbfe0ff, strength: 0.8 },
    reduceFlashes: () => reduce,
  });
  return { L, grade, bounces };
}

describe('phase lighting: the tween (D-224)', () => {
  it('turns over about 1.5 s, not at once', () => {
    const { L, grade } = lit();
    L.phase('flux-reflect');
    L.update(0.75);
    const mid = grade.exposure;
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(PHASE_GRADES['flux-reflect'].exposure);
    L.update(0.8);
    expect(grade.exposure).toBeCloseTo(PHASE_GRADES['flux-reflect'].exposure, 5);
  });

  it('REDUCE FLASHES lands the look at once', () => {
    const { L, grade } = lit(true);
    L.phase('yunalesca-3');
    expect(grade.exposure).toBeCloseTo(PHASE_GRADES['yunalesca-3'].exposure, 5);
  });

  it('no more than three changes start in any second', () => {
    const { L } = lit();
    const seq = ['flux-reflect', 'mortiorchis-charge', 'mortiorchis-imminent', 'yunalesca-2', 'anima', 'yunalesca-3'];
    for (const id of seq) {
      L.phase(id);
      L.update(0.1);
    }
    for (let i = 0; i < 20; i++) L.update(0.1);
    const times = L.starts.map(([t]) => t);
    for (let i = 3; i < times.length; i++) expect(times[i]! - times[i - 3]!).toBeGreaterThanOrEqual(1 - 1e-6);
  });

  it("a ladder's look is transient: 'restore' returns to the phase underneath", () => {
    const { L } = lit(true);
    L.phase('flux-reflect');
    L.update(1);
    L.cue('mortiorchis-charge');
    L.update(1);
    expect(L.current).toBe('mortiorchis-charge');
    L.cue('restore');
    L.update(1);
    expect(L.current).toBe('flux-reflect');
  });

  it('the floor glow reaches the figures as a bounce tint', () => {
    const { L, bounces } = lit(true);
    L.phase('yunalesca-3');
    expect(Math.max(...bounces)).toBeGreaterThan(0.1);
  });

  it('a battle with no canon beat never touches the renderer', () => {
    const { L, grade } = lit();
    for (let i = 0; i < 30; i++) L.update(0.1);
    expect(grade.applied).toEqual([]);
  });
});
