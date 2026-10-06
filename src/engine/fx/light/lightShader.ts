/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): the three looks as ONE block of GLSL injected into the painted figure's own
 * fragment shader (`shaders/PaintedShader.ts`) by `onBeforeCompile` (`../mix/patch.ts`, which the MAX mix's defringe and
 * breathing already use), so the shader file and `PaintedActor` (over 400 lines, rule 7) do not grow. Original shader code (rule 8).
 *
 * The block runs after the contact darkening and before the flash, so a hit still reads on a lit figure, and it lives in the
 * figure's own shader on purpose: the grade treats a pixel that carries the figure's frame alpha as "the painting, true" and
 * skips its look (D-437), so light added here reaches the screen as light and nothing drawn over the figure can drop the pixel
 * out of true colour. `lgMode` 0, or `lgK` 0, skips the whole block: the frame is the one the unpatched shader draws.
 *
 * What every look shares (look 1, and 2 and 3 on top of it):
 * - a BEVEL from the painting's own alpha, read at a coarse mip so it is smooth: the outward normal of the silhouette and a
 *   weight that is 1 at the edge and falls to 0 about one band inside. The band is in WORLD units (a fraction of the figure's
 *   height), so a figure that is bigger on screen, or drawn at 2x, gets the same look;
 * - WRAP: the colour of the backdrop just outside the silhouette (the blurred field, `backdropField.ts`) bleeds into the
 *   edge, strongest on the side that faces the room's key, weighted by how bright the painted pixel is and capped, so a
 *   dark costume is edged by the room and never outlined;
 * - GLINTS: where the painting is already bright, in a thin band at the key-facing edge (blade edges, metal, hair), a slow
 *   shimmer. The hand-placed stars on blades and staves are a separate layer (`overlay.ts`).
 * - FACE GUARD: inside the enlarged reviewed head box (`headBoxes.json`) the terminator and the glints are held back and the
 *   wrap is cut, so a face is never the thing a light does something odd on.
 * Look 2 adds a soft two-tone terminator from the pose's normal map (or, with none yet, a dome from the bevel), in modulation
 * form against the frontal reference so a pixel facing the viewer keeps the painting's colour exactly. Look 3 adds a
 * head-to-feet gradient of the room's colour and a diffusion of the figure's own highlights (a high threshold, so the line art
 * stays sharp).
 */

const HEAD = /* glsl */ `
  uniform float lgMode;
  uniform float lgK;
  uniform float lgTime;
  uniform vec2 lgSize;
  uniform float lgBand;
  uniform vec2 lgN0;
  uniform vec2 lgNx;
  uniform vec2 lgNy;
  uniform sampler2D lgBackTex;
  uniform vec4 lgBackM;
  uniform vec2 lgBackO;
  uniform vec4 lgKeyA;
  uniform vec3 lgDirA;
  uniform vec4 lgKeyB;
  uniform vec3 lgDirB;
  uniform vec3 lgAmb;
  uniform vec3 lgSky;
  uniform vec3 lgBounce;
  uniform vec4 lgHead;
  uniform float lgFace;
  uniform sampler2D lgNormal;
  uniform float lgHasN;
  uniform vec4 lgT1;
  uniform vec4 lgT2;
  vec3 lgBackAt(vec2 puv) {
    vec2 ndc = lgN0 + lgNx * puv.x + lgNy * puv.y;
    vec2 b = mat2(lgBackM.x, lgBackM.y, lgBackM.z, lgBackM.w) * ndc + lgBackO;
    return texture2D(lgBackTex, clamp(b, 0.0, 1.0)).rgb;
  }
  float lgLum(vec3 v) { return dot(v, vec3(0.2126, 0.7152, 0.0722)); }
`;

