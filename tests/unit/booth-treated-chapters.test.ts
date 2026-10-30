/**
 * THE TREATED CHAPTERS (release 69, branch `booth-leblanc`; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden)
 * please start with leblanc"; 2026-10-29: "you make all executive decisions for the next few days. i'll go with all of your recommendations"). Both games (shared plumbing); Leblanc, `ffx2-leblanc`, is FFX-2 only.
 *
 * `DemoGate.TREATED_CHAPTERS` is the ONE list the treatment reads (release 60 to 68 it read the two booth ids). These tests pin the list, the holds that keep a piece back with a written reason, and the `?treated=` word that
 * puts release 68's reach back; a twentieth listed chapter fails until it is treated or named in NOT_YET.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTER_IDS, CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import {
  DEMO_CHAPTERS,
  PIECE_HOLDS,
  TREATED_CHAPTERS,
  TREATED_PIECES,
  demoGameOf,
  isDemoChapter,
  isTreatedChapter,
  setTreatedScope,
  treatedHold,
  treatedScope,
  treatedScopeFromSearch,
} from '../../src/engine/motion/DemoGate.ts';

afterEach(() => setTreatedScope(null));

const BOOTH = Object.keys(DEMO_CHAPTERS);
const LISTED: readonly string[] = CHAPTER_IDS;

/** The chapters the treatment reaches now, each with its game and the release it joined: one line per chapter. */
const TREATED_NOW: Readonly<Record<string, { game: 'ffx' | 'ffx2'; since: string }>> = {
  'seymour-flux': { game: 'ffx', since: 'r60' },
  yunalesca: { game: 'ffx', since: 'r69' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
};

/** The pieces each joined chapter holds back, in the order of `TREATED_PIECES`: the booth pair holds none (the approved target). */
const HELD_NOW: Readonly<Record<string, readonly string[]>> = {
  yunalesca: ['cam', 'breath', 'smear'],
  'ffx2-leblanc': ['breath'],
};

/** Does the treatment play this piece in this chapter, under the `all` scope? */
const playsUnderAll = (id: string, piece: string): boolean => Object.prototype.hasOwnProperty.call(TREATED_NOW, id) && !(HELD_NOW[id] ?? []).includes(piece);

/**
 * The listed chapters the treatment has NOT reached yet, each with the reason (the driver's rollout order, `docs/handoff/booth-leblanc.md`). A chapter leaves this table in the commit that adds it to
 * `TREATED_CHAPTERS`; one that is in neither fails the first test below.
 */
const NOT_YET: Readonly<Record<string, string>> = {
  'braskas-final-aeon': 'FFX: seven links of three foes, the heaviest chapter; maps for about 21 poses owed',
  'ffx2-vegnagun-shuyin': 'FFX-2: five parts, a camera that keeps today (Vegnagun), the HP waiver; next after Leblanc (same dresses as Chapter IV but Paine)',
  'seymour-anima-macalania': 'FFX: three foes under one declared boss; maps owed',
  'evrae-airship': 'FFX: swap exception (a fixed head step per pose), non-standard pose names',
  'yojimbo-cavern': 'FFX: three foes, no KO pose; maps owed',
  'seymour-natus': 'FFX: the re-cut question (pale fringe heuristic +19), maps owed',
  'ffx2-fallen-aeons': 'FFX-2: three links, two re-cut candidates, a dress guard for Paine',
  'seymour-omnis': 'FFX: five foes under the F1 ribbon and card',
  'ffx2-trema': 'FFX-2: two new dresses without clip rows or maps, a giants camera row',
  'isaaru-via-purifico': 'FFX: a one-girl party under the FFX HUD, three links',
  'ffx2-den-of-woe': 'FFX-2: translucent shades, a plate room; maps owed',
  'ffx2-ixion-djose': 'FFX-2: the plate is a stand-in until its real plate, a swap exception',
  'sin-fins-core': 'FFX: bespoke deck camera and many parts',
  'sin-face': 'FFX: bespoke Sin poses and a swap exception',
  'mirror-aeons': 'FFX: no @2x backdrop on disk',
};

describe('the list', () => {
  it('every listed chapter is treated or named in NOT_YET, never both; a twentieth fails here until it is decided', () => {
    const treated = Object.keys(TREATED_CHAPTERS);
    for (const id of LISTED) expect(treated.includes(id) !== Object.prototype.hasOwnProperty.call(NOT_YET, id), id).toBe(true);
    for (const id of Object.keys(NOT_YET)) expect(LISTED, id).toContain(id);
    expect(treated.length + Object.keys(NOT_YET).length).toBe(LISTED.length);
    expect(LISTED).toHaveLength(19);
  });

  it('is Chapter I, Chapter IV, Leblanc and Chapter II, each with the game the registry says (rule 14)', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(Object.keys(TREATED_NOW).sort());
    for (const [id, e] of Object.entries(TREATED_CHAPTERS)) expect(getChapter(id)?.game, id).toBe(e.game);
    for (const [id, e] of Object.entries(TREATED_NOW)) expect(TREATED_CHAPTERS[id], id).toEqual(e);
    expect(TREATED_CHAPTERS['ffx2-leblanc']).toEqual({ game: 'ffx2', since: 'r69' });
    expect(TREATED_CHAPTERS['yunalesca']).toEqual({ game: 'ffx', since: 'r69' }); // the first FFX chapter beyond Chapter I: FFX's layout, profile and tables (hard rule 14)
  });

  it('holds the booth pair, with the games DEMO_CHAPTERS gives them; the booth list itself stays two ids', () => {
    expect(BOOTH.sort()).toEqual(['ffx2-bahamut', 'seymour-flux']);
    for (const id of BOOTH) expect(TREATED_CHAPTERS[id]!.game, id).toBe(DEMO_CHAPTERS[id]);
  });

  it('never lists a hidden, unlisted or experimental chapter (the typed words keep their own look): `exp-leblanc` is not `ffx2-leblanc`', () => {
    for (const c of [...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS]) {
      expect(Object.keys(TREATED_CHAPTERS), c.id).not.toContain(c.id);
      expect(LISTED, c.id).not.toContain(c.id);
    }
    expect(Object.keys(TREATED_CHAPTERS)).not.toContain('exp-leblanc');
    for (const id of Object.keys(TREATED_CHAPTERS)) expect(CHAPTERS.map((c) => c.id), id).toContain(id);
  });

  it('is frozen, and every treated entry names the release it joined', () => {
    expect(Object.isFrozen(TREATED_CHAPTERS)).toBe(true);
    for (const e of Object.values(TREATED_CHAPTERS)) expect(e.since).toMatch(/^r\d+$/);
  });
});

