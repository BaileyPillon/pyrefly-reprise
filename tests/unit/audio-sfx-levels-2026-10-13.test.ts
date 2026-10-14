/**
 * The levels of the 29 new recorded takes and Shuyin's (r46-fix, FOC46-03). The driver's rule (2026-10-13): a new take ships within 1.5 dB of the sound it
 * replaces on live (d5bf2206), as the game plays it; a row that cannot come within 3 dB goes back to the sound live plays. `sfx-parity-levelfix.json` is the
 * table: for each of the 30 rows, the stand-in it replaces (its play-time P1 trim included), the integrated loudness and true peak before and after, and what
 * was done. The numbers come from `tools/audio/sfx-levels-audit.mjs` (it needs ffmpeg and the live manifest, so it is a tool, not a test); this file pins that
 * the table agrees with what ships (the manifest, the record, CREDITS) and that the rule holds in it.
 *
 * Game case: per row, each game its own (FFX rows in FFX packs, FFX-2 rows in FFX-2 packs; the pack test holds that). 11 rows were moved: 9 FFX, 2 FFX-2.
 *
 * ONE NAMED EXCEPTION to the 1.5 dB rule (FFX-2 only; decision 52n, D-750): an FFX-2 party hit is never made quieter than today's on the loudest 400 ms (the
 * manifest's lufs). The Gunner's hit (ffx2-core/hit-gun) was cut 1.6 dB in the first pass of r46-fix because the integrated measure put it 2.6 dB over its stand-in;
 * on the loudest 400 ms it already equalled the stand-in (-13.97 against -14.1), so the cut made the girls' hit quieter than today's, which 52n forbids (the friends'
 * playtest heard quiet hits as "no attack sound"). It ships at the level the lane mastered it at; its row keeps the measurements and says why (`exception`).
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
  exception?: { decision: string; rule: string; standInLoudest400msLufs: number; loudest400msLufsBefore: number; loudest400msLufsAfter: number; why: string };
}
const fix = json<{ rule: { withinDb: number; hardLimitDb: number }; rows: Row[] }>('docs/audio/sfx-parity-levelfix.json');
const manifest = json<{ sfxParity: { packs: Record<string, { cues: Record<string, { lufs: number; truePeakDb: number }> }> } }>('public/audio/manifest.json');
const record = json<{ cues: { pack: string; cue: string; sha256Mastered: string; levelFix?: string; measured: { lufs: number; truePeakDb: number } }[] }>('docs/audio/sfx-parity-record.json');
const credits = readFileSync(join(ROOT, 'docs', 'audio', 'CREDITS.md'), 'utf8');
const MOVED = fix.rows.filter((r) => r.action !== 'kept');
/** The rows that are outside the 1.5 dB rule on purpose, each with its decision. */
const EXCEPTIONS = fix.rows.filter((r) => r.exception !== undefined);
/** The lane's mastered file of the Gunner's hit, and the one the first pass of r46-fix made from it with -1.6 dB (it ships the first, never the second). */
const GUNNER_LANE = 'ca9487d8682559ebf3310fbe459ca72a0f42d0e0beba09a8c3c3d738f7ed7d71';
const GUNNER_CUT = 'e0c79b8f78853e306658675a96cfdcd8de2e29f1af38ed604113af08ecce963a';