const BLOCK = /* glsl */ `
    if (lgMode > 0.5 && lgK > 0.0) {
      vec3 c0 = c;
      float k = lgK;
      // The face guard: 1 on the face, 0 beyond the enlarged head box.
      float hasHead = step(lgHead.x + 1e-4, lgHead.z);
      vec2 hc = (lgHead.xy + lgHead.zw) * 0.5;
      vec2 hr = max((lgHead.zw - lgHead.xy) * 0.85, vec2(1e-4));
      float face = hasHead * lgFace * (1.0 - smoothstep(0.7, 1.15, length((uv - hc) / hr)));
      float keep = 1.0 - face;
      // The bevel: the alpha blurred at about one band, its gradient, and a weight that is 1 at the silhouette.
      vec2 dW = vec2(lgBand) / lgSize;
      float texPerWorld = 1.0 / max(texel.y * lgSize.y, 1e-6);
      float lod = log2(max(lgBand * texPerWorld, 1.0));
      float A0 = textureLod(map, uv, lod).a;
      vec2 gx = vec2(dW.x * 0.6, 0.0);
      vec2 gy = vec2(0.0, dW.y * 0.6);
      vec2 gA = vec2(textureLod(map, uv + gx, lod).a - textureLod(map, uv - gx, lod).a,
                     textureLod(map, uv + gy, lod).a - textureLod(map, uv - gy, lod).a);
      float gm = length(gA);
      vec2 outN = gm > 1e-3 ? -gA / gm : vec2(0.0);
      // 1 at the silhouette of a mass; 0 inside it, and 0 on a thin feature (a staff ring, a spear) that the blur hardly covers.
      float edge = (1.0 - smoothstep(0.5, 0.96, A0)) * smoothstep(0.26, 0.5, A0);
      vec2 dA = normalize(lgDirA.xy + vec2(1e-4));
      vec2 dB = normalize(lgDirB.xy + vec2(1e-4));
      float kfA = dot(outN, dA) * 0.5 + 0.5;
      float kfB = dot(outN, dB) * 0.5 + 0.5;
      // WRAP: the room just outside the edge, bled in; the key's own colour on the side that faces it.
      vec3 wcol = lgBackAt(uv + outN * dW * 1.8);
      vec3 wl = wcol * 0.8 * mix(0.3, 1.0, kfA * kfA) * edge
              + lgKeyA.rgb * lgKeyA.w * 0.5 * kfA * kfA * edge
              + lgKeyB.rgb * lgKeyB.w * 0.35 * kfB * kfB * edge;
      wl *= mix(0.5, 1.0, smoothstep(0.03, 0.45, lgLum(c0)));
      c += min(wl * lgT1.x, vec3(0.38)) * mix(1.0, 0.35, face) * k;
      // GLINTS: painted highlights in a thin band at the key-facing edge.
      float edge2 = 1.0 - smoothstep(0.5, 0.94, textureLod(map, uv, max(lod - 1.2, 0.0)).a);
      float shim = 0.84 + 0.16 * sin(lgTime * 2.1 + dot(uv, vec2(41.0, 57.0)));
      float gl = smoothstep(0.52, 0.86, lgLum(c0)) * edge2 * smoothstep(0.35, 0.95, kfA) * shim;
      c += (lgKeyA.rgb * 0.6 + 0.4) * gl * lgT1.y * k * keep;
      if (lgMode > 1.5 && lgMode < 2.5) {
        // LOOK 2: the terminator. A normal from the map (or the bevel's dome), lit by the two keys, in modulation form.
        vec3 N;
        if (lgHasN > 0.5) N = normalize(texture2D(lgNormal, uv).rgb * 2.0 - 1.0 + vec3(0.0, 0.0, 1e-3));
        else N = normalize(vec3(outN * edge * 0.95, 1.0 - 0.55 * edge));
        float sA = smoothstep(-0.30, 0.60, dot(N, lgDirA));
        float sB = smoothstep(-0.30, 0.60, dot(N, lgDirB));
        float rA = smoothstep(-0.30, 0.60, lgDirA.z);
        float rB = smoothstep(-0.30, 0.60, lgDirB.z);
        vec3 T = lgAmb + lgKeyA.rgb * (lgKeyA.w * sA) + lgKeyB.rgb * (lgKeyB.w * sB);
        vec3 Tr = lgAmb + lgKeyA.rgb * (lgKeyA.w * rA) + lgKeyB.rgb * (lgKeyB.w * rB);
        vec3 ratio = clamp(T / max(Tr, vec3(0.05)), vec3(lgT2.z), vec3(lgT2.w));
        c = mix(c, c * ratio, clamp(lgT1.z * k, 0.0, 1.0) * keep);
      }
      if (lgMode > 2.5) {
        // LOOK 3: the room's colour from the head to the feet, and the figure's own highlights, diffused.
        float gv = smoothstep(0.05, 0.92, vUv.y);
        vec3 gcol = mix(lgBounce, lgSky, gv);
        c *= mix(vec3(1.0), gcol, clamp(lgT1.w * k, 0.0, 1.0));
        float lodG = log2(max(lgBand * 1.3 * texPerWorld, 1.0));
        vec3 bl = textureLod(map, uv, lodG).rgb;
        vec3 hiC = max(bl - vec3(lgT2.y), vec3(0.0));
        c += min(hiC * lgT2.x * k, vec3(0.15)) * mix(1.0, 0.6, face);
      }
      c = min(c, vec3(1.0));
    }
    `;

const AT_FLASH = 'float FLASH_FLOOR';

/** Patch one fragment shader source; null when the marker is not there, the source is not the painted figure's, or it is patched already. */
export function patchLight(src: string): string | null {
  const iMain = src.indexOf('void main()');
  const iFlash = src.indexOf(AT_FLASH);
  if (iMain < 0 || iFlash < iMain || !src.includes('c *= contact;') || src.includes('lgMode')) return null;
  const withBlock = src.slice(0, iFlash) + BLOCK + src.slice(iFlash);
  return withBlock.slice(0, iMain) + HEAD + withBlock.slice(iMain);
}
