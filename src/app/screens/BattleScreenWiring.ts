/**
 * Everything a battle is built from: the engine, its content, the HUD.
 *
 * This module began as late binding — `import.meta.glob` probes that found an
 * engine or a HUD the day an agent landed one, while those folders were still
 * being written. Every one of those modules exists now, so it is plain
 * construction, which is both easier to read and honest in the build: the
 * probes dragged every file under `src/ui/*` into a dynamic-import graph and
 * made Vite warn about each of them.
 *
 * The one piece of real work left here is {@link registerBattleContent}, the
 * join between `src/data/**` and the engines that the layering rule leaves to
 * the app (see `BattleScreenContent.ts`).
 */

import type { BattleEngine, BattleSetup, GameId } from '../../battle/common/types.ts';
import { FFXEngine } from '../../battle/ffx/index.ts';
import { FFX2Engine } from '../../battle/ffx2/index.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { FFXBattleHud } from '../../ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../ui/ffx2/FFX2BattleHud.ts';
import { ffx2EngineOptions, registerBattleContent } from './BattleScreenContent.ts';

// ---------------------------------------------------------------- engines

/**
 * A fresh engine for a game, with its content registries populated.
 *
 * The {@link registerBattleContent} call is the important half: without it the
 * FFX engine resolves against its four structural `CORE_ABILITIES` and nothing
 * else, so no spell, item or Overdrive exists and a boss can only auto-attack.
 */
export interface CreateEngineOptions {
  /**
   * Nobody is at the controls — auto-battle, e2e, the critic.
   *
   * Timed-input Overdrives then resolve from the engine's own seeded roll
   * instead of suspending on a `minigame-request`. This is not optional for an
   * automated run: a bare re-submit of the command does **not** make either
   * engine roll a default (CONTRACTS.md says it should), so without the flag
   * Tidus re-picks a ready Spiral Cut, the request re-fires, he keeps the turn,
   * and the battle loops — measured at 19,916 identical picks before a cap.
   *
   * The two engines spell the same switch differently: FFX takes
   * `autoResolveMinigames: true`, FFX-2 takes `minigames: false`.
   */
  automated?: boolean;
}

export async function createEngine(
  game: GameId,
  setup: BattleSetup,
  opts: CreateEngineOptions = {},
): Promise<BattleEngine> {
  await registerBattleContent();
  const automated = opts.automated === true;
  // A used engine holds a finished battle's state, so every battle gets its own.
  const engine: BattleEngine =
    game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: automated })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: !automated });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

// -------------------------------------------------------------------- HUD

/** A fresh HUD for a game. One per battle; the screen mounts and unmounts it. */
export function createHud(game: GameId): HudPort {
  return game === 'ffx' ? new FFXBattleHud() : new FFX2BattleHud();
}

// --------------------------------------------------------- cutscene runner

/**
 * Mid-battle cutscenes are built per battle, bound to the live field — see
 * `BattleScreenCutscenes.ts`.
 */
export { createMidBattleCutscenes } from './BattleScreenCutscenes.ts';
export type { MidBattleCutscenes } from './BattleScreenCutscenes.ts';

// ----------------------------------------------------------------- report

/**
 * Content registered right now, for `__pyrefly.wiring()`.
 *
 * Deliberately **only counts**. Earlier versions also returned
 * `engineFfx: true` / `cutsceneRunner: true`, but those were constants — a
 * boolean that is always true proves nothing, and that is exactly the shape
 * the unregistered-content bug hid behind. Whether a cutscene actually plays
 * is asserted by running one (see the chapter e2e spec), not by a flag.
 */
export async function wiringReport(): Promise<Record<string, number | string>> {
  return { ...(await registerBattleContent()) };
}
