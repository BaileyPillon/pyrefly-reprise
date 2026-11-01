/**
 * THE R72 REVIEW'S M1 AND M3 (branch `r72-sky`; FFX-2 only: Chapter XI, `ffx2-fallen-aeons`; `docs/handoff/r72-sky.md` section 8).
 *
 * M1 (major): Chapter XI's default sky grade C is patched onto the PRO ARENA's room table only. With the two holds lifted, `LookConfig.chapterLook(XI)` answered the HD-2D bold look wherever the chapter is treated, so on a phone or tablet, under `?pack=off`,
 * `?pro=off`, `?look=today` and `?prooff=arena` (the arena is off in all five) the bold look played ALONE over the Road's very bright sky with nothing dimming it: the unread frame that clips the burst (Chapter V's bold-alone read: mean luma 164.4, 26.2 percent
 * over 240), where live (release 70) and release 71 draw the plain frame. The fix: a chapter whose grade is only its DEFAULT (no option named by the address) plays the look only where the pro arena plays. Named options (`?skygrade=a|b|c`, the measuring words) keep
 * playing the look so the lighter options can be filmed, as before. Every other chapter is untouched (the review's 900-row differential; pinned here by the rule that the carve-out reads `SKY_DEFAULTS`, which has one row).
 *
 * M3 (minor): `__pyrefly.treated().holds` listed its chapters in `TREATED_CHAPTERS` order; release 71 listed them in `PIECE_HOLDS` row order, so a browser job comparing `JSON.stringify(treated())` between the two builds saw a spurious difference. Restored.
 *
 * Game case (rule 14): FFX-2 only (Chapter XI); the debug read is shared plumbing and reads as release 71 did for every chapter. Presentation only: no number of a fight changes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installProDebug } from '../../src/debug/proApi.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, isTreatedChapter, setDemoChapter, setPackScreen, setTreatedScope, type PackScreen } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { applyChapterLook, lookState } from '../../src/engine/look/LookState.ts';
import { proArenaFor, proModeFromSearch, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { SKY_DEFAULTS, SKY_OPTIONS, setSkyOption, setSkyRunning, skyActive, skyScreen, type SkyOption } from '../../src/engine/look/pro/SkyGrade.ts';

const V = 'ffx2-vegnagun-shuyin';
const XI = 'ffx2-fallen-aeons';
const CTRL = [null, 'subtle', false, false]; // the look state of a chapter the treatment (or the look) does not reach: release 71's frame for Chapter XI
const PRO_STATE = ['cinematic', 'bold', true, true]; // the pro arena: the cinematic bold rig with the room's pro grade, grade C patched on

/** The five paths on which the pro arena is off while the treatment still reaches the chapter (the review's list), as a screen class, an address and whether `?prooff=arena` stands. */
const NO_ARENA: [string, PackScreen, string, boolean][] = [
  ['a phone or tablet', 'phone', '', false],
  ['?pack=off', 'desk', '?pack=off', false],
  ['?pro=off', 'desk', '?pro=off', false],
  ['?look=today', 'desk', '?look=today', false],
  ['?prooff=arena', 'desk', '?prooff=arena', true],
];

/** Read the switches the way `main` does at start, then set the battle up in the chapter. */
function open(screen: PackScreen, search: string, arenaOff: boolean): void {
  setTreatedScope('all');
  setPackScreen(screen);
  setProMode(proModeFromSearch(search));
  if (arenaOff) setProPiece('arena', false);
}

const snap = (): unknown[] => [lookState.name, lookState.strength, lookState.armed, lookState.pro];

afterEach(() => {
  vi.unstubAllGlobals();
  setSkyOption(undefined);
  setSkyRunning(undefined);
  setTreatedScope(null);
  setDemoChapter(undefined);
  setPackScreen(null);
  setProMode(null);
  setProPiece(null);
  lookState.auto = true;
  lookState.name = null;
  lookState.armed = false;
  lookState.pro = false;
  lookState.strength = 'subtle';
});

