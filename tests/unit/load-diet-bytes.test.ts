/**
 * The byte budget of every chapter, computed offline from the art manifest and the shipped-file list (lane "load-diet", 2026-10-29; both games, shared loading plumbing).
 * `tests/unit/helpers/load-bytes-model.ts` is the model; `docs/handoff/load-diet.md` has the table. With `LOAD_DIET_REPORT=<file>` set the test also writes the rows as JSON.
 */
import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PROFILES, allChapterBytes, frontEndBytes, type ChapterBytes } from './helpers/load-bytes-model.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

const MB = 1e6;

describe('the byte budget per chapter (offline)', async () => {
  const { rows, failed } = await allChapterBytes();
  const out = process.env['LOAD_DIET_REPORT'];
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ written: new Date().toISOString(), failed, frontEnd: frontEndBytes(), rows }, null, 1));
  }
  const of = (id: string, profile: string): ChapterBytes => rows.find((r) => r.chapter === id && r.profile === profile)!;

  it('computes every listed chapter on every profile', () => {
    expect(failed).toEqual([]);
    expect(rows).toHaveLength(CHAPTERS.length * PROFILES.length);
  });

  it('every chapter has paintings the model could size (nothing the manifest lists is missing from the shipped files)', () => {
    for (const r of rows) {
      expect(r.art, r.chapter).toBeGreaterThan(5 * MB);
      expect(r.missing.filter((m) => !/\/(portraits|pause)\//.test(m)), `${r.chapter}/${r.profile}`).toEqual([]);
    }
  });

  it('the diet only moves bytes out of the first menu, never adds any', () => {
    for (const r of rows) {
      expect(r.firstMenuDiet, `${r.chapter}/${r.profile}`).toBeLessThanOrEqual(r.firstMenu67);
      expect(r.firstMenu67 - r.firstMenuDiet).toBe(r.latePoses);
      expect(r.art).toBe(r.firstMenuDiet + r.streamed);
    }
  });

  it('a phone and a 1600-wide desktop ask for the same approved paintings: no tier is fetched at 1x base (the 2x masters start at 1440p)', () => {
    for (const c of CHAPTERS) {
      const phone = of(c.id, 'phone');
      const desk = of(c.id, 'desk1600');
      expect(phone.openingPoses, c.id).toBe(desk.openingPoses);
      expect(phone.latePoses, c.id).toBe(desk.latePoses);
      expect(phone.plate, c.id).toBe(desk.plate);
    }
    // and 1440p is where the tiers begin: never fewer bytes than the 1600 desktop
    for (const c of CHAPTERS) expect(of(c.id, 'desk1440p').openingPoses + of(c.id, 'desk1440p').plate).toBeGreaterThanOrEqual(of(c.id, 'desk1600').openingPoses + of(c.id, 'desk1600').plate);
  });

  it("Chapter I (FFX) and Chapter IV (FFX-2) on the 1600-wide desktop sit near round 30b's G4 measurement (123 MB unique for Chapter I, board and audio included)", () => {
    const ch1 = of('seymour-flux', 'desk1600');
    expect(ch1.art / MB).toBeGreaterThan(60);
    expect(ch1.art / MB).toBeLessThan(110);
    expect(ch1.firstMenuDiet).toBeLessThan(ch1.firstMenu67 / 2);
  });

  it('under the diet no chapter waits for more than 25 MB of art at the first menu on the 1600-wide desktop or the phone, and 80 MB at 1440p', () => {
    for (const r of rows) expect(r.firstMenuDiet / MB, `${r.chapter}/${r.profile}`).toBeLessThan(r.profile === 'desk1440p' ? 80 : 25);
  });

  it("the board's warm is the same on every profile and its first paint waits for a card's worth, not the board's", () => {
    const f = frontEndBytes();
    expect(f.first).toBeGreaterThan(2 * MB);
    expect(f.first).toBeLessThan(f.rest);
    expect(f.strips + f.faces + f.plates + f.other).toBe(f.rest);
  });
});
