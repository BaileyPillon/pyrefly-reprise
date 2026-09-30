/**
 * The one-time SFX balance migration (D-293, refining D-210).
 *
 * Bailey, 2026-09-29 ~23:00 EDT: "yes, all your recommendations". Recommendation
 * 2: SFX balance b (effects +6 dB against the D-210 default, so a hit lands
 * level with the music's peaks) becomes the default. New profiles get it from
 * `defaultSettings()` ({@link SFX_DEFAULT_VOLUME}). This module moves an
 * existing save that never touched the level; a level the player set is kept.
 *
 * **The rule.** A settings blob without `sfxBalanceMigrated === true` was
 * written before D-293:
 * - `sfxVolume` exactly {@link D210_SFX_VOLUME} (0.35, D-210's untouched
 *   default) moves to {@link SFX_DEFAULT_VOLUME} (0.70);
 * - a missing or non-finite `sfxVolume` (a save older than the setting) plays
 *   at 0.9, the level it had before D-210 (D-210's own rule, unchanged);
 * - any other value is the player's and is kept exactly;
 * then the marker is set. A blob with the marker keeps its value, 0.35
 * included, so a player who picks 0.35 after the upgrade is never moved again
 * (the slider steps 0.1 and rounds, so 0.45 -> 0.35 lands on it exactly).
 * Idempotent. Presence decides, as with `ffx2AtbMigrated`: no `SAVE_VERSION`
 * bump. Proof and risks: `docs/plans/sfx-b-review.md`.
 *
 * Its own module only because `SaveData.ts` is over the house line cap.
 * Game case: both (shared mixer default and save plumbing; CHK-020).
 */

import { D210_SFX_VOLUME, SFX_DEFAULT_VOLUME } from '../audio/sfxMix.ts';
import type { Settings } from './SaveData.ts';

export { SFX_DEFAULT_VOLUME };

/** The level a save that predates the SFX setting was playing at (before D-210). */
export const PRE_D210_SFX_VOLUME = 0.9;

/** Apply the rule to `settings` (already merged over the defaults), in place. `raw` is the stored settings object. */
export function migrateSfxBalance(settings: Settings, raw: unknown): void {
  if (typeof raw !== 'object' || raw === null) {
    // No stored settings at all: the defaults already hold the new level and the marker.
    settings.sfxBalanceMigrated = true;
    return;
  }
  const stored = raw as { sfxVolume?: unknown; sfxBalanceMigrated?: unknown };
  const finite = typeof stored.sfxVolume === 'number' && Number.isFinite(stored.sfxVolume);
  if (!finite) settings.sfxVolume = PRE_D210_SFX_VOLUME;
  else if (stored.sfxBalanceMigrated !== true && stored.sfxVolume === D210_SFX_VOLUME) settings.sfxVolume = SFX_DEFAULT_VOLUME;
  settings.sfxBalanceMigrated = true;
}
