/**
 * Who owns **Esc** while a command menu is open.
 *
 * The player's bug report was "it doesn't seem like there's a way to pause? I
 * tried esc and P during battle". `P` is fixed elsewhere (`BattleScreen`'s
 * `canPause` no longer refuses while the HUD waits for a command). Esc is the
 * harder half, because it is *also* the command menu's back button, and one key
 * cannot mean "out of targeting" and "open the pause" on the same press.
 *
 * But that conflict is not on all the time. Both menus only bind Esc when they
 * have somewhere to go back to:
 *
 * - FFX (`ui/ffx/CommandMenu.ts`): `onSubButton` and `onTargetButton` each
 *   handle `'cancel'`; **`onTopButton` has no cancel branch at all.**
 * - FFX-2 (`ui/ffx2/CommandMenu.ts`): its `KEY_CANCEL` branch steps
 *   `target -> sub -> top` and then does nothing — at `view === 'top'` it
 *   `preventDefault()`s and returns.
 *
 * So at the top row — which is exactly where a player sits when they decide to
 * pause — Esc is unbound in both games and free for the pause menu to take.
 *
 * Each menu publishes its own answer here as it changes view; `BattleScreen`'s
 * `canPauseOnCancel` reads it. A module-level flag rather than a field on
 * `HudPort` because the presenter calls `chooseCommand()` outside App's
 * per-frame screen loop and the screen has no handle on the open menu — the
 * same reason `setRawInputSuspended` in `ui/ffx/rawInput.ts` is shaped this way.
 */

let ownsCancel = false;

/**
 * Called by a command menu whenever its view changes.
 *
 * `true` in a submenu or while targeting (Esc means "back"), `false` at the top
 * row and whenever no menu is open (Esc is free).
 */
export function setMenuOwnsCancel(value: boolean): void {
  ownsCancel = value;
}

/** Whether an open command menu would act on Esc right now. */
export function menuOwnsCancel(): boolean {
  return ownsCancel;
}
