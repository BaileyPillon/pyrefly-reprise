/**
 * THE TREATED CHAPTERS (release 69, branch `booth-leblanc`; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden)
 * please start with leblanc"; 2026-10-29: "you make all executive decisions for the next few days. i'll go with all of your recommendations"). Both games (shared plumbing); Leblanc, `ffx2-leblanc`, is FFX-2 only.
 *
 * `DemoGate.TREATED_CHAPTERS` is the ONE list the treatment reads (release 60 to 68 it read the two booth ids). These tests pin the list, the holds that keep a piece back with a written reason, and the `?treated=` word that
 * puts release 68's reach back; a twentieth listed chapter fails until it is treated or named in NOT_YET.
 *
 * **The r70 verdict pass (2026-10-31, `docs/handoff/booth-b3.md` section 12) took four chapters back off the list (IX and XII FFX only, V and XI FFX-2 only): each moved to NOT_YET with its reason, and its rows and holds stay in their tables, unread (`HELD_WITHDRAWN`). Ten were treated.**
 *
 * **The last five listed chapters (`booth-b4-last`, `docs/handoff/booth-b4-last.md`): Chapter VIII (Evrae), Chapter XVIII (Sin's face) and the Mirror Aeons chapter (FFX only) and Chapter XVI (Ixion at Djose, FFX-2 only) join with their holds (`PieceHoldsLast.ts`); Chapter XVII (Sin's Fins and Core) stays in NOT_YET with its reason. Fourteen are treated.**
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
import { WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';

afterEach(() => setTreatedScope(null));

const BOOTH = Object.keys(DEMO_CHAPTERS);
const LISTED: readonly string[] = CHAPTER_IDS;
/** The pieces Leblanc holds back, in the order of her rows in `PIECE_HOLDS` (each with its reason and its "Lifts when"); every other piece plays. */
const LEBLANC_HELD: readonly string[] = ['breath', 'cam', 'moments'];

