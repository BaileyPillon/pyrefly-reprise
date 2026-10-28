/**
 * Playback: play an ordered burst of events onto the stage, the HUD and the audio, stopping where the protocol says.
 *
 * `BattlePresenter` was one 800-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattlePresenterBase` -> `BattlePresenterPlayback` -> `BattlePresenterCommands` -> `BattlePresenter` (import that one from `BattlePresenter.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { BattleEvent } from '../battle/common/types.ts';
import { playEvent } from './BattlePresenterEvents.ts';
import { flushArrivals } from './BattlePresenterArrivals.ts';
import { playUnheld } from './TargetFrameHold.ts';
import type { PlayResult } from './BattlePresenterPorts.ts';
import { shotHoldMs } from './fx/shotHold.ts';
import { koWipedStatuses } from './BattlePresenterKoWipe.ts';
import { blowHeld, revealBlow } from './motion/SkillTravel.ts'; // r38-motion SKILL TRAVEL: a blow whose shot is in flight shows its numeral and HP rows when it lands
import { BattlePresenterBase } from './BattlePresenterBase.ts';

export class BattlePresenterPlayback extends BattlePresenterBase {
  // -------------------------------------------------------------------- play

  /**
   * Play an ordered burst of events. Stops early on `minigame-request`,
   * `victory` or `defeat`; pauses (but does not stop) on `script-trigger`.
   */
  async play(events: BattleEvent[]): Promise<PlayResult> {
    const run = this.playBurst(events);
    this.playing = run.then(() => undefined, () => undefined); // FF7's submit waits on it (`submit`)
    try {
      const res = await run;
      // The MAX mix's DRESSPHERE SHOT runs its 1.6 s before the next menu or enemy action begins (fx/shotHold.ts; 0 with no shot up).
      const held = res.ended || res.minigame ? 0 : shotHoldMs();
      if (held > 0) await this.sleep(held);
      return res;
    } finally {
      this.actingState.cancel(); // an action the burst stopped inside never ends on screen
      this.ctx.burst = undefined;
    }
  }

  /** The burst playing now: the ATB pump's enemy turn under an open menu, or a submitted command. */
  protected playing: Promise<void> = Promise.resolve();

  private async playBurst(events: BattleEvent[]): Promise<PlayResult> {
    const wiped = koWipedStatuses(events); // a status the action's own KO wipe takes is never shown (`BattlePresenterKoWipe.ts`)
    for (let i = 0; i < events.length; i++) {
      if (this.aborted) return { dropped: events.length - i };
      const event = events[i]!;
      if (wiped.has(i)) { // neither beat plays and the HUD is not told; the rows still drop what the wipe took
        if (event.type === 'status-remove') this.presentVitals(event);
        this.trace.push({ seq: event.seq, type: event.type, ms: 0 });
        continue;
      }

      // The HUD gets first look at every event so it can raise a transient. A blow whose spell or shot is still on its
      // way (SKILL TRAVEL, r38-motion) is shown to it when the blow lands instead: its numeral and HP rows wait.
      const held = blowHeld(this.ctx, event);
      if (!held) {
        this.phase = `hud:${event.type}`;
        await this.notifyHud(event);
      }

      const started = Date.now();
      if (event.type === 'minigame-request') {
        this.trace.push({ seq: event.seq, type: event.type, ms: 0 });
        return {
          minigame: { who: event.who, kind: event.kind, params: event.params },
          dropped: events.length - i - 1,
        };
      }

      if (event.type === 'script-trigger') {
        this.phase = `script:${event.name}`;
        if (this.callouts.detach(this.deps.midScripts?.[event.name], () => this.runScript(event.name))) {
          this.trace.push({ seq: event.seq, type: event.type, ms: 0 });
          continue;
        }
        await this.callouts.settle(); // two beats never overlap
        await playUnheld(this.ctx.stage.camera, () => this.runScript(event.name)); // a beat's camera cues play under an FFX-2 menu too
        this.trace.push({ seq: event.seq, type: event.type, ms: Date.now() - started });
        continue;
      }

      // The rows move with the blow, not with the burst.
      //
      // This one line is critic round 03 #9: before it, the only `syncHud` in
      // the loop ran *after* `play()` returned, so every number on the HUD was
      // the number from before the command for as long as the command took to
      // animate — a KO'd Yuna drawn alive at 711/1500 for 2145 ms, and an
      // ordinary hit's numeral 4.5 s ahead of its own bar.
      if (!held) this.presentVitals(event);

      this.phase = `play:${event.type}`;
      this.actingState.observe(event);
      // PR-0104 (FFX-2 only): a charge that has run out is no longer queued once its action starts or ends on screen.
      if ((event.type === 'action-start' || event.type === 'action-end') && this.queuedEngine) this.queuedHud(this.queuedEngine);
      if (event.type === 'victory' || event.type === 'defeat') await this.callouts.settle(); // the end waits for a callout on screen
      this.ctx.opening = this.callouts.isOpening;
      if (event.type === 'victory' || event.type === 'defeat') this.ctx.stage.camera.hold?.(false); // PR-0150: the end shot always plays
      this.ctx.burst = { events, at: i }; // the action's own later events: a fiend's strike finds its target in them (`motion/StrikeReach.ts`)
      await playEvent(this.ctx, event);
      if (held) await revealBlow(this.ctx, event); // the beat shows it itself; this only makes sure a held blow is never lost
      this.trace.push({ seq: event.seq, type: event.type, ms: Date.now() - started });

      if (event.type === 'victory' || event.type === 'defeat') {
        return { ended: event.type, result: event.result, dropped: events.length - i - 1 };
      }
    }
    // A reveal that ended the burst still arrives before the next menu opens.
    this.phase = 'arrival';
    await flushArrivals(this.ctx);
    this.phase = 'idle';
    return { dropped: 0 };
  }
}
