/**
 * THE ROWS OF BATCH 3a (release 71, branch `booth-ffx-b3a`; Chapter VII `seymour-anima-macalania`, Chapter X `seymour-natus`, Chapter IX `yojimbo-cavern`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter). The data the treatment needs for the three
 * fights, from art already on disk (no new art, nothing written into an art mirror): the HD-2D look rows, the arena grade and its cone of light, the rim-off foe rows, and the things that must stay as they are (the MAX mix's rigs, the FFX clip rows by name, no swap exception, the
 * boss re-cut art ids). Every number the rows pin was read off the plates by `docs/handoff/booth-ffx-b3a.md` section 3. The shape is `booth-yunalesca-rows`, as a table: the next chapter that joins adds one entry to ROOMS.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Object3D } from 'three';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { BOSS_CLEAN_ARTS, BOSS_FEET, BOSS_FEET_POSES, bossCleanCard, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, lutBytes } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { PRO_ARENA_FFX_B3A } from '../../src/engine/look/pro/ProGradeFfxB3a.ts';
import { TREATED_RIM_FOES, rimSkipOf, tagRimFigure } from '../../src/engine/look/pro/RimFigures.ts';
import { realKeyOf, realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { SCOPE_EXCEPTIONS, WIDE_CHAPTERS, scopeExcepted } from '../../src/engine/motion/SwapSwitch.ts';
import { victoryKind } from '../../src/engine/motion/MomentsPlan.ts';
import { classify, keepsToday } from '../../src/engine/fx/mix/masters.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setBossClean(null);
  setPartyRim(null);
});

interface RoomCase {
  id: string;
  room: string;
  /** The sharp band: the booth line at the room's idle rig, read by the handoff (`focus-calc`). */
  focus: number;
  /** The authored light on the plate (u from the left, v from the top) and where `findLight` would have put it (the reason the row exists). */
  light: { u: number; v: number };
  /** The plate's palette as the scene hands the look (Backdrop's own bands: sky and key). */
  palette: { key: number; sky: number };
  /** Colours read off the plate, as the LUT probe: the light, the dark of the room, an accent the grade must keep. */
  probes: { light: number[]; dark: number[]; accent: { rgb: number[]; warm?: boolean } };
  /** The foes the rim row flags (by combatant id) and the ones it leaves alone, each with the measured edge minus ring luminance. */
  flagged: string[];
  unflagged: string[];
  /** The hold on the directed camera: held for the two rooms whose victory is authored by hand. */
  camHeld: boolean;
}
const ROOMS: RoomCase[] = [
  {
    id: 'seymour-anima-macalania',
    room: 'macalania-temple',
    focus: 0.36,
    light: { u: 0.475, v: 0.5 },
    palette: { key: 0x5a88a8, sky: 0x657a8d },
    probes: { light: [0.35, 0.75, 0.95], dark: [0.1, 0.13, 0.2], accent: { rgb: [0.88, 0.67, 0.49], warm: true } }, // the doors' cyan, the wall between them, the brazier's gold
    flagged: ['seymour-macalania', 'guado-guardian-a', 'guado-guardian-b', 'anima-macalania'],
    unflagged: [],
    camHeld: true,
  },
  {
    id: 'seymour-natus',
    room: 'bevelle-highbridge',
    focus: 0.33,
    light: { u: 0.49, v: 0.8 },
    palette: { key: 0x5e4032, sky: 0x0a1726 },
    probes: { light: [0.09, 0.69, 0.95], dark: [0.04, 0.06, 0.12], accent: { rgb: [0.95, 0.68, 0.36], warm: true } }, // the arch's blue, the night sky, a lamp
    flagged: ['mortibody'],
    unflagged: ['seymour-natus'], // +19.3: the pale-fringe re-cut candidate, kept with his rim as release 68 draws him
    camHeld: false,
  },
  {
    id: 'yojimbo-cavern',
    room: 'cavern-stolen-fayth',
    focus: 0.33,
    light: { u: 0.59, v: 0.42 },
    palette: { key: 0x30424c, sky: 0x202b34 },
    probes: { light: [0.5, 0.68, 0.78], dark: [0.1, 0.12, 0.14], accent: { rgb: [0.17, 0.2, 0.22] } }, // the shaft, the wall; the pad is a glow added by the scene at the victory, so the accent is the floor staying readable
    flagged: ['yojimbo', 'daigoro'],
    unflagged: ['ginnem'], // +81.4 and a soft-alpha share of 1.13: a translucent glow, like Shiva and Anima in Chapter XI
    camHeld: true,
  },
];

