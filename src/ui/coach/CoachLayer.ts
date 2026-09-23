/**
 * Teaching, wrapped around a battle HUD instead of built into one.
 *
 * {@link withCoach} takes the real `HudPort` and returns one that behaves
 * identically except that, the first time a mechanic is genuinely real, it puts
 * one line from `coachCopy.ts` on screen. Everything else is delegation.
 *
 * ## Why a wrapper and not an edit to the two HUDs
 *
 * `FFXBattleHud` and `FFX2BattleHud` already run five text surfaces between
 * them and are the two files every other onboarding defect in round 02 lives
 * in. A wrapper keeps the whole feature in one folder that
 * `node tools/orphans.mjs` can see, keeps both HUDs' line counts where they
 * are, and — the part that matters — makes the FFX/FFX-2 difference a single
 * readable branch instead of two divergent edits nobody can diff.
 *
 * ## Keyed by mechanic, not by chapter
 *
 * `docs/plans/onboarding-review.md` REQUIRED 1: a first-timer who opens the
 * board and picks Chapter 3 must be taught the same things as one who starts at
 * Chapter 1, and nothing may be authored against the unbuilt Macalania and
 * Leblanc chapters. So the triggers are situations, not places:
 *
 * | mark | fires when | game |
 * |---|---|---|
 * | `ffx-turn-order` | the command menu opens for the first time | FFX |
 * | `ffx-overdrive` | an Overdrive row is first offered and enabled | FFX |
 * | `ffx-aeon` | a Summon row is first offered and enabled | FFX |
 * | `ffx2-gauge` | the command menu opens for the first time | FFX-2 |
 * | `ffx2-dressphere` | the first `spherechange` event | FFX-2 |
 * | `ffx2-chain` | the first `chain` event above 1 | FFX-2 |
 *
 * ## What is never allowed to happen
 *
 * - **An FFX-2 fight is never held.** Every X-2 path here returns or resolves
 *   without awaiting the line, and the inner HUD's menu is opened in the *same
 *   turn of the event loop* as the line goes up; `onEvent` returns `undefined`,
 *   so the presenter does not wait for it either. Teaching costs an X-2 fight
 *   nothing (`research/ffx-vs-ffx2-presentation.md` §4.2 / FC-4). What this
 *   layer does **not** claim is anything about the engine's own clock during
 *   command input — see the badge note in `CoachMark.ts`.
 * - **A game never shows the other's speaker.** `marksFor(game)` is the only
 *   source of a line, so an FFX chapter cannot reach Rikku's deck.
 * - **Two surfaces are never up at once** (REQUIRED 4). One live mark, and the
 *   advisor card stands down under it (`coach.css`).
 * - **Nothing appears with coaching off**, by the player's own switch or by the
 *   harness's (`coachState.ts`).
 */

import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  GameId,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { HudPort, TargetingPort } from '../../engine/HudPort.ts';
import { readSetting } from '../../app/SaveData.ts';
import { CoachMark } from './CoachMark.ts';
import { marksFor, type CoachMark as CoachMarkDef, type CoachMarkId } from './coachCopy.ts';
import { markSeen, shouldShow } from './coachState.ts';

export interface CoachLayerOptions {
  /** Drop the fades. Defaults to `Settings.reduceMotion`. */
  reduceMotion?: boolean;
  /** Injectable clock, for the unit tests' fake timers. */
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (handle: number) => void;
}

/**
 * Which mark, if any, the command menu about to open should carry.
 *
 * Pure so it can be asserted without a DOM: hand it a game, the rows the engine
 * offered and a "has this been seen?" predicate, and it answers with the one
 * line to show — or null. The order inside a game is the deck's order, so the
 * most basic lesson always wins a tie.
 */
