/**
 * R74-FINS, THE ROWS (2026-11-02; Bailey 2026-10-31 ~23:40 EDT: "i'll go with all of your recommendations. you make the executive decisions for the next few days", the driver's call under it, his to overturn). Chapter XVII, Sin's Fins and Core
 * (`sin-fins-core`), is the last of the nineteen listed chapters the booth treatment reaches. **Game case (rule 14): FFX only** (CTB, Cid's Trigger Command, the airship range, `research/ffx-sin.md` section 0.3); FFX-2 has no counterpart and no
 * FFX-2 table is touched. What this file pins, in the shape of `booth-b4-last-holds` and `booth-b4-last-rows`:
 *
 *  - the list entry (FFX, `since` r74) and the seven holds in the row's order (`hud`, `hd2d`, `arena`, `breath`, `cam`, `moments`, `real`), each reason with the words that make it this chapter's own and the "Lifts when" that ends it, and that every
 *    other piece plays. **`hud` is the r74 browser read's (2026-11-03, `docs/handoff/r74.md` section 3.9: FIN-1, FIN-2, FIN-4): the lane's own fallback, so the chapter joins with release 72's HUD**;
 *  - the facts under the holds, read from the code (rule 3): no room row exists for the flight plate in any table the look reads (the V and XI pattern holds the sky as it is), the framing keeps Sin's authored deck camera in all three links,
 *    the chapter is on the wide swap scope with no exception (no `smear` hold owed), the party can field the members whose real clips hop, and the deck is Chapters VIII's and XVIII's.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { sinFinsCoreBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { keepsToday } from '../../src/engine/fx/mix/masters.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS } from '../../src/engine/look/LookGrades.ts';
import { BOLD_ROOMS } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA } from '../../src/engine/look/pro/ProGrade.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, demoGameOf, isTreatedChapter, setTreatedScope, treatedHold, treatedHolds } from '../../src/engine/motion/DemoGate.ts';
import { LAST_HOLDS } from '../../src/engine/motion/PieceHoldsLast.ts';
import { SCOPE_EXCEPTIONS, WIDE_CHAPTERS } from '../../src/engine/motion/SwapSwitch.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../src/scenes/evrae-airship-deck.ts';
import { SIN_FLIGHT_PLATE, SIN_PARTY_HEIGHT } from '../../src/scenes/evrae-airship-sin.ts';

afterEach(() => setTreatedScope(null));

const ID = 'sin-fins-core';
const HELD = ['hud', 'hd2d', 'arena', 'breath', 'cam', 'moments', 'real'] as const;
/** The deck's other two chapters (Evrae's and Sin's face): the same stage, the same party arc, the same rigs. */
const DECK_MATES = ['evrae-airship', 'sin-face'] as const;

describe('the list entry: FFX only, joined in r74', () => {
  it('is on the list as an FFX chapter since r74 (the registry says ffx; the entry says ffx), and the fallback of a caller never changes the game', () => {
    expect(getChapter(ID)?.game).toBe('ffx');
    expect(TREATED_CHAPTERS[ID]).toEqual({ game: 'ffx', since: 'r74' });
    setTreatedScope('all');
    expect(demoGameOf(ID, 'ffx2')).toBe('ffx'); // FFX's layout, profile and tables play, whatever the fallback says
    expect(demoGameOf(ID, 'ffx')).toBe('ffx');
    setTreatedScope('pack');
    expect(demoGameOf(ID, 'ffx2')).toBe('ffx2'); // release 68: not a demo chapter, the fallback
  });

  it('it is the nineteenth: every listed chapter is treated, 12 of them FFX and 7 FFX-2, and no FFX-2 table names it', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toHaveLength(19);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(12);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    expect(ID.startsWith('ffx2-')).toBe(false);
  });
});

