// @vitest-environment jsdom
/**
 * PR-0341 (FFX only, Chapter IX): Yojimbo and Daigoro were not drawn at the first command menu for 4 to 6 s.
 *
 * The cavern scene holds both off the field until the opening shot (a rendered frame with the camera on its `intro`
 * rig) or `ARRIVAL_FALLBACK_MS` (9 s) after they are staged. Release 37's hurried opening (PR-0061: the player
 * skipped the pre-scene) cuts to `intro` and on to `idle` inside one tick, so no frame ever has the camera on the
 * opening shot, and the first menu opened 4 s after staging with both invisible; the blue night-sakura then arrived
 * mid-turn at the 9 s mark. Measured on the deployed bundles, real keys, 1600x900 and 2000x1012, 3 runs each:
 * release 36 drew all three at the first menu 6 of 6, release 37 drew Yojimbo and Daigoro 0 of 6.
 *
 * The scene factory cannot be built under jsdom (it paints canvases), so the decision is the pure
 * `ArrivalWait`, and the hand-over from the battle screen is `openingMark.ts`; both are pinned here, and the
 * wiring between the three files is pinned by reading them.
 */
import { readFileSync } from 'node:fs';
import { Group, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { ARRIVAL_FALLBACK_MS } from '../../../src/scenes/cavern-stolen-fayth.ts';
import { ArrivalWait } from '../../../src/scenes/cavern-stolen-fayth-arrival.ts';
import { markOpeningHurried, takeOpeningHurried } from '../../../src/scenes/openingMark.ts';

const FRAME = 16;

/** Steps `wait` frame by frame for `ms`, returning every answer. */
function run(wait: ArrivalWait, ms: number): string[] {
  const out: string[] = [];
  for (let t = 0; t < ms; t += FRAME) out.push(wait.step(FRAME));
  return out;
}

describe('ArrivalWait: the Cavern arrival waits for its opening, unless the opening is hurried', () => {
  it('holds both off the field while the card is up, until the opening shot is seen', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    expect(new Set(run(wait, 3000))).toEqual(new Set(['hold']));
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
    expect(wait.step(FRAME)).toBe('rest'); // the arrival runs on its own clock from here
  });

  it('with no opening shot at all (the skip speed) starts ARRIVAL_FALLBACK_MS after they are staged', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    const answers = run(wait, ARRIVAL_FALLBACK_MS + 200);
    const firstGo = answers.indexOf('go');
    expect(firstGo).toBeGreaterThan(0);
    expect(answers.slice(0, firstGo).every((a) => a === 'hold')).toBe(true);
    expect(firstGo * FRAME).toBeGreaterThanOrEqual(ARRIVAL_FALLBACK_MS - FRAME);
    expect(firstGo * FRAME).toBeLessThanOrEqual(ARRIVAL_FALLBACK_MS + FRAME);
  });

  it('a hurried opening waits for nothing: they are never held, the arrival is not played, they are simply there', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    wait.stage(true);
    expect(new Set(run(wait, ARRIVAL_FALLBACK_MS + 2000))).toEqual(new Set(['rest']));
  });

  it('a hurried opening does not start the arrival late either: no "go" at the 9 s mark (the blue tree mid-turn)', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    wait.stage(true);
    expect(run(wait, 15000)).not.toContain('go');
  });

  it('the next fight (a retry) waits again, and an opening seen in the last one does not carry over', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    wait.stage(false);
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('go');
    wait.stage(false);
    expect(wait.step(FRAME)).toBe('hold');
    wait.stage(true);
    expect(wait.step(FRAME)).toBe('rest');
    wait.stage(false);
    expect(wait.step(FRAME)).toBe('hold');
  });

  it('before any fight is staged there is nothing to wait for', () => {
    const wait = new ArrivalWait(ARRIVAL_FALLBACK_MS);
    expect(wait.step(FRAME)).toBe('rest');
    wait.openingSeen();
    expect(wait.step(FRAME)).toBe('rest');
  });
});

describe('openingMark: the battle screen tells the scene its opening is hurried', () => {
  it('is read once, and only on the scene that was marked', () => {
    const marked = new Scene();
    const other = new Scene();
    expect(takeOpeningHurried(marked)).toBe(false);
    markOpeningHurried(marked);
    expect(takeOpeningHurried(other)).toBe(false);
    expect(takeOpeningHurried(marked)).toBe(true);
    expect(takeOpeningHurried(marked)).toBe(false); // one fight's worth: a retry is not hurried
  });

  it('answers false for a scene that is not there yet, and for a bare group', () => {
    expect(takeOpeningHurried(null)).toBe(false);
    expect(takeOpeningHurried(undefined)).toBe(false);
    expect(takeOpeningHurried(new Group())).toBe(false);
  });
});

describe('the three files are wired together', () => {
  const read = (f: string): string => readFileSync(f, 'utf8');

  it('BattleScreen marks the loaded scene only when the opening is hurried', () => {
    expect(read('src/app/screens/BattleScreen.ts')).toMatch(/if \(this\.opts\.openingHurry\) markOpeningHurried\(scene\.scene\)/);
  });

  it('the Cavern scene takes the mark when it first sees the fight, and the wait is the pure ArrivalWait', () => {
    const src = read('src/scenes/cavern-stolen-fayth.ts');
    expect(src).toMatch(/wait\.stage\(takeOpeningHurried\(root\)\)/);
    expect(src).toMatch(/wait\.openingSeen\(\)/);
    expect(src).not.toMatch(/introSeen/); // the closure flag the hurried opening could never set
  });
});
