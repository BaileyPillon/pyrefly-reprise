/**
 * SFX parity, the mix (decisions 52i P1, 52j HOLD rows keep today's sound, 52k one menu tick; both games):
 * the generated trim table against the rows and the manifest, and the rules the table must keep.
 *
 * Facts about the retail games enter only as numbers (`docs/audio/sfx-parity-mix.json`); the sprite is not
 * re-encoded; `SaveData`, the buses and the limiter are untouched (`audio-sfx-mix.test.ts` pins them).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveTrims, isBossRow, rowTarget, type CueLevel, type MixFile, type MixRow } from '../../src/audio/sfxV2/parityDerive.ts';
import { PARITY_TRIMS_DB } from '../../src/audio/sfxV2/parityTrims.ts';
import { parityGain, parityTrimDb } from '../../src/audio/sfxV2/parityMix.ts';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';
import { voiceKey } from '../../src/audio/sfxV2/voicing.ts';

const ROOT = new URL('../../', import.meta.url);
const mix = JSON.parse(readFileSync(new URL('docs/audio/sfx-parity-mix.json', ROOT), 'utf8')) as MixFile & { rows: MixRow[] };
const manifest = JSON.parse(readFileSync(new URL('public/audio/manifest.json', ROOT), 'utf8')) as {
  sfxV2: { cues: Record<string, CueLevel & { category: string }> };
};
const cues = manifest.sfxV2.cues;
const games = ['ffx', 'ffx2'] as const;

const level = (game: 'ffx' | 'ffx2', cue: string): number => cues[cue]!.lufs + (PARITY_TRIMS_DB[game][cue] ?? 0);

describe('the P1 trim table (52i)', () => {
  it('is what the rows and the manifest give: not stale, and the tool agrees', () => {
    expect(PARITY_TRIMS_DB).toEqual(deriveTrims(mix, cues));
    // The generated file's text is the tool's output byte for byte (it exits 1 when it is not).
    expect(() => execFileSync(process.execPath, ['tools/audio/sfx-parity-mix.mjs', '--check'], { cwd: ROOT, stdio: 'pipe' })).not.toThrow();
  });

  it('keeps rule 14: a game only gets trims for cues it plays, and each game its own value', () => {
    for (const game of games) {
      for (const cue of Object.keys(PARITY_TRIMS_DB[game])) {
        expect(V2_CUES[cue], `${game}: ${cue} is not a v2 cue`).toBeDefined();
        expect(['both', game], `${game} would trim ${cue}, which is ${V2_CUES[cue]!.game}`).toContain(V2_CUES[cue]!.game);
      }
    }
    // FFX-only and FFX-2-only names never appear in the other game's table.
    expect(PARITY_TRIMS_DB.ffx2['cursor-move']).toBeUndefined();
    expect(PARITY_TRIMS_DB.ffx['cursor-move-x2']).toBeUndefined();
    expect(PARITY_TRIMS_DB.ffx['shot-gun']).toBeUndefined();
    // A cue both games play takes the value of its own game's rows.
    expect(PARITY_TRIMS_DB.ffx['shell']).not.toBe(PARITY_TRIMS_DB.ffx2['shell']);
  });

  it('holds every cue at or under the -14 LUFS cap, and a boost never takes a true peak over -1.1 dBTP', () => {
    for (const game of games) {
      for (const [cue, trim] of Object.entries(PARITY_TRIMS_DB[game])) {
        const c = cues[cue]!;
        expect(c.lufs + trim, `${game} ${cue} loudness`).toBeLessThanOrEqual(mix.capLufs + 0.05);
        if (trim > 0) expect(c.truePeakDb + trim, `${game} ${cue} true peak`).toBeLessThanOrEqual(mix.tpCeilDbtp + 0.05);
      }
    }
  });

  it('puts every applied row at its target within the rounding, for a cue only that row names', () => {
    let checked = 0;
    for (const row of mix.rows) {
      const target = rowTarget(mix, row);
      if (target === null) continue;
      for (const cue of row.cues) {
        const sharers = mix.rows.filter((r) => r.game === row.game && r.cues.includes(cue));
        if (sharers.length !== 1 || !cues[cue]) continue;
        const headroom = cues[cue]!.truePeakDb + (PARITY_TRIMS_DB[row.game][cue] ?? 0);
        const wantBoost = target - cues[cue]!.lufs;
        // A boost the true peak cannot take is limited, not skipped (the headroom guard above).
        if (wantBoost > 0 && headroom > mix.tpCeilDbtp - 0.15) continue;
        expect(level(row.game, cue), `${row.id} -> ${cue}`).toBeCloseTo(target, 0);
        checked++;
      }
    }
    expect(checked, 'rows checked').toBeGreaterThan(30);
  });
});

describe('the D-210 floor under the party (FFX-2 hits)', () => {
  it('lifts the girls\' swings and blows to the floor and no lower, today minus 6.02 dB at most', () => {
    expect(mix.floors).toEqual({ weapon: -24, impact: -20.1 });
    for (const cue of ['shot-gun', 'swing-dagger']) expect(level('ffx2', cue), cue).toBeCloseTo(-24, 0);
    for (const cue of ['hit-gun', 'hit-dagger', 'hit-greatsword', 'ko-fall']) expect(level('ffx2', cue), cue).toBeCloseTo(-20.1, 0);
    // Nothing the floor protects goes lower than the floor.
    for (const row of mix.rows.filter((r) => r.floor)) {
      const target = rowTarget(mix, row);
      if (target === null) continue;
      expect(target, row.id).toBeGreaterThanOrEqual(mix.floors[row.floor!] - 0.05);
    }
    // And no trim anywhere is a deeper cut than the floor allows a party swing or blow.
    for (const cue of ['shot-gun', 'swing-dagger', 'hit-gun', 'hit-dagger', 'hit-greatsword', 'ko-fall']) expect(PARITY_TRIMS_DB.ffx2[cue]!, cue).toBeGreaterThanOrEqual(-6.1);
  });

  it('moves the floor with one number: raising it to today\'s class levels removes the cut', () => {
    const kept = deriveTrims({ ...mix, floors: { weapon: -18, impact: -14.1 } }, cues);
    for (const cue of ['shot-gun', 'swing-dagger', 'hit-gun', 'hit-dagger', 'hit-greatsword']) expect(kept.ffx2[cue], cue).toBeUndefined();
  });
});

describe('HOLD rows keep today\'s sound (52j)', () => {
  it('trims no cue that only HOLD rows name', () => {
    const named = (cue: string, game: 'ffx' | 'ffx2') => mix.rows.filter((r) => r.game === game && r.cues.includes(cue));
    for (const game of games) {
      for (const cue of Object.keys(cues)) {
        const rows = named(cue, game);
        if (rows.length === 0 || rows.some((r) => r.confidence !== 'hold')) continue;
        expect(PARITY_TRIMS_DB[game][cue], `${game} ${cue} is a HOLD cue`).toBeUndefined();
      }
    }
    // The ones the spec lists by name: the miss whiff, the status bell, the critical flash, the guard and counter ticks, the generic hit.
    for (const cue of ['whiff', 'status-applied', 'critical', 'guard', 'counter', 'stop', 'hit-2', 'overdrive-full', 'menu-close']) expect(PARITY_TRIMS_DB.ffx[cue], `ffx ${cue}`).toBeUndefined();
    for (const cue of ['whiff', 'status-applied', 'critical', 'guard', 'counter', 'stop', 'hit-2', 'spherechange', 'battle-start', 'overdrive-full-x2']) expect(PARITY_TRIMS_DB.ffx2[cue], `ffx2 ${cue}`).toBeUndefined();
  });

  it('also holds a row the spec grades low until it is settled (the cast wind-up, the FFX weapon split, the KO and dissolve candidates)', () => {
    expect(PARITY_TRIMS_DB.ffx['magic-charge']).toBeUndefined(); // retail has the wind-up for three characters only: Bailey's decision
    expect(PARITY_TRIMS_DB.ffx['dissolve-pyreflies']).toBeUndefined();
    expect(PARITY_TRIMS_DB.ffx['ko-fall']).toBeUndefined();
    for (const cue of ['swing-sword', 'hit-sword', 'swing-staff', 'swing-claw', 'swing-katana']) expect(PARITY_TRIMS_DB.ffx[cue], cue).toBeUndefined();
    const all = deriveTrims({ ...mix, applyLow: true }, cues);
    expect(all.ffx['magic-charge']!).toBeLessThan(-15);
    expect(all.ffx['dissolve-pyreflies']!).toBeGreaterThan(5);
  });

  it('lets a boss\'s signature row move a shared cue only when no generic row names it', () => {
    const base: MixFile = { capLufs: -14, tpCeilDbtp: -1.1, floors: { weapon: -24, impact: -20.1 }, applyLow: false, rows: [] };
    const cue = { 'swing-x': { game: 'ffx', lufs: -18, truePeakDb: -6 } } as Record<string, CueLevel>;
    const row = (id: string, retailLufs: number, confidence: MixRow['confidence'] = 'high'): MixRow => ({ id, game: 'ffx', cues: ['swing-x'], retailLufs, floor: null, confidence, freq: 1 });
    expect(isBossRow({ id: 'ffx.boss.flux.cleave' })).toBe(true);
    expect(isBossRow({ id: 'ffx2.lb.sig.logos' })).toBe(true);
    expect(isBossRow({ id: 'ffx.weapon.sword.swing' })).toBe(false);
    // generic row + boss row: the generic one decides
    expect(deriveTrims({ ...base, rows: [row('ffx.weapon.x.swing', -20), row('ffx.boss.a.cleave', -14)] }, cue).ffx['swing-x']).toBe(-2);
    // generic row held (low): the boss row does not move the cue
    expect(deriveTrims({ ...base, rows: [row('ffx.weapon.x.swing', -20, 'low'), row('ffx.boss.a.cleave', -14)] }, cue).ffx['swing-x']).toBeUndefined();
    // boss row alone: it applies
    expect(deriveTrims({ ...base, rows: [row('ffx.boss.a.cleave', -15)] }, cue).ffx['swing-x']).toBe(3);
  });

  it('limits a boost to the true-peak headroom and averages shared rows by plays', () => {
    const base: MixFile = { capLufs: -14, tpCeilDbtp: -1.1, floors: { weapon: -24, impact: -20.1 }, applyLow: false, rows: [] };
    const hot = { 'tick': { game: 'ffx', lufs: -24, truePeakDb: -3.1 } } as Record<string, CueLevel>;
    const r = (id: string, retailLufs: number, freq: number): MixRow => ({ id, game: 'ffx', cues: ['tick'], retailLufs, floor: null, confidence: 'high', freq });
    expect(deriveTrims({ ...base, rows: [r('ffx.ui.a', -18.8, 4)] }, hot).ffx['tick']).toBe(2); // wants +5.2, headroom 2.0
    expect(deriveTrims({ ...base, rows: [r('ffx.ui.a', -20, 3), r('ffx.ui.b', -24, 1)] }, { tick: { game: 'ffx', lufs: -24, truePeakDb: -20 } }).ffx['tick']).toBe(3); // (3*-20 + 1*-24)/4 = -21 -> +3
    expect(deriveTrims({ ...base, rows: [r('ffx.ui.a', -10, 1)] }, { tick: { game: 'ffx', lufs: -20, truePeakDb: -20 } }).ffx['tick']).toBe(6); // capped at -14: +6
  });
});

describe('one menu tick for cursor and confirm, about +5 dB (52k)', () => {
  it('plays the same cue for both keys in each game, and nothing changes outside a chapter', () => {
    expect(voiceKey('confirm', 'ffx')).toBe('v2:cursor-move');
    expect(voiceKey('cursor-move', 'ffx')).toBe('v2:cursor-move');
    expect(voiceKey('confirm', 'ffx2')).toBe('v2:cursor-move-x2');
    expect(voiceKey('cursor-move', 'ffx2')).toBe('v2:cursor-move-x2');
    expect(voiceKey('confirm', null)).toBe('confirm'); // the title, chapter select and FF7 keep the first bank's own confirm
    expect(voiceKey('cancel', 'ffx')).toBe('v2:cancel'); // the rest of the menu set is untouched
  });

  it('raises the tick about 5 dB in both games and leaves the first-bank tick alone', () => {
    expect(parityTrimDb('ffx', 'cursor-move')).toBeGreaterThanOrEqual(4.5);
    expect(parityTrimDb('ffx', 'cursor-move')).toBeLessThanOrEqual(6);
    expect(parityTrimDb('ffx2', 'cursor-move-x2')).toBeGreaterThanOrEqual(4.5);
    expect(parityTrimDb('ffx2', 'cursor-move-x2')).toBeLessThanOrEqual(6);
    expect(level('ffx', 'cursor-move')).toBeCloseTo(-18.8, 0);
    expect(level('ffx2', 'cursor-move-x2')).toBeCloseTo(-18.8, 0);
    expect(parityTrimDb(null, 'cursor-move')).toBe(0);
    expect(parityGain(null, 'cursor-move')).toBe(1);
  });

  it('turns a trim into a linear gain', () => {
    expect(parityGain('ffx2', 'hit-gun')).toBeCloseTo(10 ** (-6 / 20), 6);
    expect(parityGain('ffx2', 'no-such-cue')).toBe(1);
    expect(parityGain('ffx', 'shot-gun')).toBe(1);
  });
});

describe('the rows file carries numbers only', () => {
  it('has no retail ids, names or audio paths, and every row names a known shape', () => {
    for (const row of mix.rows) {
      expect(Object.keys(row).sort(), row.id).toEqual(['confidence', 'cues', 'floor', 'freq', 'game', 'id', 'retailLufs']);
      expect(row.id, row.id).toMatch(/^ffx2?\.[a-z0-9.-]+$/);
      expect(row.id.startsWith(`${row.game}.`), row.id).toBe(true);
      expect(row.cues.length, row.id).toBeGreaterThan(0);
      for (const cue of row.cues) expect(V2_CUES[cue], `${row.id}: ${cue}`).toBeDefined();
      expect(['high', 'medium-high', 'medium', 'low', 'hold']).toContain(row.confidence);
      expect(row.retailLufs === null, row.id).toBe(row.confidence === 'hold');
    }
    const text = readFileSync(new URL('docs/audio/sfx-parity-mix.json', ROOT), 'utf8');
    expect(text).not.toMatch(/\.fsb|\.vbf|\.bnk|ps3data|sound_pc|[0-9]{4}\/[0-9]{3,5}\b/i);
  });
});
