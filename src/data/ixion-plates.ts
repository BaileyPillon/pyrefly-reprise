/**
 * Chapter XVI, Ixion at Djose: which painting each of its three places shows. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Bailey picked, 2026-09-28 (D-273, `docs/target/decisions.json`):** verbatim "all your recommendations",
 * answering the driver's "Ixion's scenes: Chamber C2 and Abyss A1 are in provisionally. Keep them?" — C2 for the
 * Chamber, the repaired A1 for the Abyss, both kept exactly as shown. Locked in `docs/target/approved-hashes.json`
 * under set `bailey:2026-09-28-ixion-scenes`; their sidecars now read `approved`. **The swap stays one line each**
 * (unchanged below), and the files keep their original names ending `-provisional` — a rename would churn the
 * manifest, so that suffix no longer means "unapproved" for these two. The concept README that produced them is
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md`; the earlier stand-ins (made by
 * `docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_standins.py`, no GPU, our own paintings) and the
 * unpicked C1/unrepaired-A1 options are still on disk, each one line away. Nothing else moves: the chapter's
 * `sceneKey`, the scene factory's registration, the board card, the prep wash and the cutscene backdrop all read
 * these.
 *
 * The Bevelle Underground is the approved Chapter 4 plate (`scene:bevelle-underground`), where Yuna wakes
 * (research `ffx2-ixion-djose.md` §7.2 step 12, `[verified: 4 sources]`).
 */

/**
 * The Chamber of the Fayth at Djose: the fight and the fall. **OPTION C2 "The Faction's lamps" — Bailey's pick,
 * approved 2026-09-28 (D-273)** (`docs/concepts/chapters/ixion-djose-2026-09-27/scenes/README.md`; the adversarial
 * judge passed C2). C1 "Storm-lit stone" is `'ffx2-djose-chamber-provisional'`, the stand-in
 * `'ffx2-djose-chamber-standin'`: both stay on disk, each one line away. Each plate has its own framing and Ixion
 * spot (`../scenes/djose-chamber.ts`).
 */
// Bailey's pick, 2026-09-28 (D-273, docs/target/decisions.json; hashes locked in approved-hashes.json): this line is the swap.
export const DJOSE_CHAMBER_PLATE = 'djose-chamber-provisional';

/**
 * The Farplane Abyss: the cutscene and the whistles. **OPTION A1 "White void", repaired — Bailey's pick, approved
 * 2026-09-28 (D-273)** (same README; the judge's faults painted out by masked latent inpaints: the horizon spike
 * where the whistle beat is staged, the black rock, the dark corner wedges; sidecar `repair`). The unrepaired A1 is
 * `'ffx2-abyss-provisional'`, the stand-in `'ffx2-abyss-standin'`.
 */
// Bailey's pick, 2026-09-28 (D-273, docs/target/decisions.json; hashes locked in approved-hashes.json): this line is the swap.
export const DJOSE_ABYSS_PLATE = 'farplane-abyss-provisional';

/** Where she wakes: the approved Chapter 4 plate. */
export const DJOSE_WAKE_PLATE = 'bevelle-underground';

/** True while a plate is not Bailey's pick: a stand-in or a provisional option (the handoff and a test read this). */
export function isIxionStandIn(key: string): boolean {
  return key.endsWith('-standin') || key.endsWith('-provisional');
}
