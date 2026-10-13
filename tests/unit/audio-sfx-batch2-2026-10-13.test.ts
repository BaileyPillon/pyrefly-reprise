/**
 * The second audio lane (branch r46-audio2, 2026-10-13): the driver's 29 sound-effect picks, the newer Shuyin take, and the three re-cut results loops.
 *
 * Bailey, 2026-10-13: "keep going please ill go with all your recommendations even for music and sound." (after the driver published its picks for the
 * recorded sound-effect rows: 29 use the newer recording, 24 keep today's cue, 11 wait for a method check). This pins:
 *   - which cues ship in which pack, game by game (rule 14: an FFX row only in an FFX pack, an FFX-2 row only in an FFX-2 pack, never a cue of the other
 *     game in a chapter's pack), and that the 24 "keep today's" and 11 "try again" rows are NOT in any pack;
 *   - the record agrees (29 rows with their provenance, Shuyin on take v3, the two peak-limited takes flagged with their level shortfall);
 *   - FOC45-02: the three results loops close on body music, with the level across the wrap inside 3 dB on both the 50 ms and the 200 ms windows
 *     (measured on the decoded files by the lane; the headless proof of the production build measures it again), and the manifest still describes an
 *     intro of 6 to 9 s and a body of 20 to 40 s with the 3 s run-on.
 *
 * Game case: the sound-effect cues are per game (FFX 17, FFX-2 12); the loops are FFX (victory-ffx), FFX-2 (victory-ffx2) and FFX-2 Chapter IV (victory-bahamut).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOSS_PACKS, packsFor } from '../../src/audio/sfxV2/packs.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as T;

interface PackCue { game?: string; specRow?: string; take?: string; lufs?: number; offset: number; duration: number }
interface Manifest {
  sfxParity: { packs: Record<string, { file: string; bytes: number; quality: string; cues: Record<string, PackCue> }> };
  music: Record<string, { loopStart: number; loopEnd: number; duration: number; bytes: number }>;
}
const manifest = json<Manifest>('public/audio/manifest.json');
const packs = manifest.sfxParity.packs;
const names = (pack: string): string[] => Object.keys(packs[pack]?.cues ?? {}).sort();

/** The shipped cues, pack by pack: the 18 of the first batch plus the driver's 29 (Shuyin on take v3). */
const SHIPPED: Record<string, string[]> = {
  'ffx-core': ['buff-generic', 'cancel', 'cure', 'cure-2', 'cursor-move', 'darkness', 'dissolve-pyreflies', 'error', 'fire-2', 'hit-katana', 'hit-spear', 'item-ether', 'item-grenade', 'life', 'meteor', 'petrify-shatter', 'shell', 'slow', 'swing-katana', 'thunder-3', 'water', 'water-3'],
  'ffx-flux': ['flux-cleave', 'swing-flux'],
  'ffx-final-aeon': ['fa-wave'],
  'ffx-lady': ['lady-metamorph'],
  'ffx2-core': ['cancel-x2', 'confirm-x2', 'cura-x2', 'cure-x2', 'cursor-move-x2', 'death', 'error-x2', 'flare-x2', 'gun-burst', 'hit-dagger', 'hit-greatsword', 'hit-gun', 'magic-charge-x2', 'menu-close-x2', 'menu-open-x2', 'menu-page-x2'],
  'ffx2-aeons': ['boss-shiva'],
  'ffx2-bahamut': ['boss-bahamut'],
  'ffx2-machina': ['boss-leg', 'machina-destroy'],
  'ffx2-shuyin': ['boss-shuyin'],
};

/** The 11 rows the driver sent back for a method check, and the 24 whose cue stays today's: their cue names, per pack. None of them ships. */
const NOT_SHIPPED: Record<string, string[]> = {
  'ffx-core': [
    // try again (FFX)
    'silence', 'debuff-generic', 'water-2', 'reflect',
    // keep today's (FFX)
    'hit-staff', 'protect', 'overdrive-tidus', 'cure-3', 'breath-stone', 'swing-claw', 'swing-doll', 'encounter-shatter', 'swing-staff', 'hit-doll', 'thunder', 'explosion', 'ice-2', 'holy',
  ],
  'ffx-flux': ['flux-annihilation'],
  'ffx-final-aeon': ['fa-bomber'],
  'ffx-lady': ['lady-hellbiter'],
  'ffx2-core': [
    // try again (FFX-2): its shell, bio, slow and fire are NOT the FFX cues of the same names above
    'shell', 'bio', 'slow', 'fire-x2',
    // keep today's (FFX-2)
    'reflect', 'ko-fall', 'special-stinger', 'haste', 'swing-greatsword', 'protect', 'regen',
  ],
  'ffx2-machina': ['boss-tail'],
  'ffx2-leblanc': ['swing-fgoon', 'swing-goon'],
};

