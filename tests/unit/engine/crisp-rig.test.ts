/**
 * The sharpness ladder's rig, driven without a GPU (release 39; both games, shared plumbing): which rung a frame is drawn on for each device
 * class and effects tier, what the rung switches (the supersampled scene pass, the sharpening, the MAX mix's AA pass, the scene scale the point
 * sprites read), how the frame-time governor takes it down when frames get slow, and the developer pins. Three's render targets and passes are plain
 * objects until a renderer draws them, so the real `SsaaRenderPass` and `CasPass` run here against a stub composer; the SMAA pass (it loads images
 * in its constructor) is stood in for by an object with its prototype.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Scene, type WebGLRenderer } from 'three';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import type { AaMode } from '../../../src/engine/ArtBudget.ts';
import { setArtTier, setGpuInfo } from '../../../src/engine/ArtDevice.ts';
import { crispLive } from '../../../src/engine/crisp/crispLive.ts';
import { CrispRig } from '../../../src/engine/crisp/CrispRig.ts';
import { FRAME_BUDGET_MS, HOLD_SCENE_MS } from '../../../src/engine/crisp/FrameGovernor.ts';
import { sceneScale, setSceneScale } from '../../../src/engine/crisp/sceneScale.ts';
import { eyeCandy } from '../../../src/engine/fx/EyeCandy.ts';

type DeviceClass = 'phone' | 'low' | 'mid' | 'high';

let clock = 0;

interface Rig {
  rig: CrispRig;
  scene: Scene;
  camera: PerspectiveCamera;
  renderPass: { enabled: boolean };
  msaaPass: { enabled: boolean };
  /** The MAX mix's pass before the grade, which the rig switches the moment a rung leaves it off. */
  mixAa: { enabled: boolean };
  aa: () => AaMode;
  setAaCalls: AaMode[];
}

/** One rig on a stub composer: a 2560x1440 buffer, the passes of the chain in order, the MAX mix's SMAA before the grade. */
function makeRig(cls: DeviceClass, search = '', opts: { w?: number; h?: number; maxTexture?: number; aa?: AaMode } = {}): Rig {
  setArtTier(cls);
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 16 / 9);
  const renderPass = { enabled: true };
  const msaaPass = { enabled: false };
  const bloom = { enabled: true, strength: 0.5, threshold: 0.9 };
  const tiltH = { enabled: true, uniforms: { focus: { value: 0.34 }, bandWidth: { value: 0.22 } } };
  const gradePass = { enabled: true };
  const mixAa = Object.assign(Object.create(SMAAPass.prototype) as object, { enabled: true });
  const passes = [renderPass, msaaPass, bloom, tiltH, mixAa, gradePass] as unknown as Pass[];
  const composer = {
    passes,
    insertPass(p: Pass, i: number) {
      passes.splice(i, 0, p);
    },
  } as unknown as EffectComposer;
  let aa: AaMode = opts.aa ?? 'off';
  const setAaCalls: AaMode[] = [];
  const gl = { capabilities: { maxTextureSize: opts.maxTexture ?? 16384 } } as unknown as WebGLRenderer;
  const rig = new CrispRig(
    gl,
    composer,
    {
      renderPass: renderPass as unknown as Pass,
      msaaPass: msaaPass as unknown as Pass,
      gradePass: gradePass as unknown as Pass,
      tiltH,
      aaMode: () => aa,
      setAa: (m) => {
        aa = m;
        setAaCalls.push(m);
      },
      ownSmaa: () => null,
    },
    camera,
    search,
  );
  rig.ssaa.setSize(opts.w ?? 2560, opts.h ?? 1440);
  return { rig, scene, camera, renderPass, msaaPass, mixAa: mixAa as unknown as { enabled: boolean }, aa: () => aa, setAaCalls };
}

/** Draw `n` frames, `dt` ms apart on the stubbed clock (the same scene throughout), and return the rungs seen after each. */
function frames(r: Rig, n: number, dt: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    clock += dt;
    r.rig.beforeRender(r.scene, r.camera);
    out.push(String(r.rig.report()['rung']));
  }
  return out;
}

