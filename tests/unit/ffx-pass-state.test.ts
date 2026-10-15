/**
 * **The game's own render state on a material** (`src/engine/ffx3d/passState.ts`, read from `extras.ffx.pass` by `unlitMaterial`; FFX only). What this file pins:
 *
 * 1. {@link passStateOf} reads the state three.js keeps in a glTF material's `userData` and is strict about its shape: anything else is "no state", never a guess.
 * 2. The state is put on the material the way the game draws it: an alpha-enabled variant is a **cut-out whose survivors are blended** (Evrae's see-through wing: `transparent` with the file's `alphaTest`
 *    kept, depth write on), an opaque variant is not, `CullMode` NONE is both sides, FRONT is `FrontSide` and BACK `BackSide` (swapped for a mirrored mesh).
 * 3. `unlitMaterial` uses it: a material whose file carries a state takes it; one that does not draws exactly as the file's glTF material said (the files converted before the state was written).
 * 4. `setOpacity` still returns a blended material to blended and an opaque one to opaque (the fade toggles `transparent` from what the material was made as).
 *
 * The files and numbers here are made up; nothing is read from a retail file.
 *
 * Game case: FFX only.
 */
import { AdditiveBlending, BackSide, DoubleSide, FrontSide, MeshBasicMaterial, MeshStandardMaterial, NormalBlending } from 'three';
import { describe, expect, it } from 'vitest';

import { applyPassState, isAdditive, isAlphaBlend, passStateOf, sideOf, type PassState } from '../../src/engine/ffx3d/passState.ts';
import { unlitMaterial } from '../../src/engine/ffx3d/models.ts';

const ALPHA_BLEND = { src: 'SRC_ALPHA', dst: 'INV_SRC_ALPHA', op: 'ADD' };
const rawPass = (over: Record<string, unknown> = {}): Record<string, unknown> => ({ type: 'Opaque', cull: 'FRONT', blend: null, depthTest: true, depthWrite: true, frontCounterClockwise: false, switches: {}, ...over });
const withPass = (pass: Record<string, unknown>): { ffx: { pass: Record<string, unknown> } } => ({ ffx: { pass } });

describe('reading the state', () => {
  it('reads a state from the userData three.js keeps (`{ ffx: { pass } }`), with or without a blend', () => {
    expect(passStateOf(withPass(rawPass({ type: 'Transparent', blend: ALPHA_BLEND })))).toEqual({ type: 'Transparent', cull: 'FRONT', blend: ALPHA_BLEND, depthTest: true, depthWrite: true });
    expect(passStateOf(withPass(rawPass({ cull: 'NONE' })))).toEqual({ type: 'Opaque', cull: 'NONE', blend: null, depthTest: true, depthWrite: true });
  });

  it('is null for anything that is not a state: no userData, no ffx, no pass, a wrong shape, an unknown cull', () => {
    for (const bad of [undefined, null, 3, 'x', [], {}, { ffx: null }, { ffx: {} }, { ffx: { pass: null } }, { ffx: { pass: 'FRONT' } }]) expect(passStateOf(bad), JSON.stringify(bad)).toBeNull();
    expect(passStateOf(withPass(rawPass({ cull: 'SIDEWAYS' })))).toBeNull();
    expect(passStateOf(withPass(rawPass({ type: 4 })))).toBeNull();
    expect(passStateOf(withPass(rawPass({ depthWrite: 1 })))).toBeNull();
    expect(passStateOf(withPass(rawPass({ depthTest: 'yes' })))).toBeNull();
    expect(passStateOf(withPass(rawPass({ blend: { src: 'SRC_ALPHA' } })))).toBeNull(); // a half blend is not a blend
    expect(passStateOf(withPass(rawPass({ blend: 'alpha' })))).toBeNull();
  });
});