const luma = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
const N = 32;
function grader(room: string, palette: { key: number; sky: number }, arena: boolean): (c: readonly number[]) => number[] {
  const lut = arena ? lutBytes('cinematic', 'ffx', room, palette as never, 'bold', null, true) : lutBytes('hd2d', 'ffx', room, palette as never, 'bold', null, false);
  return (c) => {
    const k = c.map((x) => Math.min(N - 1, Math.max(0, Math.round(Math.sqrt(x / 2) * (N - 1)))));
    const o = ((k[2]! * N + k[1]!) * N + k[0]!) * 4;
    return [lut[o]! / 255, lut[o + 1]! / 255, lut[o + 2]! / 255];
  };
}

describe.each(ROOMS)('$id ($room): the HD-2D look and the rows', (r) => {
  it('has the bold hd2d row, played only while the treatment reaches the chapter (`?treated=pack` is release 68)', () => {
    expect(CHAPTER_LOOKS[r.id]).toEqual({ name: 'hd2d', strength: 'bold' });
    setTreatedScope('pack');
    expect(chapterLook(r.id)).toBeNull();
    setTreatedScope('all');
    expect(chapterLook(r.id)).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it('names the plate\'s own light in both looks it is graded in (u, v read off the plate), and the sharp band follows the booth line at the idle rig', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const l = ROOM_LOOKS[look][r.room]?.light;
      expect(l, look).toBeDefined();
      expect(l!.u, look).toBeCloseTo(r.light.u, 2);
      expect(l!.v, look).toBeCloseTo(r.light.v, 2);
      expect(Math.max(...l!.color), look).toBeGreaterThan(0.9); // a light is a bright colour
    }
    expect(ROOM_LOOKS.hd2d[r.room]?.focus).toBe(r.focus);
    expect(boldRoom('hd2d', r.room)?.focus).toBe(r.focus);
    // the booth rows the rule is read from, unchanged
    expect(boldRoom('hd2d', 'gagazet')?.focus).toBe(0.36);
    expect(boldRoom('hd2d', 'bevelle-underground')?.focus).toBe(0.4);
  });

  it('has a bold grade in both looks with its own hue pulls and a coloured fog', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const g = boldRoom(look, r.room);
      expect(g, look).toBeDefined();
      expect((g!.recipe?.hues ?? []).length, look).toBeGreaterThanOrEqual(1);
    }
    const fog = boldRoom('cinematic', r.room)!.fog!;
    expect(fog).toHaveLength(3);
    expect(Math.max(...fog)).toBeLessThan(0.9); // a haze, not a white veil
  });

  it('the bold facts: no embers on purpose (the scene carries its own air; the one line to give sparks needs a yes), a rim colour, and a room that is still found by `roomBold`; an unlisted room gets none', () => {
    const b = ROOM_BOLD[r.room]!;
    expect(b.embers).toEqual([]);
    expect(b.rim).toBeDefined();
    expect(Math.max(...b.rim!)).toBeGreaterThan(0.8);
    expect(b.fog).toBeDefined();
    expect(roomBold(r.room)).toBe(b);
    expect(roomBold('no-such-room').embers).toEqual([]);
  });
});

describe.each(ROOMS)('$id ($room): the pro arena', (r) => {
  const row = PRO_ARENA[r.room]!;

  it('has a row the engine finds (spread in from `ProGradeFfxB3a`, right after the dome\'s), with the plate\'s light as the fixed cone the camera carries', () => {
    expect(proRoom(r.room)).toBe(row);
    expect(PRO_ARENA_FFX_B3A[r.room]).toBe(row);
    expect(row.cone).toBeDefined();
    expect(row.cone!.follow).toBe(false);
    expect(row.cone!.paint!.u).toBeCloseTo(r.light.u, 1);
    expect(row.cone!.paint!.v).toBeCloseTo(r.light.v, 1);
    expect(row.cone!.strength).toBeGreaterThan(0.25);
    expect(row.cone!.strength).toBeLessThan(0.6);
  });

  it('keeps the plate\'s light bright and drops the rest of the room to deep shadow, with the accent kept (the arena\'s own LUT, over colours read off the plate): one strong light, the rest to shadow and haze', () => {
    const g = grader(r.room, r.palette, true);
    const light = g(r.probes.light);
    const dark = g(r.probes.dark);
    const accent = g(r.probes.accent.rgb);
    expect(luma(light)).toBeGreaterThan(luma(dark) * 3); // the light stands out of the room
    expect(luma(dark)).toBeLessThan(0.1); // the room falls to shadow
    expect(luma(dark)).toBeLessThan(luma(r.probes.dark) + 0.02); // the grade never lifts the dark
    if (r.probes.accent.warm) {
      expect(accent[0]!).toBeGreaterThan(accent[2]!); // the warm accent stays warm: red over blue
      expect(luma(accent)).toBeGreaterThan(luma(dark) * 2);
    } else {
      expect(luma(accent)).toBeGreaterThan(0.02); // the floor stays readable
    }
  });

  it('grades the room down by a real vignette and a haze of its own colour (blue over red: the night, the ice and the cave are cold rooms), and sets its light colour from the plate', () => {
    expect(row.vignette.amount).toBeGreaterThan(0.4);
    expect(row.haze.colour[2]).toBeGreaterThan(row.haze.colour[0]);
    expect(row.lightColor[2]).toBeGreaterThan(0.9);
  });
});