/** Past the scene's warm-up, so the governor is reading frames. */
function warm(r: Rig): void {
  frames(r, 1, 16.7);
  clock += HOLD_SCENE_MS + 50;
  frames(r, 1, 16.7);
}

beforeEach(() => {
  clock = 100_000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  eyeCandy.setTier(null);
});

afterEach(() => {
  setArtTier(null);
  eyeCandy.setTier(null);
  setSceneScale(1);
  crispLive.rung = 'a2';
  crispLive.aaPre = true;
  vi.restoreAllMocks();
});

describe('the rung a device starts on', () => {
  it('draws a discrete GPU on F plus: a 2x scene pass, the sharpen, and no AA pass anywhere', () => {
    const r = makeRig('high');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('fplus');
    expect(r.rig.ssaa.enabled).toBe(true);
    expect(r.rig.ssaa.effective).toBe(2);
    expect(r.rig.cas.enabled).toBe(true);
    expect(r.renderPass.enabled).toBe(false); // the supersampled scene pass replaces the plain one
    expect(r.mixAa.enabled).toBe(false); // the MAX mix's SMAA, switched in the same frame
    expect(crispLive.aaPre).toBe(false); // and the mix is told, so it frees the pass's buffers
    expect(sceneScale()).toBe(2); // the point sprites read it
    expect(r.aa()).toBe('off'); // the renderer's own post-grade SMAA is off
  });

  it('draws an integrated GPU on F: 1.5x, a stronger sharpen, no AA pass', () => {
    const r = makeRig('mid');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('f');
    expect(r.rig.ssaa.effective).toBe(1.5);
    expect(r.rig.cas.enabled).toBe(true);
    expect(r.mixAa.enabled).toBe(false);
    expect(sceneScale()).toBe(1.5);
  });

  it('draws a software renderer on A2: the plain scene pass, the MAX mix\'s one SMAA, nothing else', () => {
    const r = makeRig('low');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('a2');
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.rig.cas.enabled).toBe(false);
    expect(r.renderPass.enabled).toBe(true);
    expect(r.mixAa.enabled).toBe(true);
    expect(crispLive.aaPre).toBe(true);
    expect(sceneScale()).toBe(1);
  });

  it('keeps the phone\'s frame as it was: the plain scene pass and its one AA pass, whatever the governor stands on', () => {
    const r = makeRig('phone');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('phone');
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.rig.cas.enabled).toBe(false);
    expect(r.renderPass.enabled).toBe(true);
    expect(r.mixAa.enabled).toBe(true);
    expect(r.aa()).toBe('off');
    warm(r);
    frames(r, 400, 80); // slow frames on a phone are not read: the rung is the device's
    expect(r.rig.report()['rung']).toBe('phone');
    expect(r.rig.report()['governor']).toMatchObject({ rung: 'a2' });
  });

  it('draws the phone effects tier and LOW EFFECTS on their own rungs on a strong GPU too', () => {
    const r = makeRig('high');
    eyeCandy.setTier('phone');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('phone');
    expect(r.rig.ssaa.enabled).toBe(false);
    eyeCandy.setTier('low');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('a2'); // LOW EFFECTS never supersamples
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.mixAa.enabled).toBe(true); // the MAX mix then decides by tier whether it builds an AA pass at all (`aaKind('low')` is none)
    eyeCandy.setTier(null);
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('fplus'); // and the governor never moved: those frames were not its to read
    expect(r.rig.ssaa.enabled).toBe(true);
  });
});

