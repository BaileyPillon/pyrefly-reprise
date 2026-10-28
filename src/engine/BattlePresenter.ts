/**
 * The playback protocol from `docs/CONTRACTS.md`, made real.
 *
 * The engine is a pure state machine that answers *what happens next?*; this is
 * the only thing in the project that knows about **time**. It takes the ordered
 * `BattleEvent[]` an engine emits and plays them onto painted actors, VFX, the
 * camera, audio and the HUD, then asks the engine for the next decision.
 *
 * Imports nothing from `three` and touches no DOM: everything it drives is a
 * port from `BattlePresenterPorts.ts`, which is what lets the whole loop run in
 * Node under `tests/unit/presenter-*.test.ts` against fakes.
 *
 * Three places the loop deliberately stops:
 * - `minigame-request` — stop, open the overlay, re-submit the *same* command
 *   with `extra` set (CONTRACTS.md "Minigame protocol").
 * - `script-trigger` — pause, run the chapter's mid-battle script, resume the
 *   remaining events.
 * - `victory` / `defeat` — hand the `BattleResult` back to the screen, which
 *   owns chaining, the results screen and retry.
 */

import type { BattleEngine, FFX2BattleEngine } from '../battle/common/types.ts';
import { settleOpening } from './BattlePresenterSettle.ts'; // `menuStance` (fluidity pass, MF-05) is re-exported there: the menu's ready stance, with or without the ready painting
import { playOpening } from './OpeningSkip.ts';
import type { BattleOutcome } from './BattlePresenterPorts.ts';
import { INPUT_STREAK_LIMIT, LIVELOCK_SPINS, outcomeOf } from './BattlePresenterUtil.ts';
import { headlineEnemy } from '../battle/common/headlineEnemy.ts';
import { BattlePresenterCommands } from './BattlePresenterCommands.ts';

// Re-exported: the loop's public types live with the ports (`BattlePresenterPorts.ts`).
export type { AutoStrategy, BattleOutcome, PlayResult } from './BattlePresenterPorts.ts';

export class BattlePresenter extends BattlePresenterCommands {
  // --------------------------------------------------------------- main loop

