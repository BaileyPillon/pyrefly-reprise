/**
 * PR-0005 option B (FFX only, Bailey's D-042,
 * `docs/concepts/layout/pr-0005-ffx/b-under.png`): while the turn cut-in slab
 * is on screen, the live command cascade is drawn **above** it and everything
 * else the HUD draws stays exactly where it always was: **under** the slab and
 * the veil (dimmed), beside it where it does not overlap.
 *
 * Why a second layer and not a z-index. `.ffxhud__stage` carries the
 * letterbox `transform`, so it is its own stacking context: no child of it
 * can out-rank `.pf-mom` (`transitions.css`, `z-index: 36`), the root the
 * cut-in slab is mounted in. The first build promoted the whole stage, which
 * put the guide rail, advisor and command help over the portrait; its repair
 * (5846f4e0) then hid every other stage child, which took the CTB list,
 * party status, Sensor panel, telegraph banner and stage-2 border off the
 * screen for the whole cut-in (phase-2 verifier, 2026-09-24). Here only
 * `.ffx-cmd-area` moves, for exactly the cut-in's lifetime, into
 * `.ffxhud__lift`: an otherwise empty sibling of the stage with the same
 * letterbox transform (`FFXBattleHud.layout`), which `ffx-hud.css` raises
 * above `.pf-mom` while the modifier is on. Nothing else changes stacking.
 *
 * Moving the node keeps its listeners and its `CommandMenu` references; the
 * menu reads keys from `window`, so a key pressed during the hold still moves
 * the selection. The area goes back to its own slot (before `.ffx-cmd-info`)
 * when the cut-in ends, including when it throws.
 */

/** The FFX HUD root's modifier class; `ffx-hud.css` keys the lift's z-index on it. */
export const FFX_HUD_CUTIN_BELOW = 'ffxhud--cutin-below';

/**
 * Lift the command cascade of the FFX HUD rooted at `hudEl` above the cut-in.
 * Returns the undo. A HUD without a lift layer (or without a command area)
 * gets only the modifier class, which then changes nothing.
 */
export function liftCommandArea(hudEl: HTMLElement): () => void {
  hudEl.classList.add(FFX_HUD_CUTIN_BELOW);
  const stage = hudEl.querySelector<HTMLElement>(':scope > .ffxhud__stage:not(.ffxhud__lift)');
  const lift = hudEl.querySelector<HTMLElement>(':scope > .ffxhud__lift');
  const area = stage?.querySelector<HTMLElement>(':scope > .ffx-cmd-area') ?? null;
  if (!stage || !lift || !area) return () => hudEl.classList.remove(FFX_HUD_CUTIN_BELOW);

  const next = area.nextSibling;
  lift.appendChild(area);
  return () => {
    if (area.parentNode === lift) {
      if (next && next.parentNode === stage) stage.insertBefore(area, next);
      else stage.appendChild(area);
    }
    hudEl.classList.remove(FFX_HUD_CUTIN_BELOW);
  };
}