export function markForMenu(
  game: GameId,
  commands: readonly AvailableCommand[],
  seen: (id: CoachMarkId) => boolean,
): CoachMarkDef | null {
  const offers = (kind: Command['kind']): boolean =>
    commands.some((c) => c.enabled && c.command.kind === kind);
  for (const mark of marksFor(game)) {
    if (seen(mark.id)) continue;
    if (mark.id === 'ffx-turn-order' || mark.id === 'ffx2-gauge') return mark;
    if (mark.id === 'ffx-overdrive' && offers('overdrive')) return mark;
    if (mark.id === 'ffx-aeon' && offers('summon')) return mark;
  }
  return null;
}

/**
 * Which mark an event should carry. FFX-2 only — FFX teaches at the menu,
 * where the player is deciding and nothing is running.
 */
export function markForEvent(
  game: GameId,
  event: BattleEvent,
  seen: (id: CoachMarkId) => boolean,
): CoachMarkDef | null {
  if (game !== 'ffx2') return null;
  const want: CoachMarkId | null =
    event.type === 'spherechange'
      ? 'ffx2-dressphere'
      : event.type === 'chain' && event.count > 1
        ? 'ffx2-chain'
        : null;
  if (!want || seen(want)) return null;
  return marksFor(game).find((m) => m.id === want) ?? null;
}

class CoachedHud implements HudPort {
  private layer: HTMLElement | null = null;
  private live: CoachMark | null = null;

  constructor(
    private readonly game: GameId,
    private readonly inner: HudPort,
    private readonly opts: CoachLayerOptions,
  ) {}

  // ------------------------------------------------------------ delegation

  mount(root: HTMLElement): void {
    this.inner.mount(root);
    const layer = document.createElement('div');
    layer.className = 'coach-layer';
    layer.dataset['role'] = 'coach-layer';
    root.appendChild(layer);
    this.layer = layer;
  }

  unmount(): void {
    this.clear();
    this.layer?.remove();
    this.layer = null;
    this.inner.unmount();
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    this.inner.sync(state, preview);
  }

  syncVitals(state: BattleState): void {
    this.inner.syncVitals?.(state);
  }

  // The three optional FFX-2 clock methods. A wrapper that leaves an optional
  // `HudPort` method out hides it from the presenter: until the Wait-mode
  // repair pass the Active pump's `syncGauges` never reached the real HUD (the
  // bars stood still under an open menu while the clock ran), a torn-down
  // menu's `closeCommandMenu` never released its keyboard claim, and the mode
  // chip was never told Wait from Active. `ffx2-wait-mode-repair.test.ts`.

  syncGauges(snapshot: AtbSnapshot): void {
    this.inner.syncGauges?.(snapshot);
  }

  closeCommandMenu(): void {
    this.inner.closeCommandMenu?.();
  }

  setAtbMode(mode: 'wait' | 'active'): void {
    this.inner.setAtbMode?.(mode);
  }

