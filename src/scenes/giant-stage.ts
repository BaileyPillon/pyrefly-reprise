import { ffx2GiantHeight } from '../data/ffx2/fiend-stature.ts';
import { PHONE_BATTLE_QUERY } from '../ui/common/phoneBattle.ts';

/**
 * The upright phone's giants (r3942-stage, wave 2; **FFX-2 only**: Bahamut of Chapter IV, Paragon of Chapter XIII, Anima of Chapter XI).
 *
 * Bailey, 2026-10-08, "go with your recommendations": on the phone every giant stands at 0.7 of its real height (option 4 of the giants options sheet;
 * `FFX2_GIANT_SHARE` in `data/ffx2/fiend-stature.ts` is the pick, `docs/handoff/r3942-stage.md` the picture). The phone keeps today's rig and its own slice fit
 * (`ShotRules.fitPhone`, A-12: the camera stands back until everyone fits), and CHAPTER FRAMING gives up BOSS SCALE and the colossus master there (`fx/mix/gates.ts`), so
 * the size is the scene's: a `figureHeights` entry for the giant, published only when the phone battle HUD takes the window. On a desktop the scene publishes nothing here
 * and `fx/mix/giants.ts` stands the giant and its camera together (a giant at its real size under today's rig is cut by the frame).
 *
 * Game case: FFX-2 only (rule 14); the heights come from the HD models' ratios to the girls (`research/ffx2-bahamut.md` §9, `ffx2-trema.md` §15, `ffx2-fallen-aeons.md` §13).
 */

/**
 * True when the phone battle HUD takes this window (its media query). Read once, when the scene is built, as the Road and the Farplane read it; false with no window (a unit
 * test, a worker).
 */
export function giantsOnPhone(win: { matchMedia?: Window['matchMedia'] } | undefined = typeof window === 'undefined' ? undefined : window): boolean {
  return win?.matchMedia?.(PHONE_BATTLE_QUERY).matches === true;
}

/**
 * `SceneStaging.figureHeights` for the giants of one chapter on the phone: `{ id: world height }` for each id, 0.7 of its real height over the chapter's girls
 * (`partyHeight` is the girls' world height in the scene); `{}` on a desktop, and for an id the table does not know as a giant.
 */
export function giantPhoneHeights(ids: readonly string[], chapter: string, partyHeight: number, phone: boolean = giantsOnPhone()): Record<string, number> {
  const out: Record<string, number> = {};
  if (!phone) return out;
  for (const id of ids) {
    const h = ffx2GiantHeight(id, chapter, partyHeight, true);
    if (h !== null) out[id] = h;
  }
  return out;
}
