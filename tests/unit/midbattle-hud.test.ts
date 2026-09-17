// @vitest-environment jsdom
/**
 * A mid-battle beat runs **over** the battle, on a clock.
 *
 * Two defects met in the Bahamut capture and produced thirty seconds of blank
 * screen in the middle of a fight:
 *
 * 1. `runMidBattleScript` called `HudPort.setVisible(false)` for the length of
 *    a beat, so the CTB list, the party bars and Bahamut's countdown badge all
 *    left the screen for a two-line callout *about the countdown*.
 * 2. Nothing capped the beat except the presenter's 30 s abandon budget, and an
 *    automated run swapped the dialogue box for a silent no-op port — so an
 *    overrunning beat (`first-mega-flare-countdown`, `yunalesca-form-2`) showed
 *    no line, no HUD and no clue, for half a minute, and then resumed.
 *
 * So this file holds the three rules that replace them: the HUD is never
 * hidden for a beat, the line is really shown and really ends on its own, and
 * the beat is cut short — once, and on the right clock — if it runs past its
 * budget.
 *
 * Budget numbers come from `src/story/registry.ts`; the timing of a line comes
 * from `research/writing-bible.md` §2.1 ("Allocate real time (1.2–2.0s)") and
 * §3 E6, which caps a mid-battle callout at ten words.
 *
 * ## Which clock the budget is on
 *
 * A third defect met the first two on the five-chapter sweep
 * (`docs/handoff/playability-round-1.md` §4.1): the budget was wall clock while
 * everything it was budgeting — camera tweens, the typewriter — is advanced a
 * frame at a time from `update(dt)`, with `dt` clamped at 1/20 s. Under
 * SwiftShader an authored 400 ms camera move costs seconds of real time, so
 * three of the five chapters cut a beat short and logged it on **every**
 * automated run. And `'skip'` did not help: `setAutoAdvance(on, {instant})`
 * swapped the dialogue port only, and its one-shot `skip()` was cleared by the
 * `reset()` at the top of the next beat.
 *
 * So: the budget is spent in scene time, wall clock only ends a beat whose
 * frame loop has *stopped* ({@link FRAME_STALL_MS}), and `'skip'` has no budget
 * at all because there is nothing left to outrun.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMidBattleCutscenes,
  FRAME_STALL_MS,
  LINE_GRACE_MS,
  MIDBEAT_CLASS,
  resetMidBattleOverrunLog,
} from '../../src/app/screens/BattleScreenCutscenes.ts';
import {
  MID_LINE_HOLD_MS,
  MID_SCRIPT_BUDGET_MS,
  OVERRUN_GRACE_MS,
  PRESENTER_BUDGET_MS,
  SEAM_BUDGET_MS,
  midBattleDeadlineMs,
  midScript,
  scriptDurationMs,
} from '../../src/story/registry.ts';
import { runMidBattleScript } from '../../src/engine/BattlePresenterUtil.ts';
import type { BattleStage, PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import type { StoryScript } from '../../src/story/dsl.ts';
import { camera, say, wait as waitStep } from '../../src/story/dsl.ts';
import { FakeHud } from './helpers/FakeStage.ts';

// ---------------------------------------------------------------- fixtures

/** A clock the test owns. Every wait the runner takes goes through it. */
function virtualClock() {
  let now = 0;
  let pending: Array<{ due: number; resolve: () => void }> = [];
  return {
    sleep: (ms: number): Promise<void> =>
      new Promise((resolve) => pending.push({ due: now + Math.max(0, ms), resolve })),
    /** Move time on, resolving what falls due, and let the microtasks settle. */
    async advance(ms: number): Promise<void> {
      // Real timers never fire while microtasks are still pending, so neither
      // does this one: drain first, or a beat that has already finished gets
      // its budget timer delivered as though it had not.
      for (let i = 0; i < 20; i++) await Promise.resolve();
      now += ms;
      const due = pending.filter((t) => t.due <= now);
      pending = pending.filter((t) => t.due > now);
      for (const t of due) t.resolve();
      // Several awaits can chain off one resolved wait (race -> step -> loop).
      for (let i = 0; i < 20; i++) await Promise.resolve();
    },
    get waiting(): number {
      return pending.length;
    },
  };
}

