/**
 * The battle screen's debug surface: the capture tool's playback and camera
 * triggers, and the engine half of `BattleScreen.snapshot()`.
 *
 * Pulled out of `BattleScreen.ts` so the screen keeps to its sequencing
 * (load, card, chain, pause, teardown). Nothing here decides anything a
 * player can reach; the e2e specs and `tools/gallery.mjs` read what it returns.
 */

import type { BattleState } from '../../battle/common/types.ts';
import type { BattlePresenter } from '../../engine/BattlePresenter.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import type { LoadedScene } from '../../scenes/index.ts';

const SPEED_TRIGGERS = { 'battle:fast': 'fast', 'battle:skip': 'skip', 'battle:normal': 'normal' } as const;

/**
 * The playback, HUD and camera-rig triggers, then the scene's own. Returns
 * whether anything answered `name`. The pause triggers stay on the screen,
 * which owns the pause.
 */
export function battleDebugTrigger(
  name: string,
  presenter: BattlePresenter | null,
  hud: HudPort | null,
  scene: LoadedScene | null,
): boolean {
  if (Object.hasOwn(SPEED_TRIGGERS, name)) {
    presenter?.setSpeed(SPEED_TRIGGERS[name as keyof typeof SPEED_TRIGGERS]);
    return true;
  }
  if (name === 'hud:on' || name === 'hud:off') {
    hud?.setVisible(name === 'hud:on');
    return true;
  }
  if (name.startsWith('rig:')) {
    const rig = name.slice(4);
    if (!scene?.battleCamera.rigNames.includes(rig)) return false;
    void scene.battleCamera.moveTo(rig, 700);
    return true;
  }
  return scene?.trigger(name) ?? false;
}

/** The `battle` field of `BattleScreen.snapshot()`: null before an engine exists. */
export function battleStateSnapshot(state: Readonly<BattleState> | undefined): Record<string, unknown> | null {
  if (!state) return null;
  return {
    turn: state.turn,
    ticks: state.ticks,
    events: state.log.length,
    result: state.result,
    combatants: Object.values(state.combatants).map((c) => ({
      id: c.id,
      hp: c.hp,
      maxHp: c.stats.maxHp,
      mp: c.mp,
      alive: c.alive,
      side: c.side,
      statuses: Object.keys(c.statuses),
    })),
  };
}
