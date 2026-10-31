/**
 * BATCH 3's ROWS (release 71, branch `booth-ffx2-b3`; FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first). The data the treatment needs for Chapter XIII (Trema, Cloister 100 of the Via Infinito, scene `via-infinito`),
 * from art already on disk: the HD-2D look rows, the arena grade and its cone, the rim-off foes, the dress rule for the real clips, and the numbers behind the moments hold. The follower camera, the rig its seam cuts to and the numbers behind the camera hold moved to
 * `booth-ffx2-b3-follower.test.ts` (review fix m1: this file was 422 lines). Batch 2's are `booth-ffx2-b2-rows.test.ts`, Leblanc's `booth-leblanc-rows.test.ts`. Every colour is `[ours]` (no source gives a grade); the numbers pinned here are measured off the plate (`docs/handoff/booth-ffx2-b3.md`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { setBossClean, bossCleanOn, bossCleanCard, BOSS_CLEAN_ARTS, BOSS_FEET } from '../../src/engine/look/pro/BossClean.ts';
import { setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, applyGrade, recipeFor } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { NEUTRAL_RECIPE, PRO_ARENA, proColour, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { rimSkipOf, tagRimFigure, TREATED_RIM_FOES } from '../../src/engine/look/pro/RimFigures.ts';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { POSE_REGISTRATION_FFX2 } from '../../src/data/art/poseRegistrationFfx2.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { TREMA_SCENE_KEY } from '../../src/data/chapter-trema-ship.ts';
import { CLOISTER_100_SLOTS, CLOISTER_BACKDROP, CLOISTER_IDS } from '../../src/scenes/cloister-100.ts';
import { CLOISTER_WIDE_RIGS } from '../../src/scenes/cloister-100-rigs.ts';
import { BEVELLE_UNDERGROUND_BACKDROP, BEVELLE_UNDERGROUND_RIGS, BEVELLE_UNDERGROUND_SLOTS } from '../../src/scenes/bevelle-underground.ts';
import { GIANT_ROWS } from '../../src/engine/fx/mix/giants.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setBossClean(null);
});

const ID = 'ffx2-trema';
const ROOM = 'via-infinito';
/** What the plate says (offline read of `public/art/backdrops/via-infinito.png`, u from the left, v from the top; `docs/handoff/booth-ffx2-b3.md` section 3): the skylight glyph's brightest 2 percent, the banners (left and right), the medallion. */
const SKYLIGHT = { u: 0.503, v: 0.064 };
const lum = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;

/** The neutral frame the arena grade works on (`LookGrades.lutBytes`: the engine's NEUTRAL recipe, then the room's colour transform), for one plate colour. */
function arena(room: string, c: [number, number, number]): [number, number, number] {
  const r = recipeFor('cinematic', 'ffx2', room, { key: 0xbcd2ca, sky: 0x203a49 }, 'bold', { ...NEUTRAL_RECIPE });
  return proColour(applyGrade(c, r), proRoom(room)!.colour);
}

// ------------------------------------------------------------------------------------------------ the pinhole, the way the rows of the booth pair were calibrated

const norm = (a: number[]): number[] => a.map((x) => x / Math.hypot(...a));
const cross = (a: number[], b: number[]): number[] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
/** A world point in a rig's frame, 0..1 from the bottom-left (the cone's own convention). */
function project(cam: number[], look: number[], fov: number, aspect: number, p: number[]): { x: number; y: number } {
  const f = norm(look.map((v, i) => v - cam[i]!));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = p.map((v, i) => v - cam[i]!);
  const z = dot(d, f);
  const t = Math.tan((fov * Math.PI) / 360);
  return { x: (dot(d, r) / z / t / aspect + 1) / 2, y: (dot(d, u) / z / t + 1) / 2 };
}
/** A painted point (u from the left, v from the top) on a backdrop plane of the 2688 x 1536 plates, in world space. */
const paintToWorld = (b: { width: number; distance: number; centreY: number }, pu: number, pv: number): number[] => [(pu - 0.5) * b.width, b.centreY + (0.5 - pv) * (b.width / (2688 / 1536)), b.distance];
/** The party's feet-and-knee middle in the frame (0 bottom .. 1 top), 16:9. */
function middle(cam: number[], look: number[], fov: number, slots: ReadonlyArray<readonly number[]>): number {
  const feet = slots.reduce((s, p) => s + project(cam, look, fov, 16 / 9, [p[0]!, 0, p[1]!]).y, 0) / slots.length;
  const knee = slots.reduce((s, p) => s + project(cam, look, fov, 16 / 9, [p[0]!, 0.5, p[1]!]).y, 0) / slots.length;
  return (feet + knee) / 2;
}
const asRig = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): { cam: number[]; look: number[]; fov: number } => ({ cam: [...(r.position as readonly number[])], look: [...(r.lookAt as readonly number[])], fov: r.fov ?? 32 });

