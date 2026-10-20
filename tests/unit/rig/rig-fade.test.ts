/**
 * DEMO MOTION, part 2 (`?motion=demo`; decision 153a; format v2.1 `RigKey.fadeMs`; both games, shared plumbing): a rig key that swaps a part to another image, or shows or hides a part,
 * cross-fades over the key's `fadeMs` (default 110 ms) instead of flipping at 0.5 of the move.
 *
 * The pure half (`rig/RigFade.ts`): the length a key asks for, where a fade starts, the pair of opacities. The engine half through the real `RigActor` on the v2 fixture, with stand-in textures:
 * a ghost mesh keeps the old image while the new one comes up; the clock is the real one (a hit-stop that holds the field does not freeze it); a cut (`fadeMs: 0`) and a build without the switch
 * flip exactly as v2.0 did and never make a ghost; a part shown from hidden fades in, a part hidden fades out; the reader refuses a bad `fadeMs`.
 */
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RigFile } from '../../../src/data/art/rigTypes.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';
import { DEFAULT_FADE_MS, FADE_MS_MAX, fadeCover, fadeMsOf, fadePair, fadeStart } from '../../../src/engine/rig/RigFade.ts';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type Mesh = import('three').Mesh;
type Mat = import('three').ShaderMaterial;

afterEach(() => setDemoMotion(null));

describe('the pure half', () => {
  it('a key\'s fade is its fadeMs, else 110; 0 is a cut; nothing past 400 is believed; junk is a cut', () => {
    expect(fadeMsOf(undefined)).toBe(DEFAULT_FADE_MS);
    expect(fadeMsOf({})).toBe(110);
    expect(fadeMsOf({ fadeMs: 60 })).toBe(60);
    expect(fadeMsOf({ fadeMs: 0 })).toBe(0);
    expect(fadeMsOf({ fadeMs: 5000 })).toBe(FADE_MS_MAX);
    expect(fadeMsOf({ fadeMs: Number.NaN })).toBe(0);
    expect(fadeMsOf({ fadeMs: -3 })).toBe(0);
  });

  it('the fade is centred on 0.5 of the move and never starts before 0.05 of it', () => {
    expect(fadeStart(140, 110)).toBeCloseTo(0.5 - 110 / 280, 9);
    expect(fadeStart(300, 110)).toBeCloseTo(0.5 - 110 / 600, 9);
    expect(fadeStart(120, 400)).toBe(0.05);
    expect(fadeStart(0, 110)).toBe(0.5);
    expect(fadeStart(140, 0)).toBe(0.5);
  });

  it('the new look comes up over the first 70 percent and the old one goes out over the last 70, and together they cover at least 0.96 all the way', () => {
    expect(fadePair(0)).toEqual({ inn: 0, out: 1 });
    expect(fadePair(1)).toEqual({ inn: 1, out: 0 });
    let pi = 0;
    let po = 1;
    let worst = 1;
    for (let i = 1; i <= 1000; i++) {
      const u = i / 1000;
      const p = fadePair(u);
      expect(p.inn).toBeGreaterThanOrEqual(pi - 1e-12);
      expect(p.out).toBeLessThanOrEqual(po + 1e-12);
      pi = p.inn;
      po = p.out;
      worst = Math.min(worst, fadeCover(u));
    }
    expect(worst).toBeGreaterThanOrEqual(0.96);
    expect(fadePair(0.7).inn).toBe(1);
    expect(fadePair(0.3).out).toBe(1);
  });
});

describe('the reader', () => {
  const withFade = (fadeMs: unknown): RigFile => {
    const f = makeRigFileV2();
    return { ...f, keys: { ...f.keys, attack: { ...f.keys['attack']!, fadeMs: fadeMs as number } } };
  };
  it('takes 0 and a number up to 2000 and refuses a negative, a non-number and one past 2000', () => {
    for (const ok of [0, 1, 110, 400, 2000]) expect(readRig(withFade(ok)).ok, String(ok)).toBe(true);
    for (const bad of [-1, 2001, Number.NaN, 'soon', null]) {
      const r = readRig(withFade(bad));
      expect(r.ok, String(bad)).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/fadeMs/);
    }
  });
  it('a file without the field reads as it always did', () => {
    const r = readRig(makeRigFileV2());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.keys.get('attack')!.fadeMs).toBeUndefined();
  });
});