describe('the holds', () => {
  it('belong to treated chapters that are not the booth pair, name real pieces, and say why and what lifts them', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) {
      expect(Object.keys(TREATED_CHAPTERS), id).toContain(id);
      expect(BOOTH, id).not.toContain(id);
      for (const [piece, why] of Object.entries(rows)) {
        expect(TREATED_PIECES as readonly string[], `${id} ${piece}`).toContain(piece);
        expect(why!.length, `${id} ${piece}`).toBeGreaterThan(80);
        expect(why, `${id} ${piece}`).toMatch(/Lifts when/);
      }
    }
  });

  it("Leblanc holds the staged breath only: her sourced showpiece is No Love Lost, a three-beat comedy combo whose tone is a mockup decision (the one hold of this release); every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-leblanc']!)).toEqual(['breath']);
    expect(treatedHold('ffx2-leblanc', 'breath')).toMatch(/No Love Lost/);
    expect(treatedHold('ffx2-leblanc', 'breath')).not.toMatch(/no sourced/i); // the review's M1: the research names the combo (section 4.5), so "nothing sourced" is false
    for (const p of TREATED_PIECES) if (p !== 'breath') expect(treatedHold('ffx2-leblanc', p), p).toBeUndefined();
    expect(treatedHold('seymour-flux', 'breath')).toBeUndefined();
    expect(treatedHold(undefined, 'hud')).toBeUndefined();
    expect(treatedHold('toString', 'hud')).toBeUndefined();
  });

  it("Chapter II holds the staged breath, the directed camera and the smear planner, and nothing else: Mega Death and Hellbiter have no telegraph hold or mockup to extend, the dome's plate is the one the colossus master pulled past its edge (PR-0307), and the smear cuts the swaps her swap exception holds back", () => {
    expect(Object.keys(PIECE_HOLDS['yunalesca']!).sort()).toEqual(['breath', 'cam', 'smear']);
    expect(treatedHold('yunalesca', 'breath')).toMatch(/Mega Death/);
    expect(treatedHold('yunalesca', 'breath')).toMatch(/Hellbiter/);
    expect(treatedHold('yunalesca', 'breath')).toMatch(/TelegraphHold/);
    expect(treatedHold('yunalesca', 'cam')).toMatch(/PR-0307/);
    expect(treatedHold('yunalesca', 'cam')).toMatch(/J4/);
    expect(treatedHold('yunalesca', 'smear')).toMatch(/SCOPE_EXCEPTIONS/);
    expect(treatedHold('yunalesca', 'smear')).toMatch(/yunalesca-all-anchor/);
    for (const p of TREATED_PIECES) if (p !== 'breath' && p !== 'cam' && p !== 'smear') expect(treatedHold('yunalesca', p), p).toBeUndefined();
  });

  it('every hold in the table is the one this file expects (a new hold, or a lifted one, is a decision made in two places)', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) expect(Object.keys(rows).sort(), id).toEqual([...(HELD_NOW[id] ?? [])].sort());
    for (const id of Object.keys(HELD_NOW)) expect(Object.keys(PIECE_HOLDS), id).toContain(id);
  });

  it('the pieces are the nineteen the switch modules name, without repeats', () => {
    expect(new Set(TREATED_PIECES).size).toBe(TREATED_PIECES.length);
    expect(TREATED_PIECES).toHaveLength(19);
  });
});

