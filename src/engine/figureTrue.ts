import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { setFigureBloomMask } from './BloomMask.ts';
import type { ScenePalette } from './Renderer.ts';

/**
 * Release 39 colour fidelity (r39-color, Bailey 2026-10-04: "colors look washed out like it's masking better character model detail" and
 * "the colors are vibrant but too vibrant"): a painted figure drawn true to its painting. Both games, shared plumbing; OFF by default, so with
 * no address override every frame is what it was. The maths and the parsing are pure; `applyFigureTrue` touches the renderer's two passes.
 *
 * Why it exists. The post chain ends in `GradeShader`, a raw `ShaderMaterial` with no `<colorspace_fragment>`, and the composer's targets are
 * linear, so the linear values the chain works in reach the canvas with no sRGB encode: `outputColorSpace = SRGBColorSpace` is never applied.
 * Every painting (the figures and the backdrops) is shown with its gamma applied twice. Measured on the figures (docs/handoff/r39-color.md):
 * mean lightness 11 to 20 L* too low and the chroma up by a third before any grade; the scene grade, the look, the bloom and the rim light
 * were then tuned against that, each one lifting or tinting what the missing encode had darkened.
 *
 * What it does. A painted figure writes 0 into the frame's alpha (the bloom mask, `BloomMask.ts`). Where this switch is on, the grade shows such a
 * pixel's own colour: no scene grade, shadow tint, saturation or look, and the sRGB encode the chain never applied. Backdrops and effects are
 * untouched. The amount mixes the two (0 = today, 1 = the painting's colour). It is a developer switch (`?figtrue=`, `__pyrefly.fx.figureTrue`)
 * until Bailey picks from the stills; the default below is the one line that changes then.
 *
 * The amount carries the quiet edge with it: a figure that shows its own colour is no bloom source (the figure bloom mask in full), gives back the
 * bloom's light in the grade (the pass adds it to every pixel, a veil that lifts the figure's blacks), and its rim light is cut (`rimQuiet`). Measured in
 * docs/handoff/r39-color.md.
 */
export const FIGURE_TRUE_DEFAULT = 0;

/** The share of the rim light a figure that shows its own colour gives up, at an amount of 1. */
export const FIGURE_TRUE_RIM_CUT = 0.55;

/** How much of a scene palette's figure bloom mask applies: all of it once figures are drawn true (their light is their own), the palette's own otherwise. */
export function bloomMaskFor(paletteMask: number, amount: number): number {
  return amount > 0 ? 1 : paletteMask;
}

/** The rim light's strength factor: 1 = as tuned (the default), less as figures are drawn true. */
export function rimQuiet(amount: number): number {
  return 1 - FIGURE_TRUE_RIM_CUT * Math.min(1, Math.max(0, amount));
}

/** What the renderer keeps of the switch (its grade pass, its bloom pass, the palette last applied). */
interface FigureTrueHost {
  gradePass: ShaderPass;
  bloomPass: UnrealBloomPass;
  palette: ScenePalette | null;
}

/** The amount in force. */
export function figureTrueOf(host: Pick<FigureTrueHost, 'gradePass'>): number {
  return host.gradePass.uniforms['figureTrue']!.value as number;
}

/** Set the amount: the grade's exemption, the bloom light it gives back and the figure bloom mask move together. */
export function applyFigureTrue(host: FigureTrueHost, amount: number): void {
  const v = Math.min(1, Math.max(0, amount));
  const u = host.gradePass.uniforms;
  u['figureTrue']!.value = v;
  u['bloomRemove']!.value = v > 0 ? 1 : 0;
  u['tBloom']!.value = host.bloomPass.renderTargetsHorizontal[0]!.texture; // the bloom's last composite target: what the pass adds to the frame
  setFigureBloomMask(host.bloomPass, bloomMaskFor(host.palette?.figureBloomMask ?? 0, v));
}

/** `?figtrue=<0..1>`: the amount for this page load; null when the address says nothing usable. */
export function parseFigureTrue(search: string): number | null {
  let raw: string | null;
  try {
    raw = new URLSearchParams(search).get('figtrue');
  } catch {
    return null;
  }
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
}

/** The sRGB encode (OETF), 0..1 to 0..1: the maths `GradeShader` applies to a figure pixel, here for the tests. */
export function srgbEncode(linear: number): number {
  const s = Math.min(1, Math.max(0, linear));
  return s <= 0.0031308 ? s * 12.92 : 1.055 * Math.pow(s, 1 / 2.4) - 0.055;
}

/** The matching decode (EOTF): what a texture marked sRGB hands the shader. */
export function srgbDecode(encoded: number): number {
  const s = Math.min(1, Math.max(0, encoded));
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
