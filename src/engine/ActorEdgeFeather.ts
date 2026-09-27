/**
 * Which battle paintings get a feathered plane edge on the stage, and how much.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Chapter II's Yunalesca (PR-0164,
 * round 11) and the aeons Yuna summons in Chapters I, X and XIV (PR-0212,
 * round 13). The stage plumbing that reads this table is shared, but no FFX-2
 * painting is listed (FFX-2 Bahamut's hurt pose is PR-0137, its own item).
 *
 * Some approved paintings run off their own canvas: `yunalesca-1/attack.png`
 * has opaque hair on its left and top border rows, `yunalesca-1/hurt.png` a pale
 * wash down its whole left column, `valefor/idle.png` 314 opaque pixels on its
 * right column (its far wing), `ixion/overdrive.png` 222 on its right. On the
 * stage the plane's own rectangle then reads as a hard straight line. The files
 * stay byte-identical (approved art is never re-cut on an agent's say-so);
 * instead the shader feathers the plane's sides and top (`PaintedActor`
 * `edgeFade` with `edgeFadeBase: false`), so the base, where the feet and
 * Yunalesca's coils meet the floor, is untouched.
 *
 * Listed by measurement, not by guess: an art id is here when one of its pose
 * files has opaque pixels (alpha > 32) on its left, right or top border
 * (scan of `public/art/characters/<id>/*.png`, 2026-09-26, `docs/handoff/t1-b2b.md`).
 * Values sit in the 0.12-0.2 band the PaintedActor option documents for a
 * full-bleed glow; 0.16 is the demo scene's boss value. Yunalesca's first form
 * (a pale wash down a whole column) and Valefor (a wing cut mid-feather) take the
 * band's top, 0.2: at 0.16 the in-game frames still showed a faint vertical line
 * (captures 2026-09-26, docs/screenshots/t1-b2b/).
 */

/** Feather width (a fraction of the plane's half-extent) per art id. */
export const EDGE_FEATHER_ART: Readonly<Record<string, number>> = {
  'yunalesca-1': 0.2, // attack: hair on the left and top border; hurt: a pale wash down the left column
  'yunalesca-2': 0.16, // idle and attack: aura on the left, right and top borders
  'yunalesca-3': 0.16, // idle, attack, cast, hurt: aura on the top border (the coils fill the base)
  valefor: 0.2, // idle: the far wing on the right border (PR-0212)
  ixion: 0.16, // overdrive: the right border, the same class as Valefor
};

/**
 * The least share of `edgeJag` the feather's end sits inside the plate edge. Mirrored in
 * `PaintedShader.ts` (`JAG_MIN`); the two are pinned together by `stage-edge-feather.test.ts`.
 */
export const JAG_MIN = 0.35;

const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The shader's edge feather, mirrored in TypeScript so its shape can be tested without WebGL:
 * the alpha multiplier at `box` (0 at the plane's centre line, 1 on its edge) for a feather of
 * width `fade`, a wander of `jag`, and the edge noise `n` (0..1) at that point along the edge.
 * The whole ramp moves inward by `jag` scaled into [JAG_MIN, 1] by the noise, so the line where
 * the painting ends wanders and never lies on the plate edge (L-0 re-check, 2026-09-27: a
 * feather that always ENDED on the edge left Yunalesca's attack hair, dense up to its left
 * border, fading into one straight pale column at 2000x1012).
 */
export function featherAlpha(box: number, fade: number, jag: number, n: number): number {
  const j = jag > 0 ? jag * (JAG_MIN + (1 - JAG_MIN) * smoothstep(0.33, 0.6, n)) : 0;
  const fadeEnd = 1 - j;
  return 1 - smoothstep(fadeEnd - fade, fadeEnd, box);
}

/**
 * The stage options for one painting: a sides-and-top feather, or `null` for none. The fade's
 * start wanders in by up to the feather's own width again (`edgeJag`): a feather parallel to the
 * plane's side still read as a soft straight column through Yunalesca's hair (Ch II, 2000x1012)
 * and Valefor's wing (Ch XIV, 1600x900) in the L-0 browser check, 2026-09-27.
 */
export function edgeFeatherFor(artId: string): { edgeFade: number; edgeFadeBase: false; edgeJag: number } | null {
  const edgeFade = EDGE_FEATHER_ART[artId];
  return edgeFade === undefined ? null : { edgeFade, edgeFadeBase: false, edgeJag: edgeFade };
}
