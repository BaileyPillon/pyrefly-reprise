/**
 * The sharpness ladder (release 39, Bailey's pick "F plus" of 2026-10-04; both games, shared plumbing): the rungs, which rung a device
 * starts on and which one a frame is drawn on, the developer overrides read from the address, the supersample sizing and the shared
 * scene-scale cell. Pure: no GPU, no browser.
 */
import { describe, expect, it } from 'vitest';
import { budgetFor } from '../../../src/engine/ArtBudget.ts';
import {
  CRISP_PRESETS,
  LADDER,
  RUNGS,
  mergeCrisp,
  parseCrisp,
  rungFor,
  startRung,
  stepDownFrom,
  type CrispConfig,
} from '../../../src/engine/crisp/CrispConfig.ts';
import { onSceneScale, sceneLod, sceneScale, setSceneScale } from '../../../src/engine/crisp/sceneScale.ts';
import { MAX_SUPERSAMPLED_PIXELS, MIN_USEFUL_SCALE, supersampleScale, usableSupersample } from '../../../src/engine/crisp/supersample.ts';
import { aaKind } from '../../../src/engine/fx/mix/gates.ts';

describe('the rungs', () => {
  it('F plus is a 2x supersample with a 0.3 sharpen and no pre-grade AA pass', () => {
    expect(RUNGS.fplus).toMatchObject({ ss: 2, cas: 0.3, aaPre: false });
  });

  it('F is a 1.5x supersample with a 0.4 sharpen and no pre-grade AA pass', () => {
    expect(RUNGS.f).toMatchObject({ ss: 1.5, cas: 0.4, aaPre: false });
  });

  it('A2 and the phone draw today\'s frame: no supersample, no sharpen, the MAX mix\'s one AA pass', () => {
    for (const r of [RUNGS.a2, RUNGS.phone]) expect(r).toMatchObject({ ss: 1, cas: 0, aaPre: true, aa: null });
  });

  it('no rung switches the renderer\'s own post-grade SMAA on: the double SMAA of the first cut of release 39 is gone', () => {
    for (const r of Object.values(RUNGS)) expect(r.aa === null || r.aa === 'off').toBe(true);
    for (const cls of ['phone', 'low', 'mid', 'high'] as const) expect(budgetFor(cls).aa).toBe('off');
  });

  it('is a ladder from best to worst, F plus, F, A2, and only the ladder is governed', () => {
    expect(LADDER).toEqual(['fplus', 'f', 'a2']);
    expect(stepDownFrom('fplus')).toBe('f');
    expect(stepDownFrom('f')).toBe('a2');
    expect(stepDownFrom('a2')).toBeNull();
  });
});

describe('which rung', () => {
  it('starts a discrete GPU on F plus, an integrated or unknown one on F, a software renderer on A2', () => {
    expect(startRung('high')).toBe('fplus');
    expect(startRung('mid')).toBe('f');
    expect(startRung('low')).toBe('a2');
    expect(startRung('phone')).toBe('a2'); // never read: the phone draws on its own rung
  });

  it('keeps today\'s frame on the phone layout and the phone effects tier, whatever the governor says', () => {
    expect(rungFor('phone', 'phone', 'fplus')).toBe('phone');
    expect(rungFor('phone', 'full', 'fplus')).toBe('phone'); // the upright phone layout
    expect(rungFor('high', 'phone', 'fplus')).toBe('phone'); // a desktop window squeezed under 600 px: the effects tier is the phone's
  });

  it('never supersamples a software renderer or LOW EFFECTS', () => {
    expect(rungFor('low', 'full', 'fplus')).toBe('a2');
    expect(rungFor('high', 'low', 'fplus')).toBe('a2');
    expect(rungFor('mid', 'low', 'f')).toBe('a2');
  });

  it('otherwise draws on the rung the governor stands on', () => {
    expect(rungFor('high', 'full', 'fplus')).toBe('fplus');
    expect(rungFor('high', 'full', 'f')).toBe('f');
    expect(rungFor('high', 'full', 'a2')).toBe('a2');
    expect(rungFor('mid', 'full', 'f')).toBe('f');
  });
});

describe('the MAX mix\'s AA pass follows the rung', () => {
  it('is off whenever the scene is supersampled, on every tier', () => {
    for (const tier of ['full', 'phone', 'low'] as const) expect(aaKind(tier, false)).toBeNull();
  });

  it('is exactly one pass per tier otherwise: SMAA, the phone\'s FXAA, none under LOW EFFECTS', () => {
    expect([aaKind('full', true), aaKind('phone', true), aaKind('low', true)]).toEqual(['smaa', 'fxaa', null]);
    expect(aaKind('full')).toBe('smaa');
  });
});

