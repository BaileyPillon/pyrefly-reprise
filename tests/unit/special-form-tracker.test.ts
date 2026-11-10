/**
 * Test 1 of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2): the form tracker, fed the engine's own bursts.
 *
 * The bursts are recorded from the real engine into `tests/fixtures/specials/logs/*.json` (`helpers/specialFormState.ts` says how and why a fall goes through the real damage
 * path). To record them again: `PYREFLY_CAPTURE_SPECIAL_LOGS=1 node node_modules/vitest/vitest.mjs run tests/unit/special-form-tracker.test.ts`. A normal run captures again, with the seed
 * each file records, and compares: the engine is deterministic under its seed, so a change to a Special's events fails the first describe before the tracker is even asked.
 * `heal-on-part-synthetic` and `status-on-part-synthetic` are hand-written (the engine's own rigs emit no event for a heal or a status on a part); their names say so.
 *
 * Removal: delete `src/engine/SpecialFormTracker.ts` and this file does not compile.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { FORMS } from '../../src/battle/ffx2/special/forms.ts';
import { SPECIAL_ART_IDS, createFormTracker, isSpecialArtId, specialArtId, specialSeenId, type FormBeat } from '../../src/engine/SpecialFormTracker.ts';
import { FORM_GIRLS, captureBursts, type FormLog } from './helpers/specialFormState.ts';

const DIR = resolve(__dirname, '..', 'fixtures', 'specials', 'logs');
const NAMES = ['entry-yuna', 'entry-rikku', 'entry-paine', 'exit-yuna', 'fall-part-standing', 'defeat-all-parts-down', 'autolife-main', 'part-falls-raised', 'heal-on-part-synthetic', 'status-on-part-synthetic'] as const;
const CAPTURING = process.env['PYREFLY_CAPTURE_SPECIAL_LOGS'] === '1';

const file = (name: string): string => resolve(DIR, `${name}.json`);
const read = (name: string): FormLog => JSON.parse(readFileSync(file(name), 'utf8')) as FormLog;
const stateOf = (log: FormLog): BattleState => log.state as unknown as BattleState;

describe('the recorded bursts', () => {
  it(CAPTURING ? 'RECORDS the ten logs (PYREFLY_CAPTURE_SPECIAL_LOGS=1)' : 'are what the engine produces again under their recorded seeds (determinism)', () => {
    if (CAPTURING) {
      mkdirSync(DIR, { recursive: true });
      const logs = captureBursts();
      for (const name of NAMES) writeFileSync(file(name), `${JSON.stringify(logs[name], null, 1)}\n`);
      return;
    }
    const seeds: Record<string, number> = {};
    for (const name of NAMES) {
      expect(existsSync(file(name)), `${name}.json is missing: record it with PYREFLY_CAPTURE_SPECIAL_LOGS=1`).toBe(true);
      seeds[name] = read(name).seed;
    }
    const again = captureBursts(seeds);
    for (const name of NAMES) expect(JSON.parse(JSON.stringify(again[name])), name).toEqual(read(name));
  }, 120_000);

  it('hold what the cases need: the entries carry `special`, the fall has ko{girl} then the Special\'s way out, the defeat has no way out, Auto-Life has no ko', () => {
    for (const { girl, special } of FORM_GIRLS) {
      const entry = read(`entry-${girl}`).events.filter((e) => e.type === 'spherechange');
      expect(entry, girl).toHaveLength(1);
      expect(entry[0]).toMatchObject({ who: girl, to: special, special });
    }
    const types = (name: string): string[] => read(name).events.map((e) => e.type);
    expect(types('exit-yuna')).toContain('spherechange');
    const fall = read('fall-part-standing').events;
    const ko = fall.findIndex((e) => e.type === 'ko' && e.targetId === 'yuna');
    expect(ko).toBeGreaterThanOrEqual(0);
    expect(fall.slice(ko).some((e) => e.type === 'spherechange' && e.who === 'yuna' && e.from === 'floral-fallal' && e.special === undefined)).toBe(true);
    expect(types('defeat-all-parts-down')).toContain('defeat');
    expect(types('defeat-all-parts-down')).not.toContain('spherechange');
    expect(types('autolife-main')).not.toContain('ko');
    expect(read('autolife-main').events.some((e) => e.type === 'revive' && e.cause === 'auto-life')).toBe(true);
  });
});

/** Feed a log, returning every beat it started in order (nulls included). */
function feed(tracker: ReturnType<typeof createFormTracker>, log: FormLog, withState = true): FormBeat[] {
  return log.events.map((e) => tracker.see(e as BattleEvent, withState ? stateOf(log) : null));
}
const beatsOnly = (beats: FormBeat[]): FormBeat[] => beats.filter((b) => b !== null);

