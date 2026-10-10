/**
 * FFX form stature: how tall a boss's **form** stood on the PS2 screen, for a boss whose painting swaps with the form (r3943-int, Chapter II: Lady Yunalesca's first form).
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Lady Yunalesca is Chapter II of the FFX list; FFX-2 has no such fiend, and nothing here is read by an FFX-2 chapter.
 *
 * **Why a table of forms and not of fiends.** `fiend-stature.ts` is keyed by combatant id, and one id draws one height for the whole fight. Yunalesca is one combatant with three
 * paintings (`yunalesca-1/2/3`, `BattlePresenterArt.FORM_ART_IDS`): the stage swaps the painting in place at the form change (`PaintedStage.setArt`), and the model the PS2 game
 * draws is a different mesh per form, so a height is true of one form only. This table is keyed by the **art id** the stage draws (`yunalesca-1`), and only the forms a pick covers are
 * in it: every other form (Yunalesca's second and third) is drawn at the stage's shared boss height, exactly as before, and the third waits for a measurement (the PS2 silhouette
 * runs out of the frame at the bottom, `research/ffx-yunalesca.md` section 18).
 *
 * **The row** is the sizes lane's read of the first form in the original NTSC-U game (PCSX2 v2.8.2, the disc SLUS-20312, `D:/Tools/pcsx2-ffx/re/dumps/boss-sizes.json`, outside the
 * repository: facts only): formation 72, model `m130`, four reloaded frames at 6.58 pixels per unit (Tidus markers 60 units to the right and to the left, 6.72 and 6.44, harmonic
 * mean), silhouette rows read on the picture: wing tips to sole **25.7**, feather crest to sole 20.6, the woman alone (white hair to sole) 17.9. The static law (116) is the union of all three
 * forms in one model and is not form 1; the engine height field `E` is 18. Tag `[single source: own measurement]` for the silhouette, `medium-high` (the lane's own label; the scale is
 * read off two Tidus markers 60 units either side at the boss's own depth, and the earlier "about 20" was withdrawn for reading the wrong rows). The method, the caveats and what the build
 * does with the number are `research/ffx-yunalesca.md` section 18.
 *
 * **`share` is Bailey's pick** (2026-10-09 14:10 EDT, "go with 3 for Yunalesca", picture 3 of the giants options study `yuna1.jpg`, "WING TIPS"): the share of `height` the build
 * draws, with `height` = the wing tips. The painting draws the woman with her hair and crest and **no wings**, so the model's number counts something the painting does not carry; Bailey
 * took the larger of the model's readings (25.7, a 2.58-unit figure that reads 0.93 over the party at 1600x900) over the crest-to-sole 20.6 (2.07 units, 0.74).
 *
 * Presentation data, not battle data (hard rule 1): no engine reads it, no stat or hit rule depends on it.
 */

import { TIDUS_TOP } from './party-stature.ts';

/** One boss form and the number it was measured to. */
export interface FormStature {
  /** The PS2 model: `mNNN` a monster mesh (the one model holds all three of Yunalesca's forms). */
  readonly model: string;
  readonly name: string;
  /** The live silhouette, game units on the scale where Tidus is 18.15: the number `share` is a share of. */
  readonly height: number;
  /** The three readings of the same silhouette, game units: the woman alone (white hair to sole), feather crest to sole, wing tips to sole (`height`). */
  readonly reads: { readonly woman: number; readonly crest: number; readonly wingTips: number };
  /** `raw x C x script scale` of the whole model, comparison only (the union of the three forms), or null where the lane records none. */
  readonly staticLaw: number | null;
  /** The engine height field `E` (a design height; comparison only). */
  readonly engine: number;
  /** How sure the live number is (the lane's own label). */
  readonly confidence: 'medium-high';
  /** Bailey's pick: the share of `height` the build draws (1 = the wing tips, the whole silhouette). */
  readonly share: number;
}

/** The forms a pick covers, by the art id the stage draws (`BattlePresenterArt.artIdFor`: `<combatant id>-<form index + 1>`). Every form not named here keeps the stage's rule. */
export const FFX_FORM_STATURE: Readonly<Record<string, FormStature>> = {
  // Chapter II, Lady Yunalesca, first form (the human woman, 24,000 HP). The painting `yunalesca-1` has her hair and crest and no wings; the silhouette on the PS2 screen has all three.
  'yunalesca-1': {
    model: 'm130',
    name: 'Lady Yunalesca, first form (wing tips to sole)',
    height: 25.7,
    reads: { woman: 17.9, crest: 20.6, wingTips: 25.7 },
    staticLaw: 116,
    engine: 18,
    confidence: 'medium-high',
    share: 1,
  },
};

const mm = (v: number): number => Math.round(v * 1000) / 1000;

/** The world height of a form on a stage whose reference hero stands `partyHeight` tall: `partyHeight x height x share / refTop`, to the millimetre; undefined for any art id this table does not know. */
export function formHeight(artId: string, partyHeight: number, refTop: number = TIDUS_TOP): number | undefined {
  const row = FFX_FORM_STATURE[artId];
  return row ? mm(partyHeight * ((row.height * row.share) / refTop)) : undefined;
}

/** A `SceneStaging.formHeights` table for the forms named in `artIds` (an art id this table does not know is left out). */
export function formFigureHeights(artIds: readonly string[], partyHeight: number, refTop: number = TIDUS_TOP): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of artIds) {
    const h = formHeight(id, partyHeight, refTop);
    if (h !== undefined) out[id] = h;
  }
  return out;
}