describe('a window that changes layout', () => {
  /** A device that reads as the phone layout while `narrow` is true (the portrait query), on a discrete GPU, with the class not forced. */
  const phoneLayout = (narrow: () => boolean): void => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: narrow() && q.includes('max-width: 599px') }));
    setGpuInfo('ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)');
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    setGpuInfo(null);
  });

  it("starts a desktop GPU opened in a narrow window on F plus once the window is widened, not on the phone's rung", () => {
    let narrow = true;
    phoneLayout(() => narrow);
    setArtTier(null);
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 16 / 9);
    const passes = [{ enabled: true }, { enabled: false }, { enabled: true }, { enabled: true, uniforms: { focus: { value: 0.34 }, bandWidth: { value: 0.22 } } }, { enabled: true }] as unknown as Pass[];
    const composer = { passes, insertPass: (p: Pass, i: number) => void passes.splice(i, 0, p) } as unknown as EffectComposer;
    const rig = new CrispRig(
      { capabilities: { maxTextureSize: 16384 } } as unknown as WebGLRenderer,
      composer,
      { renderPass: passes[0]!, msaaPass: passes[1]!, gradePass: passes[4]!, tiltH: passes[3] as unknown as { uniforms: Record<string, { value: unknown }> }, aaMode: () => 'off', setAa: () => undefined, ownSmaa: () => null },
      camera,
      '',
    );
    rig.ssaa.setSize(780, 1200);
    clock += 16.7;
    rig.beforeRender(scene, camera);
    expect(rig.report()['rung']).toBe('phone'); // the layout decides while it is narrow
    expect(rig.report()['governor']).toMatchObject({ rung: 'fplus' }); // but the governor started from the GPU
    narrow = false;
    rig.noteResize();
    clock += 16.7;
    rig.beforeRender(scene, camera);
    expect(rig.report()['rung']).toBe('fplus');
    expect(rig.ssaa.enabled).toBe(true);
  });
});

describe('the governor takes the rung down when frames are slow', () => {
  it('steps F plus to F and then to A2, switching the passes as it goes, and holds at A2', () => {
    const r = makeRig('high');
    warm(r);
    const slow = frames(r, 400, 40);
    const seen = [...new Set(slow)];
    expect(seen).toEqual(['fplus', 'f', 'a2']);
    expect(r.rig.report()['rung']).toBe('a2');
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.rig.cas.enabled).toBe(false);
    expect(r.renderPass.enabled).toBe(true);
    expect(r.mixAa.enabled).toBe(true); // the MAX mix's one SMAA is back
    expect(crispLive.aaPre).toBe(true);
    expect(sceneScale()).toBe(1);
    expect(frames(r, 400, 100)).toEqual(Array(400).fill('a2'));
  });

  it('has the supersample at 1.5x on the way down, between F plus and A2', () => {
    const r = makeRig('high');
    warm(r);
    let sawF = false;
    for (let i = 0; i < 200; i++) {
      frames(r, 1, 40);
      if (r.rig.report()['rung'] === 'f') {
        sawF = true;
        expect(r.rig.ssaa.effective).toBe(1.5);
        expect(r.rig.cas.enabled).toBe(true);
        expect(r.mixAa.enabled).toBe(false);
        break;
      }
    }
    expect(sawF).toBe(true);
  });

  it('leaves a device that holds its frame rate on F plus, 60 Hz or 144 Hz, for as long as it runs', () => {
    for (const dt of [1000 / 60, 1000 / 144]) {
      const r = makeRig('high');
      warm(r);
      expect(new Set(frames(r, 3000, dt))).toEqual(new Set(['fplus']));
    }
  });

  it('starts an integrated GPU on F and gives it one step, to A2', () => {
    const r = makeRig('mid');
    warm(r);
    expect([...new Set(frames(r, 400, 40))]).toEqual(['f', 'a2']);
  });

  it('does not read a new scene\'s first seconds (art decodes and shader compiles land there)', () => {
    const r = makeRig('high');
    warm(r);
    r.scene = new Scene(); // the next screen's scene
    const during = frames(r, Math.floor((HOLD_SCENE_MS - 200) / 300), 300); // 1.8 s of 300 ms frames
    expect(new Set(during)).toEqual(new Set(['fplus']));
    expect(new Set(frames(r, 600, 16.7))).toEqual(new Set(['fplus']));
  });

  it('starts a fresh window on a resize (the cost changed with the size)', () => {
    const r = makeRig('high');
    warm(r);
    frames(r, 40, 40);
    expect(r.rig.report()['governor']).toMatchObject({ pending: expect.any(Number) });
    r.rig.noteResize();
    expect((r.rig.report()['governor'] as { pending: number }).pending).toBe(0);
  });

  it('can be told frames are slower than they are (a capture\'s simulated slow frame), and told to stop', () => {
    const r = makeRig('high');
    warm(r);
    r.rig.simulate(FRAME_BUDGET_MS);
    expect(r.rig.report()['simulatedMs']).toBe(FRAME_BUDGET_MS);
    const rungs = [...new Set(frames(r, 400, 16.7))];
    expect(rungs).toEqual(['fplus', 'f', 'a2']);
    r.rig.simulate(null);
    expect(r.rig.report()['simulatedMs']).toBe(0);
  });
});

