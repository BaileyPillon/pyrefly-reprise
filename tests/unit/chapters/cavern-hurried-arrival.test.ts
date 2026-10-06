// @vitest-environment jsdom
/**
 * PR-0341 (FFX only, Chapter IX): Yojimbo and Daigoro were not drawn at the first command menu for 4 to 6 s.
 * FOC371-01 (FFX only, same chapter): and the fix must not take the approved night-sakura arrival away.
 *
 * The cavern scene holds both off the field until the opening shot (a rendered frame with the camera on its `intro`
 * rig) or `ARRIVAL_FALLBACK_MS` (9 s) after they are staged. Release 37's hurried opening (PR-0061: the player
 * skipped the pre-scene) cuts to `intro` and on to `idle` inside one tick, so no frame ever has the camera on the
 * opening shot, and the first menu opened 4 s after staging with both invisible; the blue night-sakura then arrived
 * mid-turn at the 9 s mark. Measured on the deployed bundles, real keys, 1600x900 and 2000x1012, 3 runs each:
 * release 36 drew all three at the first menu 6 of 6, release 37 drew Yojimbo and Daigoro 0 of 6.
 *
 * Release 37.1 cured it by never playing the arrival on a hurried opening (tree opacity 0 in every hurried run), but
 * Bailey's recorded words on the chamber tile (docs/target/targets.json, "plays at the start of the fight") say it
 * plays; the focused review of f4244e1f filed that as FOC371-01. A hurried opening now plays the arrival compressed
 * (twice as fast) from the moment the battle screen says the card is gone, and the figures are drawn long before the
 * first menu. A full opening (the scene tapped through) is unchanged.
 *
 * The independent check of r38-polish (disclosure 1) found the compressed arrival ran on the wall clock while the
 * opening obeys the presenter's playback speed: at `fast` the night and the tree stayed on screen 1.35 s after the first
 * menu, at `skip` Yojimbo and Daigoro were still coming in at the menu. The release-38 integration closes both: the
 * hurried arrival's clock follows the presenter's factor (`hurriedArrivalPace`), see the last two blocks. FFX only.
 *
 * The scene factory cannot be built under jsdom (it paints canvases), so the decision is the pure
 * `ArrivalWait`, and the hand-over from the battle screen is `openingMark.ts`; both are pinned here, and the
 * wiring between the three files is pinned by reading them.
 */
import { readFileSync } from 'node:fs';
import { Group, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import type { PlaybackSpeed } from '../../../src/engine/BattlePresenterPorts.ts';
import { SPEED_SCALE } from '../../../src/engine/BattlePresenterUtil.ts';
import { ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS } from '../../../src/scenes/cavern-stolen-fayth.ts';
import {
  ArrivalWait,
  HURRIED_ARRIVAL_SPEED,
  SAKURA_ARRIVAL_MS,
  sakuraArrivalAt,
} from '../../../src/scenes/cavern-stolen-fayth-arrival.ts';
import {
  MENU_PACE,
  SKIP_PACE,
  hurriedArrivalPace,
  markOpeningBegun,
  markOpeningHurried,
  takeOpeningBegun,
  takeOpeningHurried,
} from '../../../src/scenes/openingMark.ts';

const FRAME = 16;

/** Steps `wait` frame by frame for `ms`, returning every answer. */
function run(wait: ArrivalWait, ms: number): string[] {
  const out: string[] = [];
  for (let t = 0; t < ms; t += FRAME) out.push(wait.step(FRAME));
  return out;
}

describe('ArrivalWait: the Cavern arrival waits for its opening', () => {
  it('holds both off the field while the card is up, until the opening shot is seen', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    expect(new Set(run(wait, 3000))).toEqual(new Set(['hold']));
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
    expect(wait.step(FRAME)).toBe('rest'); // the arrival runs on its own clock from here
  });

  it('with no opening shot at all (the skip speed) starts ARRIVAL_FALLBACK_MS after they are staged', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    const answers = run(wait, ARRIVAL_FALLBACK_MS + 200);
    const firstGo = answers.indexOf('go');
    expect(firstGo).toBeGreaterThan(0);
    expect(answers.slice(0, firstGo).every((a) => a === 'hold')).toBe(true);
    expect(firstGo * FRAME).toBeGreaterThanOrEqual(ARRIVAL_FALLBACK_MS - FRAME);
    expect(firstGo * FRAME).toBeLessThanOrEqual(ARRIVAL_FALLBACK_MS + FRAME);
  });

  it('a full opening runs the arrival at its own speed (the tapped-through scene is unchanged)', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    expect(wait.speed).toBe(1);
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
    expect(wait.speed).toBe(1); // still 1 once it is running
  });
});

