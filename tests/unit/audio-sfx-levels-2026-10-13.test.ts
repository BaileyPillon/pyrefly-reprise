/**
 * The levels of the 29 new recorded takes and Shuyin's (r46-fix, FOC46-03). The driver's rule (2026-10-13): a new take ships within 1.5 dB of the sound it
 * replaces on live (d5bf2206), as the game plays it; a row that cannot come within 3 dB goes back to the sound live plays. `sfx-parity-levelfix.json` is the
 * table: for each of the 30 rows, the stand-in it replaces (its play-time P1 trim included), the integrated loudness and true peak before and after, and what
 * was done. The numbers come from `tools/audio/sfx-levels-audit.mjs` (it needs ffmpeg and the live manifest, so it is a tool, not a test); this file pins that
 * the table agrees with what ships (the manifest, the record, CREDITS) and that the rule holds in it.
 *
 * Game case: per row, each game its own (FFX rows in FFX packs, FFX-2 rows in FFX-2 packs; the pack test holds that). 12 rows were moved: 9 FFX, 3 FFX-2.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as T;

interface Row {
  pack: string; cue: string; game: string; specRow: string; take: string;
  standIn: string; standInLufs: number; levelTarget: number;
  lufsBefore: number; lufsAfter: number; truePeakAfter: number; deltaLufsBefore: number; deltaLufsAfter: number;
  action: 'kept' | 'gain' | 'limiter'; gainDb?: number;
  momentaryLufsAfter: number; manifestTruePeakAfter: number;
  sha256MasteredBefore?: string; sha256MasteredAfter?: string;
  otherStandIns?: { lufs: number; deltaLufsAfter: number }[];
}
const fix = json<{ rule: { withinDb: number; hardLimitDb: number }; rows: Row[] }>('docs/audio/sfx-parity-levelfix.json');
const manifest = json<{ sfxParity: { packs: Record<string, { cues: Record<string, { lufs: number; truePeakDb: number }> }> } }>('public/audio/manifest.json');
const record = json<{ cues: { pack: string; cue: string; sha256Mastered: string; levelFix?: string; measured: { lufs: number; truePeakDb: number } }[] }>('docs/audio/sfx-parity-record.json');
const credits = readFileSync(join(ROOT, 'docs', 'audio', 'CREDITS.md'), 'utf8');
const MOVED = fix.rows.filter((r) => r.action !== 'kept');

describe('the new takes are within the driver\'s 1.5 dB of the sound each replaces on live', () => {
  it('records the rule and all 30 rows (29 and Shuyin\'s newer take), one per shipped new cue', () => {
    expect(fix.rule).toMatchObject({ withinDb: 1.5, hardLimitDb: 3 });
    expect(fix.rows).toHaveLength(30);
    expect(new Set(fix.rows.map((r) => `${r.pack}/${r.cue}`)).size).toBe(30);
    for (const r of fix.rows) expect(manifest.sfxParity.packs[r.pack]?.cues[r.cue], `${r.pack}/${r.cue} ships`).toBeDefined();
  });

  it('holds the rule after the fix on every row, and 3 dB on every stand-in a row replaces', () => {
    for (const r of fix.rows) {
      expect(Math.abs(r.deltaLufsAfter), `${r.pack}/${r.cue} (${r.standIn})`).toBeLessThanOrEqual(fix.rule.withinDb);
      expect(Math.abs(r.lufsAfter - r.standInLufs), `${r.pack}/${r.cue} against ${r.standIn}`).toBeLessThanOrEqual(fix.rule.hardLimitDb);
      for (const o of r.otherStandIns ?? []) expect(Math.abs(o.deltaLufsAfter), `${r.pack}/${r.cue} against its other stand-in`).toBeLessThanOrEqual(fix.rule.hardLimitDb);
    }
  });

  it('moves a row toward live\'s level and never past it, and keeps the true peak at or under -1 dBTP', () => {
    expect(MOVED.map((r) => `${r.pack}/${r.cue}`).sort()).toEqual([
      'ffx-core/cure', 'ffx-core/cure-2', 'ffx-core/hit-katana', 'ffx-core/item-grenade', 'ffx-core/life', 'ffx-core/petrify-shatter', 'ffx-core/thunder-3', 'ffx-core/water-3',
      'ffx-final-aeon/fa-wave', 'ffx2-core/death', 'ffx2-core/hit-gun', 'ffx2-core/magic-charge-x2',
    ]);
    for (const r of MOVED) {
      expect(Math.abs(r.deltaLufsAfter), `${r.cue} ends nearer to live`).toBeLessThan(Math.abs(r.deltaLufsBefore));
      expect(Math.sign(r.deltaLufsAfter) === Math.sign(r.deltaLufsBefore) || Math.abs(r.deltaLufsAfter) < 0.5, `${r.cue} does not overshoot`).toBe(true);
    }
    for (const r of fix.rows) {
      expect(r.truePeakAfter, `${r.pack}/${r.cue} true peak (the meter)`).toBeLessThanOrEqual(-1);
      expect(r.manifestTruePeakAfter, `${r.pack}/${r.cue} true peak (the manifest)`).toBeLessThanOrEqual(-1.05);
    }
    // The one that needed the limiter: Petrify is a 1.5 s crack of glass with a 30 dB crest, 8.4 dB under live as the lane shipped it.
    const petrify = fix.rows.find((r) => r.cue === 'petrify-shatter')!;
    expect(petrify.action).toBe('limiter');
    expect(petrify.deltaLufsBefore).toBeLessThan(-8);
    expect(Math.abs(petrify.deltaLufsAfter)).toBeLessThanOrEqual(1.5);
  });

  it('agrees with what ships: the manifest\'s level of each cue, the record\'s measured level and mastered hash, and CREDITS', () => {
    for (const r of fix.rows) {
      const shipped = manifest.sfxParity.packs[r.pack]!.cues[r.cue]!;
      expect(shipped.lufs, `${r.pack}/${r.cue} manifest level`).toBeCloseTo(r.momentaryLufsAfter, 1);
      expect(shipped.truePeakDb, `${r.pack}/${r.cue} manifest peak`).toBeCloseTo(r.manifestTruePeakAfter, 1);
    }
    for (const r of MOVED) {
      const rec = record.cues.find((c) => c.pack === r.pack && c.cue === r.cue)!;
      expect(rec.sha256Mastered, `${r.cue} record mastered hash`).toBe(r.sha256MasteredAfter);
      expect(rec.levelFix, `${r.cue} record points at the level-fix file`).toBe('docs/audio/sfx-parity-levelfix.json');
      expect(rec.measured.lufs, `${r.cue} record level`).toBeCloseTo(r.momentaryLufsAfter, 1);
      expect(credits, `CREDITS carries the re-levelled mastered file of ${r.pack}/${r.cue}`).toContain(r.sha256MasteredAfter);
      expect(credits, `CREDITS keeps the lane's file of ${r.pack}/${r.cue}`).toContain(r.sha256MasteredBefore!);
      expect(r.sha256MasteredAfter).not.toBe(r.sha256MasteredBefore);
    }
    // A row that kept its level has no mastered-hash change recorded.
    for (const r of fix.rows.filter((x) => x.action === 'kept')) expect(record.cues.find((c) => c.pack === r.pack && c.cue === r.cue)!.levelFix, `${r.cue} was not touched`).toBeUndefined();
  });
});
