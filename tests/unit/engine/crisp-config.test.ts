/**
 * The crispness options round (scratch branch `crisp-options`; both games, shared plumbing): the config's address parsing, its
 * merge rules and the shared scene-scale cell. Pure: no GPU, no browser.
 */
import { describe, expect, it } from 'vitest';
import { CRISP_PRESETS, DEFAULT_CRISP, mergeCrisp, parseCrisp } from '../../../src/engine/crisp/CrispConfig.ts';
import { onSceneScale, sceneLod, sceneScale, setSceneScale } from '../../../src/engine/crisp/sceneScale.ts';

describe('crisp config', () => {
  it('leaves release 39 as built when the address names nothing', () => {
    expect(parseCrisp('')).toEqual(DEFAULT_CRISP);
    expect(parseCrisp('?coach=off&aa=msaa')).toEqual(DEFAULT_CRISP); // `aa` is the renderer's own flag, read elsewhere
    expect(DEFAULT_CRISP.ss).toBe(1);
    expect(DEFAULT_CRISP.cas).toBe(0);
    expect(DEFAULT_CRISP.mips).toBe('gpu');
    expect(DEFAULT_CRISP.aaPre).toBe(true);
  });

  it('takes a named end state and lets single flags win over it', () => {
    const p = parseCrisp('?crisp=f1&cas=0.4&ss=2');
    expect(p.ss).toBe(2);
    expect(p.cas).toBe(0.4);
    expect(p.mips).toBe('lanczos');
    expect(p.aaPre).toBe(false);
    expect(p.aa).toBe('off');
  });

  it('clamps and ignores what is not a value', () => {
    const p = parseCrisp('?ss=9&cas=-1&ssf=sharpest&mips=lots&aniso=99&mipbias=3&casfloor=7&aapre=0');
    expect(p.ss).toBe(4);
    expect(p.cas).toBe(0);
    expect(p.ssFilter).toBe(DEFAULT_CRISP.ssFilter);
    expect(p.mips).toBe('gpu');
    expect(p.aniso).toBe(16);
    expect(p.mipBias).toBe(0);
    expect(p.casFloor).toBe(0.5);
    expect(p.aaPre).toBe(false);
    expect(parseCrisp('?crisp=nope')).toEqual(DEFAULT_CRISP);
  });

  it('merges a patch over a base without touching what it does not name', () => {
    const base = mergeCrisp(DEFAULT_CRISP, { ss: 1.5, cas: 0.2 });
    const next = mergeCrisp(base, { cas: 0 });
    expect(next.ss).toBe(1.5);
    expect(next.cas).toBe(0);
    expect(mergeCrisp(DEFAULT_CRISP, { ss: Number.NaN }).ss).toBe(1);
  });

  it('names every end state of the round, the ideal reference included', () => {
    for (const k of ['a', 'a2', 'b', 'c1', 'c2', 'd15', 'd2', 'e', 'f0', 'f1', 'f2', 'ref3']) expect(CRISP_PRESETS[k], k).toBeDefined();
    expect(CRISP_PRESETS['a']).toEqual({ aaPre: true, aa: 'smaa' }); // release 39 as built: two SMAA passes
    expect(CRISP_PRESETS['b']?.aa).toBe('msaa');
    expect(CRISP_PRESETS['ref3']?.ss).toBe(3);
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
