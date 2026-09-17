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
 * the beat is cut short — once, loudly — if it runs past its budget.
 *
 * Budget numbers come from `src/story/registry.ts`; the timing of a line comes
 * from `research/writing-bible.md` §2.1 ("Allocate real time (1.2–2.0s)") and
 * §3 E6, which caps a mid-battle callout at ten words.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMidBattleCutscenes,
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

/**
 * A stage whose camera move never resolves — the shape of every real overrun
 * (a port that goes away mid-beat), without needing a real one.
 */
function stubStage(opts: { cameraResolves: boolean }): BattleStage {
  const never = (): Promise<void> => new Promise<void>(() => {});
  const done = (): Promise<void> => Promise.resolve();
  return {
    camera: {
      moveTo: opts.cameraResolves ? done : never,
      snapTo: () => {},
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
  const root = document.createElement('div');
  document.body.appendChild(root);
  const cutscenes = createMidBattleCutscenes({
    root,
    stage: stubStage({ cameraResolves: over.cameraResolves ?? true }),
    sleep: clock.sleep,
  });
  return { clock, root, cutscenes, box: () => root.querySelector('.dbox') as HTMLElement };
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
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('first-mega-flare-countdown');
    expect(String(error.mock.calls[0]?.[0])).toContain(String(MID_SCRIPT_BUDGET_MS));
  });

  it('logs once, however often the trigger fires', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { clock, cutscenes } = mountRunner({ cameraResolves: false });
    cutscenes.setAutoAdvance(true);

    for (let i = 0; i < 3; i++) {
      const beat = cutscenes.play([camera('action', 400)], { midBattle: true, name: 'farplane-voice' });
      await clock.advance(MID_SCRIPT_BUDGET_MS);
      await beat;
    }

    expect(error).toHaveBeenCalledTimes(1);
  });

  it("a finished beat's budget timer cannot cut the next one short", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
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
  });
});