describe('the word ?treated=', () => {
  it('reads all on a page, pack with no page, and pack for pack, booth, today and 68', () => {
    expect(treatedScopeFromSearch(undefined)).toBe('pack');
    expect(treatedScopeFromSearch('')).toBe('all');
    expect(treatedScopeFromSearch('?pack=demo')).toBe('all');
    expect(treatedScopeFromSearch('?treated=all')).toBe('all');
    expect(treatedScopeFromSearch('?treated=banana')).toBe('all');
    for (const w of ['pack', 'booth', 'today', '68', 'PACK']) expect(treatedScopeFromSearch(`?treated=${w}`), w).toBe('pack');
    expect(treatedScopeFromSearch('?pack=off&treated=pack')).toBe('pack');
  });

  it('is read once and forced by the setter (null reads the address again: under node, no page, pack)', () => {
    expect(treatedScope()).toBe('pack');
    setTreatedScope('all');
    expect(treatedScope()).toBe('all');
    setTreatedScope(null);
    expect(treatedScope()).toBe('pack');
  });
});

describe('who the treatment reaches', () => {
  const HIDDEN = ['exp-leblanc', 'ff7-guard-scorpion', 'ffx2-masterpiece-theatre', 'sinspawn-gui', 'exp-fayth', 'toString', '__proto__', 'constructor', ''];

  it('under pack (release 68, and a unit test with no page) it is the booth pair for every piece, and nobody else', () => {
    setTreatedScope('pack');
    for (const id of [...LISTED, ...HIDDEN]) {
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(BOOTH.includes(id));
      expect(isTreatedChapter(id), id).toBe(BOOTH.includes(id));
      expect(demoGameOf(id, 'ffx'), id).toBe(id === 'ffx2-bahamut' ? 'ffx2' : 'ffx');
      expect(demoGameOf(id, 'ffx2'), id).toBe(id === 'seymour-flux' ? 'ffx' : 'ffx2');
    }
    expect(isTreatedChapter(undefined)).toBe(false);
  });

  it('under all it is the booth pair, Leblanc and Chapter II: each plays every piece but the ones it holds; no other listed or hidden chapter is reached', () => {
    setTreatedScope('all');
    for (const id of [...LISTED, ...HIDDEN]) {
      const reached = Object.prototype.hasOwnProperty.call(TREATED_NOW, id);
      expect(isTreatedChapter(id), id).toBe(reached);
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(playsUnderAll(id, p));
    }
    for (const p of TREATED_PIECES) for (const id of BOOTH) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(true); // the approved target is never held
    expect(isTreatedChapter(undefined, 'hud')).toBe(false);
  });

  it("the game follows the chapter under all (FFX-2 for Leblanc, FFX for Chapter II), and the fallback elsewhere", () => {
    setTreatedScope('all');
    expect(demoGameOf('ffx2-leblanc')).toBe('ffx2');
    expect(demoGameOf('ffx2-leblanc', 'ffx')).toBe('ffx2');
    expect(demoGameOf('yunalesca', 'ffx2')).toBe('ffx'); // Chapter II is FFX: the FFX layout, curve profile and tables play there, whatever the fallback says
    expect(demoGameOf('braskas-final-aeon', 'ffx2')).toBe('ffx2'); // not treated yet: the fallback
    expect(demoGameOf('exp-leblanc', 'ffx')).toBe('ffx');
    setTreatedScope('pack');
    expect(demoGameOf('ffx2-leblanc', 'ffx')).toBe('ffx'); // release 68: not a demo chapter, the fallback
    expect(demoGameOf('yunalesca', 'ffx2')).toBe('ffx2'); // release 68: the same
  });

  it('isDemoChapter stays the booth pair under every scope (the kiosk, the party rigs and the voiced lines ask it)', () => {
    for (const scope of ['pack', 'all'] as const) {
      setTreatedScope(scope);
      expect(BOOTH.every((id) => isDemoChapter(id))).toBe(true);
      expect(isDemoChapter('ffx2-leblanc')).toBe(false);
      expect(isDemoChapter(undefined)).toBe(false);
    }
  });
});