/** What the beat asked the camera for, so `'skip'` can be shown to snap. */
interface CameraCalls {
  moved: Array<{ rig: string; ms: number | undefined }>;
  snapped: string[];
}

/**
 * A stage whose camera move never resolves — the shape of every real overrun
 * (a port that goes away mid-beat), without needing a real one. It is also the
 * shape of the *slow* case this file cares about most: a tween that needs
 * rendered frames the renderer is not delivering.
 */
function stubStage(opts: { cameraResolves: boolean; calls: CameraCalls }): BattleStage {
  const never = (): Promise<void> => new Promise<void>(() => {});
  const done = (): Promise<void> => Promise.resolve();
  return {
    camera: {
      moveTo: (rig: string, ms?: number): Promise<void> => {
        opts.calls.moved.push({ rig, ms });
        return opts.cameraResolves ? done() : never();
      },
      snapTo: (rig: string): void => {
        opts.calls.snapped.push(rig);
      },
      shake: () => {},
      punch: done,
      rigNames: ['idle', 'action'],
      rigName: 'idle',
    },
    vfx: { play: done, impact: done, screenFlash: () => {} },
    actor: () => undefined,
    sideOf: () => 'party',
    staged: () => [],
    project: () => null,
    setArt: done,
    addCombatant: () => Promise.resolve(undefined),
    removeCombatant: () => {},
  } as unknown as BattleStage;
}

function mountRunner(over: { cameraResolves?: boolean } = {}) {
  const clock = virtualClock();
  const calls: CameraCalls = { moved: [], snapped: [] };
  const root = document.createElement('div');
  document.body.appendChild(root);
  const cutscenes = createMidBattleCutscenes({
    root,
    stage: stubStage({ cameraResolves: over.cameraResolves ?? true, calls }),
    sleep: clock.sleep,
  });
  /**
   * Render `frames` frames of `dtSec` each, draining microtasks between them.
   *
   * This is the clock the beat's budget is really on, and the reason these
   * tests can distinguish "the beat used its eight seconds" from "the renderer
   * took eight seconds to draw half of it".
   */
  const pump = async (frames: number, dtSec = 1 / 20): Promise<void> => {
    for (let i = 0; i < frames; i++) {
      cutscenes.update(dtSec);
      for (let k = 0; k < 8; k++) await Promise.resolve();
    }
  };
  return { clock, root, cutscenes, calls, pump, box: () => root.querySelector('.dbox') as HTMLElement };
}

afterEach(() => {
  document.body.innerHTML = '';
  resetMidBattleOverrunLog();
  vi.restoreAllMocks();
});

// ------------------------------------------------------------ the budgets