/** The chapters the treatment reaches now, each with its game and the release it joined: one line per chapter. */
const TREATED_NOW: Readonly<Record<string, { game: 'ffx' | 'ffx2'; since: string }>> = {
  'seymour-flux': { game: 'ffx', since: 'r60' },
  yunalesca: { game: 'ffx', since: 'r70' },
  'seymour-anima-macalania': { game: 'ffx', since: 'r70' }, // batch 3a, the FFX lane `booth-ffx-b3a`
  'seymour-natus': { game: 'ffx', since: 'r70' },
  'braskas-final-aeon': { game: 'ffx', since: 'r70' }, // batch 3b, the FFX lane `booth-ffx-b3b`
  'isaaru-via-purifico': { game: 'ffx', since: 'r70' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
  'ffx2-den-of-woe': { game: 'ffx2', since: 'r70' }, // batch 2, the FFX-2 lane `booth-ffx2-b2`
  'ffx2-trema': { game: 'ffx2', since: 'r70' }, // batch 3, the FFX-2 lane `booth-ffx2-b3`
  'evrae-airship': { game: 'ffx', since: 'r71' }, // the last five listed chapters, `booth-b4-last`
  'sin-face': { game: 'ffx', since: 'r71' },
  'mirror-aeons': { game: 'ffx', since: 'r71' },
  'ffx2-ixion-djose': { game: 'ffx2', since: 'r71' },
};

/** The pieces each joined chapter holds back, in the order of `TREATED_PIECES`: the booth pair holds none (the approved target). */
const HELD_NOW: Readonly<Record<string, readonly string[]>> = {
  yunalesca: ['cam', 'breath', 'smear'],
  'ffx2-leblanc': ['cam', 'breath', 'moments'], // booth-leblanc: the follower crops Yuna (job J6) and the KO cut is a hard cut past the smear cap (CHK-027)
  'ffx2-den-of-woe': ['cam', 'breath', 'moments'], // batch 2: the staged breath and the moments (the knock-out rule: Gunner and Thief on the girls' grids); the r70 verdict added the camera (the follower crops Yuna about twice as often as release 69's frame)
  'seymour-anima-macalania': ['breath', 'cam', 'moments'], // batch 3a: the body and the pyreflies of the victory (cam), the unread knock-out cut (moments)
  'seymour-natus': ['breath', 'cam', 'moments'], // its camera played until the r70 verdict: the victory close-up of Kimahri crops him at the top edge (gate G5), so the camera is held
  'braskas-final-aeon': ['breath', 'moments'], // batch 3b: each of the three holds the staged breath; the review's M1 added the moments (Rikku, 0.52) to III and XII, and its m1 and m2 the camera to XII and XIV
  'isaaru-via-purifico': ['breath', 'cam', 'moments'], // the review of booth-b3 (M1): Yuna alone has no read at a hard cut; her aeons never take it
  'ffx2-trema': ['cam', 'breath', 'moments'], // batch 3: Chapter XIII holds the giants frame's camera (the follower undoes it), the staged breath (a tone pick) and the knock-out's cut (three KO bodies the registration data cannot clear)
  'evrae-airship': ['breath', 'cam', 'moments'], // `booth-b4-last`: the range director authors the deck's camera; the staged breath needs a tone pick; the knock-out cut is unread on this deck
  'sin-face': ['breath', 'cam', 'moments', 'smear'], // the same deck, and a swap exception (`SwapSwitch.SCOPE_EXCEPTIONS`: Auron's lunge return is a planned cut over the cap)
  'mirror-aeons': ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments'], // two plates under one room key, the first provisional and without an @2x master; the grade is applied once at the scene's entry
  'ffx2-ixion-djose': ['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear'], // a provisional plate (no room rows, no follower row) and a swap exception
};

/**
 * The holds of the four withdrawn chapters: the rows stay in `PIECE_HOLDS`, unread while the chapter is off the list, and come back into force with one line (the r70 verdict pass keeps every row).
 */
const HELD_WITHDRAWN: Readonly<Record<string, readonly string[]>> = {
  'yojimbo-cavern': ['breath', 'cam', 'moments'],
  'seymour-omnis': ['breath', 'cam', 'moments'],
  'ffx2-vegnagun-shuyin': ['cam', 'breath', 'moments'],
  'ffx2-fallen-aeons': ['breath', 'moments'],
};

/** The one answer the Den's camera test needs: the piece in the chapter under the `all` scope, the scope put back after. */
function isTreatedChapterUnderAll(id: string, piece: string): boolean {
  setTreatedScope('all');
  try {
    return isTreatedChapter(id, piece as never);
  } finally {
    setTreatedScope(null);
  }
}

/** Does the treatment play this piece in this chapter, under the `all` scope? */
const playsUnderAll = (id: string, piece: string): boolean => Object.prototype.hasOwnProperty.call(TREATED_NOW, id) && !(HELD_NOW[id] ?? []).includes(piece);

/**
 * The listed chapters the treatment has NOT reached yet, each with the reason (the driver's rollout order, `docs/handoff/booth-leblanc.md`). A chapter leaves this table in the commit that adds it to
 * `TREATED_CHAPTERS`; one that is in neither fails the first test below.
 */
const NOT_YET: Readonly<Record<string, string>> = {
  // The last five listed chapters (`booth-b4-last`): four joined with holds (Evrae, Sin's face, Mirror Aeons, Ixion at Djose); Chapter XVII stays out, with two findings read offline against the F1 zones and the plates (`docs/handoff/booth-b4-last.md` section 4).
  'sin-fins-core': "FFX: out of release 71 (booth-b4-last): the Fin plate (`.ffx-sinfin`, x 328 to 516 and y 22 to about 59 of the 640 x 360 grid at its minimum width) sits on the F1 turn strip (x 465 to 625, y 22 to 82) in links 1 and 2, a major the treatment would introduce, and the flight plate is the brightest in the game (mean luminance 0.659 against the Farplane's 0.628 that the bold look clipped); no rows are written",
  // The r70 verdict pass took these four back off the list (`booth-r70-withdrawn.ts` has the reasons): one line in `TREATED_CHAPTERS` puts one back once its defect is fixed.
  ...Object.fromEntries(Object.entries(WITHDRAWN_R70).map(([id, w]) => [id, w.why])),
};

describe('the list', () => {
  it('every listed chapter is treated or named in NOT_YET, never both; a twentieth fails here until it is decided', () => {
    const treated = Object.keys(TREATED_CHAPTERS);
    for (const id of LISTED) expect(treated.includes(id) !== Object.prototype.hasOwnProperty.call(NOT_YET, id), id).toBe(true);
    for (const id of Object.keys(NOT_YET)) expect(LISTED, id).toContain(id);
    expect(treated.length + Object.keys(NOT_YET).length).toBe(LISTED.length);
    expect(LISTED).toHaveLength(19);
    expect(treated).toHaveLength(14); // r70: ten of fourteen; booth-b4-last: four more of the last five (Chapter XVII stays out)
  });

  it('the four chapters of the r70 verdicts are NOT_YET with their reasons, off the list, and their rows and holds stay in the tables (unread)', () => {
    expect(Object.keys(WITHDRAWN_R70).sort()).toEqual(['ffx2-fallen-aeons', 'ffx2-vegnagun-shuyin', 'seymour-omnis', 'yojimbo-cavern']);
    for (const [id, w] of Object.entries(WITHDRAWN_R70)) {
      expect(Object.keys(TREATED_CHAPTERS), id).not.toContain(id);
      expect(Object.prototype.hasOwnProperty.call(NOT_YET, id), id).toBe(true);
      expect(NOT_YET[id], id).toMatch(/r70 verdict/);
      expect(getChapter(id)?.game, id).toBe(w.game); // rule 14: the game the registry says
      expect(Object.keys(PIECE_HOLDS[id] ?? {}).sort(), `${id} keeps its rows`).toEqual([...HELD_WITHDRAWN[id]!].sort());
    }
  });

  it('is Chapter I, Chapter IV, Leblanc, Chapter II, batch 2 (the Den of Woe), batch 3a (Macalania, Natus), batch 3b (Braska\'s Final Aeon, Isaaru) and batch 3 FFX-2 (Trema), each with the game the registry says (rule 14); Yojimbo, Omnis, Vegnagun and Shuyin and the Fallen Aeons are the r70 verdicts\' withdrawn four', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(Object.keys(TREATED_NOW).sort());
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(['braskas-final-aeon', 'evrae-airship', 'ffx2-bahamut', 'ffx2-den-of-woe', 'ffx2-ixion-djose', 'ffx2-leblanc', 'ffx2-trema', 'isaaru-via-purifico', 'mirror-aeons', 'seymour-anima-macalania', 'seymour-flux', 'seymour-natus', 'sin-face', 'yunalesca']);
    for (const [id, e] of Object.entries(TREATED_CHAPTERS)) expect(getChapter(id)?.game, id).toBe(e.game);
    for (const [id, e] of Object.entries(TREATED_NOW)) expect(TREATED_CHAPTERS[id], id).toEqual(e);
    expect(TREATED_CHAPTERS['ffx2-leblanc']).toEqual({ game: 'ffx2', since: 'r69' });
    expect(TREATED_CHAPTERS['yunalesca']).toEqual({ game: 'ffx', since: 'r70' }); // the first FFX chapter beyond Chapter I: FFX's layout, profile and tables (hard rule 14)
    expect(TREATED_CHAPTERS['ffx2-den-of-woe']).toEqual({ game: 'ffx2', since: 'r70' }); // batch 2: FFX-2 only (rule 14)
    for (const id of ['seymour-anima-macalania', 'seymour-natus']) expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx', since: 'r70' }); // batch 3a: FFX only (rule 14; the research notes open with the game case)
    for (const id of ['braskas-final-aeon', 'isaaru-via-purifico']) expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx', since: 'r70' }); // batch 3b: FFX only (rule 14): FFX's layout, profile and tables
    expect(TREATED_CHAPTERS['ffx2-trema']).toEqual({ game: 'ffx2', since: 'r70' }); // batch 3: Chapter XIII, FFX-2 only (ATB, dresspheres, Garment Grids: `research/ffx2-trema.md` section 0)
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons']) expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx', since: 'r71' }); // booth-b4-last: FFX only (the airship's range game has no FFX-2 counterpart, `research/ffx-evrae-airship.md` section 0.4; the Mirror Aeons chapter is FFX's)
    expect(TREATED_CHAPTERS['ffx2-ixion-djose']).toEqual({ game: 'ffx2', since: 'r71' }); // booth-b4-last: Chapter XVI, FFX-2 only (ATB, dresspheres, the fallen-aeon counter: `research/ffx2-ixion-djose.md` section 0)
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
  it('belong to treated chapters (or the four withdrawn ones, whose rows stay) that are not the booth pair, name real pieces, and say why and what lifts them', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) {
      expect([...Object.keys(TREATED_CHAPTERS), ...Object.keys(WITHDRAWN_R70)], id).toContain(id); // a withdrawn chapter's rows stay, unread
      expect(BOOTH, id).not.toContain(id);
      for (const [piece, why] of Object.entries(rows)) {
        expect(TREATED_PIECES as readonly string[], `${id} ${piece}`).toContain(piece);
        expect(why!.length, `${id} ${piece}`).toBeGreaterThan(80);
        expect(why, `${id} ${piece}`).toMatch(/Lifts when/);
      }
    }
  });

  it("Leblanc holds the staged breath (her sourced showpiece is No Love Lost, a three-beat comedy combo whose tone is a mockup decision), the directed camera (the follower crops Yuna at the left edge: job J6) and the moments (the KO cut hard-cuts Rikku and Yuna past the smear cap); every other piece plays", () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-leblanc']!)).toEqual(LEBLANC_HELD);
    expect(treatedHold('ffx2-leblanc', 'breath')).toMatch(/No Love Lost/);
    expect(treatedHold('ffx2-leblanc', 'breath')).not.toMatch(/no sourced/i); // the review's M1: the research names the combo (section 4.5), so "nothing sourced" is false
    expect(treatedHold('ffx2-leblanc', 'cam')).toMatch(/crops Yuna at the left edge/);
    expect(treatedHold('ffx2-leblanc', 'cam')).toMatch(/155 px/);
    expect(treatedHold('ffx2-leblanc', 'cam')).toMatch(/Lifts when `ProAutoStage` re-scores the candidates for her group .* 0 sampled frames/);
    expect(treatedHold('ffx2-leblanc', 'moments')).toMatch(/hard-cut her Rikku Thief and Yuna Gunner at the hurt-to-KO swap/);
    expect(treatedHold('ffx2-leblanc', 'moments')).toMatch(/0\.62 to 0\.63/);
    expect(treatedHold('ffx2-leblanc', 'moments')).toMatch(/Lifts when the KO cut stays inside the planned-smear cap .*\(CHK-027\)\.$/);
    for (const p of TREATED_PIECES) if (!LEBLANC_HELD.includes(p)) expect(treatedHold('ffx2-leblanc', p), p).toBeUndefined();
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
    expect(treatedHold('yunalesca', 'smear')).toMatch(/yunalesca-all-held-anchor/);
    for (const p of TREATED_PIECES) if (p !== 'breath' && p !== 'cam' && p !== 'smear') expect(treatedHold('yunalesca', p), p).toBeUndefined();
  });

  it('Chapters VII, IX and X (batch 3a, FFX only) hold what the handoff says and nothing else: the staged breath for all three (the candidate moves named), the directed camera in the two rooms whose victory is authored by hand and, since the r70 verdict, in Natus\'s (the victory close-up crops Kimahri), the moments where the knock-out cut is unread; IX is off the list but its rows stay', () => {
    expect(Object.keys(PIECE_HOLDS['seymour-anima-macalania']!)).toEqual(['breath', 'cam', 'moments']);
    expect(Object.keys(PIECE_HOLDS['yojimbo-cavern']!)).toEqual(['breath', 'cam', 'moments']);
    expect(Object.keys(PIECE_HOLDS['seymour-natus']!)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold('seymour-anima-macalania', 'breath')).toMatch(/anima-pain-boss/);
    expect(treatedHold('seymour-anima-macalania', 'breath')).toMatch(/anima-oblivion/);
    expect(treatedHold('seymour-anima-macalania', 'cam')).toMatch(/D-046/);
    expect(treatedHold('seymour-anima-macalania', 'cam')).toMatch(/D-225/);
    expect(treatedHold('seymour-natus', 'breath')).toMatch(/natus-flare/);
    expect(treatedHold('seymour-natus', 'breath')).toMatch(/mortibody-desperado/);
    expect(treatedHold('yojimbo-cavern', 'breath')).toMatch(/yojimbo-zanmato/);
    expect(treatedHold('yojimbo-cavern', 'cam')).toMatch(/PAD_GLOW/);
    for (const id of ['seymour-anima-macalania', 'seymour-natus', 'yojimbo-cavern']) {
      expect(treatedHold(id, 'breath'), id).toMatch(/TelegraphHold/);
      expect(treatedHold(id, 'moments'), id).toMatch(/CHK-027/);
      expect(treatedHold(id, 'moments'), id).toMatch(/0\.495 to 0\.499/); // Kimahri in Chapter I, 0.001 under the cap: the number the hold stands on
      for (const p of TREATED_PIECES) if (!Object.keys(PIECE_HOLDS[id]!).includes(p)) expect(treatedHold(id, p), `${id} ${p}`).toBeUndefined();
    }
  });

  it("Chapter X holds the directed camera since the r70 verdict (gate G5 of booth-b3.md: when Tidus lands the last blow the victory close-up is Kimahri's, which fills the frame height and cuts his horns, hair and raised hand and Tidus's sword tip at the top edge, in 4 of 4 runs at 1600, 2560 and 3440 wide; today's rig shows the whole party), written to be lifted", () => {
    const cam = treatedHold('seymour-natus', 'cam')!;
    expect(cam).toMatch(/Kimahri/);
    expect(cam).toMatch(/top edge/);
    expect(cam).toMatch(/4 of 4 runs/);
    expect(cam).toMatch(/3440 x 1440, 1600 x 900 and 2560 x 1440/);
    expect(cam).toMatch(/gate G5/);
    expect(cam).toMatch(/Lifts when the victory close-up is fitted .* at most 0\.5 percent lit\) at 16:9, 21:9 and 4:3 with Tidus, Yuna and Kimahri each as the last actor\.$/);
  });

  it("the Den of Woe holds the directed camera since the r70 verdict (the follower crops Yuna in 107 of 1,968 frames at 2560 x 1440 and 40 of 1,971 at 3440 x 1440, about twice release 69's own 55 of 1,980; Leblanc holds the same piece for the same crop), written to be lifted", () => {
    const cam = treatedHold('ffx2-den-of-woe', 'cam')!;
    expect(cam).toMatch(/107 of 1,968/);
    expect(cam).toMatch(/40 of 1,971/);
    expect(cam).toMatch(/55 of 1,980/);
    expect(cam).toMatch(/Leblanc holds this piece for the same crop/);
    expect(cam).toMatch(/Lifts when `ProAutoStage` re-scores the Den's candidates for its group .* 0 sampled frames/);
    expect(Object.keys(PIECE_HOLDS['ffx2-den-of-woe']!).sort()).toEqual(['breath', 'cam', 'moments']);
    expect(isTreatedChapterUnderAll('ffx2-den-of-woe', 'cam')).toBe(false); // release 68's resting camera plays; the rest of the treatment plays
    expect(isTreatedChapterUnderAll('ffx2-den-of-woe', 'hud')).toBe(true);
  });

  it("Chapters III, XII and XIV (batch 3b, FFX only) hold the staged breath: each has sourced showpieces whose tone, sound and shot are a mockup decision, no BigMove names them (bigMoveOf stages Mega Flare for FFX-2 only), and the one telegraph hold in these chapters is Chapter III's; with the review's pieces III, XII and XIV also hold the moments (booth-b3's M1 for XIV) and XII and XIV the camera, and every other piece plays (XII is off the list since the r70 verdict, its rows stay)", () => {
    const WORDS: Readonly<Record<string, readonly RegExp[]>> = {
      'braskas-final-aeon': [/Ultimate Jecht Shot/, /Triumphant Grasp/, /Jecht Bomber/, /TelegraphHold/, /possessed-bahamut-mega-flare/],
      'seymour-omnis': [/omnis-ultima/, /6:240/, /Total Annihilation is not in this fight/, /TelegraphHold/],
      'isaaru-via-purifico': [/Countdown/, /spathi-mega-flare/, /grothia-hellfire/, /pterya-energy-ray/, /bigMoveOf/],
    };
    for (const [id, words] of Object.entries(WORDS)) {
      expect(Object.keys(PIECE_HOLDS[id]!), id).toEqual(HELD_NOW[id] ?? HELD_WITHDRAWN[id]);
      for (const w of words) expect(treatedHold(id, 'breath'), `${id} ${w}`).toMatch(w);
      expect(treatedHold(id, 'breath'), id).toMatch(/Lifts when/);
      expect(treatedHold(id, 'breath'), id).toMatch(/hard rule 9/);
      for (const p of TREATED_PIECES) if (!(HELD_NOW[id] ?? HELD_WITHDRAWN[id])!.includes(p)) expect(treatedHold(id, p), `${id} ${p}`).toBeUndefined();
    }
  });

  it("Chapter XIII holds the directed camera (the follower undoes Paragon's approved giants frame), the staged breath (Meteor, Ultima and Final Impact need a mockup's tone) and the knock-out's cut (the three dresses' KO bodies are longer than the longest the harness has passed)", () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-trema']!).sort()).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold('ffx2-trema', 'cam')).toMatch(/giants frame/);
    expect(treatedHold('ffx2-trema', 'cam')).toMatch(/D-316/);
    expect(treatedHold('ffx2-trema', 'cam')).toMatch(/SCRIPTED_RIGS/);
    expect(treatedHold('ffx2-trema', 'breath')).toMatch(/Meteor/);
    expect(treatedHold('ffx2-trema', 'breath')).toMatch(/Ultima/);
    expect(treatedHold('ffx2-trema', 'breath')).toMatch(/Final Impact/);
    expect(treatedHold('ffx2-trema', 'moments')).toMatch(/CHK-027/);
    expect(treatedHold('ffx2-trema', 'moments')).toMatch(/0\.900/);
    expect(treatedHold('ffx2-trema', 'moments')).toMatch(/0\.859/);
    for (const p of TREATED_PIECES) if (p !== 'breath' && p !== 'moments' && p !== 'cam') expect(treatedHold('ffx2-trema', p), p).toBeUndefined();
  });

  it('every hold in the table is the one this file expects (a new hold, or a lifted one, is a decision made in two places)', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) expect(Object.keys(rows).sort(), id).toEqual([...(HELD_NOW[id] ?? HELD_WITHDRAWN[id] ?? [])].sort());
    for (const id of [...Object.keys(HELD_NOW), ...Object.keys(HELD_WITHDRAWN)]) expect(Object.keys(PIECE_HOLDS), id).toContain(id);
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

  it('under all it is the booth pair, Leblanc, Chapter II, batch 2 and batch 3 (less the four withdrawn): each plays every piece but the ones it holds; no other listed or hidden chapter is reached, and a withdrawn chapter answers like release 68 for every piece though its holds stay in the table', () => {
    setTreatedScope('all');
    const listed = Object.keys(TREATED_CHAPTERS);
    for (const id of [...LISTED, ...HIDDEN]) {
      const reached = Object.prototype.hasOwnProperty.call(TREATED_NOW, id);
      expect(isTreatedChapter(id), id).toBe(reached);
      expect(listed.includes(id), id).toBe(reached); // both lanes' readings of "reached" agree: the table here is the list there
      for (const p of TREATED_PIECES) {
        expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(playsUnderAll(id, p));
        expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(reached && treatedHold(id, p) === undefined); // and the hold is the one `PIECE_HOLDS` names
      }
    }
    for (const p of TREATED_PIECES) for (const id of BOOTH) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(true); // the approved target is never held
    expect(isTreatedChapter(undefined, 'hud')).toBe(false);
    for (const id of Object.keys(WITHDRAWN_R70)) {
      expect(isTreatedChapter(id), id).toBe(false);
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(false);
      expect(Object.keys(PIECE_HOLDS), id).toContain(id); // the rows stay, unread
    }
  });

  it("the game follows the chapter under all (FFX-2 for Leblanc, FFX for Chapter II and batch 3b), and the fallback elsewhere", () => {
    setTreatedScope('all');
    expect(demoGameOf('ffx2-leblanc')).toBe('ffx2');
    expect(demoGameOf('ffx2-leblanc', 'ffx')).toBe('ffx2');
    expect(demoGameOf('yunalesca', 'ffx2')).toBe('ffx'); // Chapter II is FFX: the FFX layout, curve profile and tables play there, whatever the fallback says
    for (const id of ['seymour-anima-macalania', 'seymour-natus']) expect(demoGameOf(id, 'ffx2'), id).toBe('ffx'); // batch 3a: FFX too
    for (const id of ['braskas-final-aeon', 'isaaru-via-purifico']) expect(demoGameOf(id, 'ffx2'), id).toBe('ffx'); // batch 3b is FFX: FFX's layout, profile and tables play there, whatever the fallback says
    for (const [id, w] of Object.entries(WITHDRAWN_R70)) expect(demoGameOf(id, w.game === 'ffx' ? 'ffx2' : 'ffx'), id).toBe(w.game === 'ffx' ? 'ffx2' : 'ffx'); // the r70 withdrawn four: not treated, so the fallback
    expect(demoGameOf('sin-fins-core', 'ffx2')).toBe('ffx2'); // not treated (NOT_YET): the fallback
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons']) expect(demoGameOf(id, 'ffx2'), id).toBe('ffx'); // booth-b4-last: FFX's layout, profile and tables play there, whatever the fallback says
    expect(demoGameOf('ffx2-ixion-djose', 'ffx')).toBe('ffx2'); // and Chapter XVI is FFX-2's, whatever the fallback says
    expect(demoGameOf('exp-leblanc', 'ffx')).toBe('ffx');
    setTreatedScope('pack');
    expect(demoGameOf('ffx2-leblanc', 'ffx')).toBe('ffx'); // release 68: not a demo chapter, the fallback
    expect(demoGameOf('yunalesca', 'ffx2')).toBe('ffx2'); // release 68: the same
    expect(demoGameOf('braskas-final-aeon', 'ffx2')).toBe('ffx2'); // and batch 3b's
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
