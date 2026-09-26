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
 * full-bleed glow; 0.16 is the demo scene's boss value.
 */

/** Feather width (a fraction of the plane's half-extent) per art id. */
export const EDGE_FEATHER_ART: Readonly<Record<string, number>> = {
  'yunalesca-1': 0.16, // attack: hair on the left and top border; hurt: a pale wash down the left column
  'yunalesca-2': 0.16, // idle and attack: aura on the left, right and top borders
  'yunalesca-3': 0.16, // idle, attack, cast, hurt: aura on the top border (the coils fill the base)
  valefor: 0.16, // idle: the far wing on the right border (PR-0212)
  ixion: 0.16, // overdrive: the right border, the same class as Valefor
};

/** The stage options for one painting: a sides-and-top feather, or `null` for none. */
export function edgeFeatherFor(artId: string): { edgeFade: number; edgeFadeBase: false } | null {
  const edgeFade = EDGE_FEATHER_ART[artId];
  return edgeFade === undefined ? null : { edgeFade, edgeFadeBase: false };
}
