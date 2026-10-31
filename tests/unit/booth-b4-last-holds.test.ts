/**
 * THE HOLDS OF THE LAST FIVE LISTED CHAPTERS (release 71, branch `booth-b4-last`; Bailey 2026-10-30: the booth treatment for every listed chapter; the driver's calls under his delegation, his to overturn). `PieceHoldsLast.ts` holds the written reasons; this file pins, per chapter, the
 * pieces it holds, the words that make each reason the chapter's own (the sourced move, the plate's measure, the exception's job), and that every other piece plays. The shared tables of `booth-treated-chapters.test.ts` (`HELD_NOW`, `NOT_YET`) pin the same lists from the other side: a hold is a decision made in two places.
 *
 * Game case (rule 14): Chapters VIII and XVIII and the Mirror Aeons chapter are FFX only (the airship's range game has no FFX-2 counterpart, `research/ffx-evrae-airship.md` section 0.4); Chapter XVI is FFX-2 only (`research/ffx2-ixion-djose.md` section 0). Chapter XVII does not join and has no hold.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, TREATED_PIECES, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { LAST_HOLDS } from '../../src/engine/motion/PieceHoldsLast.ts';

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

  it("Chapter XVIII (Sin's face, FFX only) holds the staged breath (Giga-Graviton, which the clock HUD already announces and which ends the fight in a defeat), the directed camera, the moments and, as a swap exception, the smear planner; every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['sin-face']!)).toEqual(['breath', 'cam', 'moments', 'smear']);
    expect(treatedHold('sin-face', 'breath')).toMatch(/overdrive-sin-giga-graviton/);
    expect(treatedHold('sin-face', 'breath')).toMatch(/SinHud/);
    expect(treatedHold('sin-face', 'cam')).toMatch(/evrae-airship-sin\.ts/);
    expect(treatedHold('sin-face', 'moments')).toMatch(/All seven can be fielded/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/SCOPE_EXCEPTIONS/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/224\.4 px against a cap of half his drawn height, 221\.8/);
    expect(treatedHold('sin-face', 'smear')).toMatch(/sin-face-all-held-anchor/);
    for (const p of TREATED_PIECES) if (!['breath', 'cam', 'moments', 'smear'].includes(p)) expect(treatedHold('sin-face', p), p).toBeUndefined();
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
    for (const p of TREATED_PIECES) if (!['hd2d', 'arena', 'card', 'breath', 'cam', 'moments'].includes(p)) expect(treatedHold('mirror-aeons', p), p).toBeUndefined();
  });

  it("Chapter XVI (Ixion at Djose, FFX-2 only) holds the room looks and the follower (a PROVISIONAL plate), the staged breath, the moments and, as a swap exception, the smear planner; every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-ixion-djose']!)).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear']);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/PROVISIONAL/);
    expect(treatedHold('ffx2-ixion-djose', 'hd2d')).toMatch(/DJOSE_CHAMBER_PLATE/);
    expect(treatedHold('ffx2-ixion-djose', 'arena')).toMatch(/PRO_ARENA/);
    expect(treatedHold('ffx2-ixion-djose', 'breath')).toMatch(/x2-ixion-thors-hammer/);
    expect(treatedHold('ffx2-ixion-djose', 'cam')).toMatch(/AUTO_STAGES/);
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
