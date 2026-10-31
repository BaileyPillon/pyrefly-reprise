/**
 * THE HOLDS OF THE LAST FIVE LISTED CHAPTERS (release 71, branch `booth-b4-last`; Bailey 2026-10-30: the booth treatment for every listed chapter; the driver's calls under his delegation, his to overturn). `PieceHoldsLast.ts` holds the written reasons; this file pins, per chapter, the
 * pieces it holds, the words that make each reason the chapter's own (the sourced move, the plate's measure, the exception's job), and that every other piece plays. The shared tables of `booth-treated-chapters.test.ts` (`HELD_NOW`, `NOT_YET`) pin the same lists from the other side: a hold is a decision made in two places.
 *
 * Game case (rule 14): Chapters VIII and XVIII and the Mirror Aeons chapter are FFX only (the airship's range game has no FFX-2 counterpart, `research/ffx-evrae-airship.md` section 0.4); Chapter XVI is FFX-2 only (`research/ffx2-ixion-djose.md` section 0). Chapter XVII does not join and has no hold.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DJOSE_CHAMBER_PLATE } from '../../src/data/ixion-plates.ts';
import { CHAPTER_LOOKS } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS } from '../../src/engine/look/LookGrades.ts';
import { ROOM_BOLD } from '../../src/engine/look/LookBoldConfig.ts';
import { proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { AUTO_STAGES } from '../../src/engine/procam/ProAutoStage.ts';
import { PIECE_HOLDS, TREATED_PIECES, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { LAST_HOLDS } from '../../src/engine/motion/PieceHoldsLast.ts';
import { readSource } from './helpers/cssEval.ts';

const ROOT = join(__dirname, '..', '..');

afterEach(() => setTreatedScope(null));

describe('the holds of the four chapters that joined', () => {
  it("Chapter VIII (Evrae, booth-b4-last, FFX only) holds the staged breath (Poison Breath, which his Inhale already telegraphs with its own painting), the directed camera (the range director authors the deck's rigs) and the moments (the knock-out cut is unread on the deck); every other piece plays, the smear among them (his swap exception was lifted in release 69)", () => {
    expect(Object.keys(PIECE_HOLDS['evrae-airship']!)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold('evrae-airship', 'breath')).toMatch(/evrae-poison-breath/);
    expect(treatedHold('evrae-airship', 'breath')).toMatch(/evrae-inhale/);
    expect(treatedHold('evrae-airship', 'breath')).toMatch(/TelegraphHold/);
    expect(treatedHold('evrae-airship', 'cam')).toMatch(/range director/);
    expect(treatedHold('evrae-airship', 'cam')).toMatch(/RANGE_STAGING/);
    expect(treatedHold('evrae-airship', 'cam')).toMatch(/rolled 11\.6 degrees/);
    expect(treatedHold('evrae-airship', 'moments')).toMatch(/CHK-027/);
    expect(treatedHold('evrae-airship', 'moments')).toMatch(/0\.495 to 0\.499/);
    expect(treatedHold('evrae-airship', 'moments')).toMatch(/0\.21 on this very deck/);
    for (const p of TREATED_PIECES) if (!['breath', 'cam', 'moments'].includes(p)) expect(treatedHold('evrae-airship', p), p).toBeUndefined();
  });

  it("Chapter XVIII (Sin's face, FFX only) holds the boss card (the widest boss painting of any treated chapter), the staged breath (Giga-Graviton, which the clock HUD already announces and which ends the fight in a defeat), the directed camera, the moments and, as a swap exception, the smear planner; every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['sin-face']!)).toEqual(['card', 'breath', 'cam', 'moments', 'smear']);
    expect(treatedHold('sin-face', 'card')).toMatch(/1410 x 745, aspect 1\.89/);
    expect(treatedHold('sin-face', 'card')).toMatch(/1,771 px wide on a 1600 x 900 frame/);
    expect(treatedHold('sin-face', 'card')).toMatch(/left 142 px/);
    expect(treatedHold('sin-face', 'card')).toMatch(/job J-A/);
    expect(treatedHold('sin-face', 'breath')).toMatch(/overdrive-sin-giga-graviton/);
    expect(treatedHold('sin-face', 'breath')).toMatch(/SinHud/);
    expect(treatedHold('sin-face', 'cam')).toMatch(/evrae-airship-sin\.ts/);
    expect(treatedHold('sin-face', 'moments')).toMatch(/All seven can be fielded/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/SCOPE_EXCEPTIONS/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/224\.4 px against a cap of half his drawn height, 221\.8/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/sin-face-all-held-anchor/);
    for (const p of TREATED_PIECES) if (!['card', 'breath', 'cam', 'moments', 'smear'].includes(p)) expect(treatedHold('sin-face', p), p).toBeUndefined();
  });

  it("the Mirror Aeons chapter (FFX only) holds the room looks and the full-bleed card (two plates under one key, the first provisional with no @2x master and a mean luminance of 0.600, the grade applied once at the scene's entry), the staged breath, the camera and the moments; HUD, pro look, rim, boss, ending, opening, curves, feel, effects and audio play", () => {
    expect(Object.keys(PIECE_HOLDS['mirror-aeons']!)).toEqual(['hd2d', 'arena', 'card', 'breath', 'cam', 'moments']);
    expect(treatedHold('mirror-aeons', 'hd2d')).toMatch(/TWO plates under one key/);
    expect(treatedHold('mirror-aeons', 'hd2d')).toMatch(/0\.600/);
    expect(treatedHold('mirror-aeons', 'hd2d')).toMatch(/0\.628/);
    expect(treatedHold('mirror-aeons', 'hd2d')).toMatch(/swapBackdrop/);
    expect(treatedHold('mirror-aeons', 'arena')).toMatch(/PRO_ARENA/);
    expect(treatedHold('mirror-aeons', 'card')).toMatch(/@2x/);
    expect(treatedHold('mirror-aeons', 'card')).toMatch(/No art is written/);
    expect(treatedHold('mirror-aeons', 'breath')).toMatch(/dark-mega-graviton/);
    expect(treatedHold('mirror-aeons', 'breath')).toMatch(/dark-zanmato/);
    // review m5: the pair's sixth-turn Mega Graviton rests on the pair formation and the engine's gauge rule, not on research section 2 (which describes the TRIO starting full)
    expect(treatedHold('mirror-aeons', 'breath')).toMatch(/kino01_72/);
    expect(treatedHold('mirror-aeons', 'breath')).toMatch(/battle\/ffx\/ai\/dark-aeons-rules\.ts/);
    expect(treatedHold('mirror-aeons', 'breath')).toMatch(/data\/chapter-mirror-aeons\.ts/);
    expect(treatedHold('mirror-aeons', 'breath')).not.toMatch(/gauges start at 0 and the trio's Delta Attack is not in the pair: research/);
    for (const p of TREATED_PIECES) if (!['hd2d', 'arena', 'card', 'breath', 'cam', 'moments'].includes(p)) expect(treatedHold('mirror-aeons', p), p).toBeUndefined();
  });

  it("Chapter XVI (Ixion at Djose, FFX-2 only) holds the room looks (no row exists for Bailey's approved Chamber plate and a row is a look decision), the follower (no AUTO_STAGES row), the staged breath, the moments and, as a swap exception, the smear planner; every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-ixion-djose']!)).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear']);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/Bailey's own pick and not a stand-in/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/D-273/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/djose-chamber-provisional/);
    expect(treatedHold('ffx2-ixion-djose', 'arena')).toMatch(/PRO_ARENA/);
    expect(treatedHold('ffx2-ixion-djose', 'breath')).toMatch(/x2-ixion-thors-hammer/);
    expect(treatedHold('ffx2-ixion-djose', 'cam')).toMatch(/AUTO_STAGES/);
    expect(treatedHold('ffx2-ixion-djose', 'cam')).toMatch(/PRO_AUTO_CAMERA/);
    expect(treatedHold('ffx2-ixion-djose', 'moments')).toMatch(/0\.608 to 0\.634/);
    expect(treatedHold('ffx2-ixion-djose', 'smear')).toMatch(/SCOPE_EXCEPTIONS/);
    expect(treatedHold('ffx2-ixion-djose', 'smear')).toMatch(/ixion-all-held-anchor/);
    for (const p of TREATED_PIECES) if (!['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear'].includes(p)) expect(treatedHold('ffx2-ixion-djose', p), p).toBeUndefined();
  });


  it("the rows live in PieceHoldsLast.ts and PIECE_HOLDS carries them (the same objects), every reason is 80 characters or more and ends in its \"Lifts when\" clause, and no hold belongs to Chapter XVII, which stayed out", () => {
    for (const [id, rows] of Object.entries(LAST_HOLDS)) {
      expect(PIECE_HOLDS[id], id).toBe(rows);
      for (const [piece, why] of Object.entries(rows)) {
        expect(TREATED_PIECES as readonly string[], `${id} ${piece}`).toContain(piece);
        expect(why!.length, `${id} ${piece}`).toBeGreaterThan(300);
        expect(why!, `${id} ${piece}`).toMatch(/Lifts when .*\.$/);
      }
    }
    expect(Object.keys(LAST_HOLDS)).toEqual(['evrae-airship', 'sin-face', 'mirror-aeons', 'ffx2-ixion-djose']);
    expect(Object.prototype.hasOwnProperty.call(PIECE_HOLDS, 'sin-fins-core')).toBe(false);
  });

  it('the knock-out rule: every one of the four holds the moments or the smear (Sin\'s face and Ixion both), so no chapter beyond the booth pair cuts the knock-out on an unread dress', () => {
    setTreatedScope('all');
    for (const id of Object.keys(LAST_HOLDS)) expect(isTreatedChapter(id, 'moments') && isTreatedChapter(id, 'smear'), id).toBe(false);
    for (const id of ['evrae-airship', 'mirror-aeons']) expect(treatedHold(id, 'moments'), id).toBeDefined();
  });

  it('every hold of the two chapters that hold the room looks says what the real plate or the picked grade must do, and the ones that need a still name it (hard rule 9)', () => {
    for (const id of ['mirror-aeons', 'ffx2-ixion-djose']) {
      expect(treatedHold(id, 'hd2d'), id).toMatch(/still pair|picks a grade/);
      expect(treatedHold(id, 'arena'), id).toMatch(/still pair|picked from a still/);
    }
  });
});

// ------------------------------------------------------------------------------------------------ review M1: Ixion's Chamber plate is Bailey's own pick

const readJson = (rel: string): Record<string, unknown> => JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as Record<string, unknown>;

describe("review M1 (booth-b4-last): Ixion's Chamber plate is Bailey's approved pick (D-273), so no hold may call it provisional or lift on a plate that cannot change", () => {
  it('the record says so: D-273 is adopted and names Chamber C2, the approved-hashes set locks the plate under its -provisional file name, and DJOSE_CHAMBER_PLATE is that file', () => {
    const decisions = (readJson('docs/target/decisions.json') as { decisions: Array<{ id: string; state: string; title: string; words: string; where: string }> }).decisions;
    const d273 = decisions.find((d) => d.id === 'D-273')!;
    expect(d273.state).toBe('adopted');
    expect(d273.where).toMatch(/option C2 "The Faction's lamps"/);
    const sets = (readJson('docs/target/approved-hashes.json') as { sets: Record<string, Record<string, unknown>> }).sets;
    const locked = sets['bailey:2026-09-28-ixion-scenes']!;
    expect(Object.keys(locked)).toContain('public/art/backdrops/djose-chamber-provisional.png');
    expect(DJOSE_CHAMBER_PLATE).toBe('djose-chamber-provisional');
  });

  it('so the three holds that stood on the plate say it is approved, name option C2 and D-273, and none calls it provisional, a stand-in or "Storm-lit stone" (that is C1, another file)', () => {
    for (const piece of ['hd2d', 'arena', 'cam'] as const) {
      const why = treatedHold('ffx2-ixion-djose', piece)!;
      expect(why, piece).toMatch(/D-273/);
      expect(why, piece).toMatch(/djose-chamber-provisional/);
      expect(why, piece).not.toMatch(/PROVISIONAL|going to change|changes under|Storm-lit stone|stand-in plate/);
    }
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/option C2, "The Faction's lamps"/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/no longer means unapproved/);
  });

  it("and none lifts on a condition that can never come true: no 'real plate is installed' lift, only the row that is missing (a room row, an arena row, an AUTO_STAGES row read in a still pair or a sampler)", () => {
    for (const piece of ['hd2d', 'arena', 'cam'] as const) expect(treatedHold('ffx2-ixion-djose', piece)!, piece).not.toMatch(/Lifts when the real plate/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/Lifts when a room row for `djose-chamber-provisional` is authored/);
    expect(treatedHold('ffx2-ixion-djose', 'arena')).toMatch(/Lifts when the HD-2D hold lifts and an arena row for `djose-chamber-provisional`/);
    expect(treatedHold('ffx2-ixion-djose', 'cam')).toMatch(/Lifts when `ProAutoStage\.AUTO_STAGES` has a row for this chapter/);
  });

  it('the hold is for the missing row and the missing still, so the room really has none: no look, bold, arena or follower row names the Chamber, and its plate is among the dimmest (0.266 mean luminance), so brightness is not the reason and the text does not say it is', () => {
    expect(Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, 'ffx2-ixion-djose')).toBe(false);
    for (const look of Object.values(ROOM_LOOKS)) expect(Object.prototype.hasOwnProperty.call(look, DJOSE_CHAMBER_PLATE)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(ROOM_BOLD, DJOSE_CHAMBER_PLATE)).toBe(false);
    expect(proRoom(DJOSE_CHAMBER_PLATE)).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(AUTO_STAGES, 'ffx2-ixion-djose')).toBe(false);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/mean luminance 0\.266, far under the Farplane's 0\.628/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/so brightness is not the reason/);
  });

  it('the handoff and the changelog line carry the same truth: no "provisional plate" for the Chamber, no question to Bailey about a pick he made, and the lift is the missing row', () => {
    const note = readFileSync(join(ROOT, 'docs/handoff/booth-b4-last.md'), 'utf8');
    expect(note).not.toMatch(/Ixion's provisional Chamber|the Chamber's plate is provisional|Ixion's real plate|`DJOSE_CHAMBER_PLATE`\) is Bailey's to pick/);
    expect(note).toMatch(/D-273/);
  });
});

// ------------------------------------------------------------------------------------------------ review m2: the full-bleed card against the widest boss painting

describe("review m2 (booth-b4-last): the full-bleed boss card was tuned on paintings about 1.4 wide for every high; Overdrive Sin's is 1.89, so Chapter XVIII holds the card", () => {
  const css = readSource('src/ui/common/proStage/proCard.css');
  const size = /\.bstart--pro \.bstart__art \{[^}]*background-size:\s*auto\s+(\d+)%/.exec(css);
  const pos = /\.bstart--pro \.bstart__art \{[^}]*background-position:\s*(\d+)%\s+(\d+)%/.exec(css);
  /** The idle paintings' sizes (the approved masters, read from their PNG headers on the r64 mirror; the test below re-reads them where the art is on disk). */
  const PAINTING: Record<string, [number, number]> = { 'overdrive-sin': [1410, 745], evrae: [1136, 784], 'x2-ixion': [1331, 942], paragon: [1150, 815] };

  /** Where the painting's left edge falls on a frame, and the share of the painting that stands behind the frame's left edge (the card draws it `auto <size>%` high, anchored `<pos>%` across and at the foot). */
  function cropAt(id: string, w: number, h: number): { offset: number; leftShare: number } {
    const [pw, ph] = PAINTING[id]!;
    const drawnH = (h * Number(size![1])) / 100;
    const drawnW = (drawnH * pw) / ph;
    const offset = ((w - drawnW) * Number(pos![1])) / 100;
    return { offset, leftShare: offset < 0 ? -offset / drawnW : 0 };
  }

  it('the card is sized by height (auto 104%) and anchored 83 percent across: the numbers the geometry below uses are the stylesheet\'s', () => {
    expect(size, 'background-size').not.toBeNull();
    expect(pos, 'background-position').not.toBeNull();
    expect(Number(size![1])).toBe(104);
    expect(Number(pos![1])).toBe(83);
    expect(Number(pos![2])).toBe(100);
  });

  it("at 16:9 the three paintings of the earlier cards stand whole (their left edge inside the frame) and Overdrive Sin's does not: 142 px, 8 percent of the painting, at 1600 x 900; 15 percent at 1280 x 800; whole at 3440 x 1440", () => {
    for (const id of ['evrae', 'x2-ixion', 'paragon']) {
      for (const [w, h] of [[1600, 900], [1920, 1080], [2560, 1440], [3440, 1440]] as const) expect(cropAt(id, w, h).offset, `${id} ${w}x${h}`).toBeGreaterThanOrEqual(0);
    }
    const sin = cropAt('overdrive-sin', 1600, 900);
    expect(Math.round(sin.offset)).toBe(-142);
    expect(sin.leftShare).toBeGreaterThan(0.075);
    expect(sin.leftShare).toBeLessThan(0.085);
    expect(cropAt('overdrive-sin', 1920, 1080).leftShare).toBeCloseTo(sin.leftShare, 6);
    expect(cropAt('overdrive-sin', 1280, 800).leftShare).toBeGreaterThan(0.14);
    expect(cropAt('overdrive-sin', 1280, 800).leftShare).toBeLessThan(0.16);
    expect(Math.round(cropAt('overdrive-sin', 3440, 1440).offset)).toBe(503);
  });

  it("so Sin's face holds the card (release 68's card plays) and no other treated chapter of the batch does but the Mirror Aeons chapter, for its own reason (the road's missing @2x master)", () => {
    setTreatedScope('all');
    expect(isTreatedChapter('sin-face', 'card')).toBe(false);
    expect(treatedHold('sin-face', 'card')).toMatch(/Lifts when a browser read of the card at 1600 x 900, 1280 x 800, 2560 x 1440 and 3440 x 1440/);
    expect(isTreatedChapter('evrae-airship', 'card')).toBe(true);
    expect(isTreatedChapter('ffx2-ixion-djose', 'card')).toBe(true);
    expect(isTreatedChapter('mirror-aeons', 'card')).toBe(false);
    expect(treatedHold('mirror-aeons', 'card')).toMatch(/@2x/);
  });

  for (const [id, wh] of Object.entries(PAINTING)) {
    it.skipIf(!existsSync(join(ROOT, 'public/art/characters', id, 'idle.png')))(`the sizes above are the masters': ${id}/idle.png is ${wh[0]} x ${wh[1]} (PNG header)`, () => {
      const b = readFileSync(join(ROOT, 'public/art/characters', id, 'idle.png'));
      expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual(wh);
    });
  }
});