describe('putting it on a material', () => {
  const state = (over: Partial<PassState> = {}): PassState => ({ type: 'Opaque', cull: 'FRONT', blend: null, depthTest: true, depthWrite: true, ...over });

  it('an alpha-enabled pass blends (transparent, normal blending) and keeps the cut-out threshold the file set', () => {
    const m = new MeshBasicMaterial({ alphaTest: 0.41 });
    applyPassState(m, state({ type: 'Transparent', blend: ALPHA_BLEND }));
    expect(m.transparent).toBe(true);
    expect(m.blending).toBe(NormalBlending);
    expect(m.alphaTest).toBe(0.41); // the survivors of the cut-out are the ones blended
    expect(m.depthWrite).toBe(true); // the game writes depth for the membrane too
    expect(m.depthTest).toBe(true);
  });

  it('an opaque pass is not blended even if the glTF material was', () => {
    const m = new MeshBasicMaterial({ transparent: true, depthWrite: false });
    applyPassState(m, state());
    expect(m.transparent).toBe(false);
    expect(m.depthWrite).toBe(true);
  });

  it('maps the cull state to a side: NONE both, FRONT the front, BACK the back; a mirrored mesh swaps the last two', () => {
    expect(sideOf('NONE')).toBe(DoubleSide);
    expect(sideOf('NONE', true)).toBe(DoubleSide);
    expect(sideOf('FRONT')).toBe(FrontSide);
    expect(sideOf('BACK')).toBe(BackSide);
    expect(sideOf('FRONT', true)).toBe(BackSide);
    expect(sideOf('BACK', true)).toBe(FrontSide);
    const m = new MeshBasicMaterial({ side: DoubleSide });
    applyPassState(m, state({ cull: 'FRONT' }));
    expect(m.side).toBe(FrontSide);
    applyPassState(m, state({ cull: 'FRONT' }), { mirrored: true });
    expect(m.side).toBe(BackSide);
  });

  it('adds when the pass adds (one, one, add), and says what each blend is', () => {
    const add = { src: 'ONE', dst: 'ONE', op: 'ADD' };
    const m = new MeshBasicMaterial();
    applyPassState(m, state({ blend: add }));
    expect(m.blending).toBe(AdditiveBlending);
    expect(m.transparent).toBe(true);
    expect(isAdditive(add)).toBe(true);
    expect(isAdditive(ALPHA_BLEND)).toBe(false);
    expect(isAlphaBlend(ALPHA_BLEND)).toBe(true);
    expect(isAlphaBlend(null)).toBe(false);
    expect(isAlphaBlend({ src: 'SRC_ALPHA', dst: 'ONE', op: 'ADD' })).toBe(false);
  });

  it('a null state changes nothing', () => {
    const m = new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false, alphaTest: 0.3 });
    applyPassState(m, null);
    expect([m.side, m.transparent, m.depthWrite, m.alphaTest]).toEqual([DoubleSide, true, false, 0.3]);
  });
});

describe('the unlit material takes the state the file carries', () => {
  /** The loader's material for a cut-out the converter wrote as MASK and double sided (what `GLTFLoader` makes of it), with the file's extras in userData. */
  const maskSource = (extras: Record<string, unknown> | null): MeshStandardMaterial => {
    const src = new MeshStandardMaterial({ alphaTest: 0.41, side: DoubleSide });
    if (extras) src.userData = extras;
    return src;
  };

  it('Evrae\'s wing: a mask the game blends. Transparent, single sided, the file\'s threshold kept, depth written, and kept for the fade', () => {
    const out = unlitMaterial(maskSource(withPass(rawPass({ type: 'Transparent', blend: ALPHA_BLEND }))));
    expect(out.transparent).toBe(true);
    expect(out.alphaTest).toBe(0.41);
    expect(out.side).toBe(FrontSide);
    expect(out.depthWrite).toBe(true);
    expect(out.userData['baseTransparent']).toBe(true);
    expect(out.userData['ffxPass']).toEqual({ type: 'Transparent', cull: 'FRONT', blend: ALPHA_BLEND, depthTest: true, depthWrite: true });
  });

  it('a cut-out on an opaque variant stays a plain cut-out, but single sided as the game draws it (hair, cloth)', () => {
    const out = unlitMaterial(maskSource(withPass(rawPass())));
    expect(out.transparent).toBe(false);
    expect(out.alphaTest).toBe(0.41);
    expect(out.side).toBe(FrontSide);
    expect(out.userData['baseTransparent']).toBe(false);
  });

  it('a variant that says NONE is double sided (the stage\'s DOUBLE_SIDED switch)', () => {
    expect(unlitMaterial(maskSource(withPass(rawPass({ cull: 'NONE' })))).side).toBe(DoubleSide);
  });

  it('a file converted before the state was written draws as its glTF material said: double sided, its own blending, no state kept', () => {
    const out = unlitMaterial(maskSource(null));
    expect(out.side).toBe(DoubleSide);
    expect(out.transparent).toBe(false);
    expect(out.alphaTest).toBe(0.41);
    expect(out.userData['ffxPass']).toBeNull();
    const blended = new MeshStandardMaterial({ transparent: true, depthWrite: false });
    const kept = unlitMaterial(blended);
    expect(kept.transparent).toBe(true);
    expect(kept.depthWrite).toBe(false);
  });
});