describe('the chapter stands on the room the rows are keyed by, and that room is Chapter IV\'s frame', () => {
  it('Chapter XIII is on `via-infinito` (the look is keyed by scene key), FFX-2', () => {
    expect(getChapter(ID)!.sceneKey).toBe(ROOM);
    expect(TREMA_SCENE_KEY).toBe(ROOM);
    expect(getChapter(ID)!.game).toBe('ffx2');
  });

  it("the Cloister's plane, idle rig and party slots ARE Chapter IV's (the plate is the Bevelle plate repainted), so the booth rows' geometry carries over", () => {
    expect(CLOISTER_BACKDROP).toEqual(BEVELLE_UNDERGROUND_BACKDROP);
    expect(CLOISTER_WIDE_RIGS['idle']).toEqual(BEVELLE_UNDERGROUND_RIGS['idle']);
    expect(CLOISTER_100_SLOTS.party.map((s) => [s[0], s[2]])).toEqual(BEVELLE_UNDERGROUND_SLOTS.party.map((s) => [s[0], s[2]]));
  });
});

describe("the HD-2D look and the room's rows", () => {
  it('the chapter has the bold hd2d row, played only while the treatment reaches it (`?treated=pack` is release 68)', () => {
    expect(CHAPTER_LOOKS[ID]).toEqual({ name: 'hd2d', strength: 'bold' });
    setTreatedScope('pack');
    expect(chapterLook(ID)).toBeNull();
    setTreatedScope('all');
    expect(chapterLook(ID)).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it("the authored light is the painting's own skylight (the plate's one cyan-white star at the top of the hall), in both looks, not the lit banner `findLight` would take (u 0.133, v 0.597)", () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const l = ROOM_LOOKS[look][ROOM]?.light;
      expect(l, look).toBeDefined();
      expect(l!.u, look).toBeCloseTo(SKYLIGHT.u, 2);
      expect(l!.v, look).toBeCloseTo(SKYLIGHT.v, 2);
      expect(l!.color[1], look).toBeGreaterThan(l!.color[0] + 0.1); // cyan-white: green and blue over red
      expect(l!.color[2], look).toBeGreaterThanOrEqual(l!.color[1]);
    }
  });

  it("the sharp band is Chapter IV's 0.40 at the idle rig (the same middle, 0.241) and 0.35 under Paragon's giants camera (the middle drops to 0.172, by the booth rule of 0.727 of a band per middle); the one row, 0.38, sits between", () => {
    const idle = asRig(CLOISTER_WIDE_RIGS['idle']!);
    const bevelle = asRig(BEVELLE_UNDERGROUND_RIGS['idle']!);
    const slots = CLOISTER_100_SLOTS.party.map((s) => [s[0], s[2]]);
    const mid = middle(idle.cam, idle.look, idle.fov, slots);
    expect(mid).toBeCloseTo(middle(bevelle.cam, bevelle.look, bevelle.fov, slots), 6);
    expect(mid).toBeCloseTo(0.241, 2);
    const g = GIANT_ROWS.find((r) => r.id === 'paragon')!;
    const view = g.views[0]!;
    const giantMid = middle([...view.pos], [...view.look], view.fov, slots);
    expect(giantMid).toBeCloseTo(0.172, 2);
    const atGiants = 0.4 - 0.727 * (mid - giantMid);
    expect(atGiants).toBeCloseTo(0.35, 2);
    expect(ROOM_LOOKS.hd2d[ROOM]!.focus).toBe(0.38);
    expect(boldRoom('hd2d', ROOM)!.focus).toBe(0.38);
    expect(0.38).toBeGreaterThan(atGiants);
    expect(0.38).toBeLessThan(0.4);
  });

  it('the bold grade has both looks, with the room\'s own hues pulled (the steel blue, hue 205, and the banners\' gold, hue 38) and a blue haze', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const r = boldRoom(look, ROOM);
      expect(r, look).toBeDefined();
      expect(r!.recipe?.hues?.map((h) => h.hue), look).toEqual([205, 38]);
    }
    const fog = ROOM_LOOKS.cinematic[ROOM]!.fog!;
    expect(fog[2]).toBeGreaterThan(fog[0]! + 0.2); // steel blue
    expect(boldRoom('cinematic', ROOM)!.fog).toEqual(fog);
    expect(boldRoom('hd2d', ROOM)!.shadow![2]).toBeGreaterThan(boldRoom('hd2d', ROOM)!.shadow![0]! + 0.25); // blue shadows, not Chapter IV's violet
  });

  it('NO EMBERS: the source says flags and pyreflies, no fire, and the canon table marks the hall as attested pyreflies (the stage adds its own lens band)', () => {
    const b = ROOM_BOLD[ROOM]!;
    expect(b.embers).toEqual([]);
    expect(roomBold(ROOM)).toBe(b);
    expect(b.gloss).toBeGreaterThan(0.5); // the polished floor, a little under Bevelle's 0.8
    expect(b.gloss).toBeLessThan(roomBold('bevelle-underground').gloss);
    expect(roomBold('bevelle-underground').embers.length).toBeGreaterThan(0); // Chapter IV's four lamps keep theirs: that is its source, not this room's
  });
});