describe('the rows are [ours] and say so: set from the plates, graded offline, a still owed beside Chapter I (hard rule 9)', () => {
  it('ProGradeFfxB3a.ts names the lane, the handoff and the still; the handoff is committed and names the grade picture', () => {
    const root = resolve(__dirname, '../..');
    const src = readFileSync(resolve(root, 'src/engine/look/pro/ProGradeFfxB3a.ts'), 'utf8');
    expect(src).toMatch(/each row is \[ours\]/);
    expect(src).toMatch(/a still beside Chapter I is owed before Bailey judges it \(hard rule 9/);
    const handoffPath = resolve(root, 'docs/handoff/booth-ffx-b3a.md');
    expect(existsSync(handoffPath)).toBe(true);
    expect(readFileSync(handoffPath, 'utf8')).toContain('booth-ffx-b3a-plate-grade.png');
  });
});

describe.each(ROOMS)('$id: the boss and the rim', (r) => {
  it('draws no screen-space rim on the foes the row flags, none on the party, and nothing else by accident; the foes it leaves out keep release 68\'s rim', () => {
    setTreatedScope('all');
    setDemoChapter(r.id);
    setBossClean('clean');
    setPartyRim('off');
    for (const id of r.flagged) {
      const o = new Object3D();
      tagRimFigure(o, id, 'enemy');
      expect(rimSkipOf(o), id).toBe(true);
      expect(TREATED_RIM_FOES[id], id).toBe('ffx');
    }
    for (const id of r.unflagged) {
      const o = new Object3D();
      tagRimFigure(o, id, 'enemy');
      expect(rimSkipOf(o), id).toBe(false);
      expect(Object.keys(TREATED_RIM_FOES), id).not.toContain(id);
    }
    const hero = new Object3D();
    tagRimFigure(hero, 'tidus', 'party');
    expect(rimSkipOf(hero)).toBe(true);
    const ghost = new Object3D();
    tagRimFigure(ghost, 'some-other-foe', 'enemy');
    expect(rimSkipOf(ghost)).toBe(false);
  });

  it('under `?treated=pack` the flagged foes keep their rim (release 68\'s frame), and another chapter that plays the same ids is not reached', () => {
    setBossClean('clean');
    setPartyRim('off');
    setTreatedScope('pack');
    setDemoChapter(r.id);
    for (const id of r.flagged) {
      const o = new Object3D();
      tagRimFigure(o, id, 'enemy');
      expect(rimSkipOf(o), id).toBe(false);
    }
    setTreatedScope('all');
    setDemoChapter('sinspawn-gui'); // a hidden chapter the treatment can never reach
    for (const id of r.flagged) {
      const o = new Object3D();
      tagRimFigure(o, id, 'enemy');
      expect(rimSkipOf(o), id).toBe(false);
    }
  });
});

describe('what must stay as it is', () => {
  it('has NO footprint rows and NO re-cut art entries for any foe of the three chapters, on purpose (the pale fringe of Natus is a re-cut candidate, held; no footprint is read here): the booth bosses\' two stay the only ones', () => {
    setTreatedScope('all');
    setBossClean('clean');
    for (const art of ['seymour-macalania', 'guado-guardian', 'anima', 'seymour-natus', 'seymour-natus-ring', 'mortibody', 'yojimbo-cavern', 'ginnem', 'daigoro']) {
      setDemoChapter('seymour-natus');
      expect(Object.keys(BOSS_CLEAN_ARTS), art).not.toContain(art);
      expect(Object.keys(BOSS_FEET), art).not.toContain(art);
      expect(Object.keys(BOSS_FEET_POSES), art).not.toContain(art);
      expect(bossCleanOn(art), art).toBe(false);
      expect(bossCleanCard(art), art).toBe(false);
    }
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
  });

  it('none of the three is a swap exception (the stance and cause picks and the smear all play: `SwapSwitch.SCOPE_EXCEPTIONS` is unchanged and names none of them)', () => {
    for (const { id } of ROOMS) {
      expect(scopeExcepted(id), id).toBe(false);
      expect(Object.keys(SCOPE_EXCEPTIONS), id).not.toContain(id);
      expect(WIDE_CHAPTERS, id).toContain(id);
    }
    expect(Object.keys(SCOPE_EXCEPTIONS).sort()).toEqual(['evrae-airship', 'sin-face', 'yunalesca', 'ffx2-ixion-djose'].sort());
  });

  it("the MAX mix's framing is today's classification: Natus and Yojimbo are colossus masters, Seymour a hero; none keeps today's rig by name (`keepsToday`): the camera hold is the piece's, not the framing's", () => {
    expect(classify(['seymour-natus', 'mortibody'])).toBe('colossus');
    expect(classify(['yojimbo', 'ginnem', 'daigoro'])).toBe('colossus');
    expect(classify(['guado-guardian-a', 'seymour-macalania', 'guado-guardian-b'])).toBe('hero');
    for (const foes of [['seymour-natus'], ['yojimbo'], ['seymour-macalania']]) expect(keepsToday(foes)).toBe(false);
  });

  it('the victory is the cheer kind in all three (research/ffx-vs-ffx2-presentation.md 2.1: only Zanarkand withholds the FFX pose), so the title sits over the party\'s cheer and there is no pull-back', () => {
    for (const { id } of ROOMS) {
      expect(getChapterMeta(id)?.victoryPose, id).not.toBe('hold');
      expect(victoryKind(getChapterMeta(id)?.victoryPose), id).toBe('cheer');
      expect(getChapter(id)?.game, id).toBe('ffx');
    }
  });

  it("the real clips are FFX rows by name: Tidus, Yuna, Kimahri and Lulu have rows (Chapters VII, IX and X use them), FFX Rikku and the bosses play the house curves; the FFX-2 dress rule never applies here", () => {
    setTreatedScope('all');
    for (const { id } of ROOMS) {
      setDemoChapter(id);
      for (const who of ['tidus', 'yuna', 'kimahri', 'lulu']) expect(realRowOf('ffx', who), `${id} ${who}`).toBeDefined();
      expect(realRowOf('ffx', 'rikku'), id).toBeUndefined();
      for (const boss of ['seymour-macalania', 'anima', 'seymour-natus', 'mortibody', 'yojimbo', 'daigoro']) expect(realRowOf('ffx', boss), boss).toBeUndefined();
    }
    expect(realKeyOf('yuna', 'ffx')).toBe('yuna');
    expect(realKeyOf('yuna-gunner', 'ffx2', true)).toBeUndefined();
  });

  it('every other listed chapter is still unreached by these rows: the look table lists the three and the chapters that were already treated, and no hidden chapter', () => {
    setTreatedScope('all');
    const looked = CHAPTERS.filter((c) => chapterLook(c.id) !== null).map((c) => c.id);
    for (const { id } of ROOMS) expect(looked).toContain(id);
    for (const hidden of ['exp-leblanc', 'sinspawn-gui', 'exp-fayth', 'ffx2-tourist-trap']) expect(looked).not.toContain(hidden);
  });
});

describe('review MINOR 5 (2026-10-30): five [ours] numbers the other tests in this file did not reach, pinned so that a retune is an edit made on purpose and not a drift under a green suite', () => {
  // These are colour and gloss values set from the plates and graded offline; NO test can say they are RIGHT (the stills of job J11 owe that, hard rule 9). A green suite is not a colour check: it says only that the
  // value below is the one the handoff and the plate-grade still were made with, so changing one means changing this line and showing Bailey the still again.
  it('the Cavern gloss, the Macalania arena exposure, the cinematic Highbridge shadow tint, the hd2d Cavern highlight tint and the Macalania rim colour', () => {
    expect(ROOM_BOLD['cavern-stolen-fayth']?.gloss).toBe(0.3);
    expect(PRO_ARENA_FFX_B3A['macalania-temple']?.colour.exposure).toBe(0.95);
    expect(ROOM_LOOKS.cinematic['bevelle-highbridge']?.shadow).toEqual([0.04, 0.06, 0.24]); // the Highbridge arena's look row (the bold table's own shadow [0.06, 0.05, 0.3] is pinned with its recipe above)
    expect(boldRoom('hd2d', 'cavern-stolen-fayth')?.highlight).toEqual([0.86, 0.96, 1.0]);
    expect(ROOM_BOLD['macalania-temple']?.rim).toEqual([0.45, 0.8, 1.0]);
  });
});
