/**
 * **Valefor's stand-in moves** (`src/engine/ww3d/moves.ts`, `moveFx.ts`, `beats.ts`; FFX-2 only): which of her four actions (chapter 24's own ability ids) gets which toon beat, how long each lives, the shapes, and the
 * objects that draw them (made and freed, in Node, with no GPU); and the tap that carries the shot director's beats to the skin with the ability id and the targets.
 */
import { Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { x2ValeforAbilities, VALEFOR_ATTACK_ID, VALEFOR_ENERGY_BLAST_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID } from '../../../src/data/ffx2/enemies/valefor-abilities.ts';
import { x2Valefor } from '../../../src/data/ffx2/enemies/valefor.ts';
import { LUNGE_MS, OVERDRIVE_LEAD_MS, tapDirector, type BeatListener } from '../../../src/engine/ww3d/beats.ts';
import { MoveFx } from '../../../src/engine/ww3d/moveFx.ts';
import { MIN_LEAD, MOVE_TIMING, ORB, curlPoints, moveKindOf, movePhase, orbRadius } from '../../../src/engine/ww3d/moves.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import type { ActionShot, ImpactShot, ShotCtx } from '../../../src/engine/ShotDirector.ts';

describe('which move gets which beat', () => {
  it('maps chapter 24\'s own ids: the Ray a beam, the Blast an orb, Sonic Wings a gust; the plain attack the flap alone', () => {
    expect(moveKindOf(VALEFOR_ENERGY_RAY_ID)).toBe('ray');
    expect(moveKindOf(VALEFOR_ENERGY_BLAST_ID)).toBe('blast');
    expect(moveKindOf(VALEFOR_SONIC_WINGS_ID)).toBe('wings');
    expect(moveKindOf(VALEFOR_ATTACK_ID)).toBeNull();
    expect(moveKindOf(undefined)).toBeNull();
    expect(moveKindOf('x2-valefor-something-new')).toBeNull();
  });

  it('covers every ability she has: each is mapped or is the plain attack, and her enemy record lists exactly those four', () => {
    expect(x2Valefor.abilityIds).toEqual([VALEFOR_ATTACK_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_ENERGY_BLAST_ID]);
    expect(x2ValeforAbilities.map((a) => a.id).sort()).toEqual([...(x2Valefor.abilityIds ?? [])].sort());
    for (const a of x2ValeforAbilities) expect(moveKindOf(a.id) !== null || a.id === VALEFOR_ATTACK_ID, a.id).toBe(true);
  });
});

describe('the life of a beat', () => {
  it('charges from the opening to the blow, fires through the hold, fades, and is done', () => {
    const t = MOVE_TIMING.ray;
    expect(movePhase('ray', 0, 1)).toMatchObject({ charge: 0, fire: 0, fade: 1, done: false });
    expect(movePhase('ray', 0.5, 1).charge).toBeCloseTo(0.5, 10);
    expect(movePhase('ray', 1.0, 1)).toMatchObject({ charge: 1, fire: 1, fade: 1 });
    expect(movePhase('ray', 1 + t.hold + t.fade / 2, 1).fade).toBeCloseTo(0.5, 6);
    expect(movePhase('ray', 1 + t.hold + t.fade + 0.01, 1).done).toBe(true);
    expect(movePhase('ray', 1 + t.hold, 1).done).toBe(false);
  });

  it('gives a move with no lead a windup anyway, so the charge is always seen', () => {
    expect(MIN_LEAD).toBeGreaterThan(0.3);
    expect(movePhase('blast', MIN_LEAD / 2, 0).charge).toBeCloseTo(0.5, 10);
    expect(movePhase('wings', 0, -3).charge).toBe(0);
  });

  it('swells the orb through the charge and bursts it at the blow', () => {
    const r0 = orbRadius(movePhase('blast', 0, 1.5));
    const rMid = orbRadius(movePhase('blast', 0.75, 1.5));
    const rFull = orbRadius(movePhase('blast', 1.4, 1.5));
    const rBurst = orbRadius(movePhase('blast', 1.5, 1.5));
    expect(r0).toBeLessThan(rMid);
    expect(rMid).toBeLessThan(rFull);
    expect(rFull).toBeLessThanOrEqual(ORB.radius);
    expect(rBurst).toBeCloseTo(ORB.radius * ORB.burst, 6);
  });

  it('draws a curly trail that starts at the mouth, ends on the girl, swells between and turns the given number of times', () => {
    const from: [number, number, number] = [0, 2, 0];
    const to: [number, number, number] = [-4, 1, 3];
    const pts = curlPoints(from, to, 2, 0.5, 25, 0);
    expect(pts).toHaveLength(25);
    expect(pts[0]).toEqual(from);
    for (let k = 0; k < 3; k++) expect(pts[24]![k]).toBeCloseTo(to[k]!, 10);
    // never farther from the line than the radius, widest in the middle
    const line = new Vector3(...to).sub(new Vector3(...from));
    const dist = (p: readonly number[]): number => new Vector3(p[0], p[1], p[2]).sub(new Vector3(...from)).cross(line.clone().normalize()).length();
    for (const p of pts) expect(dist(p)).toBeLessThanOrEqual(0.5 + 1e-9);
    expect(dist(pts[12]!)).toBeGreaterThan(dist(pts[2]!));
    expect(curlPoints(from, from, 1, 1, 3)).toHaveLength(3); // a zero-length line does not throw
  });
});

describe('the objects that draw them', () => {
  const mouth = new Vector3(0, 3, 2);
  const girls = [new Vector3(-3, 0.8, 1), new Vector3(-2, 0.8, -0.4), new Vector3(-1, 0.8, -1.5)];

  it('makes a beam to each girl and a muzzle orb for the Ray, a big orb and a ring for the Blast, three trails per girl for Sonic Wings, and frees them all', () => {
    const fx = new MoveFx();
    fx.start('ray', mouth, girls, 0.6);
    expect(fx.group.children).toHaveLength(1 + 3); // the muzzle and one beam each
    fx.start('blast', mouth, [], 1.2);
    expect(fx.group.children).toHaveLength(4 + 2);
    fx.start('wings', mouth, [girls[0]!], 0.6);
    expect(fx.group.children).toHaveLength(6 + 3);
    expect(fx.kinds).toEqual(['ray', 'blast', 'wings']);
    expect(fx.active).toBe(3);
    for (let i = 0; i < 200; i++) fx.update(0.016);
    expect(fx.active).toBe(0);
    expect(fx.group.children).toHaveLength(0);
    fx.dispose();
  });

  it('keeps the beam shut through the charge, opens it at the blow, and aims it from the mouth at the girl', () => {
    const fx = new MoveFx();
    fx.start('ray', mouth, [girls[0]!], 1.0);
    const [muzzle, beam] = fx.group.children as [import('three').Mesh, import('three').Mesh];
    fx.update(0.5);
    expect(beam.visible).toBe(false);
    expect(muzzle.scale.x).toBeGreaterThan(0.1);
    fx.update(0.55);
    expect(beam.visible).toBe(true);
    const len = mouth.distanceTo(girls[0]!);
    expect(beam.scale.y).toBeCloseTo(len, 6);
    const mid = mouth.clone().lerp(girls[0]!, 0.5);
    expect(beam.position.distanceTo(mid)).toBeLessThan(1e-6);
    const along = new Vector3(0, 1, 0).applyQuaternion(beam.quaternion);
    expect(along.dot(girls[0]!.clone().sub(mouth).normalize())).toBeCloseTo(1, 6);
    fx.dispose();
  });

  it('draws the gust out toward the girl a little at a time, with a draw range that grows', () => {
    const fx = new MoveFx();
    fx.start('wings', mouth, [girls[1]!], 1.0);
    const trail = fx.group.children[0] as import('three').Mesh;
    fx.update(0.1);
    expect(trail.visible).toBe(false); // it sets out partway through the windup
    fx.update(0.5);
    const early = trail.geometry.drawRange.count;
    fx.update(0.3);
    expect(trail.geometry.drawRange.count).toBeGreaterThan(early);
    fx.dispose();
  });
});

describe('the tap on the shot director', () => {
  const ctx = (extra: Record<string, unknown> = {}): ShotCtx => ({ camera: {} as never, speed: 'normal', skipping: false, ms: (n: number) => n, ...extra });
  const open = (abilityId: string | undefined, kind = 'cast'): ActionShot => ({
    ...ctx(),
    actor: { id: 'x2-valefor', side: 'enemy' },
    targets: [{ id: 'yuna', side: 'party' }, { id: 'rikku', side: 'party' }],
    action: { kind, abilityId },
  });

  it('tells the listener who opened what, aimed at whom, with the lead to the blow: the lunge\'s apex for an action, a charge of its own for an overdrive', async () => {
    const seen: unknown[][] = [];
    const listener: BeatListener = { open: (...a) => seen.push(a) };
    const director = tapDirector(undefined, listener);
    await director.actionOpen?.(open(VALEFOR_ENERGY_RAY_ID));
    await director.overdriveStart?.(open(VALEFOR_ENERGY_BLAST_ID, 'overdrive'));
    expect(seen[0]).toEqual(['x2-valefor', 'cast', (LUNGE_MS * ATTACK_IMPACT) / 1000, { abilityId: VALEFOR_ENERGY_RAY_ID, targetIds: ['yuna', 'rikku'] }]);
    expect(seen[1]).toEqual(['x2-valefor', 'overdrive', OVERDRIVE_LEAD_MS / 1000, { abilityId: VALEFOR_ENERGY_BLAST_ID, targetIds: ['yuna', 'rikku'] }]);
  });

  it('reports a blow and a close when they are asked, changes none of the inner director\'s answers, and a listener that throws costs only the report', async () => {
    const impact = vi.fn();
    const close = vi.fn();
    const inner = { actionOpen: vi.fn(() => Promise.resolve(true)), impact: vi.fn(() => true) };
    const director = tapDirector(inner as never, { impact, close, open: () => { throw new Error('listener'); } });
    expect(await director.actionOpen?.(open(undefined, 'attack'))).toBe(true);
    expect(director.impact?.({ ...ctx(), actor: { id: 'yuna', side: 'party' }, target: { id: 'x2-valefor', side: 'enemy' }, hitIndex: 0, heavy: false } as ImpactShot)).toBe(true);
    expect(impact).toHaveBeenCalledWith('yuna');
    director.actionClose?.({ ...ctx(), actor: { id: 'yuna', side: 'party' } });
    expect(close).toHaveBeenCalledWith('yuna');
    expect(director.telegraph?.({ ...ctx(), enemy: { id: 'x2-valefor', side: 'enemy' }, stage: 1 })).toBe(false); // a beat nobody handles is the presenter's own
  });

  it('still tells the listener when the inner director\'s handler throws, and passes the error on', () => {
    const open = vi.fn();
    const director = tapDirector({ actionOpen: () => { throw new Error('camera'); } } as never, { open });
    expect(() => director.actionOpen?.(ctxOpen())).toThrow('camera');
    expect(open).toHaveBeenCalledOnce();
    function ctxOpen(): ActionShot {
      return { ...ctx(), actor: { id: 'yuna', side: 'party' }, targets: [], action: { kind: 'attack', abilityId: undefined } };
    }
  });
});
