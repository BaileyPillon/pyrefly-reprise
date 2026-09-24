/**
 * FFX-2's ATB clock on the battle HUD, the two small pieces split out of
 * `FFX2BattleHud.ts` so that file does not grow (it is far over the 400-line
 * house rule already; DEV.md "House rules"). **FFX-2 ONLY** (AGENTS.md rule
 * 14): FFX's CTB has no clock under a menu and no ATB Mode setting.
 *
 * - {@link paintAtbChip}: the Active / Wait indicator shown while a target
 *   cursor is live.
 * - {@link MenuLevelRelay}: where the open command menu's cursor is, for
 *   Wait's split (`research/ffx2-combat-core.md` §1.5: the clock runs at the
 *   top-level window and freezes in a submenu), relayed to the presenter
 *   through `HudPort.onMenuLevel`.
 */
import type { AtbMode } from '../../battle/ffx2/active.ts';

/** Where the open menu's cursor is: the top-level list, or a submenu / target cursor. */
export type MenuLevel = 'top' | 'deep';

/**
 * Paint FFX-2's **Active / Wait** indicator. It is a real FFX-2 Config entry —
 * the ATB either keeps counting while a menu is open (Active) or holds (Wait) —
 * and it is in the approved frame for exactly that reason: an FFX-2 player
 * aiming at Vegnagun needs to know whether the clock is still running. It shows
 * only over a target cursor, which holds the clock under Wait with or without
 * the split, so "WAIT — ATB HELD" is true wherever it appears. FFX's CTB has no
 * such setting and gets no such indicator [research/ffx-vs-ffx2-presentation.md,
 * the ATB/CTB rows].
 */
export function paintAtbChip(el: HTMLElement | null, mode: AtbMode): void {
  if (!el) return;
  const active = mode === 'active';
  el.classList.toggle('ffx2-atbmode--wait', !active);
  el.textContent = active ? 'ACTIVE — ATB RUNNING' : 'WAIT — ATB HELD';
}

/**
 * The open command menu's level, relayed to one listener (the presenter's,
 * `BattlePresenterActive.followMenuLevel`). A repeat report of the same level
 * is dropped; a listener that subscribes while a menu is open hears its level
 * at once; {@link closed} forgets the level when the menu goes away.
 */
export class MenuLevelRelay {
  private level: MenuLevel | null = null;
  private listener: ((level: MenuLevel) => void) | null = null;

  subscribe(listener: (level: MenuLevel) => void): () => void {
    this.listener = listener;
    if (this.level) listener(this.level);
    return () => {
      if (this.listener === listener) this.listener = null;
    };
  }

  report(level: MenuLevel): void {
    if (this.level === level) return;
    this.level = level;
    this.listener?.(level);
  }

  closed(): void {
    this.level = null;
  }
}