describe('the pro arena', () => {
  it('has a row with the one cone of light anchored to the painted skylight (it follows the camera: a painted anchor, not a fixed frame point)', () => {
    const r = proRoom(ROOM);
    expect(r).toBe(PRO_ARENA[ROOM]);
    expect(r!.cone).toBeDefined();
    expect(r!.cone!.follow).toBe(false);
    expect(r!.cone!.paint!.u).toBeCloseTo(SKYLIGHT.u, 2);
    expect(r!.cone!.paint!.v).toBeCloseTo(SKYLIGHT.v, 2);
    expect(r!.vignette.amount).toBeGreaterThan(0.4);
    expect(r!.grain).toBeLessThan(0.03);
  });

  it("the cone starts where Chapter IV's does by the same rule: the skylight's frame u from the idle rig less the amount by which Chapter IV's shipped start sits left of its own pinhole read, at the top edge (the light is above the frame)", () => {
    const idle = asRig(CLOISTER_WIDE_RIGS['idle']!);
    const here = project(idle.cam, idle.look, idle.fov, 16 / 9, paintToWorld(CLOISTER_BACKDROP, SKYLIGHT.u, SKYLIGHT.v));
    const bev = PRO_ARENA['bevelle-underground']!.cone!;
    const bevelle = project(idle.cam, idle.look, idle.fov, 16 / 9, paintToWorld(BEVELLE_UNDERGROUND_BACKDROP, bev.paint!.u, bev.paint!.v));
    expect(here.y).toBeGreaterThan(1); // above the frame's top edge at the idle rig
    expect(bevelle.y).toBeGreaterThan(1);
    expect(bev.v).toBe(0.98);
    const cone = PRO_ARENA[ROOM]!.cone!;
    expect(cone.v).toBe(bev.v);
    expect(cone.u).toBeCloseTo(here.x - (bevelle.x - bev.u), 2);
    expect(cone.strength).toBeGreaterThan(0.4); // a beam like Chapter IV's skylight, not the Den's pooled glow
    expect(cone.strength).toBeLessThanOrEqual(bev.strength);
  });

  it("the skylight stays the brightest thing and the rest falls: its cyan-white keeps over 0.75 luminance, the steel-blue walls fall under a third of their plate luminance, the banners' gold stays warm and dims, the floor glow stays blue", () => {
    expect(lum(arena(ROOM, [0.8, 1.0, 1.0]))).toBeGreaterThan(0.75);
    const wall = arena(ROOM, [0.12, 0.2, 0.25]);
    expect(lum(wall)).toBeLessThan(0.33 * lum([0.12, 0.2, 0.25]) + 0.02);
    expect(wall[2]).toBeGreaterThan(wall[0]); // blue-black, not grey
    const banner = arena(ROOM, [0.785, 0.612, 0.389]); // the banners' mean colour on the plate
    expect(banner[0]).toBeGreaterThan(banner[2]); // still warm
    expect(lum(banner)).toBeLessThan(lum([0.785, 0.612, 0.389]));
    const glow = arena(ROOM, [0.684, 0.857, 0.967]); // the lit floor's bright part
    expect(glow[2]).toBeGreaterThan(glow[0] + 0.15);
  });

  it("the arena's key light is the colour of the room's own painted skylight (the o2 rule of batch 2): within 0.15 of the HD-2D row's light on every channel, cyan-white", () => {
    const painted = ROOM_LOOKS.hd2d[ROOM]!.light!.color;
    const key = proRoom(ROOM)!.lightColor;
    for (let i = 0; i < 3; i++) expect(Math.abs(key[i]! - painted[i]!), `channel ${i}`).toBeLessThanOrEqual(0.15);
    expect(key[2]).toBeGreaterThanOrEqual(key[1]);
    expect(key[1]).toBeGreaterThan(key[0]);
  });
});