describe('the cues that ship, pack by pack (47: 18 of the first batch, the driver\'s 29)', () => {
  it('holds exactly these cues in each pack', () => {
    expect(Object.keys(packs).sort()).toEqual(Object.keys(SHIPPED).sort());
    for (const [pack, cues] of Object.entries(SHIPPED)) expect(names(pack), pack).toEqual([...cues].sort());
    expect(Object.values(SHIPPED).flat().length).toBe(47);
  });

  it('keeps the 24 "keep today\'s" rows and the 11 "try again" rows out of every pack', () => {
    for (const [pack, cues] of Object.entries(NOT_SHIPPED)) {
      for (const cue of cues) expect(packs[pack]?.cues[cue], `${pack}/${cue} must not ship`).toBeUndefined();
    }
  });

  it('is game-aware: every cue names its pack\'s game and a spec row of that game, so no chapter\'s pack carries the other game\'s cue (rule 14)', () => {
    let ffx = 0;
    let ffx2 = 0;
    for (const [pack, p] of Object.entries(packs)) {
      const game = pack.split('-')[0]!;
      for (const [cue, c] of Object.entries(p.cues)) {
        expect(c.game, `${pack}/${cue}`).toBe(game);
        expect(c.specRow!.startsWith(`${game}.`), `${pack}/${cue}: row ${c.specRow} is not ${game}`).toBe(true);
        if (game === 'ffx') ffx++;
        else ffx2++;
      }
    }
    expect([ffx, ffx2]).toEqual([26, 21]); // FFX: the first batch's 9 plus the driver's 17; FFX-2: the first batch's 9 plus the driver's 12
  });

  it('loads each new boss pack in the chapters whose fight plays it, and only in its own game\'s chapters', () => {
    expect(packsFor('ffx', 'seymour-flux')).toEqual(['ffx-flux', 'ffx-core']);
    expect(packsFor('ffx', 'braskas-final-aeon')).toEqual(['ffx-final-aeon', 'ffx-core']);
    expect(packsFor('ffx2', 'ffx2-fallen-aeons')).toEqual(['ffx2-aeons', 'ffx2-core']);
    expect(packsFor('ffx2', 'ffx2-ixion-djose')).toEqual(['ffx2-aeons', 'ffx2-core']);
    expect(packsFor('ffx2', 'ffx2-vegnagun-shuyin')).toEqual(['ffx2-machina', 'ffx2-shuyin', 'ffx2-core']);
    for (const pack of ['ffx-flux', 'ffx-final-aeon', 'ffx2-aeons', 'ffx2-machina']) {
      expect(Object.values(BOSS_PACKS).some((list) => list.includes(pack)), `${pack} is listed for a chapter`).toBe(true);
    }
    expect(packsFor('ffx2', 'seymour-flux')).toEqual(['ffx2-core']); // an FFX chapter's pack is never handed to FFX-2
    expect(packsFor('ffx', 'ffx2-fallen-aeons')).toEqual(['ffx-core']);
  });

  it('puts Shuyin on the newer take and ships the shared menu takes at each game\'s own row level', () => {
    expect(packs['ffx2-shuyin']!.cues['boss-shuyin']!.take).toBe('ffx2.boss.shuyin.v3');
    expect(packs['ffx-core']!.cues['cancel']!.take).toBe('ffx.ui.cancel.v4');
    expect(packs['ffx2-core']!.cues['cancel-x2']!.take).toBe('ffx.ui.cancel.v4');
    expect(packs['ffx2-core']!.cues['menu-close-x2']!.take).toBe('ffx.ui.cancel.v4');
    expect(packs['ffx-core']!.cues['error']!.take).toBe('ffx.ui.error.v2');
    expect(packs['ffx2-core']!.cues['error-x2']!.take).toBe('ffx.ui.error.v2');
    // The same take is mastered to each row's own level (FFX cancel -22.8, FFX-2 window close -24.0).
    expect(packs['ffx-core']!.cues['cancel']!.lufs!).toBeCloseTo(-22.8, 0);
    expect(packs['ffx2-core']!.cues['menu-close-x2']!.lufs!).toBeCloseTo(-24, 0);
  });
});