describe('developer overrides', () => {
  it('say nothing about the frame unless the address names an end state or a lever', () => {
    expect(parseCrisp('')).toBeNull();
    expect(parseCrisp('?coach=off&aa=msaa')).toBeNull(); // `aa` is the renderer's own flag, read elsewhere
    expect(parseCrisp('?crisp=nope')).toBeNull();
  });

  it('pin a named end state, by either of its names', () => {
    expect(parseCrisp('?crisp=a2')?.cfg).toMatchObject({ ss: 1, cas: 0, aaPre: true, aa: 'off' });
    expect(parseCrisp('?crisp=g2')?.cfg).toEqual(parseCrisp('?crisp=fplus')?.cfg);
    expect(parseCrisp('?crisp=g1')?.cfg).toEqual(parseCrisp('?crisp=f')?.cfg);
    expect(parseCrisp('?crisp=A2')?.name).toBe('a2');
    expect(CRISP_PRESETS['a']).toMatchObject({ aaPre: true, aa: 'smaa', ss: 1 }); // release 39 as first built: two SMAA passes
    expect(CRISP_PRESETS['ref3']?.ss).toBe(3);
  });

  it('let a single flag win over the named state, or stand alone over A2', () => {
    const p = parseCrisp('?crisp=f&cas=0.2&ss=2');
    expect(p?.cfg).toMatchObject({ ss: 2, cas: 0.2, aaPre: false });
    const alone = parseCrisp('?ss=3');
    expect(alone?.name).toBeNull();
    expect(alone?.cfg).toMatchObject({ ss: 3, cas: 0, aaPre: true });
    expect(parseCrisp('?crisp=fplus&aapre=1')?.cfg.aaPre).toBe(true);
  });

  it('clamp and ignore what is not a value', () => {
    const p = parseCrisp('?ss=9&cas=-1&aapre=0');
    expect(p?.cfg).toMatchObject({ ss: 4, cas: 0, aaPre: false });
    expect(parseCrisp('?ss=lots')).toBeNull();
  });

  it('merge a patch without touching what it does not name', () => {
    const base = mergeCrisp({ ...RUNGS.a2 }, { ss: 1.5, cas: 0.2 });
    const next = mergeCrisp(base, { cas: 0 });
    expect(next.ss).toBe(1.5);
    expect(next.cas).toBe(0);
    expect(mergeCrisp({ ...RUNGS.a2 }, { ss: Number.NaN }).ss).toBe(1);
    const patch = { aa: 'bogus' } as unknown as Partial<CrispConfig>;
    expect(mergeCrisp({ ...RUNGS.a2 }, patch).aa).toBeNull();
  });
});

describe('the supersampled target', () => {
  it('is the scale asked for when the GPU and the pixel budget allow it', () => {
    expect(supersampleScale(2, 2560, 1440, 16384)).toBe(2);
    expect(supersampleScale(1.5, 1600, 900, 16384)).toBe(1.5);
  });

  it('holds a 4K frame at 2x inside its 36 megapixels', () => {
    expect(3840 * 2 * 2160 * 2).toBeLessThan(MAX_SUPERSAMPLED_PIXELS);
    expect(supersampleScale(2, 3840, 2160, 16384)).toBe(2);
  });

  it('comes down on a frame whose supersample would not fit, never below 1', () => {
    const s = supersampleScale(2, 5120, 2880, 16384); // a 5K buffer: 2x would be 59 megapixels
    expect(s).toBeLessThan(2);
    expect(s).toBeGreaterThan(1);
    expect(5120 * s * 2880 * s).toBeLessThanOrEqual(MAX_SUPERSAMPLED_PIXELS * 1.001);
    expect(supersampleScale(2, 7680, 4320, 16384)).toBeLessThan(1.05); // 8K: next to nothing to give
  });

  it('is not drawn at all when what is left is too little to be worth it (the A2 rung stands in)', () => {
    expect(usableSupersample(2, 7680, 4320, 16384)).toBe(1);
    expect(usableSupersample(2, 2560, 1440, 16384)).toBe(2);
    const s = usableSupersample(2, 5120, 2880, 16384);
    expect(s).toBeGreaterThanOrEqual(MIN_USEFUL_SCALE); // 5K still gets about 1.56x
    expect(usableSupersample(1.5, 1280, 720, 1024)).toBe(1); // a GPU whose largest texture is the buffer's own width
  });

  it('is held to the GPU\'s largest texture', () => {
    expect(supersampleScale(2, 4096, 2304, 4096)).toBe(1);
    expect(supersampleScale(2, 1280, 720, 2048)).toBeCloseTo(1.6, 5);
    expect(supersampleScale(Number.NaN, 1280, 720, 8192)).toBe(1);
  });
});

describe('scene scale', () => {
  it('is 1 until a supersampled scene sets it, tells listeners once per change, and gives the lod the backdrop adds back', () => {
    expect(sceneScale()).toBe(1);
    expect(sceneLod()).toBe(0);
    let calls = 0;
    const off = onSceneScale(() => calls++);
    setSceneScale(2);
    setSceneScale(2);
    expect(calls).toBe(1);
    expect(sceneScale()).toBe(2);
    expect(sceneLod()).toBe(1);
    setSceneScale(0.3); // below 1 is not a scale
    expect(sceneScale()).toBe(1);
    expect(calls).toBe(2);
    off();
    setSceneScale(1.5);
    expect(calls).toBe(2);
    setSceneScale(1);
  });
});
