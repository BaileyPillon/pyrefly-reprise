/**
 * Chapter II's first form at Bailey's pick: the party height it is read against and the per-form height that stands Lady Yunalesca's first painting at her wing tips
 * (r3943-int, FFX only, Chapter II).
 *
 * Kept out of `zanarkand-dome.ts` (house style is every source file under 400 lines; that scene is 1,584): this block is data that has nothing to do with painting the dome.
 * `zanarkand-dome.ts` names it in its `STAGING`, so `stagingOf`, the stage and the debug scenes all read the one table.
 */

import { formFigureHeights } from '../data/ffx/form-stature.ts';

/**
 * The party's shared world height on this stage: Tidus's 1.82, the stage's own default (the real battle scene, `buildZanarkandDomeScene`, publishes no `partyHeight`:
 * `resolveSceneHeights`), which the form's height is read against (`formHeight`: a form stands at the party's height times its game height over Tidus's 18.15).
 */
export const ZANARKAND_PARTY_HEIGHT = 1.82;

/**
 * r3943-int (Bailey, 2026-10-09 14:10 EDT, "go with 3 for Yunalesca"; FFX only, Chapter II): **Lady Yunalesca's first form stands at her wing tips**: 25.7 game units on the PS2
 * screen, 2.577 world units here, from the stage's shared boss height 4.1 (`data/ffx/form-stature.ts` `FFX_FORM_STATURE`, `research/ffx-yunalesca.md` section 18). She reads 0.93 over the
 * party at 1600x900 and 1.02 on the phone (the options study's picture 3). **Per form**: the painting swaps with the form (`PaintedStage.setArt`), so the height is keyed by the art id
 * (`yunalesca-1`); her second and third forms are not in it and stand at the shared 4.1, as before. Her spot and the camera are unchanged.
 */
export const ZANARKAND_FORM_HEIGHTS = formFigureHeights(['yunalesca-1'], ZANARKAND_PARTY_HEIGHT);