describe('the record of the second batch', () => {
  interface RecCue { set: string; pack: string; cue: string; specRow: string; take: string; fit?: string; levelFlags?: string[]; levelShortfallDb?: number; replaces?: { take: string } }
  const record = json<{ cues: RecCue[]; rejected: { specRow: string; take: string; supersededBy?: string }[] }>('docs/audio/sfx-parity-record.json');

  it('carries the 29 driver rows (17 FFX, 12 FFX-2) and the 18 of the first batch', () => {
    expect(record.cues.length).toBe(47);
    const driver = record.cues.filter((c) => c.set === 'driver');
    expect(driver.length).toBe(29);
    expect(driver.filter((c) => c.pack.startsWith('ffx-')).length).toBe(17);
    expect(driver.filter((c) => c.pack.startsWith('ffx2-')).length).toBe(12);
    expect(record.cues.filter((c) => c.set === 'strict').length).toBe(7);
    expect(record.cues.filter((c) => c.set === 'near').length).toBe(11);
    for (const c of driver) expect(packs[c.pack]!.cues[c.cue]!.take, `${c.pack}/${c.cue}`).toBe(c.take);
  });

  it('discloses the two peak-limited takes: mastered below their rows\' level because a limiter would have had to take more than 3 dB', () => {
    const flagged = record.cues.filter((c) => c.levelFlags?.includes('capped'));
    expect(flagged.map((c) => c.specRow).sort()).toEqual(['ffx.petrify', 'ffx.weapon.spear.hit']);
    for (const c of flagged) expect(c.levelShortfallDb!, c.specRow).toBeGreaterThan(3);
  });

  it('records Shuyin\'s newer take and keeps the superseded one among the takes turned down', () => {
    const shuyin = record.cues.find((c) => c.pack === 'ffx2-shuyin')!;
    expect(shuyin.take).toBe('ffx2.boss.shuyin.v3');
    expect(shuyin.replaces?.take).toBe('ffx2.boss.shuyin.v1');
    expect(record.rejected.some((r) => r.take === 'ffx2.boss.shuyin.v1' && r.supersededBy === 'ffx2.boss.shuyin.v3')).toBe(true);
  });

  it('lists no shipped take among the takes turned down for the same row', () => {
    const shipped = new Set(record.cues.map((c) => `${c.specRow}|${c.take}`));
    for (const r of record.rejected) expect(shipped.has(`${r.specRow}|${r.take}`), `${r.specRow} ${r.take}`).toBe(false);
  });
});

describe('FOC45-02: the three results loops close on body music', () => {
  interface Recut { wrapBefore: Record<string, number>; wrapAfter: Record<string, number>; before: { manifestEntry: { loopStart: number; loopEnd: number } } }
  const batch2 = json<{ cues: { cue: string; manifestEntry: { loopStart: number; loopEnd: number; duration: number; bytes: number }; recut?: Recut }[] }>('docs/audio/music-batch2-2026-10-12.json');
  const cues = ['victory-ffx', 'victory-ffx2', 'victory-bahamut'] as const;

  it.each(cues)('%s: the level across the wrap steps by 3 dB or less on 50 ms and on 200 ms windows (it stepped by 12 to 24 dB before)', (cue) => {
    const rec = batch2.cues.find((c) => c.cue === cue)!;
    expect(rec.recut, `${cue} has a recut record`).toBeDefined();
    const { wrapBefore, wrapAfter } = rec.recut!;
    expect(Math.abs(wrapAfter['step50']!), `${cue} 50 ms step`).toBeLessThanOrEqual(3);
    expect(Math.abs(wrapAfter['step200']!), `${cue} 200 ms step`).toBeLessThanOrEqual(3);
    expect(Math.max(Math.abs(wrapBefore['step50']!), Math.abs(wrapBefore['step200']!)), `${cue} was a breath before`).toBeGreaterThan(10);
    expect(wrapAfter['clickRatio']!, `${cue} click ratio`).toBeLessThan(1);
  });

  it.each(cues)('%s: the manifest is the record, the intro is 6 to 9 s, the body 20 to 40 s, and the file runs on 3 s past the loop end', (cue) => {
    const rec = batch2.cues.find((c) => c.cue === cue)!;
    const entry = manifest.music[cue]!;
    expect(entry).toMatchObject(rec.manifestEntry);
    expect(entry.loopStart).toBeGreaterThanOrEqual(6);
    expect(entry.loopStart).toBeLessThanOrEqual(9);
    expect(entry.loopEnd - entry.loopStart).toBeGreaterThanOrEqual(20);
    expect(entry.loopEnd - entry.loopStart).toBeLessThanOrEqual(40);
    expect(Math.abs(entry.duration - (entry.loopEnd + 3))).toBeLessThan(0.001);
    // Both loop points moved together by whole beats into the body, so the loop starts later than it did.
    expect(rec.recut!.before.manifestEntry.loopStart).toBeLessThan(entry.loopStart);
  });
});
