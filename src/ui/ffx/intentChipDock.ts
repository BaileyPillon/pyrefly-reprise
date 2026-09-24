import { STAGE } from './hudSafeZones.ts';

/** Grid px between the parked `E ENEMY MOVE` chip and the CTB queue's top edge. */
export const CHIP_DOCK_GAP = 11;

/**
 * The CTB queue's authored rail on the grid, for the frames it is not up.
 *
 * `docs/ENGINE-API.md#hud-safe-area` gives it as 0.843..0.970 x 0.138..0.557 of
 * the frame — the *worst case under the name-plate cap*, not where today's cast
 * happens to put it — which on the 640x360 stage is x 539.5..620.8,
 * y 49.7..200.5. Only the top-right corner is used; see `FFXBattleHud.intentChipDock`.
 */
export const CTB_RAIL = { left: 539.5, top: 49.7, right: 620.8, bottom: 200.5 } as const;

/**
 * The arithmetic behind `FFXBattleHud.intentChipDock`, on its own so a test can
 * reach it without a laid-out browser. See that method for why the fallback
 * exists; `tests/unit/ui-ffx-hud.test.ts` pins the state that needed it.
 */
export function intentChipDockAt(
  ctb: { right: number; top: number; width: number; height: number },
  host: { left: number; top: number; width: number; height: number },
  scale: number,
): { x: number; y: number } | null {
  if (!scale) return null;
  if (ctb.width > 0 && ctb.height > 0) return { x: ctb.right, y: ctb.top - CHIP_DOCK_GAP * scale };
  const ox = host.left + (host.width - STAGE.width * scale) / 2;
  const oy = host.top + (host.height - STAGE.height * scale) / 2;
  return { x: ox + CTB_RAIL.right * scale, y: oy + (CTB_RAIL.top - CHIP_DOCK_GAP) * scale };
}
