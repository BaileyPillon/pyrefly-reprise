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
import { FFX2Engine, type AtbMode, type AtbSpeed } from '../../battle/ffx2/index.ts';
import { Ff7Engine } from '../../battle/ff7/index.ts';
import { ff7Registry } from '../../data/ff7/index.ts';
import { readSetting } from '../SaveData.ts';
import { waitSplitFromUrl } from '../waitSplitSwitch.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { FFXBattleHud } from '../../ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../ui/ffx2/FFX2BattleHud.ts';
import { withCoach } from '../../ui/coach/CoachLayer.ts';
import { withPhoneLayout } from '../../ui/common/phoneBattle.ts';
import { installFfxPhoneHud } from '../../ui/ffx/phoneHud.ts';
import { installFfx2PhoneHud } from '../../ui/ffx2/phoneHud.ts';
import { ffx2EngineOptions, registerBattleContent } from './BattleScreenContent.ts';
import { withOversoulLook, type OversoulField } from '../../engine/OversoulLook.ts';
import { withOmnisDiscs } from '../../engine/OmnisDiscTap.ts';
import { withOmnisGlow } from '../../engine/OmnisGlowLook.ts';
import { withOmnisReadout } from '../../ui/ffx/OmnisReadout.ts';
import { withSinHud } from '../../ui/ffx/SinHud.ts';
import { Ff7BattleHud } from '../../ui/ff7/Ff7BattleHud.ts';
import { withStatusLooks, type StatusField } from '../../ui/common/withStatusLooks.ts';
import { isPhysicalAction } from '../../engine/EnemyActionPose.ts';
import { abilityFactsFor } from './battleAbilityFacts.ts';

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
  // FF7 (the hidden Guard Scorpion experiment) gets its own engine, `src/battle/ff7/`: never an
  // FFX2Engine (docs/plans/ff7-game-branch-audit.md). FF7 only: its content is the FF7 registry,
  // and it is not handed FFX-2's saved ATB mode (`applyAtbConfig`); FF7's own mode is its default,
  // Recommended (research/ff7-battle-core.md §2.5), until a Config row exists.
  if (game === 'ff7') {
    const engine = new Ff7Engine({ registry: ff7Registry() });
    engine.setSeed(setup.seed);
    engine.init(setup);
    return engine;
  }
  await registerBattleContent();
  const automated = opts.automated === true;
  // A used engine holds a finished battle's state, so every battle gets its own.
  const engine: BattleEngine =
    game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: automated })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: !automated });
  applyAtbConfig(engine);
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/**
 * Tell an FFX-2 engine the player's Config ATB speed (the pause screen's ATB
 * SPEED row, `Settings.ffx2AtbSpeed`; `research/ffx2-combat-core.md` §1.2).
 *
 * Called when the engine is built and again when the pause closes, so a change
 * made mid-fight lands on the very next tick — the clock is frozen while the
 * menu is up. An unset value is Normal, the engine exactly as it always was.
 * FFX has no `setAtbSpeed` (CTB has no tick rate), so this is a no-op there
 * (AGENTS.md rule 14).
 */
export function applyAtbSpeed(engine: BattleEngine | null): void {
  const x2 = engine as (BattleEngine & { setAtbSpeed?: (s: AtbSpeed) => void }) | null;
  x2?.setAtbSpeed?.(readSetting('ffx2AtbSpeed') ?? 'normal');
}

/**
 * Tell an FFX-2 engine the player's Config ATB mode (the pause screen's X-2
 * BATTLE ACTIVE/WAIT row, `Settings.ffx2Atb`; `research/ffx2-combat-core.md`
 * §1.5). **Wait** unless the save says Active (Bailey, D-029). Same timing as
 * {@link applyAtbSpeed}: at chapter start and when the pause closes, before the
 * presenter is released, so the first pump step after the pause already runs
 * the new mode. FFX has no `setAtbMode` (CTB has no clock under a menu), so
 * this is a no-op there (AGENTS.md rule 14).
 */