describe('an entry', () => {
  for (const { girl, special, parts } of FORM_GIRLS) {
    it(`${girl} -> ${special}: 'enter', ids [${girl}, right, left] in that order, the other two girls parked`, () => {
      const tracker = createFormTracker();
      const log = read(`entry-${girl}`);
      expect(beatsOnly(feed(tracker, log))).toEqual(['enter']);
      const form = tracker.form(girl)!;
      expect(form.special).toBe(special);
      expect(form.ids).toEqual([girl, ...parts]);
      expect(form.parked).toEqual(['yuna', 'rikku', 'paine'].filter((g) => g !== girl));
      expect(form.fell).toBe(false);
      expect(tracker.of(girl)).toMatchObject({ role: 'main' });
      expect(tracker.of(parts[0])).toMatchObject({ role: 'right' });
      expect(tracker.of(parts[1])).toMatchObject({ role: 'left' });
      expect(tracker.isPart(girl)).toBe(false);
      expect(tracker.isPart(parts[0])).toBe(true);
      expect(tracker.isPart(parts[1])).toBe(true);
      expect(tracker.of('bahamut')).toBeUndefined();
    });

    it(`${girl}: the order is the data's (pods[0] is the RIGHT part, pods[1] the LEFT): the order pin G10`, () => {
      const tracker = createFormTracker();
      feed(tracker, read(`entry-${girl}`));
      expect(tracker.form(girl)!.ids).toEqual([girl, FORMS[special].pods[0].id, FORMS[special].pods[1].id]);
    });
  }

  it('without a state, the parked girls are the two who are not the one who entered', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-rikku'), false);
    expect(tracker.form('rikku')!.parked).toEqual(['yuna', 'paine']);
  });

  it('with a state, the parked girls are the ones the engine marked (an Ejected girl the form did not park is not listed)', () => {
    const tracker = createFormTracker();
    const log = read('entry-yuna');
    const state = structuredClone(log.state);
    delete state.combatants['rikku']!.aiMemory;
    for (const e of log.events) tracker.see(e as BattleEvent, state as unknown as BattleState);
    expect(tracker.form('yuna')!.parked).toEqual(['paine']);
  });
});

describe('an exit', () => {
  it("returns 'exit' once, clears the form and every id with it", () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const beats = feed(tracker, read('exit-yuna'));
    expect(beatsOnly(beats)).toEqual(['exit']);
    expect(tracker.form('yuna')).toBeUndefined();
    expect(tracker.of('floral-fallal-right-pistil')).toBeUndefined();
    expect(tracker.isPart('floral-fallal-left-pistil')).toBe(false);
  });

  it("an exit with no form the tracker knew reads as 'exit'", () => {
    const tracker = createFormTracker();
    expect(beatsOnly(feed(tracker, read('exit-yuna')))).toEqual(['exit']);
  });

  it('an ordinary change returns null and touches nothing', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const plain = { type: 'spherechange', who: 'yuna', from: 'gunner', to: 'thief', gatesCrossed: [] } as unknown as BattleEvent;
    expect(tracker.see(plain)).toBeNull();
    expect(tracker.form('yuna')).toBeDefined();
  });
});

