/**
 * BATCH 3's ROWS (release 71, branch `booth-ffx2-b3`; FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first). The data the treatment needs for Chapter XIII (Trema, Cloister 100 of the Via Infinito, scene `via-infinito`),
 * from art already on disk: the HD-2D look rows, the arena grade and its cone, the follower camera and the rig its seam cuts to, the rim-off foes, the dress rule for the real clips, and the numbers behind the two holds. Batch 2's are
 * `booth-ffx2-b2-rows.test.ts`, Leblanc's `booth-leblanc-rows.test.ts`. Every colour is `[ours]` (no source gives a grade); the numbers pinned here are measured off the plate (`docs/handoff/booth-ffx2-b3.md`).
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
import { PRO_AUTO_CAMERA } from '../../src/data/procam/proShots.ts';
import { AUTO_STAGES, SCRIPTED_RIGS, autoCameraFor, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { ProFollower } from '../../src/engine/procam/ProFollower.ts';
import { fitDolly, ndcRect, type Box } from '../../src/engine/procam/ProFit.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { POSE_REGISTRATION_FFX2 } from '../../src/data/art/poseRegistrationFfx2.ts';
import { ffx2GiantHeight } from '../../src/data/ffx2/fiend-stature.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { TREMA_SCENE_KEY } from '../../src/data/chapter-trema-ship.ts';
import { CLOISTER_100_RIGS, CLOISTER_100_SLOTS, CLOISTER_ACTOR_HEIGHTS, CLOISTER_BACKDROP, CLOISTER_BOSS_SPOT, CLOISTER_IDS } from '../../src/scenes/cloister-100.ts';
import { CLOISTER_LINK_RIG, CLOISTER_WIDE_RIGS } from '../../src/scenes/cloister-100-rigs.ts';
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
type V3 = [number, number, number];

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

describe('the follower camera on the Cloister', () => {
  const heights = CLOISTER_ACTOR_HEIGHTS;
  const centroid = (members: Array<{ x: number; y: number; z: number; h: number }>): number[] => {
    const f = [0, 0, 0];
    for (const m of members) {
      f[0]! += m.x;
      f[1]! += m.y + 0.9 * m.h;
      f[2]! += m.z;
    }
    return f.map((v) => v / members.length);
  };
  const girls = CLOISTER_100_SLOTS.party.map((s) => ({ x: s[0], y: 0, z: s[2], h: heights.party }));

  it("the focus is link 2's group (the girls and Trema on the boss spot at his own height), the home azimuth is the idle eye seen from it, and it is Chapter IV's focus lowered by its taller dragon", () => {
    const f = centroid([...girls, { x: CLOISTER_BOSS_SPOT[0], y: 0, z: CLOISTER_BOSS_SPOT[2], h: heights.trema }]);
    const st = AUTO_STAGES[ID]!;
    for (let k = 0; k < 3; k++) expect(st.focus[k]!, `axis ${k}`).toBeCloseTo(f[k]!, 2);
    const eye = asRig(CLOISTER_WIDE_RIGS['idle']!).cam;
    expect(st.homeAzimuthDeg).toBeCloseTo((Math.atan2(eye[0]! - st.focus[0], eye[2]! - st.focus[2]) * 180) / Math.PI, 1);
    expect(st.focus[0]).toBeCloseTo(PRO_AUTO_CAMERA.focus[0], 2); // the same slots and the same boss spot as Chapter IV: x and z agree
    expect(st.focus[2]).toBeCloseTo(PRO_AUTO_CAMERA.focus[2], 2);
    expect(st.homeAzimuthDeg).toBeCloseTo(PRO_AUTO_CAMERA.homeAzimuthDeg, 1);
    expect(PRO_AUTO_CAMERA.focus[1] - st.focus[1]).toBeCloseTo(0.386, 2);
  });

  it('the four candidates keep the lane\'s angles about the room\'s own front, inside the 35 degree corridor, above the floor; Chapter IV keeps the generated camera, the very object', () => {
    const cam = autoCameraFor(ID);
    const st = AUTO_STAGES[ID]!;
    expect(cam).not.toBe(PRO_AUTO_CAMERA);
    expect(cam.cands).toHaveLength(4);
    cam.cands.forEach((c, i) => {
      const d = [c.eye[0] - st.focus[0], c.eye[1] - st.focus[1], c.eye[2] - st.focus[2]];
      expect(Math.hypot(d[0]!, d[1]!, d[2]!), `cand ${i} distance`).toBeCloseTo(c.fitM, 1);
      const az = (Math.atan2(d[0]!, d[2]!) * 180) / Math.PI;
      expect(az - st.homeAzimuthDeg, `cand ${i} azimuth from home`).toBeCloseTo(c.azDeg, 1);
      expect(Math.abs(az), `cand ${i} corridor`).toBeLessThanOrEqual(35);
      expect(c.eye[1], `cand ${i} above the floor`).toBeGreaterThan(1);
    });
    expect(cam.cands.map((c) => [c.azDeg, c.elDeg])).toEqual(PRO_AUTO_CAMERA.cands.map((c) => [c.azDeg, c.elDeg]));
    expect(autoCameraFor('ffx2-bahamut')).toBe(PRO_AUTO_CAMERA);
  });

  it("the kill link's rig is the one the follower stands down on: the scene's name, the story's name and the table agree (`trema-link`), and the follower is the rig's own there and the follower's own anywhere else", () => {
    expect(SCRIPTED_RIGS[ID]).toEqual([CLOISTER_LINK_RIG]);
    expect(CLOISTER_LINK_RIG).toBe('trema-link');
    expect(scriptedShot(ID, CLOISTER_LINK_RIG)).toBe(true);
    for (const rig of Object.keys(CLOISTER_100_RIGS)) if (rig !== CLOISTER_LINK_RIG) expect(scriptedShot(ID, rig), rig).toBe(false);
    expect(scriptedShot('ffx2-bahamut', CLOISTER_LINK_RIG)).toBe(false);
  });

  /**
   * The offline read of defect class 3, with the REAL follower and fit, in both links, 52 s each, all four candidates (`docs/handoff/booth-ffx2-b3.md` section 4): why the camera is held although no girl is ever cropped. A figure's rectangle is the engine's `contentQuad` (the pose's tight alpha box,
   * read off `computePoseScale` of every pose): the idle's, the widest pose's, or the tallest pose's (`tall`: the cast painting of Paragon is 12 percent taller than his idle's, Yuna's `ready` 15 percent).
   */
  describe("why the follower is held: no girl is ever cropped, but under Paragon's approved giants frame it undoes the frame and crops his cast painting", () => {
    const SAFE = { x: 0.84, y: 0.9 };
    const partyWidths = [1.389, 1.251, 1.557]; // the widest pose of Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight (idle: 0.77, 0.76, 0.85)
    const partyTall = [1.155, 1.016, 1.075]; // the tallest non-victory pose over the idle's box
    const paragonW = 1.408; // per unit of height (4.366 wide at 3.1)
    const paragonTall = 1.119; // his cast painting over his idle's
    const tremaW = 0.72; // per unit of height (1.271 wide at 1.784, his widest, the attack)
    const run = (base: Pose, bossH: number, bossW: number, bossTall: number, aspect: number, tall: boolean) => {
      const spot = CLOISTER_BOSS_SPOT;
      const boxes: Box[] = [
        ...girls.map((g, i) => ({ x0: g.x - partyWidths[i]! / 2, x1: g.x + partyWidths[i]! / 2, y0: 0, y1: g.h * (tall ? partyTall[i]! : 1), z0: g.z - 0.1, z1: g.z + 0.1 })),
        { x0: spot[0] - bossW / 2, x1: spot[0] + bossW / 2, y0: 0, y1: bossH * (tall ? bossTall : 1), z0: spot[2] - 0.1, z1: spot[2] + 0.1 },
      ];
      const members = [...girls.map((g, i) => ({ id: `g${i}`, feet: [g.x, 0, g.z] as V3, height: g.h })), { id: 'boss', feet: [spot[0], 0, spot[2]] as V3, height: bossH }];
      let kSat = 0;
      let counting = false;
      const fol = new ProFollower({ members: () => members, held: () => false, still: () => false, fitK: (p) => { const k = fitDolly(p, aspect, boxes, SAFE).k; if (counting && k >= 1.79) kSat++; return k; } }, autoCameraFor(ID));
      const yh = (p: Pose): number => {
        const r = ndcRect(boxes[0]!, p, aspect)!;
        return (r.y1 - r.y0) / 2;
      };
      const hs: number[] = [];
      let girlsOut = 0;
      let bossOut = 0;
      let bossTop = 0;
      let frames = 0;
      const cands = new Set<number>();
      for (let i = 0; i < 60 * 60; i++) {
        if (i % 60 === 30) fol.effectEnd();
        counting = i >= 60 * 8;
        const pose = fol.step(1 / 60, base);
        if (i < 60 * 8) continue;
        frames++;
        cands.add(fol.candidate);
        hs.push(yh(pose));
        boxes.forEach((b, n) => {
          const r = ndcRect(b, pose, aspect);
          const ext = r ? Math.max(Math.abs(r.x0), Math.abs(r.x1), Math.abs(r.y0), Math.abs(r.y1)) : 9;
          if (n === boxes.length - 1) {
            bossTop = Math.max(bossTop, r ? r.y1 : 9);
            if (ext > 1 + 1e-6) bossOut++;
          } else if (ext > 1 + 1e-6) girlsOut++;
        });
      }
      expect([...cands].sort(), 'all four candidates were seen').toEqual([0, 1, 2, 3]);
      hs.sort((x, y) => x - y);
      return { girlsOut, bossOut, bossTop, frames, kSat, ratioMin: hs[0]! / yh(base), ratioMedian: hs[hs.length >> 1]! / yh(base) };
    };
    const rigPose = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): Pose => ({ pos: [...(r.position as readonly number[])] as V3, look: [...(r.lookAt as readonly number[])] as V3, fov: r.fov ?? 32, roll: 0 });
    const IDLE = rigPose(CLOISTER_WIDE_RIGS['idle']!);
    const giant = GIANT_ROWS.find((r) => r.id === 'paragon')!.views[0]!;
    const GIANT: Pose = { pos: [...giant.pos] as V3, look: [...giant.look] as V3, fov: giant.fov, roll: 0 };
    const paragonGiantH = ffx2GiantHeight('paragon', 'ffx2-trema', heights.party, false)!;

    it("link 1 under the giants frame (a window up to 1.79 wide: 1600x900 and 2560x1440): no girl is cropped in any pose, but the fit sits on its 1.8 cap in 60 to 70 percent of the frames (every frame in the tallest poses) and the girls fall to 0.73 to 0.79 of the approved frame's size", () => {
      expect(paragonGiantH).toBeCloseTo(9.447, 2);
      for (const tall of [false, true]) {
        const r = run(GIANT, paragonGiantH, paragonGiantH * paragonW, paragonTall, 16 / 9, tall);
        expect(r.girlsOut, `girls outside the frame (tall ${tall})`).toBe(0);
        if (tall) expect(r.kSat / r.frames, 'the fit at its cap (tall)').toBeGreaterThan(0.95); // the tallest poses need more than the cap in every frame
        else {
          expect(r.kSat / r.frames, 'the fit at its cap').toBeGreaterThan(0.6);
          expect(r.kSat / r.frames, 'the fit at its cap').toBeLessThan(0.7);
        }
        expect(r.ratioMin, `girls (tall ${tall})`).toBeGreaterThan(0.7);
        expect(r.ratioMin, `girls (tall ${tall})`).toBeLessThan(0.8);
        expect(r.ratioMedian, `girls (tall ${tall})`).toBeGreaterThan(0.75);
      }
    });

    it("Paragon's cast painting passes the top of the frame by 0.12 of the half frame under the follower (56 px at 1600x900, 90 px at 2560x1440) where the approved frame, with no follower, has 0.04 (19 and 30 px)", () => {
      const base = ndcRect({ x0: CLOISTER_BOSS_SPOT[0] - 6, x1: CLOISTER_BOSS_SPOT[0] + 6, y0: 0, y1: paragonGiantH * paragonTall * (3.049 / 3.1), z0: CLOISTER_BOSS_SPOT[2] - 0.1, z1: CLOISTER_BOSS_SPOT[2] + 0.1 }, GIANT, 16 / 9)!;
      expect(base.y1 - 1).toBeCloseTo(0.042, 2); // the approved frame, in the cast pose
      expect((base.y1 - 1) * 450).toBeCloseTo(19, 0);
      expect((base.y1 - 1) * 720).toBeCloseTo(30, 0);
      const idle = run(GIANT, paragonGiantH, paragonGiantH * paragonW, paragonTall, 16 / 9, false);
      expect(idle.bossOut, 'in his idle painting he stays inside the frame').toBe(0);
      expect(idle.bossTop).toBeLessThan(1);
      const cast = run(GIANT, paragonGiantH, paragonGiantH * paragonW, paragonTall, 16 / 9, true);
      expect(cast.bossTop - 1, 'the cast painting under the follower').toBeGreaterThan(0.1);
      expect(cast.bossTop - 1).toBeLessThan(0.16);
      expect((cast.bossTop - 1) * 450).toBeGreaterThan(50); // px at 1600x900
      expect((cast.bossTop - 1) * 720).toBeGreaterThan(80); // px at 2560x1440
      expect(cast.bossTop - 1).toBeGreaterThan(2.8 * (base.y1 - 1)); // about three times what the approved frame already costs
      expect(cast.bossOut / cast.frames).toBeGreaterThan(0.5);
    });

    it("link 1 on today's rig (a wider window: 3440x1440) and link 2 on today's rig at both shapes read clean: no figure is cropped in any pose, the fit never reaches its cap and the girls keep 0.85 or more of the rig's own size", () => {
      for (const [name, bossH, bossW, bossTall, aspect] of [
        ['link 1, 21:9', 3.1, 3.1 * paragonW, paragonTall, 3440 / 1440],
        ['link 2, 16:9', heights.trema, heights.trema * tremaW, 1.015, 16 / 9],
        ['link 2, 21:9', heights.trema, heights.trema * tremaW, 1.015, 3440 / 1440],
      ] as const) {
        for (const tall of [false, true]) {
          const r = run(IDLE, bossH, bossW, bossTall, aspect, tall);
          expect(r.girlsOut + r.bossOut, `${name} (tall ${tall}): figures outside the frame`).toBe(0);
          expect(r.kSat, `${name}: the fit at its cap`).toBe(0);
          expect(r.ratioMin, name).toBeGreaterThan(0.85);
        }
      }
    });
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

describe('the real clips follow the dress in this chapter, and the two dresses the treatment has not met have none (the dress guard of `booth-leblanc`, FFX-2 only)', () => {
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
});
