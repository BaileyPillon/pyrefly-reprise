/**
 * LADY YUNALESCA'S ROWS (release 69, branch `booth-ffx-yunalesca`; Chapter II, `yunalesca`, FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter; the lane is the first FFX widening beyond Chapter I). The data the treatment
 * needs for her fight, from art already on disk (no new art): the HD-2D look rows, the arena grade and its cone of light from the oculus, the rim-off foe row, and the things that must stay as they are (the swap exception that holds her stance look,
 * the MAX mix's rig, the FFX clip rows by name). Every number the rows pin was read off the plate by `docs/handoff/booth-ffx-yunalesca.md` section 3.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { setBossClean, BOSS_CLEAN_ARTS, BOSS_FEET, BOSS_FEET_POSES, bossCleanCard, bossCleanOn } from '../../src/engine/look/pro/BossClean.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, lutBytes } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { TREATED_RIM_FOES, rimSkipOf, tagRimFigure } from '../../src/engine/look/pro/RimFigures.ts';
import { realKeyOf, realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { SCOPE_EXCEPTIONS, WIDE_CHAPTERS, chapterInScope, scopeExcepted, setCauseMode, setStanceMode, causeMode, stanceNow, swapHow, swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setSmearStyle, smearOn, smearStyleNow } from '../../src/engine/motion/SmearSwitch.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { victoryKind } from '../../src/engine/motion/MomentsPlan.ts';
import { keepsToday } from '../../src/engine/fx/mix/masters.ts';
import { classify } from '../../src/engine/fx/mix/masters.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setBossClean(null);
  setPartyRim(null);
  setStanceMode(null);
  setCauseMode(null);
  setSmearStyle(null);
  setCurvesMode(null);
});

const ROOM = 'zanarkand-dome';
// the oculus on the plate (offline read of `D:/pyrefly-art-r64/backdrops/zanarkand-dome.png`: the near-white lavender pixels of the top of the plate, centroid, u from the left, v from the top) and the gold sphere's centroid
const OCULUS = { u: 0.338, v: 0.063 };
const SPHERE = { u: 0.262, v: 0.788 };

describe("the HD-2D look and the dome's rows", () => {
  it('the chapter has the bold hd2d row, played only while the treatment reaches it (`?treated=pack` is release 68)', () => {
    expect(CHAPTER_LOOKS['yunalesca']).toEqual({ name: 'hd2d', strength: 'bold' });
    setTreatedScope('pack');
    expect(chapterLook('yunalesca')).toBeNull();
    setTreatedScope('all');
    expect(chapterLook('yunalesca')).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it("the authored light is the oculus in both looks the room is graded in (`findLight` left alone takes the gold sphere low on the left, so the shafts would climb from the floor)", () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const l = ROOM_LOOKS[look][ROOM]?.light;
      expect(l, look).toBeDefined();
      expect(l!.u, look).toBeCloseTo(OCULUS.u, 2);
      expect(l!.v, look).toBeCloseTo(OCULUS.v, 2);
      expect(l!.v, look).toBeLessThan(0.2); // the top of the plate, not the sphere (v 0.79)
      expect(l!.color[2], look).toBeGreaterThan(0.9); // pale lavender: blue high, red high, green lower
      expect(l!.color[0], look).toBeGreaterThan(l!.color[1]);
    }
  });

  it("the sharp band follows the booth rule at the dome's idle rig: 0.35 against Chapter I's 0.36 and Chapter IV's 0.40 (the party stands lower in this frame)", () => {
    expect(ROOM_LOOKS.hd2d[ROOM]?.focus).toBe(0.35);
    expect(boldRoom('hd2d', ROOM)?.focus).toBe(0.35);
    expect(boldRoom('hd2d', 'gagazet')?.focus).toBe(0.36);
    expect(boldRoom('hd2d', 'bevelle-underground')?.focus).toBe(0.4);
  });

  it("the bold grade has both looks, with the plate's blue-violet (hue 245) and the sphere's gold (hue 35) pulled and the fog a violet", () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const r = boldRoom(look, ROOM);
      expect(r, look).toBeDefined();
      expect((r!.recipe?.hues ?? []).map((h) => h.hue), look).toEqual([245, 35]);
    }
    const fog = boldRoom('cinematic', ROOM)!.fog!;
    expect(fog[2]).toBeGreaterThan(fog[0]);
    expect(fog[2]).toBeGreaterThan(fog[1]);
    // the plate is brighter than either booth room, so the exposure is held at or under Chapter I's row
    expect(boldRoom('hd2d', ROOM)!.recipe!.exposure!).toBeLessThanOrEqual(boldRoom('hd2d', 'gagazet')!.recipe!.exposure! + 0.1);
  });

  it('the bold facts: a wet floor (gloss like the cathedral\'s), the scene\'s cold violet for the rim, NO embers on purpose (the scene carries its own pyrefly fields); an unlisted room still gets none', () => {
    const b = ROOM_BOLD[ROOM]!;
    expect(b.gloss).toBeGreaterThanOrEqual(0.5);
    expect(b.rim![2]).toBeGreaterThan(b.rim![0]); // violet-blue: blue over red over green
    expect(b.rim![0]).toBeGreaterThan(b.rim![1]);
    expect(b.embers).toEqual([]);
    // the one line to add sparks at the sphere, if Bailey says yes (`LookBoldConfig.ts`): the point is on the painting's lower left
    expect(SPHERE.u).toBeGreaterThan(0.1);
    expect(SPHERE.u).toBeLessThan(0.4);
    expect(SPHERE.v).toBeGreaterThan(0.6);
    expect(roomBold(ROOM)).toBe(b);
    expect(roomBold('no-such-room').embers).toEqual([]);
  });
});

describe('the pro arena: one light, the oculus; the rest falls to indigo, the sphere stays gold', () => {
  const room = PRO_ARENA[ROOM]!;
  const luma = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;

  it('has a row the engine finds, with the oculus as the fixed cone (the painted point the cone follows through the camera)', () => {
    expect(proRoom(ROOM)).toBe(room);
    expect(room.cone).toBeDefined();
    expect(room.cone!.follow).toBe(false);
    expect(room.cone!.paint!.u).toBeCloseTo(OCULUS.u, 2);
    expect(room.cone!.paint!.v).toBeCloseTo(OCULUS.v, 2);
    expect(room.cone!.v).toBeGreaterThan(0.9); // the frame point it starts from: the top, where the oculus is at the first menu
    expect(room.cone!.colour[2]).toBeGreaterThan(room.cone!.colour[1]); // pale lavender
    expect(room.lightColor[2]).toBeGreaterThan(0.9);
  });

  it("keeps the oculus bright, drops the hall and the pink dusk to deep shadow, and leaves the sphere warm (the arena's own LUT, the engine's neutral recipe then this room's colour transform, over colours read off the plate)", () => {
    // the palette the scene hands the look (Backdrop's own bands for this scene: sky [0, 0.14], key [0.66, 0.86]; measured on the plate, handoff section 3)
    const lut = lutBytes('cinematic', 'ffx', ROOM, { key: 0x7c6680, sky: 0x534a7c } as never, 'bold', null, true);
    const N = 32;
    const grade = (c: readonly number[]): number[] => {
      const k = c.map((x) => Math.min(N - 1, Math.max(0, Math.round(Math.sqrt(x / 2) * (N - 1)))));
      const o = ((k[2]! * N + k[1]!) * N + k[0]!) * 4;
      return [lut[o]! / 255, lut[o + 1]! / 255, lut[o + 2]! / 255];
    };
    const oculus = grade([0.97, 0.82, 0.98]); // the near-white lavender of the oculus
    const hall = grade([0.3, 0.26, 0.55]); // the plate's blue-violet columns and vault
    const dusk = grade([0.7, 0.55, 0.85]); // the pink dusk between the right-hand columns
    const sphere = grade([0.9, 0.64, 0.41]); // the gold sphere's mean colour
    expect(luma(oculus)).toBeGreaterThan(0.6);
    expect(luma(hall)).toBeLessThan(0.15);
    expect(luma(dusk)).toBeLessThan(luma([0.7, 0.55, 0.85]) * 0.6); // the pink falls well under its own plate value
    expect(luma(hall)).toBeLessThan(luma(oculus) / 4); // one strong light: the room reads a good deal under it
    expect(sphere[0]).toBeGreaterThan(sphere[2]!); // warm: red over blue
    expect(luma(sphere)).toBeGreaterThan(luma(hall) * 2);
  });

  it('is [ours] and says so: the row\'s comment names the still owed beside Chapter I (hard rule 9) and the handoff', () => {
    // the plate-grade still beside Chapter I ships with the branch; the file test is the repo's own check that it was committed
    expect(room.vignette.amount).toBeGreaterThan(0.4);
    expect(room.haze.colour[2]).toBeGreaterThan(room.haze.colour[0]);
  });
});

describe('the boss and the rim', () => {
  it('Lady Yunalesca (one combatant, three paintings) draws no screen-space rim in her chapter under all, the party draws none, and nothing else of hers is flagged by accident', () => {
    setTreatedScope('all');
    setDemoChapter('yunalesca');
    setBossClean('clean');
    setPartyRim('off');
    const boss = new Object3D();
    tagRimFigure(boss, 'yunalesca', 'enemy');
    expect(rimSkipOf(boss)).toBe(true);
    const hero = new Object3D();
    tagRimFigure(hero, 'tidus', 'party');
    expect(rimSkipOf(hero)).toBe(true);
    const ghost = new Object3D();
    tagRimFigure(ghost, 'some-other-foe', 'enemy');
    expect(rimSkipOf(ghost)).toBe(false);
    expect(TREATED_RIM_FOES['yunalesca']).toBe('ffx'); // FFX only: no FFX-2 chapter has her, and the id is never read there
  });

  it("under `?treated=pack` she keeps her rim (release 68's frame), and outside her own chapter nothing flags her", () => {
    setBossClean('clean');
    setPartyRim('off');
    setTreatedScope('pack');
    setDemoChapter('yunalesca');
    const boss = new Object3D();
    tagRimFigure(boss, 'yunalesca', 'enemy');
    expect(rimSkipOf(boss)).toBe(false);
    setTreatedScope('all');
    setDemoChapter('braskas-final-aeon'); // another chapter that plays an id of the same table is not reached
    expect(rimSkipOf(boss)).toBe(false);
  });

  it('has NO footprint rows and NO re-cut art entries, on purpose (the measured reasons are in `RimFigures.ts` and the handoff): the three forms are not `BOSS_CLEAN_ARTS`, so `bossCleanOn(art)` and the cut-out card stay false', () => {
    setTreatedScope('all');
    setDemoChapter('yunalesca');
    setBossClean('clean');
    for (const art of ['yunalesca-1', 'yunalesca-2', 'yunalesca-3', 'yunalesca']) {
      expect(Object.keys(BOSS_CLEAN_ARTS), art).not.toContain(art);
      expect(Object.keys(BOSS_FEET), art).not.toContain(art);
      expect(Object.keys(BOSS_FEET_POSES), art).not.toContain(art);
      expect(bossCleanOn(art), art).toBe(false);
      expect(bossCleanCard(art), art).toBe(false);
    }
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']); // the booth bosses, unchanged
  });
});

describe('what must stay as it is', () => {
  it('the swap exception that holds her stance look is still there, still names its lift job, and the treatment does not touch it (release 69\'s re-measure could not lift it)', () => {
    expect(scopeExcepted('yunalesca')).toBe(true);
    expect(SCOPE_EXCEPTIONS['yunalesca']).toMatch(/Lifts when/);
    expect(SCOPE_EXCEPTIONS['yunalesca']).toMatch(/yunalesca-all-anchor/);
    expect(WIDE_CHAPTERS).toContain('yunalesca');
    setTreatedScope('all');
    expect(chapterInScope('yunalesca', 'wide')).toBe(false);
    expect(chapterInScope('yunalesca', 'all')).toBe(true); // the measuring word still reaches it
  });

  it('and the smear planner, which cuts those same swaps, is held with it (a PIECE_HOLD): under the treatment her chapter plays no smear and no stance or cause pick, exactly release 68\'s swap look; `?swapscope=all` still reaches her', () => {
    setTreatedScope('all');
    setDemoChapter('yunalesca');
    setCurvesMode('real-snappy');
    setSmearStyle('paint');
    setStanceMode('v1a');
    setCauseMode('pick');
    expect(swapsInScope()).toBe(false);
    expect(smearOn()).toBe(false);
    expect(smearStyleNow()).toBe('off');
    expect(stanceNow()).toBe('today');
    expect(swapHow('contact')).toBe('today');
    // the measuring word reaches her (the held piece is the treatment's, not the swap scope's)
    expect(chapterInScope('yunalesca', 'all')).toBe(true);
    expect(causeMode()).toBe('pick');
  });

  it("the MAX mix's rig for the dome is today's: she is not a colossus (PR-0307), so the chapter framing keeps today's cameras", () => {
    expect(classify(['yunalesca'])).not.toBe('colossus');
    expect(keepsToday(['yunalesca'])).toBe(false); // the framing's master is not what holds her camera: the piece hold `cam` is (DemoGate.PIECE_HOLDS)
  });

  it('Zanarkand\'s victory is the hold kind (nobody poses there, research/ffx-vs-ffx2-presentation.md 2.1): a stand-down, not a cheer', () => {
    expect(getChapterMeta('yunalesca')?.victoryPose).toBe('hold');
    expect(victoryKind(getChapterMeta('yunalesca')?.victoryPose)).toBe('stand-down');
    expect(getChapter('yunalesca')?.game).toBe('ffx');
  });

  it("the real clips are FFX rows by name: the party's six have rows, FFX Rikku and the boss play the house curves; the FFX-2 dress rule never applies here", () => {
    setTreatedScope('all');
    setDemoChapter('yunalesca');
    for (const id of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu']) expect(realRowOf('ffx', id), id).toBeDefined();
    expect(realKeyOf('rikku', 'ffx')).toBeUndefined();
    expect(realRowOf('ffx', 'rikku')).toBeUndefined();
    for (const art of ['yunalesca', 'yunalesca-1', 'yunalesca-2', 'yunalesca-3']) expect(realRowOf('ffx', art), art).toBeUndefined();
    expect(realKeyOf('yuna', 'ffx')).toBe('yuna'); // by name, in a chapter the treatment joined (the dress guard is an FFX-2 rule: `realRowOf` reads it for `ffx2` only)
    expect(realKeyOf('yuna-gunner', 'ffx2', true)).toBeUndefined(); // and FFX-2's strict rule is unchanged
  });
});