describe('the budget a live beat is really given', () => {
  it('caps an ordinary beat at the 8 s the story suite budgets it for', () => {
    const beat: StoryScript = [say('paine', "That's a timer.", { auto: 1100 })];
    expect(midBattleDeadlineMs(beat)).toBe(MID_SCRIPT_BUDGET_MS);
  });

  it('gives a chain seam its own authored length instead of the flat cap', () => {
    // `jecht-falls` is a declared seam: it plays with the player's hands off
    // the controller, and cutting it at 8 s would cut the goodbye in half.
    const seam = midScript('braskas-final-aeon', 'jecht-falls');
    expect(seam, 'jecht-falls is registered').toBeDefined();
    const authored = scriptDurationMs(seam!, MID_LINE_HOLD_MS);
    expect(authored).toBeGreaterThan(MID_SCRIPT_BUDGET_MS);
    expect(midBattleDeadlineMs(seam!)).toBe(Math.min(authored, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS);
  });

  it('never hands a script more than the presenter is prepared to wait', () => {
    const hugeSeam: StoryScript = [waitStep(120_000)];
    expect(midBattleDeadlineMs(hugeSeam)).toBe(SEAM_BUDGET_MS + OVERRUN_GRACE_MS);
    expect(midBattleDeadlineMs(hugeSeam)).toBeLessThan(PRESENTER_BUDGET_MS);
  });

  it('charges an untimed line the hold the runner will really give it', () => {
    // The audit charges a line with no `auto` the whole presenter budget, so a
    // script containing one can never pass. The *runner* forces a hold onto it
    // instead, so the beat it belongs to still gets the ordinary 8 s.
    const untimed: StoryScript = [say('auron', 'It is not over.')];
    expect(scriptDurationMs(untimed)).toBeGreaterThan(PRESENTER_BUDGET_MS);
    expect(scriptDurationMs(untimed, MID_LINE_HOLD_MS)).toBeLessThan(MID_SCRIPT_BUDGET_MS);
    expect(midBattleDeadlineMs(untimed)).toBe(MID_SCRIPT_BUDGET_MS);
  });

  it('every real beat in the Bahamut fight fits the cap it is given', () => {
    // The two the log named. Both used to reach the presenter's 30 s.
    for (const name of ['first-mega-flare-countdown', 'bahamut-half', 'bahamut-low']) {
      const script = midScript('ffx2-bahamut', name);
      expect(script, `${name} is registered`).toBeDefined();
      expect(scriptDurationMs(script!, MID_LINE_HOLD_MS)).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(script!)).toBe(MID_SCRIPT_BUDGET_MS);
    }
  });
});

// --------------------------------------------------------------- the HUD

describe('the HUD stays on screen for a beat', () => {
  it('the presenter never hides it', async () => {
    const hud = new FakeHud();
    const hidden: boolean[] = [];
    const setVisible = hud.setVisible.bind(hud);
    hud.setVisible = (v: boolean): void => {
      hidden.push(v);
      setVisible(v);
    };
    const script: StoryScript = [say('paine', "That's a timer.", { auto: 1100 })];
    const played: StoryScript[] = [];
    const deps = {
      hud,
      cutscenes: {
        play: (s: StoryScript) => {
          // The HUD has to still be up *while* the beat plays, not merely be
          // put back afterwards.
          expect(hidden).toEqual([]);
          played.push(s);
          return Promise.resolve();
        },
      },
      midScripts: { 'first-mega-flare-countdown': script },
    } as unknown as PresenterDeps;

    await runMidBattleScript(deps, 'first-mega-flare-countdown', () => new Promise<void>(() => {}));

    expect(played).toEqual([script]);
    expect(hidden, 'setVisible was never called at all').toEqual([]);
    expect(hud.visible).toBe(true);
  });

  it('the runner dims the battle behind the line instead, and undims after', async () => {
    const { clock, root, cutscenes } = mountRunner();
    cutscenes.setAutoAdvance(true);

    const beat = cutscenes.play([say('paine', "That's a timer.", { auto: 1100 })], {
      midBattle: true,
      name: 'first-mega-flare-countdown',
    });
    await Promise.resolve();
    expect(root.classList.contains(MIDBEAT_CLASS)).toBe(true);

    // The line's own hold ends it, well inside the beat's budget.
    await clock.advance(4_000);
    await beat;
    expect(root.classList.contains(MIDBEAT_CLASS)).toBe(false);
  });
});

// -------------------------------------------------------------- the line