// ------------------------------------------------------------------ the engine

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });
const loaded = new Map<string, Texture>();

async function rigged(file: RigFile): Promise<RigActorT> {
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

/** The fixture with the attack key asking for `fadeMs` (undefined: the default). */
function file(fadeMs?: number): RigFile {
  const f = makeRigFileV2();
  return fadeMs === undefined ? f : { ...f, keys: { ...f.keys, attack: { ...f.keys['attack']!, fadeMs }, hurt: { ...f.keys['hurt']!, fadeMs } } };
}

const run = (a: RigActorT, seconds: number, dt = 1 / 60, realDt = dt): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) a.update(dt, realDt);
};
const parts = (a: RigActorT): Mesh[] => a.figure.plane.children as Mesh[];
const mesh = (a: RigActorT, n: string): Mesh => parts(a).find((c) => c.name === n)!;
const ghost = (a: RigActorT, n: string): Mesh | undefined => parts(a).find((c) => c.name === `${n}~ghost`);
const mat = (m: Mesh): Mat => m.material as Mat;
const mapOf = (m: Mesh): Texture => mat(m).uniforms['map']!.value as Texture;
const opac = (m: Mesh): number => mat(m).uniforms['opacity']!.value as number;
const ghosts = (a: RigActorT): Mesh[] => parts(a).filter((c) => c.name.endsWith('~ghost'));