describe('the new takes are within the driver\'s 1.5 dB of the sound each replaces on live', () => {
  it('records the rule and all 30 rows (29 and Shuyin\'s newer take), one per shipped new cue', () => {
    expect(fix.rule).toMatchObject({ withinDb: 1.5, hardLimitDb: 3 });
    expect(fix.rows).toHaveLength(30);
    expect(new Set(fix.rows.map((r) => `${r.pack}/${r.cue}`)).size).toBe(30);
    for (const r of fix.rows) expect(manifest.sfxParity.packs[r.pack]?.cues[r.cue], `${r.pack}/${r.cue} ships`).toBeDefined();
  });

  it('holds the rule after the fix on every row but the one named exception, and 3 dB on every stand-in a row replaces', () => {
    for (const r of fix.rows.filter((x) => x.exception === undefined)) {
      expect(Math.abs(r.deltaLufsAfter), `${r.pack}/${r.cue} (${r.standIn})`).toBeLessThanOrEqual(fix.rule.withinDb);
      expect(Math.abs(r.lufsAfter - r.standInLufs), `${r.pack}/${r.cue} against ${r.standIn}`).toBeLessThanOrEqual(fix.rule.hardLimitDb);
      for (const o of r.otherStandIns ?? []) expect(Math.abs(o.deltaLufsAfter), `${r.pack}/${r.cue} against its other stand-in`).toBeLessThanOrEqual(fix.rule.hardLimitDb);
    }
    // The exception holds the hard limit all the same (2.6 dB over its stand-in on the integrated measure), and it is not a way out for anything else.
    for (const r of EXCEPTIONS) {
      expect(Math.abs(r.deltaLufsAfter), `${r.pack}/${r.cue} (${r.standIn})`).toBeLessThanOrEqual(fix.rule.hardLimitDb);
    }
  });

  it('the exception is one row, the Gunner\'s hit, FFX-2 only, and it is a hit the 1.5 dB rule would have cut below today\'s level', () => {
    expect(EXCEPTIONS.map((r) => `${r.pack}/${r.cue}`)).toEqual(['ffx2-core/hit-gun']);
    const r = EXCEPTIONS[0]!;
    expect(r.game).toBe('ffx2');
    expect(r.exception!.decision).toContain('52n');
    expect(r.action, 'it keeps the lane\'s level: nothing was moved').toBe('kept');
    // Against the stand-in it replaces, on the measure 52n fixes (the loudest 400 ms = the manifest's lufs): equal, not quieter.
    expect(r.exception!.standInLoudest400msLufs).toBe(-14.1);
    expect(r.exception!.loudest400msLufsAfter - r.exception!.standInLoudest400msLufs).toBeGreaterThanOrEqual(-0.5);
    expect(r.exception!.loudest400msLufsAfter).toBe(r.exception!.loudest400msLufsBefore);
    // On the integrated measure it is over (the metrics disagree), which is what the rule would have cut.
    expect(r.deltaLufsAfter).toBeGreaterThan(fix.rule.withinDb);
    expect(r.lufsAfter).toBe(r.lufsBefore);
  });

  it('an FFX-2 party hit is never made quieter than today\'s on the loudest 400 ms (52n): every blow of the girls in ffx2-core reads the impact class level', () => {
    const IMPACT_TODAY = -14.1;
    for (const cue of ['hit-dagger', 'hit-greatsword', 'hit-gun']) {
      expect(manifest.sfxParity.packs['ffx2-core']!.cues[cue]!.lufs, `ffx2-core/${cue} against today's level`).toBeGreaterThanOrEqual(IMPACT_TODAY - 0.5);
    }
  });

  it('moves a row toward live\'s level and never past it, and keeps the true peak at or under -1 dBTP', () => {
    expect(MOVED.map((r) => `${r.pack}/${r.cue}`).sort()).toEqual([
      'ffx-core/cure', 'ffx-core/cure-2', 'ffx-core/hit-katana', 'ffx-core/item-grenade', 'ffx-core/life', 'ffx-core/petrify-shatter', 'ffx-core/thunder-3', 'ffx-core/water-3',
      'ffx-final-aeon/fa-wave', 'ffx2-core/death', 'ffx2-core/magic-charge-x2',
    ]);
    expect(MOVED.filter((r) => r.game === 'ffx2').map((r) => r.cue).sort(), 'no FFX-2 party hit is among the moved rows').toEqual(['death', 'magic-charge-x2']);
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
    // The Gunner's hit ships the lane's mastered file, in the record and in CREDITS; the file the first pass of r46-fix cut from it is nowhere (the exception, 52n).
    const gunner = record.cues.find((c) => c.pack === 'ffx2-core' && c.cue === 'hit-gun')!;
    expect(gunner.sha256Mastered).toBe(GUNNER_LANE);
    expect(credits).toContain(GUNNER_LANE);
    expect(credits, 'the cut file is not named as the mastered file').not.toContain(GUNNER_CUT);
    expect(JSON.stringify(record)).not.toContain(GUNNER_CUT);
    expect(gunner.measured.lufs, 'the record\'s level is the lane\'s').toBeCloseTo(-14.1, 0);
    expect(manifest.sfxParity.packs['ffx2-core']!.cues['hit-gun']!.lufs, 'the pack plays it at the lane\'s level').toBeCloseTo(-13.97, 1);
  });
});
