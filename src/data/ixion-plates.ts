/**
 * Chapter XVI, Ixion at Djose: which painting each of its three places shows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The swap is one line each.** The Djose Chamber and the Farplane Abyss are a painting round still owed to
 * Bailey (rule 9: options until Bailey picks). Until a judge-passed option exists, the chapter shows the
 * stand-ins the concept README names (`docs/concepts/chapters/ixion-djose-2026-09-27/README.md`), made by
 * `docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_standins.py` (no GPU; our own paintings; each
 * sidecar says PROVISIONAL; **not approved, not locked**). The options are installed add-only under keys ending
 * `-provisional` (C1 and A1 as `ffx2-djose-chamber-provisional` / `ffx2-abyss-provisional`; C2 and the repaired A1
 * as `djose-chamber-provisional` / `farplane-abyss-provisional`); the constants below name the ones shown.
 * Nothing else moves: the chapter's `sceneKey`, the scene factory's registration, the board card, the prep wash and
 * the cutscene backdrop all read these.
 *
 * The Bevelle Underground is the approved Chapter 4 plate (`scene:bevelle-underground`), where Yuna wakes
 * (research `ffx2-ixion-djose.md` §7.2 step 12, `[verified: 4 sources]`).
 */

/**
 * The Chamber of the Fayth at Djose: the fight and the fall. **OPTION C2 "The Faction's lamps", provisional**
 * (`docs/concepts/chapters/ixion-djose-2026-09-27/scenes/README.md`; the adversarial judge passed C2; not locked).
 * C1 "Storm-lit stone" is `'ffx2-djose-chamber-provisional'`, the stand-in `'ffx2-djose-chamber-standin'`: both stay
 * on disk, each one line away. Each plate has its own framing and Ixion spot (`../scenes/djose-chamber.ts`).
 */
// Bailey's pick is pending (rule 9): this line is the swap.
export const DJOSE_CHAMBER_PLATE = 'djose-chamber-provisional';

/**
 * The Farplane Abyss: the cutscene and the whistles. **OPTION A1 "White void", repaired, provisional** (same README;
 * the judge's faults painted out by masked latent inpaints: the horizon spike where the whistle beat is staged, the
 * black rock, the dark corner wedges; sidecar `repair`). The unrepaired A1 is `'ffx2-abyss-provisional'`, the
 * stand-in `'ffx2-abyss-standin'`.
 */
// Bailey's pick is pending (rule 9): this line is the swap.
export const DJOSE_ABYSS_PLATE = 'farplane-abyss-provisional';

/** Where she wakes: the approved Chapter 4 plate. */
export const DJOSE_WAKE_PLATE = 'bevelle-underground';

/** True while a plate is not Bailey's pick: a stand-in or a provisional option (the handoff and a test read this). */
export function isIxionStandIn(key: string): boolean {
  return key.endsWith('-standin') || key.endsWith('-provisional');
}