describe('a frame too big to supersample', () => {
  it('is drawn on A2 with its one AA pass, not with no anti-aliasing at all (an 8K window)', () => {
    const r = makeRig('high', '', { w: 7680, h: 4320 });
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('fplus>a2');
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.rig.cas.enabled).toBe(false);
    expect(r.mixAa.enabled).toBe(true);
    expect(crispLive.aaPre).toBe(true);
    expect(sceneScale()).toBe(1);
  });

  it('is drawn at the scale the GPU and the pixel budget leave, when that is enough (a 5K window)', () => {
    const r = makeRig('high', '', { w: 5120, h: 2880 });
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('fplus');
    expect(r.rig.ssaa.effective).toBeGreaterThan(1.5);
    expect(r.rig.ssaa.effective).toBeLessThan(2);
  });
});

describe('developer overrides pin the frame', () => {
  it('?crisp=a2 draws A2 on any device and the governor stands down', () => {
    const r = makeRig('high', '?crisp=a2');
    warm(r);
    expect(new Set(frames(r, 600, 80))).toEqual(new Set(['a2']));
    expect(r.rig.report()['pinned']).toBe(true);
    expect(r.rig.ssaa.enabled).toBe(false);
    expect(r.mixAa.enabled).toBe(true);
  });

  it('?crisp=fplus stays on F plus under slow frames', () => {
    const r = makeRig('mid', '?crisp=fplus');
    warm(r);
    expect(new Set(frames(r, 600, 80))).toEqual(new Set(['fplus']));
    expect(r.rig.ssaa.effective).toBe(2);
  });

  it('?crisp=a draws release 39 as first built: no supersample, the MAX mix\'s SMAA and the renderer\'s own after the grade', () => {
    const r = makeRig('high', '?crisp=a');
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('a');
    expect(r.aa()).toBe('smaa');
    expect(r.mixAa.enabled).toBe(true);
    expect(r.rig.ssaa.enabled).toBe(false);
  });

  it('?crisp=ref3 draws the 3x reference, held to what the pixel budget allows', () => {
    const r = makeRig('high', '?crisp=ref3');
    frames(r, 1, 16.7);
    expect(r.rig.ssaa.effective).toBe(3);
    const big = makeRig('high', '?crisp=ref3', { w: 3840, h: 2160 });
    frames(big, 1, 16.7);
    expect(big.rig.ssaa.effective).toBeCloseTo(Math.sqrt(36e6 / (3840 * 2160)), 5);
  });

  it('preset(), set() and unpin() move the frame at run time; unpin hands it back to the device', () => {
    const r = makeRig('high');
    frames(r, 1, 16.7);
    expect(r.rig.preset('a2')).toBe(true);
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('a2');
    expect(r.rig.preset('nope')).toBe(false);
    expect(r.rig.set({ ss: 1.5, cas: 0.2 })).toMatchObject({ ss: 1.5, cas: 0.2 });
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('custom');
    expect(r.rig.ssaa.effective).toBe(1.5);
    r.rig.unpin();
    frames(r, 1, 16.7);
    expect(r.rig.report()['rung']).toBe('fplus');
    expect(r.rig.report()['pinned']).toBe(false);
  });

  it('leaves the renderer\'s own AA where `?aa=` put it on every rung that does not name one', () => {
    const r = makeRig('high', '', { aa: 'smaa' });
    frames(r, 1, 16.7);
    expect(r.aa()).toBe('smaa');
    expect(r.setAaCalls).toEqual(['smaa']); // set once, not every frame
    frames(r, 20, 16.7);
    expect(r.setAaCalls).toEqual(['smaa']);
  });

  it('takes the governor\'s budget from `?crispbudget=`', () => {
    const r = makeRig('high', '?crispbudget=10');
    expect((r.rig.report()['governor'] as { budgetMs: number }).budgetMs).toBe(10);
  });
});