describe('RigActor with the switch on', () => {
  it('a variant swap cross-fades: the new image comes up on the part, the old one stays on a ghost and goes out, and nothing is left over once it is done', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack'); // 140 ms; the fade (100 ms) starts at 0.5 - 100 / 280 = 0.14 of the move, 20 ms in
    run(a, 0.01);
    expect(ghosts(a).length).toBe(0); // not yet
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.png'));
    run(a, 0.03); // 40 ms in: 20 ms into the fade
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.back.png'));
    const g = ghost(a, 'head')!;
    expect(g).toBeDefined();
    expect(g.visible).toBe(true);
    expect(mapOf(g)).toBe(loaded.get('head.png'));
    expect(opac(g)).toBeGreaterThan(0.9); // the old look stays whole for the first 30 percent
    expect(opac(mesh(a, 'head'))).toBeLessThan(0.55);
    expect(a.figure.fading).toBe(true);
    run(a, 0.04); // well into the fade: the new look is up, the old one going out under it
    expect(opac(mesh(a, 'head'))).toBeGreaterThan(0.85);
    expect(opac(g)).toBeGreaterThan(0);
    expect(opac(g)).toBeLessThan(0.7);
    expect(g.position.z).toBeLessThan(mesh(a, 'head').position.z); // drawn under it
    run(a, 0.1);
    expect(a.figure.fading).toBe(false);
    expect(g.visible).toBe(false);
    expect(opac(mesh(a, 'head'))).toBe(1);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.back.png'));
  });

  it('the pair covers the part the whole way: at no frame do the two opacities leave less than 0.96 of it', async () => {
    setDemoMotion(true);
    const a = await rigged(file(110));
    a.setPose('attack');
    let worst = 1;
    for (let i = 0; i < 40; i++) {
      a.update(1 / 60);
      const g = ghost(a, 'head');
      const inn = opac(mesh(a, 'head'));
      const out = g && g.visible ? opac(g) : 0;
      if (a.figure.fading) worst = Math.min(worst, 1 - (1 - inn) * (1 - out));
    }
    expect(worst).toBeGreaterThanOrEqual(0.96 - 1e-6);
  });

  it('the fade runs on the real clock: a hit-stop that holds the field (dt 0) does not freeze it, and the bones do not move meanwhile', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack');
    run(a, 0.04);
    const key = a.rigInfo().key;
    const before = opac(mesh(a, 'head'));
    for (let i = 0; i < 6; i++) a.update(0, 1 / 60); // a 100 ms freeze: the field holds, real time goes on
    expect(opac(mesh(a, 'head'))).toBeGreaterThan(before);
    expect(a.blending).toBe(true); // the move itself waited for the field clock
    expect(a.rigInfo().key).toBe(key);
    for (let i = 0; i < 12; i++) a.update(0, 1 / 60);
    expect(a.figure.fading).toBe(false);
  });

  it('a part a key brings in from hidden fades IN (no ghost: there was no old look), a part a key hides fades OUT on a ghost', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack'); // scar shown (was hidden)
    run(a, 0.04);
    expect(mesh(a, 'scar').visible).toBe(true);
    expect(opac(mesh(a, 'scar'))).toBeLessThan(0.5);
    expect(ghost(a, 'scar')).toBeUndefined();
    run(a, 0.2);
    expect(opac(mesh(a, 'scar'))).toBe(1);
    a.setPose('hurt'); // arm hidden (was shown), scar hidden, head to wide
    run(a, 0.04);
    expect(mesh(a, 'arm').visible).toBe(false);
    const g = ghost(a, 'arm')!;
    expect(g.visible).toBe(true);
    expect(mapOf(g)).toBe(loaded.get('arm.png'));
    expect(opac(g)).toBeGreaterThan(0);
    run(a, 0.3);
    expect(g.visible).toBe(false);
    expect(mesh(a, 'arm').visible).toBe(false);
    expect(ghost(a, 'scar')!.visible).toBe(false);
    expect(a.figure.fading).toBe(false);
  });

  it('a key with fadeMs 0 is a cut: it flips at half way, as v2.0, and makes no ghost', async () => {
    setDemoMotion(true);
    const a = await rigged(file(0));
    a.setPose('attack');
    run(a, 0.04);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.png'));
    run(a, 0.05); // 90 ms of 140: past half
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.back.png'));
    expect(opac(mesh(a, 'head'))).toBe(1);
    expect(ghosts(a).length).toBe(0);
    expect(a.figure.fading).toBe(false);
  });

  it('a key that says nothing fades over the default 110 ms', async () => {
    setDemoMotion(true);
    const a = await rigged(file());
    a.setPose('attack');
    run(a, 0.04);
    expect(a.figure.fading).toBe(true);
    run(a, 0.2);
    expect(a.figure.fading).toBe(false);
  });

  it('a snap (an immediate pose) is a flip, not a fade', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack', { immediate: true });
    a.update(1 / 60);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.back.png'));
    expect(a.figure.fading).toBe(false);
    expect(ghosts(a).length).toBe(0);
  });

  it('a second change in the middle of a fade carries on from the look that is stronger, never a third image on screen', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack');
    run(a, 0.05); // head: back coming in over head.png going out
    a.setPose('hurt'); // head: wide
    run(a, 0.06);
    const visible = [mesh(a, 'head'), ghost(a, 'head')].filter((m): m is Mesh => m !== undefined && m.visible);
    expect(visible.length).toBeLessThanOrEqual(2);
    run(a, 0.4);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.wide.png'));
    expect(a.figure.fading).toBe(false);
    expect(ghost(a, 'head')!.visible).toBe(false);
  });

  it('a ghost goes with the actor\'s alpha, and is freed with the figure', async () => {
    setDemoMotion(true);
    const a = await rigged(file(100));
    a.setPose('attack');
    run(a, 0.04);
    const g = ghost(a, 'head')!;
    a.setAlpha(0.5);
    a.update(1 / 60);
    expect(opac(g)).toBeLessThanOrEqual(0.5 + 1e-9);
    const dispose = vi.spyOn(mat(g), 'dispose');
    a.dispose();
    expect(dispose).toHaveBeenCalled();
  });
});

describe('RigActor without the switch', () => {
  it('flips at half way exactly as v2.0 whatever the key says, and never makes a ghost', async () => {
    setDemoMotion(false);
    const a = await rigged(file(100));
    a.setPose('attack');
    run(a, 0.04);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.png'));
    run(a, 0.05);
    expect(mapOf(mesh(a, 'head'))).toBe(loaded.get('head.back.png'));
    for (let i = 0; i < 30; i++) {
      a.update(1 / 60);
      expect(opac(mesh(a, 'head'))).toBe(1);
    }
    expect(ghosts(a).length).toBe(0);
    expect(a.figure.fading).toBe(false);
  });
});
