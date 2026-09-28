/**
 * Chapter XVI, Ixion at Djose: which painting each of its three places shows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The swap is one line each.** The Djose Chamber and the Farplane Abyss are a painting round still owed to
 * Bailey (rule 9: options until Bailey picks). Until a judge-passed option exists, the chapter shows the
 * stand-ins the concept README names (`docs/concepts/chapters/ixion-djose-2026-09-27/README.md`), made by
 * `docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_standins.py` (no GPU; our own paintings; each
 * sidecar says PROVISIONAL; **not approved, not locked**). When the recommended option is installed under
 * `backdrops/ffx2-djose-chamber-provisional` / `backdrops/ffx2-abyss-provisional` (add-only), point the constant
 * at that key. Nothing else moves: the chapter's `sceneKey`, the scene factory's registration, the board card,
 * the prep wash and the cutscene backdrop all read these.
 *
 * The Bevelle Underground is the approved Chapter 4 plate (`scene:bevelle-underground`), where Yuna wakes
 * (research `ffx2-ixion-djose.md` §7.2 step 12, `[verified: 4 sources]`).
 */

/** The Chamber of the Fayth at Djose: the fight and the fall. STAND-IN (Macalania hall over the Den floor, recoloured). */
export const DJOSE_CHAMBER_PLATE = 'ffx2-djose-chamber-standin';

/** The Farplane Abyss: the cutscene and the whistles. STAND-IN (the Chapter 5 Farplane washed white). */
export const DJOSE_ABYSS_PLATE = 'ffx2-abyss-standin';

/** Where she wakes: the approved Chapter 4 plate. */
export const DJOSE_WAKE_PLATE = 'bevelle-underground';

/** True while a plate is one of the stand-ins (the handoff and a test read this). */
export function isIxionStandIn(key: string): boolean {
  return key.endsWith('-standin');
}
