/**
 * The room's haze (`GradeShader` `hazeColor` / `hazeAmount` / `hazeSide`, `ScenePalette.hazeColor` / `hazeAmount` / `hazeSide`): the one knob the experimental Leblanc
 * room's look added to the shared grade, and the proof that it changes nothing anywhere else (branch `exp-leblanc`; FFX-2 only for the room).
 *
 * "Nothing anywhere else" is held three ways: the shader's defaults are the neutral values and its haze block runs only when the amount is above zero; no palette but
 * the experimental room's names a haze, and applying any palette that does not take the haze off (so the next room never inherits it); and the browser proof
 * (`tools/exp-grade-proof.mjs`: the live grade pass run over a fixed picture on the committed build and on this one, the hashes equal for Chapter I, Bahamut and Chapter VI).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Vector2, type Vector3 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { describe, expect, it } from 'vitest';

import { Renderer, type ScenePalette } from '../../../src/engine/Renderer.ts';
import { ScenePalettes } from '../../../src/engine/ScenePalettes.ts';
import { GradeShader } from '../../../src/engine/shaders/GradeShader.ts';
import { SCENE_LOOKS_A } from '../../../src/engine/fx/a/sceneLooks.ts';

const ROOM = 'expMoonlitHall';
const read = (rel: string): string => readFileSync(fileURLToPath(new URL(`../../../${rel}`, import.meta.url)), 'utf8');

/** A renderer's palette side with a real grade pass and bloom pass and nothing that needs WebGL. */
function host() {
  const gradePass = new ShaderPass(GradeShader);
  const bloomPass = new UnrealBloomPass(new Vector2(64, 64), 0.5, 0.5, 0.9);
  return { gradePass, bloomPass, renderer: { toneMappingExposure: 1 }, applyPost: () => undefined, palette: null as ScenePalette | null };
}
const v3 = (u: { value: unknown }): number[] => {
  const v = u.value as Vector3;
  return [v.x, v.y, v.z];
};

describe('the haze is neutral until a room asks for it', () => {
  it('the shader\'s defaults are no haze', () => {
    expect(GradeShader.uniforms.hazeColor.value.toArray()).toEqual([0, 0, 0]);
    expect(GradeShader.uniforms.hazeAmount.value.toArray()).toEqual([0, 0, 0]);
    expect(GradeShader.uniforms.hazeSide.value).toBe(0);
  });

  it('the haze block runs only when the amount is above zero, and sits before the figure mix (a painted figure keeps its own colour over it)', () => {
    const src = GradeShader.fragmentShader;
    const guard = src.indexOf('if (hazeAmount.x + hazeAmount.y + hazeAmount.z > 0.0) {');
    expect(guard).toBeGreaterThan(0);
    const block = src.slice(guard, src.indexOf('}', src.indexOf('luma = dot', guard)) + 1);
    expect(block).toContain('hazeColor');
    expect(block).toContain('hazeSide');
    expect(src.indexOf('hazeColor', guard + block.length)).toBe(-1); // nothing outside the guard reads it
    expect(src.indexOf('hazeSide', guard + block.length)).toBe(-1);
    expect(guard).toBeLessThan(src.indexOf('c = mix(c, enc, figm);'));
  });

  it('no palette but the experimental room\'s names a haze', () => {
    for (const [name, palette] of Object.entries(ScenePalettes)) {
      const p = palette as ScenePalette;
      if (name === ROOM) continue;
      expect(p.hazeColor, `${name} hazeColor`).toBeUndefined();
      expect(p.hazeAmount, `${name} hazeAmount`).toBeUndefined();
      expect(p.hazeSide, `${name} hazeSide`).toBeUndefined();
    }
    const room = ScenePalettes[ROOM] as ScenePalette;
    expect(room.hazeColor).toBeDefined();
    expect(room.hazeAmount).toBeDefined();
  });

  it('only the experimental room\'s option A row is its own: Chapter VI\'s and every other row keep their values', () => {
    const others = Object.keys(SCENE_LOOKS_A).filter((k) => k !== 'exp-leblanc-last-room');
    expect(others.length).toBeGreaterThan(5);
    // the fixture is the rows as the committed build had them (tests/fixtures/exp-leblanc/other-looks.json)
    const fixture = JSON.parse(read('tests/fixtures/exp-leblanc/other-looks.json')) as { palettes: Record<string, unknown>; looks: Record<string, unknown> };
    for (const k of others) expect(SCENE_LOOKS_A[k], k).toEqual(fixture.looks[k]);
    for (const [name, palette] of Object.entries(ScenePalettes)) {
      if (name === ROOM) continue;
      expect(palette, name).toEqual(fixture.palettes[name]);
    }
    expect(Object.keys(fixture.looks).sort()).toEqual(others.sort());
    expect(Object.keys(fixture.palettes).sort()).toEqual(Object.keys(ScenePalettes).filter((n) => n !== ROOM).sort());
  });
});

describe('applying a palette sets the haze, and a palette without one takes it off', () => {
  const apply = (h: ReturnType<typeof host>, p: ScenePalette): void => (Renderer.prototype.applyPalette as (this: unknown, p: ScenePalette) => void).call(h, p);

  it('the room\'s palette puts its haze on the grade pass', () => {
    const h = host();
    apply(h, ScenePalettes[ROOM] as ScenePalette);
    const room = ScenePalettes[ROOM] as ScenePalette;
    expect(v3(h.gradePass.uniforms['hazeColor']!)).toEqual(room.hazeColor);
    expect(v3(h.gradePass.uniforms['hazeAmount']!)).toEqual(room.hazeAmount);
    expect(h.gradePass.uniforms['hazeSide']!.value).toBe(room.hazeSide ?? 0);
  });

  it('the next room\'s palette (Chapter VI\'s, with no haze) puts the grade pass back to none', () => {
    const h = host();
    apply(h, ScenePalettes[ROOM] as ScenePalette);
    apply(h, ScenePalettes.chateauLeblanc as ScenePalette);
    expect(v3(h.gradePass.uniforms['hazeColor']!)).toEqual([0, 0, 0]);
    expect(v3(h.gradePass.uniforms['hazeAmount']!)).toEqual([0, 0, 0]);
    expect(h.gradePass.uniforms['hazeSide']!.value).toBe(0);
  });

  it('every other palette leaves the haze at none, from a fresh pass and from the room\'s', () => {
    for (const [name, palette] of Object.entries(ScenePalettes)) {
      if (name === ROOM) continue;
      for (const afterRoom of [false, true]) {
        const h = host();
        if (afterRoom) apply(h, ScenePalettes[ROOM] as ScenePalette);
        apply(h, palette as ScenePalette);
        expect(v3(h.gradePass.uniforms['hazeAmount']!), `${name} after room ${afterRoom}`).toEqual([0, 0, 0]);
        expect(h.gradePass.uniforms['hazeSide']!.value, name).toBe(0);
      }
    }
  });
});
