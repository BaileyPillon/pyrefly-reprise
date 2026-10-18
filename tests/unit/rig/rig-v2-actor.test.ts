/**
 * RigActor with a format v2 rig: parts a key hides are not drawn and not skinned, a swap changes the part's map and mesh, and both flip halfway through the move into the key, where
 * `layers` flips. Textures are stand-ins that need no image (a distinct `Texture` per file name, so a swap can be seen on the material).
 */
import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { HIDDEN, OWN } = await import('../../../src/engine/rig/RigPartState.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });

const loaded = new Map<string, Texture>();
async function rigged(file: RigFileT): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  loaded.clear();
  return RigActor.createRigged(opts(), {
    data: r.data,
    base: '/art/rigs/testfig',
    idlePainting: idlePainting(),
    loadTexture: async (url) => {
      const t = new Texture();
      loaded.set(url.split('/').pop()!.replace(/\.webp$/, '.png'), t);
      return t;
    },
  });
}
const run = (a: RigActorT, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) a.update(dt);
};
const mesh = (a: RigActorT, n: string) => a.figure.plane.children.find((c) => c.name === n) as import('three').Mesh;
const partIndex = (a: RigActorT, n: string): number => a.figure.plane.children.findIndex((c) => c.name === n);
const mapOf = (a: RigActorT, n: string): Texture => (mesh(a, n).material as import('three').ShaderMaterial).uniforms['map']!.value as Texture;

describe('RigActor, format v2', () => {
  it('loads every variant texture and starts in the rest state: the hidden part is not drawn', async () => {
    const a = await rigged(makeRigFileV2());
    for (const f of ['head.png', 'head.back.png', 'head.wide.png', 'head.back.rim.png', 'scar.png']) expect(loaded.has(f), f).toBe(true);
    expect(a.figure.partCount).toBe(7);
    expect(mesh(a, 'scar').visible).toBe(false);
    expect(mesh(a, 'head').visible).toBe(true);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.png'));
    expect(a.figure.partState()[partIndex(a, 'scar')]).toBe(HIDDEN);
  });

  it('a pose change flips the state halfway through the move: nothing before, everything after', async () => {
    const a = await rigged(makeRigFileV2());
    a.setPose('attack'); // 140 ms
    run(a, 0.04);
    expect(mesh(a, 'scar').visible).toBe(false);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.png'));
    run(a, 0.05); // 90 ms of 140: past half
    expect(mesh(a, 'scar').visible).toBe(true);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.back.png'));
    expect(mesh(a, 'head').visible).toBe(true);
    run(a, 0.3);
    expect(a.blending).toBe(false);
    a.setPose('idle');
    run(a, 0.04);
    expect(mesh(a, 'scar').visible).toBe(true); // still the attack's until half way back
    run(a, 0.3);
    expect(mesh(a, 'scar').visible).toBe(false);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.png'));
  });

  it('a variant with its own mesh swaps the geometry; the shared-mesh variant keeps the part geometry', async () => {
    const a = await rigged(makeRigFileV2());
    const own = mesh(a, 'head').geometry;
    a.setPose('attack', { immediate: true });
    expect(mesh(a, 'head').geometry).toBe(own); // `back` uses the part's mesh
    a.setPose('hurt', { immediate: true });
    expect(mesh(a, 'head').geometry).not.toBe(own); // `wide` has its own
    expect(mapOf(a, 'head')).toBe(loaded.get('head.wide.png'));
    a.update(1 / 60);
    const pos = (mesh(a, 'head').geometry.getAttribute('position') as import('three').BufferAttribute).array as Float32Array;
    expect(pos.length).toBe(4 * 3); // the variant's quad, skinned (a quad of its box on the head bone)
    expect(pos.some((v) => v !== 0 && Number.isFinite(v))).toBe(true);
    a.setPose('idle', { immediate: true });
    expect(mesh(a, 'head').geometry).toBe(own);
  });

  it('skips the skinning of a part a key hides (a hidden part costs nothing per frame), and skins it again when it is back', async () => {
    const a = await rigged(makeRigFileV2());
    const spy = vi.spyOn(a.figure.skeleton, 'skin');
    const skinned = (): string[] => spy.mock.calls.map((c) => String((c[0] as unknown as { png: string }).png));
    a.update(1 / 60);
    expect(skinned().includes('scar.png')).toBe(false); // hidden at rest
    expect(skinned().length).toBe(6);
    spy.mockClear();
    a.setPose('hurt', { immediate: true }); // arm hidden, scar hidden
    spy.mockClear();
    a.update(1 / 60);
    expect(skinned().includes('arm.png')).toBe(false);
    expect(skinned().length).toBe(5);
    spy.mockClear();
    a.setPose('attack', { immediate: true }); // scar shown, arm back
    spy.mockClear();
    a.update(1 / 60);
    expect(skinned()).toEqual(expect.arrayContaining(['arm.png', 'scar.png']));
    expect(mesh(a, 'arm').visible).toBe(true);
  });

  it('a mid-move retarget keeps the state on the parts until the NEW move is half way', async () => {
    const a = await rigged(makeRigFileV2());
    a.setPose('attack');
    run(a, 0.1); // past half: scar shown
    expect(mesh(a, 'scar').visible).toBe(true);
    a.setPose('hurt'); // moving on before the attack settled
    run(a, 0.02);
    expect(mesh(a, 'scar').visible).toBe(true); // the attack's state stays until hurt is half way
    expect(mesh(a, 'arm').visible).toBe(true);
    run(a, 0.2);
    expect(mesh(a, 'scar').visible).toBe(false);
    expect(mesh(a, 'arm').visible).toBe(false);
    expect(a.figure.partState()[partIndex(a, 'head')]).toBe(1);
  });

  it('a hidden part stays hidden when the actor fades back in (alpha does not resurrect it)', async () => {
    const a = await rigged(makeRigFileV2());
    a.setAlpha(0);
    a.update(1 / 60);
    expect(mesh(a, 'head').visible).toBe(false);
    a.setAlpha(1);
    a.update(1 / 60);
    expect(mesh(a, 'head').visible).toBe(true);
    expect(mesh(a, 'scar').visible).toBe(false);
  });

  it('dispose frees every variant', async () => {
    const a = await rigged(makeRigFileV2());
    const spies = [...loaded.values()].map((t) => vi.spyOn(t, 'dispose'));
    a.dispose();
    expect(spies.every((s) => s.mock.calls.length >= 1)).toBe(true);
  });

  it('a v1 rig behaves as before: one look a part, all shown, the state never changes', async () => {
    const a = await rigged(makeRigFile());
    const rest = a.figure.partState();
    expect([...rest].every((s) => s === OWN)).toBe(true);
    a.setPose('attack');
    run(a, 0.5);
    expect([...a.figure.partState()]).toEqual([...rest]);
    expect(a.figure.plane.children.every((c) => c.visible)).toBe(true);
  });
});