  /**
   * The CONTRACTS.md loop, start to finish. Returns how the battle ended; the
   * screen owns what happens next (chain, results, retry).
   */
  async run(engine: BattleEngine, link: { headline?: string; bossId?: string; moreLinks?: boolean } = {}): Promise<BattleOutcome> {
    this.ctx.moreLinks = link.moreLinks === true; // the chain says whether another formation follows (`BattleEncounterChain`)
    // Ground the mid-burst row projection before a single event is played. The
    // first burst of a fight (and of every later link of a chain, which re-runs
    // on a fresh engine) happens before any `syncHud` in the loop below.
    this.seedVitals(engine);
    this.queuedEngine = engine; // PR-0104: `queuedHud` reads it at each action's start and end
    // A-1 (FFX-2 only): an engine with an ATB clock gets the wait-camera fit rule (`ShotFit.ts`); FF7's ATB is not FFX-2's (CHK-B2-8).
    this.ctx.moments.shots.ffx2Framing = typeof (engine as { tick?: unknown }).tick === 'function' && engine.state().game !== 'ff7';

    // The opening shot, once per encounter: the party slides in, then the
    // headline enemy gets its slow push and name plate. A chained formation
    // (Yunalesca's forms, the Vegnagun chain) re-enters `run` on the same
    // presenter and gets the reveal for its *new* boss only.
    await this.openOn(engine, link.headline, link.bossId);

    /** Consecutive decisions that left `state().log` exactly as it was. */
    let idleSpins = 0;
    /** Consecutive player-input decisions with nothing in between. */
    let inputStreak = 0;
    let streakActor = '';
    let lastLogLength = engine.state().log.length;

    for (;;) {
      if (this.aborted) return { kind: 'aborted' };

      // A charged timed input (the reels) asked for its overlay out of the clock.
      if (this.deferredMinigame) {
        const ended = await this.settleDeferredMinigame(engine);
        if (ended) return ended;
      }

      // A decision that produces no events resolves its promise as a
      // microtask, and a run of them never returns to the event loop at all —
      // no timers, no rAF, a page that looks hung rather than slow. Yielding a
      // real macrotask keeps the frame loop (and any watchdog) alive.
      if (idleSpins > 0) await this.baseSleep(0);

      if (idleSpins > LIVELOCK_SPINS) {
        console.error(
          `[presenter] the engine produced ${LIVELOCK_SPINS} decisions in a row ` +
            `without emitting a single event (log stuck at ${lastLogLength}); ` +
            'abandoning the battle rather than spinning forever',
        );
        return { kind: 'aborted' };
      }

      this.phase = 'decision';
      const decision = engine.nextDecision();

      switch (decision.kind) {
        case 'battle-over':
          this.syncHud(engine);
          return outcomeOf(decision.result);

        case 'resolved': {
          inputStreak = 0;
          const res = await this.play(decision.events);
          this.syncHud(engine);
          if (res.minigame) {
            // An AI actor should never raise one, but if it does, resolve it
            // with the engine's own default by re-submitting bare.
            await this.resolveMinigame(engine, res.minigame, true);
            continue;
          }
          if (res.ended) return outcomeOf(res.result ?? engine.state().result);
          break;
        }

        case 'waiting': {
          inputStreak = 0;
          const events = (engine as FFX2BattleEngine).tick(decision.nextEventMs);
          const res = await this.play(events);
          this.syncHud(engine);
          if (res.ended) return outcomeOf(res.result ?? engine.state().result);
          // A *charged* timed input (X-2's reels) asks for its overlay when the purple bar empties,
          // out of `tick()`, not `submit()`. This branch used to drop the request, so a human never
          // saw the reels and the spin was never resolved at all.
          if (res.minigame) this.deferredMinigame = res.minigame;
          break;
        }

        case 'player-input': {
          inputStreak = decision.actorId === streakActor ? inputStreak + 1 : 1;
          streakActor = decision.actorId;
          if (inputStreak > INPUT_STREAK_LIMIT) {
            console.error(
              `[presenter] ${decision.actorId} has been offered the turn ` +
                `${INPUT_STREAK_LIMIT} times in a row without it passing; the last ` +
                `command (${JSON.stringify(this.lastCommand)}) is not being ` +
                'resolved by the engine. Abandoning the battle rather than looping.',
            );
            return { kind: 'aborted' };
          }
          this.phase = `command:${decision.actorId}`;
          const command = await this.chooseCommand(engine, decision.actorId, decision.commands);
          // FFX-2 Active: the clock ran while the menu was open and its owner
          // stopped being able to answer it. Nothing was submitted; ask the
          // engine what happens next instead of hanging on a dead menu.
          if (this.inputAbandoned) {
            this.inputAbandoned = false;
            inputStreak = 0;
            streakActor = '';
            this.syncHud(engine);
            break;
          }
          if (!command) return { kind: 'aborted' };
          this.commandBy.set(decision.actorId, command);
          this.cutIns.acted(decision.actorId); // PR-0104: a moved cut-in waits for her next turn
          const out = await this.submit(engine, command);
          if (out) return out;
          break;
        }
      }

      const logLength = engine.state().log.length;
      idleSpins = logLength === lastLogLength ? idleSpins + 1 : 0;
      lastLogLength = logLength;
    }
  }

  /**
   * Play the opening moment for whatever is on the field right now.
   *
   * The "boss" is the first enemy that is not a destructible part — that is
   * Yunalesca rather than a coil, Braska's Final Aeon rather than the Yu
   * Pagodas — and an encounter with no enemies at all (the demo reel) simply
   * gets the party slide. A link's own `headline` (`EnemyGroupDef.headline`,
   * PR-0205) names the plate when the first enemy would misname the formation.
   */
  private async openOn(engine: BattleEngine, headline?: string, bossId?: string): Promise<void> {
    if (this.aborted) return;
    const state = engine.state();
    const boss = headlineEnemy(state, bossId); // PR-0243: a formation's declared boss first
    this.phase = 'moment:battle-start';
    const opening = { partyIds: state.activeIds, bossId: boss?.id ?? null, bossName: (boss && headline) || boss?.name || null }; // PR-0205
    await playOpening(this.ctx, () => this.ctx.moments.battleStart(opening)); // a Confirm press ends it (PR-0061)
    if (!this.aborted) await settleOpening(this.ctx); // CHAPTER FRAMING's first plan lands before the first command menu can open (`fx/mix/openingGate.ts`)
  }
}