describe('an automated run still sees the line', () => {
  it('shows the dialogue box and advances it without input', async () => {
    const { clock, cutscenes, box } = mountRunner();
    cutscenes.setAutoAdvance(true);

    const line = say('paine', "That's a timer.", { auto: 1100 });
    const beat = cutscenes.play([line], { midBattle: true, name: 'first-mega-flare-countdown' });
    await Promise.resolve();

    expect(box().hidden, 'the box is on screen for an auto-battle beat').toBe(false);
    expect(box().classList.contains('dbox--visible')).toBe(true);
    expect(beat).toBeInstanceOf(Promise);

    // Nobody presses Confirm and nothing pumps `update(dt)`, so the only thing
    // that can end this line is its own deadline: typing + hold + grace.
    let settled = false;
    void beat.then(() => (settled = true));
    await clock.advance(100);
    expect(settled).toBe(false);
    await clock.advance(1_100 + LINE_GRACE_MS + line.text.length * 25);
    await beat;
    expect(settled).toBe(true);
  });

  it("shows nothing under 'skip' playback, where there is no viewer", async () => {
    const { cutscenes, box } = mountRunner();
    cutscenes.setAutoAdvance(true, { instant: true });

    await cutscenes.play([say('paine', "That's a timer.", { auto: 1100 })], {
      midBattle: true,
      name: 'first-mega-flare-countdown',
    });

    expect(box().hidden).toBe(true);
  });
});

// ----------------------------------------------------------- the fail-safe

describe('a beat that overruns is ended, and logged once', () => {
  it('cuts the script short at its budget and resumes the battle', async () => {
    // No `pump()` anywhere in this test: the frame loop has stopped, so after
    // `FRAME_STALL_MS` of real silence the wall clock is allowed to end the
    // beat. That is the stall guard, and it is the only path on which wall
    // clock still decides anything.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, root, cutscenes } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true);

    // A camera move that never comes back: the beat can only end on its budget.
    const beat = cutscenes.play([camera('action', 400), say('paine', 'That is a timer.', { auto: 1100 })], {
      midBattle: true,
      name: 'first-mega-flare-countdown',
    });
    let settled = false;
    void beat.then(() => (settled = true));

    await clock.advance(MID_SCRIPT_BUDGET_MS - 1_000);
    expect(settled, 'still playing inside its budget').toBe(false);

    await clock.advance(1_000);
    await beat;

    expect(settled).toBe(true);
    expect(root.classList.contains(MIDBEAT_CLASS), 'the dim is dropped').toBe(false);
    // Not `console.error`: the fight carried on, and every automated gate we
    // have fails a run that logs one. An automated run says it quietly.
    expect(error, 'an overrun is not an error').not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0]?.[0])).toContain('first-mega-flare-countdown');
    expect(String(info.mock.calls[0]?.[0])).toContain(String(MID_SCRIPT_BUDGET_MS));
  });

  it('warns instead, when it is a human whose beat got cut off', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { clock, cutscenes } = mountRunner({ cameraResolves: false });
    // No `setAutoAdvance`: someone is holding the controller.

    const beat = cutscenes.play([camera('action', 400)], { midBattle: true, name: 'seymour-half' });
    await clock.advance(MID_SCRIPT_BUDGET_MS);
    await beat;

    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('seymour-half');
  });

  it('logs once, however often the trigger fires', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true);

    for (let i = 0; i < 3; i++) {
      const beat = cutscenes.play([camera('action', 400)], { midBattle: true, name: 'farplane-voice' });
      await clock.advance(MID_SCRIPT_BUDGET_MS);
      await beat;
    }

    expect(info).toHaveBeenCalledTimes(1);
  });

  it("a finished beat's budget timer cannot cut the next one short", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes } = mountRunner();
    cutscenes.setAutoAdvance(true, { instant: true });

    // Beat one resolves at once; its 8 s timer is still out there.
    await cutscenes.play([say('paine', 'It stopped.', { auto: 1100 })], { midBattle: true, name: 'a' });
    const second = cutscenes.play([say('paine', "That's a timer.", { auto: 1100 })], {
      midBattle: true,
      name: 'b',
    });
    await clock.advance(MID_SCRIPT_BUDGET_MS * 2);
    await second;

    expect(error, 'the stale timer belonged to a beat that had already ended').not.toHaveBeenCalled();
    expect(info, 'and it is not reported as an overrun either').not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------- the budget's clock