describe('ArrivalWait: a hurried opening plays the arrival compressed, and never holds them at the first menu (FOC371-01)', () => {
  it('holds them off the field until the battle screen says the card is gone, then goes at twice the speed', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(true);
    expect(wait.speed).toBe(HURRIED_ARRIVAL_SPEED);
    expect(HURRIED_ARRIVAL_SPEED).toBe(2);
    // The card is up: the figures are staged but not yet "summoned", exactly as for a full opening.
    expect(new Set(run(wait, 1500))).toEqual(new Set(['hold']));
    wait.openingSeen(); // the battle screen's mark, passed on by the scene
    expect(wait.step(FRAME)).toBe('go');
    expect(wait.step(FRAME)).toBe('rest');
    expect(wait.speed).toBe(HURRIED_ARRIVAL_SPEED); // and keeps its speed while it runs
  });

  it('the mark can come before the first frame that sees the fight, and the arrival still starts at once', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(true);
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
  });

  it('never holds them past HURRIED_ARRIVAL_FALLBACK_MS when the mark never comes (PR-0341 stays fixed)', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(true);
    const answers = run(wait, HURRIED_ARRIVAL_FALLBACK_MS + 500);
    const firstGo = answers.indexOf('go');
    expect(firstGo).toBeGreaterThan(0);
    expect(answers.slice(0, firstGo).every((a) => a === 'hold')).toBe(true);
    expect(firstGo * FRAME).toBeGreaterThanOrEqual(HURRIED_ARRIVAL_FALLBACK_MS - FRAME);
    expect(firstGo * FRAME).toBeLessThanOrEqual(HURRIED_ARRIVAL_FALLBACK_MS + FRAME);
  });

  it('the bound is under the shortest first-menu gap measured after staging (4.6 s), and under the full opening bound', () => {
    expect(HURRIED_ARRIVAL_FALLBACK_MS).toBeLessThanOrEqual(4600);
    expect(HURRIED_ARRIVAL_FALLBACK_MS).toBeLessThan(ARRIVAL_FALLBACK_MS);
  });

  it('the compressed timeline has Daigoro and Yojimbo fully on the field within 0.7 s and is over within 3 s', () => {
    const T = SAKURA_ARRIVAL_MS;
    const at = (realMs: number): ReturnType<typeof sakuraArrivalAt> => sakuraArrivalAt(realMs * HURRIED_ARRIVAL_SPEED);
    expect(T.yojimboIn[1] / HURRIED_ARRIVAL_SPEED).toBeLessThanOrEqual(700);
    expect(at(700).yojimbo).toBe(1);
    expect(at(700).daigoro).toBe(1);
    expect(at(0).yojimbo).toBe(0); // they are still hidden at the start: they arrive
    expect(at(0).night).toBe(0);
    // The night, the tree and the petals all show: the arrival is seen, not skipped.
    expect(Math.max(...Array.from({ length: 300 }, (_, i) => at(i * 10).tree))).toBe(1);
    expect(Math.max(...Array.from({ length: 300 }, (_, i) => at(i * 10).night))).toBe(1);
    expect(at(T.end / HURRIED_ARRIVAL_SPEED).done).toBe(true);
    expect(T.end / HURRIED_ARRIVAL_SPEED).toBeLessThanOrEqual(3000);
  });

  it('the next fight (a retry) waits again, and an opening seen in the last one does not carry over', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
    wait.stage(false);
    expect(wait.step(FRAME)).toBe('hold');
    wait.stage(true);
    expect(wait.step(FRAME)).toBe('hold'); // hurried: waits for the card, at the compressed speed
    expect(wait.speed).toBe(HURRIED_ARRIVAL_SPEED);
    wait.stage(false);
    expect(wait.step(FRAME)).toBe('hold');
    expect(wait.speed).toBe(1);
  });

  it('before any fight is staged there is nothing to wait for', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS);
    expect(wait.step(FRAME)).toBe('rest');
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('rest');
  });
});

