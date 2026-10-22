/**
 * Demo looks, light on the paintings: the RIGGED figures (release 61; both games: Chapter I's Seymour Flux is FFX, Chapter IV's Bahamut is FFX-2; the shader and this file are shared plumbing).
 *
 * A painted figure is lit by binding its material to the normal map of the painting it draws (`FigureRelight.bindRelight`). A rig draws no painting, only PARTS cut from paintings, so the rig file carries a
 * normal piece for every part and variant (`RigPart.normal`, format v2.2: the same window of the painting's normal map as the colour PNG, `tools/rig/rig_normals.py`). This file is the look's side of it:
 *
 *   - {@link rigRelightWanted}: should a rig load its normal pieces now? Only while a look with a relight is armed (`RELIGHT[name]` is not null: anime stays flat). A page with no look asks for no piece,
 *     downloads nothing and compiles the shader exactly as before.
 *   - {@link relightUniforms}: the shared light cells (`relightCells`, the same objects every painted figure references, so the key, the rim and the point lights are ONE set of numbers for the painted party and
 *     the rigged boss) plus the part's own `relightNormal` and `relightOn` for a part material.
 *   - {@link setPartNormal}: bind the piece of the look a part shows now (null: that look has none, the part is not lit while it is shown).
 *
 * The lighting model is the painted shader's block (`PaintedShader.ts`, `PAINTED_RELIGHT`), unchanged: the rig's vertex shader provides the same varyings (`RELIGHT_VARYINGS`, `RELIGHT_VERTEX`) from the plane the
 * parts hang under (the plane group copies the idle plane's place, scale and mirror, so the plane's axes in view space are the parts').
 */
import type { ShaderMaterial, Texture } from 'three';
import { lookState } from '../LookState.ts';
import { RELIGHT } from './RelightConfig.ts';
import { flatNormal, relightCells, relightStats } from './FigureRelight.ts';

/** Should a rig load its normal pieces now: a look is armed, named, and has a relight. */
export function rigRelightWanted(): boolean {
  if (!lookState.armed || lookState.name === null) return false;
  return RELIGHT[lookState.name] !== null;
}

/** The uniforms a part material of a lit rig carries: the shared light cells, and its own normal piece (flat, off) until {@link setPartNormal} binds one. */
export function relightUniforms(): Record<string, { value: unknown }> {
  relightStats.bound++;
  return { ...relightCells, relightNormal: { value: flatNormal() }, relightOn: { value: 0 } };
}

/** The `defines` of a lit part material: the painted shader compiles its relight block. */
export const RELIGHT_DEFINES: Readonly<Record<string, string>> = Object.freeze({ PAINTED_RELIGHT: '' });

/** Bind (or, with null, unbind) the normal piece of the look a part shows. A material that was not built lit (no define) is left alone. */
export function setPartNormal(m: ShaderMaterial, tex: Texture | null): void {
  if (m.defines?.['PAINTED_RELIGHT'] === undefined) return;
  m.uniforms['relightNormal']!.value = tex ?? flatNormal();
  m.uniforms['relightOn']!.value = tex ? 1 : 0;
}