describe('M1: the default grade reaches the screen only through the pro arena, so without the arena Chapter XI is release 71\'s frame', () => {
  it.each(NO_ARENA)('%s: no arena, no look, the control look state, and the screen reads release69 (never the bold look alone)', (_label, screen, search, arenaOff) => {
    open(screen, search, arenaOff);
    expect(proArenaFor(XI, search)).toBe(false);
    expect(isTreatedChapter(XI, 'hd2d')).toBe(true); // the hold is NOT what stands the look aside: the chapter plays hd2d, only the gate below does (review m2)
    expect(chapterLook(XI)).toBeNull();
    applyChapterLook(XI);
    expect(snap()).toEqual(CTRL);
    expect(lookState.armed && lookState.pro).toBe(false);
    expect(skyScreen(lookState.armed && lookState.pro)).toBe('release69');
  });

  it('the desktop default is unchanged: the look and the arena play, the cinematic bold rig with grade C', () => {
    open('desk', '', false);
    expect(proArenaFor(XI, '')).toBe(true);
    expect(chapterLook(XI)).toEqual({ name: 'hd2d', strength: 'bold' });
    applyChapterLook(XI);
    expect(snap()).toEqual(PRO_STATE);
    expect(skyActive()).toBe('c');
    expect(skyScreen(lookState.armed && lookState.pro)).toBe('c');
  });

  it('a switch flipped at run time follows the same rule: `__pyrefly.pro(false)` in the battle takes the look away with the arena, and `pro(true)` brings both back', () => {
    open('desk', '', false);
    applyChapterLook(XI);
    expect(snap()).toEqual(PRO_STATE);
    setProMode('today');
    expect(snap()).toEqual(CTRL);
    setProMode('pro');
    expect(snap()).toEqual(PRO_STATE);
    setProPiece('arena', false); // the console's `proPiece('arena', false)`
    expect(snap()).toEqual(CTRL);
    setProPiece('arena', true);
    expect(snap()).toEqual(PRO_STATE);
  });

  it('a named option is a measuring word and still plays the look without the arena (a phone, `?pro=off`), as in release 71 and r72 before the fix; `today` is release 71\'s frame', () => {
    for (const o of SKY_OPTIONS) {
      open('phone', '', false);
      setSkyOption(o as SkyOption);
      expect(chapterLook(XI), o).toEqual({ name: 'hd2d', strength: 'bold' });
      expect(chapterLook(V), o).toEqual({ name: 'hd2d', strength: 'bold' }); // Chapter V plays the held row with a named option only, as before
    }
    open('phone', '', false);
    setSkyOption('today');
    expect(chapterLook(XI)).toBeNull();
    expect(chapterLook(V)).toBeNull();
  });

  it('nothing else is carved out: the carve-out reads `SKY_DEFAULTS` (one row, Chapter XI), so every other chapter\'s look answers as the hold alone says on every one of the five paths', () => {
    expect(Object.keys(SKY_DEFAULTS)).toEqual([XI]);
    for (const [label, screen, search, arenaOff] of NO_ARENA) {
      open(screen, search, arenaOff);
      for (const id of Object.keys(CHAPTER_LOOKS)) {
        if (id === XI) continue;
        expect(chapterLook(id) !== null, `${id} ${label}`).toBe(isTreatedChapter(id, 'hd2d'));
      }
    }
  });
});

describe('M3: `__pyrefly.treated().holds` lists its chapters in the order release 71 did (`PIECE_HOLDS` row order)', () => {
  type Treated = (s?: 'all' | 'pack' | null) => { holds: Record<string, string[]> };
  const api = (): { treated: Treated; sky: (w?: SkyOption | 'today' | null) => unknown } => {
    const a: Record<string, unknown> = {};
    installProDebug(a);
    return { treated: a['treated'] as Treated, sky: a['skyGrade'] as (w?: SkyOption | 'today' | null) => unknown };
  };
  const release71Order = (): string[] => Object.keys(PIECE_HOLDS).filter((k) => Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, k));

  it('the key order is the order of the hold rows, with no word and under `today`, and every row lists the same pieces as `PIECE_HOLDS` (plus Chapter XI\'s two under `today`)', () => {
    const { treated, sky } = api();
    expect(Object.keys(treated('all').holds)).toEqual(release71Order());
    for (const id of Object.keys(PIECE_HOLDS)) if (Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id)) expect(treated('all').holds[id], id).toEqual(Object.keys(PIECE_HOLDS[id]!));
    sky('today');
    expect(Object.keys(treated('all').holds)).toEqual(release71Order());
    expect(treated('all').holds[XI]).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
    treated(null);
  });

  it('a chapter off the list and a chapter with no hold row are not reported', () => {
    const { treated } = api();
    const holds = treated('all').holds;
    for (const id of Object.keys(holds)) expect(Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id), id).toBe(true);
    expect(holds['ffx2-bahamut']).toBeUndefined();
    expect(holds['seymour-flux']).toBeUndefined();
    treated(null);
  });
});