  openMinigame(kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult> {
    // A minigame owns the whole screen; a line left under it would be the
    // second surface REQUIRED 4 forbids.
    this.clear();
    return this.inner.openMinigame(kind, params);
  }

  setVisible(visible: boolean): void {
    if (!visible) this.clear();
    if (this.layer) this.layer.style.display = visible ? '' : 'none';
    this.inner.setVisible(visible);
  }

  setProjector(
    project: (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null,
  ): void {
    this.inner.setProjector(project);
  }

  setTargetingPort(port: TargetingPort): void {
    this.inner.setTargetingPort?.(port);
  }

  update(dt: number): void {
    this.inner.update?.(dt);
    // FOC-05: `.mad__card` is re-solved by `MoveAdvisor.layout()` on its own
    // schedule (`CoachMark.recheckPosition`'s own comment), so an FFX line
    // has to keep checking, not just check once when it goes up.
    this.live?.recheckPosition();
  }

  // ----------------------------------------------------------- the teaching

  /**
   * The menu opens in the same turn of the event loop as the line, **in both
   * games** (FOC-01, critic/reviews/5e92289…-focused.json). It used to be the
   * game-aware split: FFX awaited the line before opening the menu at all, on
   * the theory that the engine is already parked waiting for a command so
   * holding *that* freezes nothing. It does not freeze the engine, but it did
   * freeze the presentation — the approved tile
   * `docs/concepts/onboarding/c-aurons-briefing/c2-first-use-ffx.png` pictures
   * Auron's line **beside** a visible command menu and a populated advisor
   * card, and the build measured `display: none` / zero children instead, with
   * the strategy guide's idle "Waiting for your turn." printed as if it were
   * still the player's turn to wait for it. FFX-2 never had this problem: it
   * already calls `show()` and throws the promise away — `CoachMark` resolves
   * an X-2 line immediately by construction — then opens the menu in the same
   * turn, so no gauge sees a gap. FFX now does the same thing structurally,
   * and only `CoachMark`'s own `holds` flag decides whether the line itself
   * waits for a confirm or fades on its own; see `CoachMark.show`.
   *
   * `raise()` runs **before** `inner.chooseCommand()`, not after: both attach
   * a `keydown` listener to `window`, and `CoachMark.onConfirmCapture` swallows
   * the confirm key only if it is already registered when the real menu's own
   * (bubble-phase) watcher would otherwise see the same press — the FFX
   * equivalent of PR-0051 (`docs/handoff/onboarding-c.md`). Registration order
   * is also what keeps a `window.dispatchEvent` test (no real capture-vs-bubble
   * traversal when the target *is* `window`) agreeing with a browser.
   */
  chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const mark = this.due(markForMenu(this.game, commands, (id) => !shouldShow(id)));
    if (mark) {
      markSeen(mark.id);
      void this.raise(mark);
    }
    return this.inner.chooseCommand(actorId, commands, previewRank);
  }

  /**
   * Never returns a promise the presenter has to wait on.
   *
   * `HudPort.onEvent` may resolve within ~600 ms, and an X-2 line lasts five
   * seconds. Returning `undefined` is what lets the fight carry on underneath
   * it — the whole point of C3's non-blocking voice.
   */
  onEvent(event: BattleEvent): void {
    // The menu was answered by something other than the player (`setAutoPlay`
    // racing the HUD's promise): a held FFX line would otherwise sit there
    // forever with nobody to press confirm.
    if (event.type === 'action-start' && this.live?.finished === false) this.clear();
    const mark = this.due(markForEvent(this.game, event, (id) => !shouldShow(id)));
    if (mark) {
      markSeen(mark.id);
      void this.raise(mark);
    }
    void this.inner.onEvent(event);
  }

  /** One surface at a time: a second candidate is simply dropped. */
  private due(mark: CoachMarkDef | null): CoachMarkDef | null {
    if (!mark || !this.layer) return null;
    if (this.live && !this.live.finished) return null;
    return mark;
  }

  private raise(mark: CoachMarkDef): Promise<unknown> {
    const layer = this.layer;
    if (!layer) return Promise.resolve(null);
    const line = new CoachMark({
      root: layer,
      mark,
      game: this.game,
      reduceMotion: this.opts.reduceMotion ?? readSetting('reduceMotion'),
      ...(this.opts.setTimer ? { setTimer: this.opts.setTimer } : {}),
      ...(this.opts.clearTimer ? { clearTimer: this.opts.clearTimer } : {}),
    });
    this.live = line;
    return line.show();
  }

  private clear(): void {
    this.live?.dismiss();
    this.live = null;
  }
}

/**
 * Wrap a HUD so it teaches once, in its own game's voice.
 *
 * `app/screens/BattleScreenWiring.ts`'s `createHud` is the only caller; every
 * battle in the game goes through it, which is what makes this module reachable
 * (AGENTS.md hard rule 4) rather than a subsystem nothing imports.
 */
export function withCoach(game: GameId, hud: HudPort, opts: CoachLayerOptions = {}): HudPort {
  return new CoachedHud(game, hud, opts);
}
