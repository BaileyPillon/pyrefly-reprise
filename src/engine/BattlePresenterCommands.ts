/**
 * The decisions: submit a command and play what it produced, resolve a minigame's request, and ask the HUD (or the auto strategy, or the FFX-2 clock under an open menu) for the next command.
 *
 * `BattlePresenter` was one 800-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattlePresenterBase` -> `BattlePresenterPlayback` -> `BattlePresenterCommands` -> `BattlePresenter` (import that one from `BattlePresenter.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { BattleEngine, Command, CombatantId, MinigameKind, AvailableCommand, AtbSnapshot, TurnPreview } from '../battle/common/types.ts';
import { clockEngine, followMenuLevel, runMenuClock } from './BattlePresenterActive.ts';
import { menuStance, settleForMenu } from './BattlePresenterSettle.ts'; // `menuStance` (fluidity pass, MF-05) is re-exported there: the menu's ready stance, with or without the ready painting
import { aeonMenuRows } from './PayRows.ts';
import type { BattleOutcome, PlayResult } from './BattlePresenterPorts.ts';
import { firstEnabled, askMinigame, backOutOfMinigame, outcomeOf, previewOf } from './BattlePresenterUtil.ts';
import { BattlePresenterPlayback } from './BattlePresenterPlayback.ts';

export class BattlePresenterCommands extends BattlePresenterPlayback {
  /** Submit one command and play everything it produced, minigames included. */
  protected async submit(engine: BattleEngine, command: Command): Promise<BattleOutcome | null> {
    // A reel request raised while this menu was open is answered before this command resolves.
    if (this.deferredMinigame) {
      const ended = await this.settleDeferredMinigame(engine);
      if (ended) return ended;
    }
    this.lastCommand = command;
    // FF7 resolves one action at a time (research/ff7-battle-core.md §2.6): a command confirmed while the pump
    // plays the boss's turn waits until that turn has finished on screen (repair item 3). FFX and FFX-2 as before.
    if (engine.state().game === 'ff7') await this.playing;
    const events = engine.submit(command);
    this.queuedHud(engine); // PR-0104 (FFX-2 only): name the queued command now, not after its pose has played
    let res = await this.play(events);
    this.syncHud(engine);

    // A minigame suspends the loop; the same command comes back with `extra`.
    let guard = 0;
    while (res.minigame && guard++ < 4) {
      res = await this.resolveMinigame(engine, res.minigame, false);
      this.syncHud(engine);
    }
    if (res.minigame && this.auto) this.minigamesNeedOverlay = true;

    if (res.ended) return outcomeOf(res.result ?? engine.state().result);
    return null;
  }

  /** Open the overlay for a request parked by {@link deferredMinigame} and resolve the spin. */
  protected async settleDeferredMinigame(engine: BattleEngine): Promise<BattleOutcome | null> {
    let request = this.deferredMinigame;
    this.deferredMinigame = null;
    let guard = 0;
    while (request && guard++ < 4) {
      const res = await this.resolveMinigame(engine, request, false);
      this.syncHud(engine);
      if (res.ended) return outcomeOf(res.result ?? engine.state().result);
      request = res.minigame ?? null;
    }
    return null;
  }

  /**
   * Open the overlay named by the request, then re-submit the **same** command
   * with the outcome in `extra`. With nobody at the controls it goes back bare
   * (automated battles auto-resolve minigames, `BattleScreenWiring.createEngine`).
   * Hotfix 24: a cancelled or broken picker returns an FFX turn to its menu.
   */
  protected async resolveMinigame(
    engine: BattleEngine,
    request: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> },
    engineDefault: boolean,
  ): Promise<PlayResult> {
    // The command that raised it, which for a charged action is not the last one submitted:
    // the other two girls act during her wind-up.
    const base = this.commandBy.get(request.who) ?? this.lastCommand;
    if (!base) return { dropped: 0 };
    const answer = !engineDefault && !this.auto ? await askMinigame(this.deps.hud, request) : undefined;
    if (answer && answer.kind !== 'result' && backOutOfMinigame(engine)) return { dropped: 0 };
    const extra = answer?.kind === 'result' ? answer.result : undefined;
    // FFX's timed inputs are Overdrives; FFX-2's (Trigger Happy, Lady Luck's reels) are ordinary menu
    // abilities. Attaching the outcome to `overdrive` alone threw every X-2 result away: the player
    // stopped three reels, the command went back bare, and the engine rolled a spin of its own.
    const carries = base.kind === 'overdrive' || base.kind === 'ability';
    return this.play(engine.submit(extra && carries ? { ...base, extra } : { ...base }));
  }

  /** Ask the HUD (or the auto strategy) for a command. */
  protected async chooseCommand(
    engine: BattleEngine,
    actorId: CombatantId,
    commands: AvailableCommand[],
  ): Promise<Command | null> {
    this.callouts.close(); // PR-0061(a): from the first menu on, every beat is held
    if (this.auto) {
      // Taken over mid-fight on an engine built for a human: a timed Overdrive
      // would suspend forever, so the strategy simply does not see those rows.
      const offered = this.minigamesNeedOverlay
        ? commands.filter((c) => !c.opensMinigame && c.command.kind !== 'overdrive')
        : commands;
      // An automated run must never fall through to the menu: there is nobody
      // to answer it and the battle would hang forever. A strategy that has no
      // opinion gets the first legal row instead.
      return this.auto(actorId, offered, engine) ?? firstEnabled(offered);
    }
    const hud = this.deps.hud;
    if (!hud) return firstEnabled(commands);

    menuStance(this.ctx, actorId); // setPose('ready'): the stance and its painting (or the idle's under ?stance=v1a|v1b)
    // PR-0005/PR-0061: the cut-in plays over the settle and the open menu, never in front of it.
    void this.cutIns.play(engine.state(), actorId);
    await settleForMenu(this.ctx); // PR-0094: the whole field in frame
    const previewRank = (cmd: AvailableCommand | null): TurnPreview[] | AtbSnapshot =>
      previewOf(engine, cmd?.command);

    // Racing the menu against an interrupt is what lets `setAutoPlay` (and so
    // `__pyrefly.autoBattle()`) take over a fight that is already waiting on a
    // human. The HUD's own promise is simply abandoned; the `syncHud` that
    // follows the submitted command re-renders it.
    const interrupt = new Promise<Command>((resolve) => {
      this.pendingMenu = { actorId, commands, engine, resolve };
    });

    // FFX-2's ATB clock under this menu, Wait or Active (`runMenuClock`).
    // FFX gets `null` here and behaves exactly as it always has (rule 14).
    const clock = clockEngine(engine);
    const unfollow = followMenuLevel(hud, clock, this.menuWake); // Wait's split: before the menu opens
    let settled = false;
    // Yojimbo's one Pay row becomes a ladder of amounts, and a Sister's order rows get short words, for a person's menu (`PayRows.ts`; any other menu comes back as it was). The auto strategy took its own branch above and
    // the interrupt below hands it the engine's own rows, so only the keys see the ladder.
    const shown = aeonMenuRows(commands, gilLeft(engine));
    const decided = Promise.race([hud.chooseCommand(actorId, shown, previewRank), interrupt]).then(
      (command) => {
        settled = true;
        return command;
      },
      (err: unknown) => {
        settled = true;
        throw err;
      },
    );
    // The pump may win the race below, leaving `decided` pending forever; a
    // late rejection from an abandoned menu must not surface as an unhandled
    // one, and this handler is separate from the race's own.
    void decided.catch(() => undefined);

    // Tear the DOM menu down and release the cancel claim, or Esc belongs to a
    // menu that is no longer on screen and the pause key stops working — a
    // defect this project has already paid for once.
    const abandon = (): null => {
      try {
        hud.closeCommandMenu?.();
      } catch (err) {
        console.warn('[presenter] HUD closeCommandMenu threw', err);
      }
      this.inputAbandoned = true;
      return null;
    };

    /**
     * The last gate before a command is submitted, **FFX-2, and only once
     * the clock has run under this menu** (Active, or a pause flip to it).
     *
     * A command can win the race above and still be worthless: the pump plays
     * an enemy's burst with `await`, and the player may confirm *during* that
     * animation, in the same step the burst KO's (or Stops, or chains) the
     * menu's owner. `runActivePump` deliberately lets a command that arrived
     * mid-`play` win, so it returns `'settled'` without re-asking — which left
     * the presenter submitting a dead girl's command. `FFX2Engine.submit`
     * refuses it at the root; this is the half that also closes the menu and
     * lets the loop ask the engine what happens next, instead of a submit that
     * silently produces nothing.
     */
    const finish = (command: Command, ran = true): Command | null =>
      ran && clock && !clock.inputValid(actorId) ? abandon() : command;

    try {
      if (!clock) return await decided;
      this.ctx.stage.camera.hold?.(true); // PR-0150: FFX-2 holds the menu/target frame (TargetFrameHold.ts)
      const outcome = await runMenuClock({
        engine: clock,
        actorId,
        decided,
        settled: () => settled,
        aborted: () => this.aborted,
        sleep: (ms) => this.baseSleep(ms),
        now: this.now,
        play: async (events) => {
          const res = await this.play(events);
          if (res.minigame) this.deferredMinigame = res.minigame; // a reel asked while this menu was open
          return res;
        },
        interrupted: () => this.deferredMinigame !== null,
        syncGauges: (snapshot) => this.syncGauges(snapshot),
        modeChanged: () => this.menuWake.park(),
        epoch: () => this.menuWake.epoch,
        showMode: (mode) => this.showAtbMode(mode),
      });
      if ('command' in outcome) return finish(outcome.command, outcome.ran);
      if (outcome.stop === 'invalidated') return abandon();
      // `'settled'` also covers a torn-down presenter, whose menu promise may
      // never resolve at all; awaiting it there would park this task forever.
      if (this.aborted) return null;
      return finish(await decided);
    } catch (err) {
      if (this.aborted) return null;
      console.warn('[presenter] command menu failed; falling back', err);
      return firstEnabled(commands);
    } finally {
      unfollow();
      this.ctx.stage.camera.hold?.(false);
      this.pendingMenu = null;
    }
  }
}

/** The party gil the player's Yojimbo is paid from (`state.flags['yojimbo:gil']`, mirrored by the engine after every change), or `undefined` when the build has no Yojimbo. */
function gilLeft(engine: BattleEngine): number | undefined {
  const v = engine.state().flags['yojimbo:gil'];
  return typeof v === 'number' ? v : undefined;
}
