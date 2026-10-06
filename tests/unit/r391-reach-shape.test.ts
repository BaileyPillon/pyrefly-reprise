/**
 * r391-reach (both games): the field's look at a painted shape for the strike (`StageMotion.shape`) and a painted actor's look at a pose it is not showing
 * (`PaintedActor.poseShape`). Real `three` objects, no GPU.
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Scene, Texture, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { computePoseScale } from '../../src/engine/PaintedScale.ts';
import { StageMotion } from '../../src/engine/motion/StageMotion.ts';
import { BANDS, type Profile } from '../../src/engine/motion/Silhouette.ts';

// ------------------------------------------------------------------ StageMotion.shape

function field(over: { visible?: boolean; alpha?: number; dissolveLevel?: number } = {}) {
  const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  const rigs = { idle: { position: [0, 2.3, 8.2] as [number, number, number], lookAt: [0, 1.4, 0] as [number, number, number] } };
  const battle = new BattleCamera(cam, { rigs, initial: 'idle', swayAmplitude: 0 });
  const scene = new Scene();
  const figure = Object.assign(new Group(), { alpha: over.alpha ?? 1, dissolveLevel: over.dissolveLevel ?? 0 });
  figure.visible = over.visible ?? true;
  figure.position.set(-1, 0, 1);
  scene.add(figure);
  const asked: Array<{ what: string; pose?: string | undefined }> = [];
  const profile: Profile = { left: new Float32Array(BANDS).fill(0.1), right: new Float32Array(BANDS).fill(0.9) };
  const motion = new StageMotion({
    scene,
    camera: battle,
    quadOf: (id, out, pose) => {
      asked.push({ what: 'quad', pose });
      if (id !== 'paine') return null;
      const w = pose === 'follow' ? 1.4 : 0.9; // the follow-through painting is wider than the one showing
      [new Vector3(-w / 2, 0, 0), new Vector3(w / 2, 0, 0), new Vector3(w / 2, 1.8, 0), new Vector3(-w / 2, 1.8, 0)].forEach((v, i) => out[i]!.copy(v).add(figure.position));
      return out;
    },
    figure: (id) => (id === 'paine' ? figure : undefined),
    view: () => ({ w: 1600, h: 900 }),
    lowEffects: () => false,
    profileOf: (id, pose) => {
      asked.push({ what: 'profile', pose });
      return id === 'paine' ? profile : undefined;
    },
  });
  return { motion, figure, asked, profile };
}

describe('StageMotion.shape: the painted box and its rows, or null where the figure is not on the screen', () => {
  it('is the box `rect` reads and the profile the painting gives', () => {
    const { motion, profile } = field();
    const s = motion.shape('paine')!;
    expect(s.rect).toEqual(motion.rect('paine'));
    expect(s.profile).toBe(profile);
  });

  it('reads the pose asked for, as it would stand, for the box and for the rows (the others as they show)', () => {
    const { motion, asked } = field();
    const showing = motion.shape('paine')!;
    const follow = motion.shape('paine', { pose: 'follow' })!;
    expect(follow.rect.w).toBeGreaterThan(showing.rect.w); // 1.4 wide against 0.9
    expect(asked.filter((a) => a.what === 'quad' && a.pose === 'follow')).toHaveLength(1);
    expect(asked.filter((a) => a.what === 'profile' && a.pose === 'follow')).toHaveLength(1);
    expect(asked.filter((a) => a.pose === undefined).length).toBeGreaterThanOrEqual(2);
  });

  it('carries the figure to `at` like rect does (the attacker\'s lunge)', () => {
    const { motion } = field();
    const home = motion.shape('paine')!.rect;
    const moved = motion.shape('paine', { at: { x: 0.2, y: 0, z: 1 } })!.rect;
    expect(moved.x).toBeGreaterThan(home.x);
    expect(Math.abs(moved.w / home.w - 1)).toBeLessThan(0.05); // the same figure, a camera with a little yaw
  });

  it('is null for a figure that is off the field, faded out (a summon took it off the field), dissolved, or hidden', () => {
    expect(field().motion.shape('nobody')).toBeNull();
    expect(field({ alpha: 0.02 }).motion.shape('paine')).toBeNull();
    expect(field({ alpha: 0.5 }).motion.shape('paine')).not.toBeNull();
    expect(field({ dissolveLevel: 0.97 }).motion.shape('paine')).toBeNull();
    expect(field({ dissolveLevel: 0.4 }).motion.shape('paine')).not.toBeNull();
    expect(field({ visible: false }).motion.shape('paine')).toBeNull();
  });

  it('gives the box alone where the painting cannot be read', () => {
    const { motion } = field();
    expect(motion.shape('paine')!.profile).toBeDefined();
    const bare = new StageMotion({
      scene: new Scene(),
      camera: new BattleCamera(new PerspectiveCamera(32, 16 / 9, 0.1, 100), { rigs: { idle: { position: [0, 2.3, 8.2], lookAt: [0, 1.4, 0] } }, initial: 'idle', swayAmplitude: 0 }),
      quadOf: (_id, out) => {
        [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 2, 0), new Vector3(0, 2, 0)].forEach((v, i) => out[i]!.copy(v));
        return out;
      },
      figure: () => new Group(),
      view: () => ({ w: 1600, h: 900 }),
      lowEffects: () => false,
    });
    expect(bare.shape('x')!.profile).toBeUndefined();
  });
});

// ------------------------------------------------------------------ PaintedActor.poseShape

/** A painted actor without its renderer: the fields `poseShape` reads, around the real prototype. */
function actorOf(opts: { facing?: 1 | -1; art?: 'right' | 'left'; poseShiftPx?: Record<string, number> } = {}) {
  const idle = { width: 400, height: 1000, baselineY: 950, content: { x0: 100, x1: 300, y0: 50, y1: 950 } };
  const follow = { width: 600, height: 1000, baselineY: 950, content: { x0: 120, x1: 560, y0: 200, y1: 950 } };
  const placeholder = { width: 400, height: 1000, baselineY: 950 };
  const ko = { width: 1200, height: 800, baselineY: 780 };
  const tex = (n: string) => Object.assign(new Texture(), { name: n });
  const a = Object.create(PaintedActor.prototype) as Record<string, unknown>;
  a['poses'] = new Map([
    ['idle', { texture: tex('idle'), meta: idle, placeholder: false }],
    ['follow', { texture: tex('follow'), meta: follow, placeholder: false }],
    ['attack', { texture: tex('attack'), meta: placeholder, placeholder: true }],
    ['ko', { texture: tex('ko'), meta: ko, placeholder: false }],
  ]);
  a['worldHeight'] = 1.8;
  a['reference'] = idle;
  a['referenceUpp'] = 0.0018;
  a['extents'] = { maxExtent: 2.2, minExtent: 0.35, proneAspect: 1.15 };
  a['artFacing'] = opts.art ?? 'right';
  a['facing'] = opts.facing ?? 1;
  a['poseShiftPx'] = opts.poseShiftPx;
  const inner = new Group();
  inner.position.set(0.3, 0, 0); // a lunge in flight
  const root = new Group();
  root.position.set(2, 0, -3);
  root.add(inner);
  a['inner'] = inner;
  return { actor: a as unknown as PaintedActor, idle, follow };
}