describe('the seven holds, in the row\'s order, each with its own words and its lift', () => {
  it('the row is in PieceHoldsLast.ts (the very object PIECE_HOLDS carries), after the FFX rows and before Chapter XVI\'s, and names exactly the seven pieces', () => {
    expect(Object.keys(PIECE_HOLDS[ID]!)).toEqual([...HELD]);
    expect(PIECE_HOLDS[ID]).toBe(LAST_HOLDS[ID]);
    expect(Object.keys(LAST_HOLDS).indexOf(ID)).toBe(Object.keys(LAST_HOLDS).indexOf('mirror-aeons') + 1);
    expect(Object.keys(LAST_HOLDS).indexOf(ID)).toBe(Object.keys(LAST_HOLDS).indexOf('ffx2-ixion-djose') - 1);
    expect(treatedHolds(ID)).toEqual([...HELD]);
  });

  it('every reason is long, ends in its "Lifts when" clause and begins with the game and the chapter (FFX, Chapter XVII)', () => {
    for (const p of HELD) {
      const why = treatedHold(ID, p)!;
      expect(TREATED_PIECES as readonly string[], p).toContain(p);
      expect(why.length, p).toBeGreaterThan(300);
      expect(why, p).toMatch(/Lifts when .*\.$/);
      expect(why, p).toMatch(/^FFX, Chapter XVII \(Sin's Fins and Core\)/);
    }
  });

  it('hud: the r74 browser read\'s numbers (FIN-1, FIN-2, FIN-4, FIN-3, FIN-9), what stays as release 72 draws it, and a "Lifts when" that names both defects and how the sky read is retaken', () => {
    const why = treatedHold(ID, 'hud')!;
    for (const w of [/FIN-1 to FIN-4 and FIN-9/, /508\.1 \/ 635\.2 \/ 1016\.3 px/, /914\.3 \/ 1142\.9 \/ 1828\.6/, /15\.7 \/ 19\.6 \/ 31\.4 px/, /89\.5 x 2\.2 px at link II, 1600 x 900, cursor on/, /760 x 97 px/, /145 x 10 px/, /9\.84 and 9\.63 levels/, /0\.88 and 0\.21 with the HUD hidden/, /5\.82 grid px gap/]) expect(why, String(w)).toMatch(w);
    expect(why).toMatch(/both arms draw release 72\'s HUD/);
    expect(why).toMatch(/Lifts when the Sensor card stops touching the flag at link II \(1600 x 900, cursor on\), the advisor card stops covering the boss ribbon at 2560 x 1440 at TEXT SIZE 115 with Intel on and the plate charged, and FIN-1 to FIN-4 and FIN-9 then read 0 pairs/);
    expect(why).toMatch(/with the HUD hidden or with both arms drawing one HUD and its mean luma within 6 levels\.$/);
  });

  it('hd2d: the flight plate is the brightest of any listed chapter\'s fight plate (0.659 against the Farplane\'s 0.628, its top 40 percent 0.664 against the deck\'s 0.446), and the V and XI pattern holds the sky as it is', () => {
    const why = treatedHold(ID, 'hd2d')!;
    expect(why).toMatch(/sin-fahrenheit-flight/);
    expect(why).toMatch(/0\.659 against the Farplane's 0\.628/);
    expect(why).toMatch(/0\.664 against that deck's 0\.446/);
    expect(why).toMatch(/20\.05 percent of the sky band over 240/);
    expect(why).toMatch(/Chapters V, VIII and XI/);
    expect(why).toMatch(/hard rule 9/);
    expect(why).toMatch(/3 points over live's share over 240 at 1600 x 900 and 2560 x 1440/);
  });

  it('arena: built on the chapter look, so held with it; the deck rows of Chapters VIII and XVIII are the only ones and none is written for the flight plate', () => {
    const why = treatedHold(ID, 'arena')!;
    expect(why).toMatch(/PRO_ARENA/);
    expect(why).toMatch(/ProGradeFfxLast\.ts/);
    expect(why).toMatch(/while `hd2d` is held it cannot play/);
    expect(why).toMatch(/highlights held under 235/);
  });

  it('breath: Gravija is the sourced showpiece (75 percent of current HP, cannot kill, "Core gathers energy" a turn ahead, whiffs at FAR), the chapter shows its own telegraph, and a breath is a tone pick (rule 9)', () => {
    const why = treatedHold(ID, 'breath')!;
    expect(why).toMatch(/Gravija/);
    expect(why).toMatch(/Percentage Current 12 of 16, 75 percent of current HP/);
    expect(why).toMatch(/Core gathers energy/);
    expect(why).toMatch(/research\/ffx-sin\.md sections 3\.1, 3\.3 and 5\.1\.2/);
    expect(why).toMatch(/`charge-near` and `charge-far`/);
    expect(why).toMatch(/TelegraphHold/);
    expect(why).toMatch(/mockup decisions \(hard rule 9/);
    expect(why).toMatch(/BigMove/);
  });

  it('cam: the range director authors links I and II, link III stages the giants at pinned spots, and the framing keeps Sin\'s authored master in all three (keepsToday)', () => {
    const why = treatedHold(ID, 'cam')!;
    expect(why).toMatch(/range director/);
    expect(why).toMatch(/RANGE_STAGING/);
    expect(why).toMatch(/SIN_GENAIS_CORE_STAGING/);
    expect(why).toMatch(/4\.913 and 3\.008 units against the party's 1\.82/);
    expect(why).toMatch(/keepsToday/);
    expect(why).toMatch(/sin-left-fin/);
    expect(why).toMatch(/at 16:9, 21:9 and 4:3, at NEAR and at FAR in links I and II, and in link III/);
  });

  it('moments: the knock-out cut is unread on the registration table\'s spread, all seven can be fielded, and the party carries over the links', () => {
    const why = treatedHold(ID, 'moments')!;
    expect(why).toMatch(/PaintedActorLife\.koCutWindow/);
    expect(why).toMatch(/0\.495 to 0\.499/);
    expect(why).toMatch(/0\.21 on the deck of Chapter VIII/);
    expect(why).toMatch(/All seven can be fielded here \(Tidus, Yuna, Auron, Wakka, Lulu, Rikku and Kimahri\)/);
    expect(why).toMatch(/every cut at or under 0\.5 of the drawn height\)\.$/);
  });

  it('real: the reason carries the deck\'s evidence (R71-C2 and R71-C1), the three statuses in the other real rows\' order, and the standard lift clause', () => {
    const why = treatedHold(ID, 'real')!;
    expect(why).toMatch(/13 one-frame Wakka attack-to-follow swap hops of 161 to 494 px in Chapter VIII \(R71-C2\)/);
    expect(why).toMatch(/28 hops of 166 to 530 px in Chapter XVIII/);
    expect(why).toMatch(/530\.5, 486 and 461 px/);
    expect(why).toMatch(/R71-C1/);
    expect(why.indexOf('Status at release 72')).toBeGreaterThan(0);
    expect(why.indexOf('Status at r73-fit')).toBeGreaterThan(why.indexOf('Status at release 72'));
    expect(why.indexOf('Status at r73-fast')).toBeGreaterThan(why.indexOf('Status at r73-fit'));
    expect(why.indexOf('Lifts when')).toBeGreaterThan(why.indexOf('Status at r73-fast'));
    expect(why).toMatch(/Lifts when the real clips' one-frame steps are scaled to the figure's drawn size \(the release-72 motion lane\) and a CHK-027 run of the chapter against `\?treated=pack` shows no one-frame hop over 100 px that the control does not have\.$/);
    expect(why).toMatch(/returnArc 0\.024 and 0/);
    expect(why).toMatch(/StrikeCurve\.crossingFloors/);
  });

  it('every other piece plays under the all scope (the pro look, the card, the ending, the opening, the curves, the smear, the feel, the new effects, the sound pass and the governor; the HUD since the r74 browser read is held), and none plays under the pack scope', () => {
    setTreatedScope('all');
    for (const p of TREATED_PIECES) expect(isTreatedChapter(ID, p), p).toBe(!(HELD as readonly string[]).includes(p));
    for (const p of ['look', 'rim', 'boss', 'card', 'ending', 'opening', 'curves', 'smear', 'feel', 'fx', 'audio', 'governor'] as const) expect(treatedHold(ID, p), p).toBeUndefined();
    setTreatedScope('pack');
    for (const p of TREATED_PIECES) expect(isTreatedChapter(ID, p), p).toBe(false);
    expect(isTreatedChapter(ID)).toBe(false);
  });
});

describe('the facts under the holds, read from the code (rule 3)', () => {
  const ROOM = SIN_FLIGHT_PLATE; // the room key of the chapter's scene (`sceneKey: 'sin-fahrenheit-flight'`)

  it('the chapter\'s scene is the flight plate and no table the look reads has a row for it: no chapter row, no room look, no bold room, no room bold config, no arena row', () => {
    expect(getChapter(ID)?.sceneKey).toBe(ROOM);
    expect(Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, ID)).toBe(false);
    for (const t of [ROOM_LOOKS.hd2d, ROOM_LOOKS.cinematic, BOLD_ROOMS.hd2d, BOLD_ROOMS.cinematic, ROOM_BOLD, PRO_ARENA] as ReadonlyArray<Record<string, unknown>>) expect(Object.prototype.hasOwnProperty.call(t, ROOM)).toBe(false);
    setTreatedScope('all');
    expect(chapterLook(ID)).toBeNull(); // the frame of release 72
    setTreatedScope('pack');
    expect(chapterLook(ID)).toBeNull();
  });

  it("the deck's other two chapters are the only ones with deck rows (the room keys the held reasons cite), so the flight plate would be the third row of a look decision", () => {
    for (const key of ['evrae-airship-deck', 'sin-fahrenheit-bevelle']) {
      expect(Object.prototype.hasOwnProperty.call(ROOM_BOLD, key), key).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(PRO_ARENA, key), key).toBe(true);
    }
  });

  it("the framing keeps Sin's deck camera in all three links (the subjects are the paintings' folders: the Fins' two, then Genais and the Core), so the MAX mix never re-frames them", () => {
    expect(keepsToday(['sin-left-fin'])).toBe(true);
    expect(keepsToday(['sin-right-fin'])).toBe(true);
    expect(keepsToday(['sinspawn-genais', 'sin-core'])).toBe(true);
    expect(keepsToday(['sinspawn-genais'])).toBe(false); // Genais alone is not matched: the Core beside him is what keeps link III's rig
  });

  it('the chapter is on the wide swap scope and is NOT a scope exception, so the stance and cause picks play and no `smear` hold is owed', () => {
    expect(WIDE_CHAPTERS).toContain(ID);
    expect(Object.keys(SCOPE_EXCEPTIONS)).not.toContain(ID);
    expect(Object.prototype.hasOwnProperty.call(PIECE_HOLDS[ID]!, 'smear')).toBe(false);
  });

  it("the party can field the members whose real clips hop on this deck: Wakka and Auron have no return flip (returnArc 0 and 0.024), and Tidus's is the one the fit scales (0.857)", () => {
    const party = sinFinsCoreBuild.members.map((m) => m.id);
    expect(party).toEqual(['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'rikku', 'kimahri']);
    expect(REAL_MOTION.ffx['wakka']!.attack!.returnArc).toBe(0);
    expect(REAL_MOTION.ffx['auron']!.attack!.returnArc).toBe(0.024);
    expect(REAL_MOTION.ffx['tidus']!.attack!.returnArc).toBeGreaterThan(0.8);
  });

  it("the deck is Chapters VIII's and XVIII's: the same slots, the party's shared height 1.82, and the other two chapters hold the real clips for the same reason", () => {
    expect(SIN_PARTY_HEIGHT).toBe(1.82);
    expect(EVRAE_AIRSHIP_DECK_SLOTS).toBeDefined();
    for (const id of DECK_MATES) expect(treatedHold(id, 'real'), id).toBeDefined();
    expect(getChapter('sin-face')?.sceneKey).toBe('sin-fahrenheit-bevelle');
    expect(getChapter('evrae-airship')?.sceneKey).toBe('evrae-airship-deck');
  });
});
