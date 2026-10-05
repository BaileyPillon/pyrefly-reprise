/**
 * The MAX mix (D-316), SMOOTH EDGES' defringe (CINEMA LIGHT; both games), ported from option C's
 * prototype (`fx/max/c/relight.ts`), the defringe alone: no relighting from normals (not in the mix).
 * Injected into the painted figure's own fragment shader (`shaders/PaintedShader.ts`) by
 * `onBeforeCompile`, so the shader file and `PaintedActor` (over 400 lines, rule 7) do not grow.
 *
 * - the alpha edge is tightened by about a screen pixel's worth (VP-1001-18): the pale matte residue
 *   round a cut-out (Vegnagun's halo) goes;
 * - the semi-transparent edge texels are darkened a little, so what is left of a light matte reads as
 *   the figure's own edge, not a sticker outline.
 * The rim's screen-pixel width (VP-1001-17) is already CINEMA LIGHT's own (`KeyRim.ts`, 1.5 px).
 *
 * `mixDefringe` defaults to 0, so an injected material with the part off draws exactly as before; the
 * approved paintings are never changed (the edit is at draw time). Original shader code (rule 8).
 */

const HEAD = /* glsl */ `
  uniform float mixDefringe;
`;

const AT_CUT = 'if (a < alphaCut) discard;';
const CUT = /* glsl */ `if (mixDefringe > 0.0) {
      float dk = mixDefringe * 0.32;
      a = clamp((a - dk) / max(1.0 - dk, 0.01), 0.0, 1.0);
    }
    if (a < alphaCut) discard;`;

const AT_CONTACT = 'c *= contact;';
const EDGE = /* glsl */ `c *= contact;
    if (mixDefringe > 0.0) c *= mix(1.0 - 0.16 * mixDefringe, 1.0, smoothstep(0.3, 0.92, texel4.a));`;

/** Patch one fragment shader source; null when the markers are not there (an unknown figure shader). */
export function patchDefringe(src: string): string | null {
  const iMain = src.indexOf('void main()');
  if (iMain < 0 || !src.includes(AT_CONTACT) || !src.includes(AT_CUT) || src.includes('mixDefringe')) return null;
  return (src.slice(0, iMain) + HEAD + src.slice(iMain)).replace(AT_CUT, CUT).replace(AT_CONTACT, EDGE);
}