describe('openingMark: the battle screen tells the scene its opening is hurried, and when it begins', () => {
  it('is read once, and only on the scene that was marked', () => {
    const marked = new Scene();
    const other = new Scene();
    expect(takeOpeningHurried(marked)).toBe(false);
    markOpeningHurried(marked);
    expect(takeOpeningHurried(other)).toBe(false);
    expect(takeOpeningHurried(marked)).toBe(true);
    expect(takeOpeningHurried(marked)).toBe(false); // one fight's worth: a retry is not hurried
  });

  it('the "begun" mark is its own one-shot, independent of the hurried mark', () => {
    const marked = new Scene();
    const other = new Scene();
    expect(takeOpeningBegun(marked)).toBe(false);
    markOpeningBegun(marked);
    expect(takeOpeningBegun(other)).toBe(false);
    expect(takeOpeningHurried(marked)).toBe(false); // setting one does not set the other
    expect(takeOpeningBegun(marked)).toBe(true);
    expect(takeOpeningBegun(marked)).toBe(false);
  });

  it('answers false for a scene that is not there yet, and for a bare group', () => {
    for (const take of [takeOpeningHurried, takeOpeningBegun]) {
      expect(take(null)).toBe(false);
      expect(take(undefined)).toBe(false);
      expect(take(new Group())).toBe(false);
    }
  });
});

/** A scene marked hurried whose playback speed and "a menu is up" are read live, as the battle screen marks it. */
function hurriedAt(speed: () => PlaybackSpeed, menu: () => boolean = () => false): Scene {
  const scene = new Scene();
  markOpeningHurried(scene, () => ({ speed: speed(), menu: menu() }));
  return scene;
}

describe('hurriedArrivalPace: the compressed arrival follows the presenter\'s playback speed (r38-polish check, disclosure 1)', () => {
  it('is the reciprocal of the presenter\'s own factor: 1 at normal, 1 / 0.32 at fast, and skip finishes it in one frame', () => {
    expect(SPEED_SCALE).toEqual({ normal: 1, fast: 0.32, skip: 0 }); // the presenter's table this is derived from
    expect(hurriedArrivalPace(hurriedAt(() => 'normal'))).toBe(1);
    expect(hurriedArrivalPace(hurriedAt(() => 'fast'))).toBeCloseTo(1 / SPEED_SCALE.fast, 10);
    expect(hurriedArrivalPace(hurriedAt(() => 'skip'))).toBe(SKIP_PACE);
    expect(Number.isFinite(SKIP_PACE)).toBe(true); // a 0 dt times Infinity is NaN, which would freeze the scene
  });

  it('is read live, so a fast-forward pressed in the middle of the arrival speeds up the rest of it', () => {
    let speed: PlaybackSpeed = 'normal';
    const scene = hurriedAt(() => speed);
    expect(hurriedArrivalPace(scene)).toBe(1);
    speed = 'fast';
    expect(hurriedArrivalPace(scene)).toBeCloseTo(3.125, 10);
    speed = 'skip';
    expect(hurriedArrivalPace(scene)).toBe(SKIP_PACE);
    speed = 'normal'; // and back: a held key let go
    expect(hurriedArrivalPace(scene)).toBe(1);
  });

  it('is 1 when nobody sent a speed (the old call, a bare group, no scene) and never reads nonsense as skip', () => {
    const marked = new Scene();
    markOpeningHurried(marked); // the call before this change still works
    expect(takeOpeningHurried(marked)).toBe(true);
    expect(hurriedArrivalPace(marked)).toBe(1);
    expect(hurriedArrivalPace(new Group())).toBe(1);
    expect(hurriedArrivalPace(null)).toBe(1);
    expect(hurriedArrivalPace(undefined)).toBe(1);
    expect(hurriedArrivalPace(hurriedAt(() => 'warp' as PlaybackSpeed))).toBe(1);
  });

  it('survives the hurried mark being taken: the scene reads the pace for the fight it just took the mark for', () => {
    const scene = hurriedAt(() => 'fast');
    expect(takeOpeningHurried(scene)).toBe(true);
    expect(takeOpeningHurried(scene)).toBe(false);
    expect(hurriedArrivalPace(scene)).toBeCloseTo(3.125, 10);
  });

  it('at fast the arrival is over within a second, before the first enemy acts (about 1.05 s after the card) and Yojimbo is in by a quarter of a second', () => {
    const T = SAKURA_ARRIVAL_MS;
    const rate = HURRIED_ARRIVAL_SPEED * hurriedArrivalPace(hurriedAt(() => 'fast'));
    expect(rate).toBeCloseTo(6.25, 10);
    expect(T.end / rate).toBeLessThanOrEqual(1000); // the check measured 2.5 s on the wall clock, 1.35 s past the first menu
    expect(sakuraArrivalAt(1000 * rate).done).toBe(true);
    expect(T.yojimboIn[1] / rate).toBeLessThanOrEqual(250);
    expect(sakuraArrivalAt(250 * rate)).toMatchObject({ daigoro: 1, yojimbo: 1 });
    // It is still played, not skipped: the tree and the night both show at some frame.
    const frames = Array.from({ length: 100 }, (_, i) => sakuraArrivalAt((i * 10 * rate)));
    expect(Math.max(...frames.map((f) => f.tree))).toBe(1);
    expect(Math.max(...frames.map((f) => f.night))).toBe(1);
  });

  it('at skip one frame, even a 1 ms one, finishes it: both drawn, no night, tree or petals left to flash', () => {
    const rate = HURRIED_ARRIVAL_SPEED * hurriedArrivalPace(hurriedAt(() => 'skip'));
    for (const frameMs of [1, 4, 16, 50]) {
      expect(sakuraArrivalAt(frameMs * rate)).toEqual({ night: 0, tree: 0, petals: 0, daigoro: 1, yojimbo: 1, done: true });
    }
  });

  it('the normal-speed pace is the hurried 2x of FOC371-01 (the arrival over in half its authored length: 1.8 s since release 39.1, B8)', () => {
    const rate = HURRIED_ARRIVAL_SPEED * hurriedArrivalPace(hurriedAt(() => 'normal'));
    expect(rate).toBe(2);
    expect(SAKURA_ARRIVAL_MS.end / rate).toBeCloseTo(1800, 6);
  });
});

