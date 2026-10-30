/**
 * The state of one encounter: the scene, the stage hooks, the presenter, the engine and the HUD it was handed, the pause and settle bookkeeping.
 *
 * `BattleScreen.ts` was one 1,085-line class. It is now a short chain of classes, every layer calling only the layers below it:
 * `BattleScreenBase` (state) -> `BattleScreenPause` (the pause, the input, the stall watch) -> `BattleScreenCard` (the battle-start card) -> `BattleScreenEncounter` (enter, the encounter loop)
 * -> `BattleScreen` (the frame, the debug beats, exit; import that one from `BattleScreen.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where another layer reads it.
 * Source-text tests read the screen's wiring across the whole chain (`tests/unit/helpers/battleScreenSource.ts`).
 */

import type { Vector3 } from 'three';
import type { BattleEngine, BattleSetup, EnemyGroupDef } from '../../battle/common/types.ts';
import { NO_FLOW, type FlowHandle } from '../../audio/sfxV2/flowSlots.ts';
import { BattlePresenter } from '../../engine/BattlePresenter.ts';
import { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { BeatClock } from '../../engine/BeatClock.ts'; // MF-08: the presenter's beats are counted in this screen's frame clock
import type { HudPort } from '../../engine/HudPort.ts';
import type { LoadedScene } from '../../scenes/index.ts';
import { Screen } from '../Screen.ts';
import type { ChainCheckpoint } from './BattleChainCheckpoint.ts';
import type { OfferingOverlay } from '../../ui/ffx/offering/OfferingScreen.ts';
import { BattleStartBanner } from '../../ui/common/BattleStartBanner.ts';
import type { MidBattleCutscenes } from './BattleScreenCutscenes.ts';
import type { MomentOverlay } from '../../ui/common/transitions/index.ts';
import type { ProStageLayer } from '../../ui/common/proStage/ProStageLayer.ts';
import { PauseScreen } from './PauseScreen.ts';
import type { StageHook as AirshipBattleHook } from './BattleScreenStageHook.ts';
import type { MarkRecorder } from '../markRecorder.ts';
import type { SpectacleHandle } from './battleSpectacle.ts'; // eye-candy option C, `?fx=c` only
import { SETTLE_WINDOW_MS, type BattleScreenOptions, type BattleScreenResult } from './BattleScreenTypes.ts';

export abstract class BattleScreenBase extends Screen {
  protected readonly opts: BattleScreenOptions;
  protected scene: LoadedScene | null = null;
  protected stage: PaintedStage | null = null;
  protected airship: AirshipBattleHook | null = null;
  protected spectacle: SpectacleHandle | null = null;
  protected presenter: BattlePresenter | null = null;
  protected engine: BattleEngine | null = null;
  protected hud: HudPort | null = null;
  protected cutscenes: MidBattleCutscenes | null = null;
  /** Letterbox bars, name slab and heartbeat vignette (`BattleMoments`). */
  protected momentOverlay: MomentOverlay | null = null;
  protected proStage: ProStageLayer | null = null;
  protected setup: BattleSetup | null = null;
  protected group: EnemyGroupDef | null = null;
  /** The hidden Last Summoning's offering screen while it is up (FFX only); the frame's input goes to it first (`handleInput`). */
  protected offering: OfferingOverlay | null = null;
  protected checkpoint: ChainCheckpoint | null = null;

  protected startedAt = 0;
  /** N1 (release 39.1, both games): the hidden mark key and the inputs since the battle began (`markRecorder.ts`); shows nothing. */
  protected markRecorder: MarkRecorder | null = null;
  protected startParty: string[] = [];
  protected links = 0;
  protected preview = false;
  protected finishedResolve: ((r: BattleScreenResult) => void) | null = null;

  // --------------------------------------------------------------- pausing

  /** The pause overlay while it is up. See {@link openPause}. */
  protected pauseScreen: PauseScreen | null = null;
  /** True while the presenter's clock is held. */
  protected presenterPaused = false;
  /** Sleeps parked on the pause gate, released when it opens. */
  protected pauseWaiters: Array<() => void> = [];
  protected readonly beats = new BeatClock(); // MF-08: ticked by `update` with the animation dt, released when the presenter is aborted
  /**
   * How much longer the field may still settle itself, in milliseconds.
   *
   * The lane has to be clear **in the frame**, and the frame is not fixed when
   * the field is staged: the camera eases from the establishing shot into the
   * idle rig over the opening seconds, and a lane relaxed against frame one is
   * relaxed against the wrong framing. Measured live, that is exactly what
   * happened — Chapter 1 and Chapter 5 settled and Chapter 3 did not, because
   * its camera was still moving when the budget ran out.
   *
   * So the window is a real one, it re-arms on camera movement inside it, and
   * it is **over before the player's first decision**: moving enemies when a
   * command goes live was option D's idea and Bailey did not pick it.
   */
  protected formationSettleMs = SETTLE_WINDOW_MS;
  /** Where the camera was at the last relaxation, to notice it has moved. */
  protected lastSettleCam: Vector3 | null = null;
  /** True once a relaxation pass has come back with nothing left to move. */
  protected formationSettled = false;

  /** How many formations this chapter chains through. Measured in `enter`. */
  protected chainLength = 1;
  /** Where the player asked to go from the pause menu. See {@link requestExit}. */
  protected exitIntent: 'restart' | 'chapter-select' | 'title' | null = null;
  /** Set by the raw `P` listener; consumed by the next `handleInput`. */
  protected pauseKeyPressed = false;
  /** The small PAUSE chip in the HUD corner — the mouse's way in. */
  protected pauseChip: HTMLElement | null = null;
  /** The approved battle-start boss card while it is up. See {@link showBattleStart}. */
  protected battleStartBanner: BattleStartBanner | null = null;
  /** SFX parity: the encounter's opening sounds, ended with the screen (`audio/sfxV2/flowSlots.ts`). */
  protected encounterSfx: FlowHandle = NO_FLOW;

  /**
   * Set by {@link exit}. `App.replace` can tear this screen down while `enter()`
   * is still awaiting its loads or the battle-start card is up, and both carry
   * on afterwards: every await below checks this before touching anything.
   */
  protected exited = false;
  /**
   * Lane "budgets-2" (review R1 and R2): this screen's own fight number (`LeaveRelease.beginFight`), the number of the phone hold it shut (`LoadHold.activeHold`, 0 when it held nothing) and whether
   * every figure was built. A screen that is overtaken by `App.replace` and finishes `enter()` later must only undo what it did itself: it releases its own hold, ends its own fight, and judges the
   * caches only when its stage was built (a fight that never asked for its whole set cannot say what it did not use).
   */
  protected fightId = 0;
  protected holdId = 0;
  protected stageBuilt = false;
  /** False until the field's shaders are compiled: nothing draws it before (PR-0061). */
  protected fieldShown = false;

  /** Resolves when the encounter ends (victory, defeat, escape or exit). */
  readonly finished: Promise<BattleScreenResult>;

  constructor(opts: BattleScreenOptions) {
    super();
    this.opts = opts;
    this.finished = new Promise((resolve) => {
      this.finishedResolve = resolve;
    });
  }

  /** Frees what `enter()` built; the leaf class implements it (`exit` uses it too), and `enter()` calls it when it was overtaken by `exit`. */
  protected abstract releaseParts(): void;
}
