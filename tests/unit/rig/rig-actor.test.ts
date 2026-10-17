import { Group, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

// a canvas the three side never uploads: the painted stand-ins and the shared noise, blob and ring textures need none in a test
vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { PaintedActor } = await import('../../../src/engine/PaintedActor.ts');
const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { carrierOf, idleSlot } = await import('../../../src/engine/rig/RigCarrier.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { lacksKoPainting } = await import('../../../src/engine/KoFallback.ts');
const { CustomBlending, NormalBlending } = await import('three');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

const idlePainting = (): Painted => ({
  texture: new Texture(),
  meta: { width: 400, height: 800, baselineY: 780 },
  placeholder: false,
  url: '/art/characters/testfig/idle.png',
});

const opts = (over: Partial<Opts> = {}): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false, ...over });

async function rigged(file = makeRigFile(), o: Partial<Opts> = {}): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  return RigActor.createRigged(opts(o), { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() });
}

const run = (a: RigActorT, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) a.update(dt);
};

describe('the carrier: the private parts of PaintedActor the rig reads (pinned, so a rename fails here)', () => {
  it('a PaintedActor still has inner, slots with a mesh, material, pose and meta, active, life, the uniform cells and noteViewCamera', () => {
    const actor = new PaintedActor(opts({ figure: false }));
    actor.adoptPoses({ idle: idlePainting() }, 'idle');
    const c = carrierOf(actor);
    expect(c.inner).toBeInstanceOf(Group);
    expect(c.slots).toHaveLength(2);
    expect(c.active === 0 || c.active === 1).toBe(true);
    const slot = idleSlot(c);
    expect(slot.mesh.isMesh).toBe(true);
    expect(slot.material.uniforms['contactBand']).toBeDefined();
    expect((slot.material.uniforms['texel']!.value as { x: number }).x).toBeGreaterThan(0);
    expect(slot.pose).toBe('idle');
    expect(slot.meta).toMatchObject({ width: 400, height: 800 });
    expect(c.life?.state).toBe('idle');
    for (const k of ['brightness', 'tint', 'flashColor', 'flashAmount', 'rimColor', 'rimStrength', 'rimDir', 'rimWidth', 'bounceColor', 'bounceStrength', 'dissolve', 'dissolveSweep', 'groundShade', 'desaturate', 'alphaCut', 'noiseMap']) {
      expect(c.u[k], k).toBeDefined();
    }
    expect(typeof c.noteViewCamera).toBe('function');
    expect(slot.material.uniforms['flashAmount']).toBe(c.u['flashAmount']); // the slot materials share the cells by reference, as the parts will
  });
});