describe('hurriedArrivalPace: a command menu that opens ends the arrival at once, whatever the speed (the first menu opens at no fixed time)', () => {
  it('takes the pace to MENU_PACE at normal and fast, leaves skip at SKIP_PACE, and changes nothing while no menu is up', () => {
    expect(MENU_PACE).toBeGreaterThan(1 / SPEED_SCALE.fast); // faster than fast alone: the point
    expect(MENU_PACE).toBeLessThan(SKIP_PACE);
    expect(hurriedArrivalPace(hurriedAt(() => 'normal', () => true))).toBe(MENU_PACE);
    expect(hurriedArrivalPace(hurriedAt(() => 'fast', () => true))).toBe(MENU_PACE);
    expect(hurriedArrivalPace(hurriedAt(() => 'skip', () => true))).toBe(SKIP_PACE);
    expect(hurriedArrivalPace(hurriedAt(() => 'normal', () => false))).toBe(1);
    expect(hurriedArrivalPace(hurriedAt(() => 'fast', () => false))).toBeCloseTo(3.125, 10);
  });

  it('a whole arrival at the menu pace is over in under 100 ms, a few frames: Yojimbo and Daigoro in, no night, tree or petals left', () => {
    const rate = HURRIED_ARRIVAL_SPEED * MENU_PACE;
    expect(SAKURA_ARRIVAL_MS.end / rate).toBeLessThan(100);
    expect(sakuraArrivalAt(100 * rate)).toEqual({ night: 0, tree: 0, petals: 0, daigoro: 1, yojimbo: 1, done: true });
    // Not a pop: from a standing start it takes more than one 60 fps frame to go.
    expect(sakuraArrivalAt(16.7 * rate).done).toBe(false);
  });

  it('is read live: the menu that opens in the middle of the arrival speeds the rest of it, and one that is not up does not', () => {
    let menu = false;
    const scene = hurriedAt(() => 'fast', () => menu);
    expect(hurriedArrivalPace(scene)).toBeCloseTo(3.125, 10);
    menu = true;
    expect(hurriedArrivalPace(scene)).toBe(MENU_PACE);
  });

  it('only a menu that is really up counts: anything but the boolean true is no menu', () => {
    const scene = new Scene();
    markOpeningHurried(scene, () => ({ speed: 'fast', menu: 'yes' as unknown as boolean }));
    expect(hurriedArrivalPace(scene)).toBeCloseTo(3.125, 10);
  });
});