describe('PaintedActor.poseShape: the painted box of a pose the actor is not showing, nothing changed', () => {
  it('is the pose\'s own tight box, sized from the idle\'s pixel scale and carried by the actor\'s motion (the lunge in flight, its place)', () => {
    const { actor, idle, follow } = actorOf();
    const s = actor.poseShape('follow')!;
    const upp = computePoseScale(follow, { worldHeight: 1.8, reference: idle, maxExtent: 2.2, minExtent: 0.35, proneAspect: 1.15 }).unitsPerPixel;
    const box = computePoseScale(follow, { worldHeight: 1.8, reference: idle, maxExtent: 2.2, minExtent: 0.35, proneAspect: 1.15 }).contentBox;
    const xs = s.corners.map((c) => c.x);
    expect(Math.min(...xs)).toBeCloseTo(2 + 0.3 + box.x0, 6);
    expect(Math.max(...xs)).toBeCloseTo(2 + 0.3 + box.x1, 6);
    expect(Math.min(...s.corners.map((c) => c.y))).toBeCloseTo(box.y0, 6);
    expect(Math.max(...s.corners.map((c) => c.y))).toBeCloseTo(box.y1, 6);
    expect(s.corners.every((c) => Math.abs(c.z + 3) < 1e-9)).toBe(true);
    // the box in uv: the follow painting is 600 wide, its box runs 120 to 560 px: u 0.2 to 0.9333
    expect(s.u0).toBeCloseTo(120 / 600, 6);
    expect(s.u1).toBeCloseTo(560 / 600, 6);
    expect(upp).toBeGreaterThan(0);
    expect(s.mirrored).toBe(false);
    expect(s.tex).toBeInstanceOf(Texture);
    expect(s.v1).toBeCloseTo(1 - 200 / 1000, 4); // the top of the box, 200 px from the top of the image (v is up)
  });

  it('mirrors the box for a painting that faces the wrong way for the body (art facing right, body turned left)', () => {
    const right = actorOf({ facing: 1, art: 'right' }).actor.poseShape('follow')!;
    const left = actorOf({ facing: -1, art: 'right' }).actor.poseShape('follow')!;
    expect(right.mirrored).toBe(false);
    expect(left.mirrored).toBe(true);
    // about the actor's centre line (2.3): the box leans right of it for one and left for the other, by the same amount
    const lean = (s: typeof right): number => (Math.min(...s.corners.map((c) => c.x)) + Math.max(...s.corners.map((c) => c.x))) / 2 - 2.3;
    expect(lean(right)).toBeCloseTo(-lean(left), 6);
    expect(Math.abs(lean(right))).toBeGreaterThan(0.01);
  });

  it('slides the plane by the sidecar\'s own shift, in the direction the plane is drawn', () => {
    const plain = actorOf().actor.poseShape('follow')!;
    const shifted = actorOf({ poseShiftPx: { follow: 10 } }).actor.poseShape('follow')!;
    const dx = Math.min(...shifted.corners.map((c) => c.x)) - Math.min(...plain.corners.map((c) => c.x));
    expect(dx).toBeGreaterThan(0);
    expect(dx).toBeCloseTo(10 * computePoseScale({ width: 600, height: 1000, baselineY: 950 }, { worldHeight: 1.8, reference: { width: 400, height: 1000, baselineY: 950 } as never, maxExtent: 2.2, minExtent: 0.35, proneAspect: 1.15 }).unitsPerPixel, 6);
  });

  it('is null for a pose with no painting of its own (a placeholder, a pose it does not have) and for a body lying down', () => {
    const { actor } = actorOf();
    expect(actor.poseShape('attack')).toBeNull(); // a placeholder: nothing real to size
    expect(actor.poseShape('nonesuch')).toBeNull();
    expect(actor.poseShape('ko')).toBeNull(); // wider than tall: a prone plane is placed by its ground hull
  });
});
