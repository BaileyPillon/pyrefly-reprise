/**
 * The MAX mix (D-316), BREATHING and KO COLLAPSE's vertex patch, ported from option A's prototype
 * (`fx/max/a/livingShader.ts`), its breathing and buckle terms only (no hair, cloth or part springs, not
 * in the mix). Applied to whichever vertex program the figure has (the painted one, or LIVING PAINTINGS'
 * sway) by `patch.ts`, on a subdivided plane (`living.ts`). Every term is zero while `mlOn` is 0, so the
 * figure draws as before. Original shader code (rule 8). Both games (plumbing).
 *
 * - Breathing: the chest swells sideways by the rig's chest band and the shoulders (and what rides on
 *   them) rise; the belt line stays put and nothing below the hips moves.
 * - Lean and buckle (the KO collapse): the knees give, everything above them sinks and tips forward.
 */
const HEAD = /* glsl */ `
  uniform sampler2D mlRig;
  uniform vec4 mlLand;  // hip, chest, head, core (uv)
  uniform vec4 mlA;     // breath, buckle, forward (+1/-1 in this plane's x), lean
  uniform vec2 mlSlot;  // this plane's height/width, its mirror sign
  uniform float mlOn;
  vec3 mixLive(vec3 q) {
    if (mlOn < 0.5) return q;
    vec4 w = texture2D(mlRig, uv);
    float hip = mlLand.x;
    float chest = mlLand.y;
    float core = mlLand.w;
    float ax = mlSlot.x;
    float fwd = mlA.z;
    float up = smoothstep(hip, chest, uv.y);
    q.x += (uv.x - core) * mlA.x * 2.4 * w.r;
    q.y += mlA.x * up;
    float b = max(uv.y - hip, 0.0) / max(1.0 - hip, 0.1);
    q.x += mlA.w * ax * fwd * b * b;
    q.y -= abs(mlA.w) * b * b * 0.3;
    float knee = hip * 0.6;
    q.y -= mlA.y * 0.14 * smoothstep(knee * 0.4, hip, uv.y);
    q.x += mlA.y * 0.06 * ax * fwd * smoothstep(knee, 1.0, uv.y);
    return q;
  }
`;

/** Patch a figure vertex shader (the painted one or the sway); null when it is not one of ours. */
export function patchLiving(src: string): string | null {
  if (src.includes('mixLive') || !src.includes('void main()')) return null;
  const a = 'modelViewMatrix * vec4(position, 1.0)';
  const b = 'modelViewMatrix * vec4(p, 1.0)';
  if (!src.includes(a) && !src.includes(b)) return null;
  const i = src.indexOf('void main()');
  return (src.slice(0, i) + HEAD + src.slice(i)).replace(a, 'modelViewMatrix * vec4(mixLive(position), 1.0)').replace(b, 'modelViewMatrix * vec4(mixLive(p), 1.0)');
}
