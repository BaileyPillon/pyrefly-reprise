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
 * The scene factory cannot be built under jsdom (it paints canvases), so the decision is the pure
 * `ArrivalWait`, and the hand-over from the battle screen is `openingMark.ts`; both are pinned here, and the
 * wiring between the three files is pinned by reading them.
 */
import { readFileSync } from 'node:fs';
import { Group, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS } from '../../../src/scenes/cavern-stolen-fayth.ts';
import {
  ArrivalWait,
  HURRIED_ARRIVAL_SPEED,
  SAKURA_ARRIVAL_MS,
  sakuraArrivalAt,
} from '../../../src/scenes/cavern-stolen-fayth-arrival.ts';
import { markOpeningBegun, markOpeningHurried, takeOpeningBegun, takeOpeningHurried } from '../../../src/scenes/openingMark.ts';

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

describe('the three files are wired together', () => {
  const read = (f: string): string => readFileSync(f, 'utf8');

  it('BattleScreen marks the loaded scene hurried, and raises "begun" when the card is gone, only for a hurried opening', () => {
    const src = read('src/app/screens/BattleScreen.ts');
    expect(src).toMatch(/if \(this\.opts\.openingHurry\) markOpeningHurried\(scene\.scene\)/);
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
    expect(src).toMatch(/arrivalMs \+= dt \* 1000 \* wait\.speed/);
    expect(src).toMatch(/new ArrivalWait\(ARRIVAL_FALLBACK_MS, HURRIED_ARRIVAL_FALLBACK_MS\)/);
    expect(src).not.toMatch(/introSeen/); // the closure flag the hurried opening could never set
  });
});
