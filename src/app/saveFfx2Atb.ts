/**
 * The one-time FFX-2 Wait migration (D-029 follow-up 1).
 *
 * Bailey, 2026-09-23 00:00 EDT: *"1, 2, 3 I'll take your recommendations on all
 * please"*. The recommendation he took: every existing save gets Wait once,
 * because before release 09 Active was the only behaviour the engine had and
 * `'active'` was the stored default, so no save's `'active'` is a choice anybody
 * made (`docs/handoff/ffx2-wait-mode.md` §6.1). After that the player's own
 * choice is kept for good.
 *
 * **The rule.** A settings blob without `ffx2AtbMigrated === true` gets
 * `ffx2Atb = 'wait'` and the marker, whatever `ffx2Atb` held. A blob with the
 * marker keeps its `ffx2Atb` (a value that is neither mode reads as the default,
 * CHK-024). Nothing else is touched. Idempotent: the first pass always leaves
 * the marker set, so every later pass takes the keep branch. Proof and risks:
 * `docs/plans/ffx2-wait-migration-review.md`.
 *
 * Presence decides, as with `seenCoach`'s veteran rule; no `SAVE_VERSION` bump.
 * Its own module only because `SaveData.ts` is over the house line cap.
 *
 * FFX-2 only (AGENTS.md rule 14): only the FFX-2 engine reads `ffx2Atb`.
 */

import type { Settings } from './SaveData.ts';

/** Apply the rule to `settings` (already merged over the defaults), in place. */
export function migrateFfx2Atb(settings: Settings, raw: unknown): void {
  const marked =
    typeof raw === 'object' && raw !== null && (raw as { ffx2AtbMigrated?: unknown }).ffx2AtbMigrated === true;
  if (!marked) settings.ffx2Atb = 'wait';
  else if (settings.ffx2Atb !== 'active' && settings.ffx2Atb !== 'wait') settings.ffx2Atb = 'wait';
  settings.ffx2AtbMigrated = true;
}