describe('a fall', () => {
  it("ko{main} then the way out of the Special reads 'fall' (the stream, not an alive flag), and clears the form", () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const log = read('fall-part-standing');
    const beats = log.events.map((e) => {
      const beat = tracker.see(e as BattleEvent, stateOf(log));
      if (e.type === 'ko' && e.targetId === 'yuna') expect(tracker.form('yuna')!.fell).toBe(true);
      return beat;
    });
    expect(beatsOnly(beats)).toEqual(['fall']);
    expect(beats[beats.length - 2]).toBe('fall'); // the `spherechange`, then the engine's system message
    expect(tracker.form('yuna')).toBeUndefined();
  });

  it('Auto-Life (status-remove consumed, then revive cause auto-life, no ko) leaves `fell` false and starts no beat', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    expect(beatsOnly(feed(tracker, read('autolife-main')))).toEqual([]);
    expect(tracker.form('yuna')!.fell).toBe(false);
  });

  it('the same with a ko{main} earlier in the burst sets `fell` and the revive clears it', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const log = read('autolife-main');
    const ko = { type: 'ko', targetId: 'yuna' } as unknown as BattleEvent;
    tracker.see(ko);
    expect(tracker.form('yuna')!.fell).toBe(true);
    const revive = log.events.find((e) => e.type === 'revive')!;
    tracker.see(revive as BattleEvent);
    expect(tracker.form('yuna')!.fell).toBe(false);
  });

  it('a defeat with every part down starts no beat at any event (the engine reads it as a defeat: no way out), and `fell` stays true', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const beats = feed(tracker, read('defeat-all-parts-down'));
    expect(beats.every((b) => b === null)).toBe(true);
    expect(tracker.form('yuna')!.fell).toBe(true);
  });

  it('a part\'s ko and revive change nothing (the main\'s `fell` stays false, no beat)', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    const log = read('part-falls-raised');
    expect(log.events.some((e) => e.type === 'ko' && tracker.isPart(e.targetId))).toBe(true);
    expect(log.events.some((e) => e.type === 'revive' && tracker.isPart(e.targetId))).toBe(true);
    expect(beatsOnly(feed(tracker, log))).toEqual([]);
    expect(tracker.form('yuna')!.fell).toBe(false);
  });

  it('a heal or a status aimed at a part (hand-written bursts) changes nothing', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    for (const name of ['heal-on-part-synthetic', 'status-on-part-synthetic']) {
      expect(read(name).source).toBe('synthetic');
      expect(beatsOnly(feed(tracker, read(name)))).toEqual([]);
    }
    expect(tracker.form('yuna')!.fell).toBe(false);
  });
});

describe('the tracker as a whole', () => {
  it('keeps one form per girl, replaces a form that is entered again, and `reset` forgets everything', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-yuna'));
    feed(tracker, read('entry-rikku'));
    expect(tracker.form('yuna')).toBeDefined();
    expect(tracker.form('rikku')).toBeDefined();
    tracker.see({ type: 'ko', targetId: 'yuna' } as unknown as BattleEvent);
    feed(tracker, read('entry-yuna')); // entered again: a new form, `fell` false
    expect(tracker.form('yuna')!.fell).toBe(false);
    tracker.reset();
    expect(tracker.form('yuna')).toBeUndefined();
    expect(tracker.of('machina-maw-smasher-r')).toBeUndefined();
  });

  it('ignores victory and defeat and every event it has no row for', () => {
    const tracker = createFormTracker();
    feed(tracker, read('entry-paine'));
    for (const e of [{ type: 'victory', result: {} }, { type: 'defeat', result: {} }, { type: 'message', text: 'x', kind: 'system' }, { type: 'damage', targetId: 'paine', amount: 5 }]) {
      expect(tracker.see(e as unknown as BattleEvent)).toBeNull();
    }
    expect(tracker.form('paine')).toBeDefined();
  });
});

describe('the ids', () => {
  it('names the Special art subjects, inside an art namespace or not, and the first-time id', () => {
    expect([...SPECIAL_ART_IDS].sort()).toEqual(['paine-full-throttle', 'rikku-machina-maw', 'yuna-floral-fallal']);
    for (const { girl, special } of FORM_GIRLS) {
      expect(specialArtId(girl, special)).toBe(`${girl}-${special}`);
      expect(isSpecialArtId(specialArtId(girl, special))).toBe(true);
      expect(isSpecialArtId(`exp-leblanc-${girl}-${special}`)).toBe(true);
    }
    expect(specialSeenId('yuna', 'floral-fallal')).toBe('special-yuna-floral-fallal');
    expect(isSpecialArtId('yuna-gunner')).toBe(false);
    expect(isSpecialArtId('exp-leblanc-yuna-gunner')).toBe(false);
    expect(isSpecialArtId(null)).toBe(false);
    expect(isSpecialArtId(undefined)).toBe(false);
    expect(isSpecialArtId('')).toBe(false);
  });
});
