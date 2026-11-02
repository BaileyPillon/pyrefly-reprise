/**
 * The bytes a phone's battle entry waits for, per chapter, before and after release 73 (lane "r73-bytes"; both games, shared loading plumbing; `docs/handoff/r73-bytes.md`).
 * `tests/unit/helpers/phone-entry-model.ts` is the model; with `R73_REPORT=<file>` set this test also writes the rows as JSON. The model is checked against release 70's live phone10 run
 * (`critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/phone10/first-command-phone10-pad-r32-g4-live.json`): the boss rig's, the idle maps' and the results cues' bytes of Chapters I and IV, which
 * the run summed from its request log.
 */
import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { LINE_MB_PER_S, allEntryBytes, type EntryBytes } from './helpers/phone-entry-model.ts';

const MB = 1e6;
/** The two chapters whose HD-2D look is on by default and the only two whose boss is a variant rig in the phone's window (FFX Chapter I, FFX-2 Chapter IV). */
const LOOK_CHAPTERS = ['seymour-flux', 'ffx2-bahamut'];

describe('what the phone\'s battle entry waits for, per chapter (offline)', async () => {
  const { rows, failed } = await allEntryBytes();
  const out = process.env['R73_REPORT'];
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ written: new Date().toISOString(), lineMBps: LINE_MB_PER_S, failed, rows }, null, 1));
  }
  const of = (id: string): EntryBytes => rows.find((r) => r.chapter === id)!;

  it('prices every listed chapter', () => {
    expect(failed).toEqual([]);
    expect(rows).toHaveLength(CHAPTERS.length);
  });

  it('reproduces release 70\'s live phone10 run: Chapter I\'s boss rig (4.73 MB on the wire), its five idle maps (2.23 MB)', () => {
    const c = of('seymour-flux');
    expect(c.rigs.map((r) => r.id)).toEqual(['seymour-flux-body']);
    expect(c.rigAll / MB).toBeGreaterThan(4.73 * 0.97);
    expect(c.rigAll / MB).toBeLessThan(4.73 * 1.03);
    expect(c.idleMaps / MB).toBeGreaterThan(2.23 * 0.98);
    expect(c.idleMaps / MB).toBeLessThan(2.23 * 1.02);
    expect(c.rigVariants / c.rigAll).toBeGreaterThan(0.55); // 2.8 of 4.73 MB: attack, cast, hurt, telegraph, ko and their rim and normal pieces
    expect(c.rigVariants / c.rigAll).toBeLessThan(0.7);
  });

  it('and Chapter IV: Bahamut\'s rig (5.71 MB), its four idle maps (1.79 to 1.83 MB), the wings and depth plate of the diorama (2.75 MB), the pause and defeat cues (1.6 MB)', () => {
    const c = of('ffx2-bahamut');
    expect(c.rigs.map((r) => r.id)).toEqual(['ffx2-bahamut']);
    expect(c.rigAll / MB).toBeGreaterThan(5.71 * 0.97);
    expect(c.rigAll / MB).toBeLessThan(5.71 * 1.03);
    expect(c.idleMaps / MB).toBeGreaterThan(1.75);
    expect(c.idleMaps / MB).toBeLessThan(1.87);
    expect(c.diorama / MB).toBeGreaterThan(2.6);
    expect(c.diorama / MB).toBeLessThan(2.9);
    expect(c.resultsCues / MB).toBeGreaterThan(1.5);
    expect(c.resultsCues / MB).toBeLessThan(1.7);
    expect(c.rigVariants / c.rigAll).toBeGreaterThan(0.5);
  });

  it('the four cuts only take bytes out of the window, never add: r73 = diorama + opening + the rig\'s base looks, and saved is exactly the variants, the idle maps and the results cues', () => {
    for (const r of rows) {
      expect(r.r73, r.chapter).toBeLessThanOrEqual(r.r70);
      expect(r.r73, r.chapter).toBe(r.diorama + r.opening + r.rigBase);
      expect(r.saved, r.chapter).toBe(r.rigVariants + r.idleMaps + r.resultsCues);
      expect(r.r73s, r.chapter).toBeLessThanOrEqual(r.r70s);
    }
  });

  it('the idle maps and the variant looks are Chapter I\'s (FFX) and Chapter IV\'s (FFX-2) alone: no other chapter has its look on or a boss with variants (rule 14: the case is both games, the content is one chapter of each)', () => {
    for (const r of rows) {
      if (LOOK_CHAPTERS.includes(r.chapter)) {
        expect(r.idleMaps, r.chapter).toBeGreaterThan(1.5 * MB);
        expect(r.rigVariants, r.chapter).toBeGreaterThan(2.5 * MB);
      } else {
        expect(r.idleMaps, r.chapter).toBe(0);
        expect(r.rigVariants, r.chapter).toBe(0);
      }
    }
    expect(of('seymour-flux').game).toBe('ffx');
    expect(of('ffx2-bahamut').game).toBe('ffx2');
  });

  it('every chapter loses its results cues (0.77 MB in FFX, 0.99 MB in FFX-2, Chapter IV\'s 1.6 MB), and nothing else', () => {
    for (const r of rows) {
      if (LOOK_CHAPTERS.includes(r.chapter)) continue;
      expect(r.saved, r.chapter).toBe(r.resultsCues);
      expect(r.resultsCues / MB, r.chapter).toBeGreaterThan(0.7);
      expect(r.resultsCues / MB, r.chapter).toBeLessThan(1.1);
    }
  });

  it('the two chapters the budget is about lose more than a third of the window\'s bytes on a 10 Mbit/s line, and the line seconds say how much that is', () => {
    for (const id of LOOK_CHAPTERS) {
      const r = of(id);
      expect(r.saved / r.r70, id).toBeGreaterThan(0.35);
      expect(r.r70s - r.r73s, id).toBeGreaterThan(4.5); // seconds of line
      expect(r.r70s - r.r73s).toBeCloseTo(r.saved / MB / LINE_MB_PER_S, 6);
    }
  });
});