describe('the budget is spent in scene time, not wall clock', () => {
  it('does not cut a beat short because the renderer is slow', async () => {
    // The measured defect: under SwiftShader a `camera('action', 400)` needs
    // its eight-plus rendered frames whatever the clock says, and wall clock
    // ran out first on Chapters 1, 3 and 4 of every sweep.
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes, pump } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true);

    const beat = cutscenes.play([camera('action', 400), say('paine', 'That is a timer.', { auto: 1100 })], {
      midBattle: true,
      name: 'first-mega-flare-countdown',
    });
    let settled = false;
    void beat.then(() => (settled = true));

    // Frames are arriving, but slowly: 100 of them is 5 s of scene time and
    // any amount of wall clock at all.
    await pump(100);
    await clock.advance(MID_SCRIPT_BUDGET_MS * 10);
    await pump(1);
    expect(settled, 'five seconds of scene time is inside an eight second budget').toBe(false);
    expect(info).not.toHaveBeenCalled();

    // Past eight seconds of *scene* time it is a real overrun, and ends.
    await pump(80);
    await beat;
    expect(settled).toBe(true);
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('still ends a beat whose frame loop has stopped', async () => {
    // The stall guard. Scene time cannot advance if nothing is rendering, so
    // the wall clock has to be allowed to end the beat — a beat must never be
    // able to wedge a battle, however the frames went away.
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes, pump } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true);

    const beat = cutscenes.play([camera('action', 400)], { midBattle: true, name: 'yu-yevon-arrives' });
    await pump(4); // a few frames, then the loop dies
    // Real time, not the virtual clock, is what the stall guard reads.
    await new Promise((r) => setTimeout(r, FRAME_STALL_MS + 50));
    await clock.advance(MID_SCRIPT_BUDGET_MS);
    await beat;

    expect(info).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------ 'skip' is free

describe("'skip' playback costs a beat nothing, every time", () => {
  it('resolves every beat with no clock and no frames at all', async () => {
    // The regression: `setAutoAdvance(true, {instant:true})` skipped the runner
    // once, and `play()`'s own `reset()` cleared the latch — so beat two
    // onwards paid full price, and a five-chapter sweep ran at ~1.5 s a turn.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes, calls } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true, { instant: true });

    for (const name of ['seymour-half', 'yu-yevon-arrives', 'first-mega-flare-countdown']) {
      // A camera move that never resolves plus three seconds of authored
      // silence: the two things that used to cost the budget its whole 8 s.
      await cutscenes.play([camera('action', 400), waitStep(3_000), say('paine', 'That is a timer.')], {
        midBattle: true,
        name,
      });
    }

    // Nothing was ever handed to the clock, so none of it can have been waited on.
    expect(clock.waiting, 'no timer was left running either').toBe(0);
    expect(error).not.toHaveBeenCalled();
    expect(info, 'nothing overran, because nothing was raced').not.toHaveBeenCalled();
    // The rig still lands — snapped, not tweened over frames nobody renders.
    expect(calls.snapped).toEqual(['action', 'action', 'action']);
    expect(calls.moved, 'a tween would have needed eight rendered frames').toEqual([]);
  });

  it('goes back to playing beats properly when the speed comes off', async () => {
    // Beat "b" is left to hit its budget at the end, on the stall path (no
    // frames): that is the point — it is racing again.
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clock, cutscenes, calls, box } = mountRunner();
    cutscenes.setAutoAdvance(true, { instant: true });
    await cutscenes.play([camera('action', 400)], { midBattle: true, name: 'a' });

    cutscenes.setAutoAdvance(true);
    const beat = cutscenes.play([camera('action', 400), say('paine', 'That is a timer.', { auto: 1100 })], {
      midBattle: true,
      name: 'b',
    });
    await Promise.resolve();
    expect(box().hidden, 'the box is back on screen').toBe(false);
    expect(calls.moved.map((m) => m.rig), 'and the camera tweens again').toEqual(['action']);

    await clock.advance(MID_SCRIPT_BUDGET_MS);
    await beat;
  });
});