describe('the figures get their last value on the frame that carries them there, at any clock rate and frame length', () => {
  const T = SAKURA_ARRIVAL_MS;
  /** The scene's rule restated: a frame sets the figures when it starts before the end of their ramp (`from < yojimboIn[1]`). */
  function lastWrite(rate: number, frameMs: number, rule: (from: number, after: number) => boolean): ReturnType<typeof sakuraArrivalAt> | null {
    let at = 0;
    let last: ReturnType<typeof sakuraArrivalAt> | null = null;
    for (let i = 0; i < 200000; i++) {
      const from = at;
      at += frameMs * rate;
      const f = sakuraArrivalAt(at);
      if (rule(from, at)) last = f;
      if (f.done) break;
    }
    return last;
  }
  const fromRule = (from: number): boolean => from < T.yojimboIn[1];
  const oldWindow = (_from: number, after: number): boolean => after <= T.yojimboIn[1] + 50;

  it('Daigoro and Yojimbo end at alpha 1 for every pace and frame length (4 ms to 100 ms, 1x to skip)', () => {
    for (const rate of [1, 2, 6.25, 12.5, HURRIED_ARRIVAL_SPEED * SKIP_PACE]) {
      for (const frameMs of [1, 4, 16.7, 33.3, 50, 100]) {
        const last = lastWrite(rate, frameMs, fromRule);
        expect(last, `rate ${rate}, frame ${frameMs} ms`).not.toBeNull();
        expect(last!.daigoro, `rate ${rate}, frame ${frameMs} ms`).toBe(1);
        expect(last!.yojimbo, `rate ${rate}, frame ${frameMs} ms`).toBe(1);
      }
    }
  });

  it('the fixed 50 ms window it replaces stepped over the end at 6.25x and 16.7 ms frames, leaving Yojimbo short of 1', () => {
    const old = lastWrite(6.25, 16.7, oldWindow);
    expect(old).not.toBeNull();
    expect(old!.yojimbo).toBeLessThan(1);
    expect(lastWrite(6.25, 16.7, fromRule)!.yojimbo).toBe(1);
  });

  it('at the speeds FOC371-01 measured (1x and 2x, 60 fps) the last write is the same alpha as before', () => {
    expect(lastWrite(1, 16.7, fromRule)!.yojimbo).toBe(1);
    expect(lastWrite(2, 16.7, fromRule)!.yojimbo).toBe(1);
    expect(lastWrite(2, 16.7, oldWindow)!.yojimbo).toBe(1);
  });
});

describe('the three files are wired together', () => {
  const read = (f: string): string => readFileSync(f, 'utf8');

  it('BattleScreen marks the loaded scene hurried (with the presenter\'s live speed), and raises "begun" when the card is gone, only for a hurried opening', () => {
    const src = read('src/app/screens/BattleScreen.ts');
    expect(src).toMatch(
      /if \(this\.opts\.openingHurry\) markOpeningHurried\(scene\.scene, \(\) => \(\{ speed: this\.presenter\?\.playbackSpeed \?\? 'normal', menu: this\.presenter\?\.snapshot\(\)\['awaitingMenu'\] === true \}\)\)/,
    );
    expect(src).toMatch(/if \(this\.opts\.openingHurry && this\.scene\) markOpeningBegun\(this\.scene\.scene\)/);
    // It is raised in runEncounter, which only runs once the card (showBattleStart) is gone.
    const run = src.slice(src.indexOf('private async runEncounter'));
    expect(run.indexOf('markOpeningBegun')).toBeGreaterThan(-1);
    expect(run.indexOf('markOpeningBegun')).toBeLessThan(run.indexOf('runEncounterChain'));
  });

  it('the Cavern scene takes the marks, starts the wait from "begun" for a hurried fight, and runs the clock at the wait\'s speed', () => {
    const src = read('src/scenes/cavern-stolen-fayth.ts');
    expect(src).toMatch(/hurried = takeOpeningHurried\(root\)/);
    expect(src).toMatch(/wait\.stage\(hurried\)/);
    expect(src).toMatch(/if \(hurried && takeOpeningBegun\(root\)\) wait\.openingSeen\(\)/);
    expect(src).toMatch(/wait\.openingSeen\(\)/);
    // The clock follows the wait's speed, and for a hurried fight only, the presenter's playback speed too (fast, skip).
    expect(src).toMatch(/arrivalMs \+= dt \* 1000 \* wait\.speed \* \(hurried \? hurriedArrivalPace\(root\) : 1\)/);
    // The figures are set by the frame that starts before the end of their ramp, not by a fixed window a fast clock steps over.
    expect(src).toMatch(/const from = arrivalMs;/);
    expect(src).toMatch(/if \(from < SAKURA_ARRIVAL_MS\.yojimboIn\[1\]\) \{/);
    expect(src).not.toMatch(/yojimboIn\[1\] \+ 50/);
    expect(src).toMatch(/new ArrivalWait\(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS\)/);
    expect(src).not.toMatch(/introSeen/); // the closure flag the hurried opening could never set
  });
});