describe('RigActor', () => {
  it('is a PaintedActor that draws no plane; its parts hang under the motion group and share the actor uniform cells', async () => {
    const a = await rigged();
    expect(a).toBeInstanceOf(PaintedActor);
    const c = carrierOf(a);
    expect(c.slots.every((s) => !s.mesh.visible)).toBe(true);
    expect(a.figure.plane.parent).toBe(c.inner);
    expect(a.figure.partCount).toBe(6);
    for (const m of a.figure.materials) {
      for (const k of ['tint', 'flashAmount', 'flashColor', 'rimColor', 'rimStrength', 'rimDir', 'dissolve', 'brightness', 'desaturate', 'noiseMap']) expect(m.uniforms[k], k).toBe(c.u[k]);
      expect(m.uniforms['contactBand']).toBe(idleSlot(c).material.uniforms['contactBand']);
      // a part's border is a cut: nothing that works on a texture border is shared
      expect(m.uniforms['edgeFade']!.value).toBe(0);
      expect(m.uniforms['erode']!.value).toBe(0);
    }
    expect(a.pose).toBe('idle');
    expect(a.isPlaceholder).toBe(false);
    expect(a.poseNames.sort()).toEqual(['attack', 'hurt', 'idle', 'ko', 'ready']);
  });

  it('a flash, a tint and a dissolve on the actor reach the parts through the shared cells; alpha reaches their opacity; dissolving turns the bloom mask off', async () => {
    const a = await rigged();
    const m = a.figure.materials[0]!;
    a.flash(0xffffff, 200, 1);
    expect(m.uniforms['flashAmount']!.value).toBeGreaterThan(0.9);
    a.setTint(0x88aaff);
    a.setDim(0.5);
    expect(m.uniforms['desaturate']!.value).toBeCloseTo(0.5, 6);
    a.setAlpha(0.4);
    a.update(1 / 60);
    expect(m.uniforms['opacity']!.value).toBeCloseTo(0.4, 6);
    expect(m.blending).toBe(CustomBlending);
    a.setDissolve(0.5);
    a.update(1 / 60);
    expect(m.uniforms['dissolve']!.value).toBe(0.5);
    expect(m.blending).toBe(NormalBlending);
    a.setAlpha(0);
    a.update(1 / 60);
    expect(a.figure.plane.visible).toBe(false);
  });

  it('follows the idle plane: its place, its size and its mirror', async () => {
    const a = await rigged(makeRigFile(), { side: 'enemy', artFacing: 'right' });
    a.update(1 / 60);
    const slot = idleSlot(carrierOf(a));
    expect(a.figure.plane.scale.x).toBe(slot.mesh.scale.x);
    expect(a.figure.plane.scale.y).toBe(slot.mesh.scale.y);
    expect(a.figure.plane.position.y).toBe(slot.mesh.position.y);
    expect(a.mirrored).toBe(true);
    expect(a.figure.plane.scale.x).toBeLessThan(0);
    a.setFacing(1);
    a.update(1 / 60);
    expect(a.figure.plane.scale.x).toBeGreaterThan(0);
  });

  it('setPose moves to the key over its time on the game ease, reports pose and blending, and holds while the field is frozen', async () => {
    const a = await rigged();
    a.update(0);
    const hand0 = a.landmark('hand')!;
    a.setPose('attack');
    expect(a.pose).toBe('attack');
    expect(a.blending).toBe(true);
    a.update(0); // a hit-stop: the field clock is zero
    expect(a.landmark('hand')!.x).toBeCloseTo(hand0.x, 9);
    expect(a.landmark('hand')!.y).toBeCloseTo(hand0.y, 9);
    a.update(0.07);
    expect(a.blending).toBe(true);
    run(a, 0.2);
    expect(a.blending).toBe(false);
    const hand1 = a.landmark('hand')!;
    expect(Math.hypot(hand1.x - hand0.x, hand1.y - hand0.y)).toBeGreaterThan(0.2); // the arm is up: the fist moved by a good part of a unit
    a.setPose('idle');
    run(a, 0.4);
    const hand2 = a.landmark('hand')!;
    // back to the idle, give or take the idle sway (a degree or two)
    expect(Math.hypot(hand2.x - hand0.x, hand2.y - hand0.y)).toBeLessThan(0.05);
  });

  it('a key can reorder parts: the overrides go on halfway through the move and come off again with the next key', async () => {
    const a = await rigged();
    const z = (n: string): number => a.figure.plane.children.find((c) => c.name === n)!.position.z;
    const dz = 0.002;
    expect(z('head')).toBeCloseTo(5 * dz, 9); // its own order
    a.setPose('attack');
    run(a, 0.03); // 140 ms move: not halfway yet
    expect(z('head')).toBeCloseTo(5 * dz, 9);
    run(a, 0.2);
    expect(z('head')).toBeCloseTo(1.5 * dz, 9);
    expect(z('arm')).toBeCloseTo(6 * dz, 9);
    expect(z('body')).toBeCloseTo(2 * dz, 9); // untouched
    a.setPose('idle', { immediate: true });
    expect(z('head')).toBeCloseTo(5 * dz, 9);
    expect(z('arm')).toBeCloseTo(4 * dz, 9);
  });

  it('a name resolves down the chain: cast to attack, an Overdrive name with no key leaves the figure as it is, immediate snaps', async () => {
    const a = await rigged();
    a.setPose('cast');
    expect(a.pose).toBe('attack');
    a.setPose('od-meteor');
    expect(a.pose).toBe('attack');
    a.setPose('idle', { immediate: true });
    expect(a.pose).toBe('idle');
    expect(a.blending).toBe(false);
    a.setPose('victory');
    expect(a.pose).toBe('idle'); // victory has no key: idle
  });

  it('a body on the ground ignores a hurt (the actor life layer decides, not the rig); a flinch plays the hurt key and gives the pose back', async () => {
    const a = await rigged();
    a.flinch(200);
    expect(a.pose).toBe('hurt');
    run(a, 0.5);
    expect(a.pose).toBe('idle');
    a.setPose('ko');
    expect(a.pose).toBe('ko');
    a.setPose('hurt');
    expect(a.pose).toBe('ko');
    a.flinch(200);
    expect(a.pose).toBe('ko');
  });

  it('KoFallback: a rig with a ko key has a KO pose; a rig without one is laid down like a figure with no KO painting', async () => {
    const a = await rigged();
    expect(lacksKoPainting(a)).toBe(false);
    const f = makeRigFile();
    delete (f.keys as Record<string, unknown>)['ko'];
    const b = await rigged(f);
    expect(lacksKoPainting(b)).toBe(true);
    b.setPose('ko');
    expect(b.pose).toBe('hurt'); // ko falls to hurt on the actor's chain
  });

  it('feet stay planted through a pose change: the sole stays on its row to a few pixels at every frame', async () => {
    const a = await rigged();
    const tol = 0.012 * 800; // 1.2 percent of the painting's height, in painting px (the actor's own crouch and lean are whole-figure stage motion, not the rig's)
    const sole = (): number => a.figure.skeleton.landmark('footN')!.y;
    const base = sole();
    a.setPose('attack');
    for (let i = 0; i < 20; i++) {
      a.update(1 / 60);
      expect(Math.abs(sole() - base)).toBeLessThan(tol);
    }
    a.setPose('hurt');
    for (let i = 0; i < 20; i++) {
      a.update(1 / 60);
      expect(Math.abs(sole() - base)).toBeLessThan(tol);
    }
  });

  it('the idle plays on the bones and the whole-card breath is left to them; still (REDUCE MOTION) holds the figure', async () => {
    const a = await rigged();
    run(a, 0.3);
    const h0 = a.landmark('head')!;
    run(a, 0.5);
    const h1 = a.landmark('head')!;
    expect(Math.hypot(h1.x - h0.x, h1.y - h0.y)).toBeGreaterThan(1e-4);
    a.still = () => true;
    run(a, 2); // the idle fades out
    const s0 = a.landmark('head')!;
    run(a, 0.7);
    const s1 = a.landmark('head')!;
    expect(Math.hypot(s1.x - s0.x, s1.y - s0.y)).toBeLessThan(1e-4);
  });

  it('a rig without an idle motion block keeps the painted actor breath', async () => {
    const f = makeRigFile();
    delete (f as { motion?: unknown }).motion;
    const a = await rigged(f);
    expect(a.rigInfo()).toMatchObject({ idle: false, chains: 0, keys: expect.arrayContaining(['idle']) });
  });

  it('refuses a rig whose idle painting has another shape, and a missing idle painting, without leaving an actor behind', async () => {
    const r = readRig(makeRigFile());
    if (!r.ok) throw new Error(r.reason);
    const wide: Painted = { ...idlePainting(), meta: { width: 800, height: 800, baselineY: 780 } };
    await expect(RigActor.createRigged(opts(), { data: r.data, base: 'x', idlePainting: wide, loadTexture: async () => new Texture() })).rejects.toThrow(/was cut from 400x800/);
    await expect(RigActor.createRigged(opts(), { data: r.data, base: 'x', loadTexture: async () => new Texture() })).rejects.toThrow(/no idle painting/);
  });

  it('dispose frees the parts', async () => {
    const a = await rigged();
    const plane = a.figure.plane;
    a.dispose();
    expect(plane.parent).toBeNull();
  });
});