export function applyAtbMode(engine: BattleEngine | null): void {
  const x2 = engine as (BattleEngine & { setAtbMode?: (m: AtbMode) => void; setWaitSplit?: (on: boolean) => void }) | null;
  x2?.setAtbMode?.(readSetting('ffx2Atb') === 'active' ? 'active' : 'wait');
  const split = waitSplitFromUrl();
  if (split !== null) x2?.setWaitSplit?.(split);
}

// `?wait=split` / `?wait=hold`: `app/waitSplitSwitch.ts` (the coach reads it too).
export { waitSplitFromUrl };

/** FFX-2's Config "ATB Mode and Speed", both halves: {@link applyAtbMode} and {@link applyAtbSpeed}. */
export function applyAtbConfig(engine: BattleEngine | null): void {
  applyAtbMode(engine);
  applyAtbSpeed(engine);
}

// -------------------------------------------------------------------- HUD

/**
 * A fresh HUD for a game. One per battle; the screen mounts and unmounts it.
 *
 * Wrapped in {@link withCoach}, which is what puts Bailey's approved first-use
 * lines on the HUD — Auron's in the FFX chapters, holding the decision until a
 * confirm press, and Rikku's in the FFX-2 chapters, fading on their own with
 * **nothing paused** (`src/ui/coach/CoachLayer.ts` has the table and the
 * sources). The wrapper is transparent when coaching is off, already seen, or
 * suppressed with `?coach=off`, so every capture harness sees the bare HUD.
 */
export function createHud(game: GameId, field?: () => (OversoulField & StatusField) | null, engine?: BattleEngine | null, artNamespace?: string, advisorCap?: number): HudPort {
  // FF7 gets its own HUD: Bailey's option A made more faithful (docs/plans/ff7-hud-faithful-a-spec.md).
  // Never the FFX-2 HUD, never a coach, never the shared phone rail: it draws FF7's own phone band (FF7 only).
  // The Item list's counts come from the engine's bag (the HUD holds no numbers of its own).
  if (game === 'ff7') return new Ff7BattleHud(engine instanceof Ff7Engine ? { itemCount: (id) => engine.inventory()[id] } : {});
  // The upright-phone layout, option B (Bailey, 2026-09-25; `ui/common/phoneBattle.ts`).
  // The FFX-2 HUD: the engine (advisor v3), and the scene's art namespace (the experimental Leblanc chapter's party heads come from its own paintings).
  // `advisorCap`: the scene's cap on the advisor card's height (`SceneStaging.advisorCap`; Chapter VI's low-standing fiends), unset everywhere else.
  const ffx2Options = { engine: engine instanceof FFX2Engine ? engine : null, ...(artNamespace ? { artNamespace } : {}), ...(advisorCap !== undefined ? { advisorCap } : {}) };
  const hud: HudPort = game === 'ffx'
    ? withSinHud(withOmnisReadout(withPhoneLayout(new FFXBattleHud(), installFfxPhoneHud)))
    : withPhoneLayout(new FFX2BattleHud(ffx2Options), installFfx2PhoneHud); // advisor v3
  // The Oversoul look (FFX-2 only: Oversoul exists only in FFX-2), on the field the screen passes in.
  // Inert unless an Oversoul form is on the field (`engine/OversoulLook.ts`). The FFX side gets the
  // Mortiphasm disc colours and Omnis's red glow (FFX only, Chapter XII; inert without the Omnis state,
  // `engine/OmnisDiscTap.ts`, `engine/OmnisGlowLook.ts`). The disc strip and the intent line are
  // `ui/ffx/OmnisReadout.ts`, on the FFX HUD above (the same Chapter XII gate). The Sin clock and the Fin
  // plate are `ui/ffx/SinHud.ts` (FFX only, Chapters XVII and XVIII; inert without Sin's flags).
  // Status display O3 (Bailey's pick, 2026-09-29; both games, each its own table): the looks on the
  // figures, the message line, the cure hint and the guard rails (`ui/common/withStatusLooks.ts`).
  const facts = abilityFactsFor(game);
  const looks = !field ? hud : withStatusLooks(hud, game, field, (id) => isPhysicalAction(facts(id)));
  const tapped = !field ? looks : game === 'ffx2' ? withOversoulLook(looks, field) : withOmnisGlow(withOmnisDiscs(looks, field), field);
  return withCoach(game, tapped);
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