// ------------------------------------------------------------------------------------------------ review m5 and m6: two wordings that were inexact

describe("review m5 and m6 (booth-b4-last): the citations are the sources that say it, and 'the brightest' is the claim the plates support", () => {
  it("no source, test or note of the batch says the flight plate of Chapter XVII is 'the brightest in the game' (the unused Abyss stand-in is 0.733 and the hidden Sinspawn camp's road 0.685; the flight plate is 0.659 to 0.660), and each says what is true: the brightest of any LISTED chapter's fight plate, against the Farplane's 0.628", () => {
    for (const rel of ['src/engine/motion/DemoGate.ts', 'src/engine/motion/PieceHoldsLast.ts', 'tests/unit/booth-treated-chapters.test.ts', 'docs/handoff/booth-b4-last.md']) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      expect(text, rel).not.toMatch(/brightest (plate )?in the game/);
      expect(text, rel).toMatch(/brightest of any (listed chapter's|LISTED chapter's) fight plate/);
    }
  });

  it("the Mirror breath hold's pair fact is the chapter's and the engine's (`kino01_72` starts both gauges at 0; +20 a basic move; a full gauge picks Mega Graviton), and the engine says so: the rule the hold cites exists", () => {
    const ai = readFileSync(join(ROOT, 'src/battle/ffx/ai/dark-aeons-rules.ts'), 'utf8');
    expect(ai).toMatch(/SISTER_GAUGE_PER_TURN = 20/);
    expect(readFileSync(join(ROOT, 'src/data/chapter-mirror-aeons.ts'), 'utf8')).toMatch(/kino01_72.*both gauges starting at 0/);
  });
});
