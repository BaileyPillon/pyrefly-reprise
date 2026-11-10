/**
 * The presenter-side holder of the HUD's held list and the Wait chip during a Special's sequence and for the whole life of the form (FFX-2 only: the three Special
 * dresspheres exist only in FFX-2; nothing creates one while the switch `specialDressUp` is OFF).
 *
 * The HUD draws the engine's `activeIds` unless it is told to hold a list (`HudPort.holdRows`, optional and additive). During a Special the engine's `activeIds` names the
 * three parts from the first event, but the frames show the three girls, then her row alone, then the three parts, so the presenter holds each list in turn. The chip is the
 * HUD's existing Wait/Active indicator (`HudPort.showAtbChip`, `setAtbMode`). Every HUD call is wrapped like `BattlePresenterBase.showAtbMode`: a HUD that throws must not
 * stop a battle. While held, the beats call the FULL sync, never `syncVitals`, so the main's row shows the form's pools.
 */

import type { CombatantId } from '../battle/common/types.ts';

/** The three optional HUD members the holder uses; `HudPort` satisfies it. */
export interface HoldHud {
  holdRows?(ids: readonly CombatantId[] | null): void;
  showAtbChip?(on: boolean): void;
  setAtbMode?(mode: 'wait' | 'active'): void;
}

export interface PartyHold {
  /** True from the first `rows` call until `release`. */
  readonly active: boolean;
  /** Hold this list of rows (the girls, her alone, or the parts). May be called again at each change of the list. */
  rows(ids: readonly CombatantId[]): void;
  /** `chip(true, 'wait')` sets the HUD's mode to Wait and shows the chip; `chip(false, mode)` sets the mode (when given) and hides the chip. The rows stay held. */
  chip(on: boolean, mode?: 'wait' | 'active'): void;
  /** Let go of everything, once: the held list, the chip, the mode back to the Config's, then one full sync. Idempotent; safe from a `finally` and from `abort()`. */
  release(configMode: 'wait' | 'active', syncFull: () => void): void;
}

function guarded(label: string, run: () => void): void {
  try {
    run();
  } catch (err) {
    console.warn(`[presenter] ${label} failed`, err);
  }
}

export function createPartyHold(hud: HoldHud | null | undefined): PartyHold {
  let active = false;
  let chipShown = false; // a chip shown with no list held is still undone by `release`
  return {
    get active() {
      return active;
    },
    rows(ids) {
      active = true;
      guarded('holdRows', () => hud?.holdRows?.(ids));
    },
    chip(on, mode) {
      if (on) {
        chipShown = true;
        guarded('setAtbMode', () => hud?.setAtbMode?.(mode ?? 'wait'));
        guarded('showAtbChip', () => hud?.showAtbChip?.(true));
        return;
      }
      chipShown = false;
      if (mode !== undefined) guarded('setAtbMode', () => hud?.setAtbMode?.(mode));
      guarded('showAtbChip', () => hud?.showAtbChip?.(false));
    },
    release(configMode, syncFull) {
      if (!active && !chipShown) return;
      active = false;
      chipShown = false;
      guarded('holdRows', () => hud?.holdRows?.(null));
      guarded('setAtbMode', () => hud?.setAtbMode?.(configMode));
      guarded('showAtbChip', () => hud?.showAtbChip?.(false));
      guarded('syncFull', syncFull);
    },
  };
}