describe('the foes draw no screen-space rim in their own chapter, and nowhere else', () => {
  it('under all, in Chapter XIII: Paragon and Trema are tagged and skip the rim; the booth bosses\' re-cut rows stay the two (no footprint row for either: Trema stands on his anchor, Paragon\'s row is five hand-set numbers and held)', () => {
    setBossClean('clean');
    setTreatedScope('all');
    setDemoChapter(ID);
    for (const foe of Object.values(CLOISTER_IDS)) {
      expect(TREATED_RIM_FOES[foe], foe).toBe('ffx2');
      const o = new Object3D();
      tagRimFigure(o, foe, 'enemy');
      expect(rimSkipOf(o), foe).toBe(true);
    }
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    expect(Object.keys(BOSS_FEET).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    for (const art of ['paragon', 'trema']) {
      expect(bossCleanOn(art), art).toBe(false);
      expect(bossCleanCard(art), art).toBe(false);
    }
  });

  it('under pack (release 68), in any other chapter and for the hidden Valefor (which plays no Paragon) the same ids keep their rim', () => {
    setBossClean('clean');
    for (const [scope, chapter] of [['pack', ID], ['all', 'ffx2-ixion-djose'], ['all', 'ffx2-valefor-besaid'], ['all', 'exp-leblanc']] as const) {
      setTreatedScope(scope);
      setDemoChapter(chapter);
      for (const foe of ['paragon', 'trema']) {
        const o = new Object3D();
        tagRimFigure(o, foe, 'enemy');
        expect(rimSkipOf(o), `${scope} ${chapter} ${foe}`).toBe(false);
      }
    }
  });
});

describe('the real clips follow the dress in this chapter, and the three dresses the chapter starts in have none (the dress guard of `booth-leblanc`, FFX-2 only)', () => {
  it('Yuna Dark Knight, Rikku Alchemist and Paine Dark Knight have no decoded row, so they play the house curves; the rows that exist stay on their own dresses; Chapter IV is untouched', () => {
    setTreatedScope('all');
    setDemoChapter(ID);
    expect(realRowOf('ffx2', 'yuna-dark-knight')).toBeUndefined();
    expect(realRowOf('ffx2', 'rikku-alchemist')).toBeUndefined();
    expect(realRowOf('ffx2', 'paine-dark-knight')).toBeUndefined();
    expect(realRowOf('ffx2', 'yuna-white-mage')).toBe(REAL_MOTION.ffx2['yuna']); // other dresses' rows are never taken for these three, and still reach theirs
    expect(realRowOf('ffx2', 'rikku-dark-knight')).toBe(REAL_MOTION.ffx2['rikku']);
    expect(realRowOf('ffx2', 'paine-warrior')).toBe(REAL_MOTION.ffx2['paine']);
    setDemoChapter('ffx2-bahamut');
    expect(realRowOf('ffx2', 'paine-dark-knight'), 'the booth pair keeps the prefix rule, byte for byte').toBe(REAL_MOTION.ffx2['paine']);
  });
});

describe("the moments hold's numbers are the registration table's", () => {
  const ko = (subject: string): number => POSE_REGISTRATION_FFX2[subject]!['ko']!.lengthRatio!;

  it("the three dresses' KO bodies are 0.900, 0.896 and 0.918 of their idle's height, every one longer than Chapter IV Rikku Dark Knight's 0.859 (whose cut the harness read at 0.48, 0.02 under its cap) and shorter than Leblanc's Rikku Thief's 1.197 (0.62, over it)", () => {
    expect(ko('yuna-dark-knight')).toBeCloseTo(0.9, 3);
    expect(ko('rikku-alchemist')).toBeCloseTo(0.896, 3);
    expect(ko('paine-dark-knight')).toBeCloseTo(0.918, 3);
    expect(ko('rikku-dark-knight')).toBeCloseTo(0.859, 3);
    expect(ko('rikku-thief')).toBeCloseTo(1.197, 3);
    expect(ko('yuna-gunner')).toBeCloseTo(0.588, 3);
    for (const s of ['yuna-dark-knight', 'rikku-alchemist', 'paine-dark-knight']) {
      expect(ko(s), s).toBeGreaterThan(ko('rikku-dark-knight'));
      expect(ko(s), s).toBeLessThan(ko('rikku-thief'));
    }
    const why = treatedHold(ID, 'moments')!;
    for (const n of ['0.900', '0.896', '0.918', '0.859', '1.197', '0.588']) expect(why, n).toContain(n);
  });

  it("the length does NOT predict the harness reading (review m5): the shortest KO body (Yuna Gunner, 0.588) reads over the cap while a longer one (Rikku Dark Knight, 0.859) reads under it, so the reason claims no reading, not an estimate", () => {
    const readings: Array<[string, number]> = [['rikku-dark-knight', 0.48], ['yuna-gunner', 0.51], ['rikku-thief', 0.62]]; // release 69's jobs: the hurt-to-ko jerk over the drawn height
    const byLength = [...readings].sort((a, b) => ko(a[0]) - ko(b[0])).map((r) => r[0]);
    const byReading = [...readings].sort((a, b) => a[1] - b[1]).map((r) => r[0]);
    expect(byLength).not.toEqual(byReading);
    expect(byLength[0]).toBe('yuna-gunner');
    const why = treatedHold(ID, 'moments')!;
    expect(why).toMatch(/does not predict the reading/);
    expect(why).toMatch(/NO READING/);
    expect(why).not.toMatch(/longer than Chapter IV/); // the first wording read the length as if it predicted the reading
  });

  it("the cap has two regimes in this chapter and the reason names both: the 120 px floor in link 1 (the girls 0.178 of the frame height, 160 px at 900 high: half is 80 px, so the floor binds and a cut is excused up to 0.75 of the drawn height) and half the drawn height in link 2 (about 0.31 of the frame, 280 px: 140 px); the lift reads BOTH links (review m5)", () => {
    const girlsLink1 = 0.178 * 900;
    expect(girlsLink1).toBeCloseTo(160, 0);
    expect(Math.max(120, 0.5 * girlsLink1)).toBe(120); // the floor binds
    expect(120 / girlsLink1).toBeCloseTo(0.75, 2);
    const girlsLink2 = 0.31 * 900;
    expect(Math.max(120, 0.5 * girlsLink2)).toBeCloseTo(139.5, 0); // half the drawn height binds
    const why = treatedHold(ID, 'moments')!;
    expect(why).toMatch(/two regimes/);
    expect(why).toMatch(/120 px/);
    expect(why).toMatch(/0\.75 of the drawn height/);
    expect(why).toMatch(/half the drawn height binds, about 140 px/);
    expect(why).toMatch(/BOTH links/);
    expect(why).toMatch(/Lifts when/);
  });
});
