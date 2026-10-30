/**
 * LEBLANC'S ROWS (release 69, branch `booth-leblanc`; Chapter VI, `ffx2-leblanc`, FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first). The data the treatment needs for her room and
 * her fight, from art already on disk (no new art): the HD-2D look rows, the arena grade and its cone of light, and the follower camera retargeted to her plate (the real clips matched by dress are `booth-leblanc-dress.test.ts`).
 * The hidden experiment `exp-leblanc` plays the same fight on its own paintings and is not touched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proColour, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { PRO_AUTO_CAMERA } from '../../src/data/procam/proShots.ts';
import { AUTO_STAGES, autoCameraFor, retargetAutoCamera } from '../../src/engine/procam/ProAutoStage.ts';
import { LEBLANC_ENEMY_SPOTS, LEBLANC_FIGURE_HEIGHTS, LEBLANC_PARTY_HEIGHT } from '../../src/scenes/leblanc-staging.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
});

const ROOM = 'leblanc-last-room';
// the heart-shaped door inlay on the plate (offline read of `public/art/backdrops/leblanc-last-room.png`: the magenta pixels' centroid, u from the left, v from the top)
const HEART = { u: 0.5, v: 0.264 };

describe("the HD-2D look and her room's rows", () => {
  it('the chapter has the bold hd2d row, played only while the treatment reaches it (`?treated=pack` is release 68)', () => {
    expect(CHAPTER_LOOKS['ffx2-leblanc']).toEqual({ name: 'hd2d', strength: 'bold' });
    setTreatedScope('pack');
    expect(chapterLook('ffx2-leblanc')).toBeNull();
    setTreatedScope('all');
    expect(chapterLook('ffx2-leblanc')).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it('the authored light is the heart, in both looks the room is graded in (the plate\'s brightest blob is the pale floor patch, which `findLight` would take)', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const l = ROOM_LOOKS[look][ROOM]?.light;
      expect(l, look).toBeDefined();
      expect(l!.u, look).toBeCloseTo(HEART.u, 2);
      expect(l!.v, look).toBeCloseTo(HEART.v, 2);
      expect(l!.color[0], look).toBeGreaterThan(l!.color[1]); // the heart's rose: red over green, blue high
      expect(l!.color[2], look).toBeGreaterThan(l!.color[1]);
    }
  });

  it('the sharp band is the booth\'s moved down by the lower camera: 0.39 against Chapter IV\'s 0.40', () => {
    expect(ROOM_LOOKS.hd2d[ROOM]?.focus).toBe(0.39);
    expect(boldRoom('hd2d', ROOM)?.focus).toBe(0.39);
    expect(boldRoom('hd2d', 'bevelle-underground')?.focus).toBe(0.4);
  });

  it('the bold grade has both looks, with the heart\'s magenta (hue 313) and the door\'s cyan (190) pulled and the fog a violet-rose', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const r = boldRoom(look, ROOM);
      expect(r, look).toBeDefined();
      const hues = (r!.recipe?.hues ?? []).map((h) => h.hue);
      expect(hues, look).toEqual([313, 190]);
    }
    const fog = boldRoom('cinematic', ROOM)!.fog!;
    expect(fog[2]).toBeGreaterThan(fog[1]);
  });

  it('the bold facts: no embers (the source: "no particles" in this room), a modest gloss, the rose of the heart for the rim; an unlisted room still gets none', () => {
    const b = ROOM_BOLD[ROOM]!;
    expect(b.embers).toEqual([]); // `research/ffx-vs-ffx2-presentation.md` section 8.1: "indoor, pink, heart-motifed, no particles ... resist atmosphere"; the review's m1 (the booth pair's Bevelle carries embers, this room's source says none)
    // the three porthole points the embers would use if Bailey says yes (the one-line comment in LookBoldConfig) are still on the wall lamps, inside the frame
    for (const [u, v] of [[0.039, 0.404], [0.066, 0.423], [0.943, 0.434]] as const) {
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThan(0.3);
      expect(v).toBeLessThan(0.5);
    }
    expect(b.gloss).toBeGreaterThan(0);
    expect(b.gloss).toBeLessThan(0.5);
    expect(b.rim![0]).toBeGreaterThan(b.rim![1]);
    expect(roomBold('leblanc-last-room')).toBe(b);
    expect(roomBold('no-such-room').embers).toEqual([]);
  });
});

describe('the pro arena', () => {
  it('has a row for her room, the booth grammar (one fixed cone of light on the painted heart, a haze, a vignette, grain) in her colours', () => {
    const r = proRoom(ROOM);
    expect(r).toBeDefined();
    expect(r).toBe(PRO_ARENA[ROOM]);
    expect(r!.cone).toBeDefined();
    expect(r!.cone!.follow).toBe(false);
    expect(r!.cone!.paint!.u).toBeCloseTo(HEART.u, 2);
    expect(r!.cone!.paint!.v).toBeCloseTo(HEART.v, 2);
    expect(r!.cone!.colour[0]).toBeGreaterThan(r!.cone!.colour[1]); // rose, not Chapter IV's cyan
    expect(r!.lightColor[0]).toBeGreaterThan(proRoom('bevelle-underground')!.lightColor[0]);
    expect(r!.vignette.amount).toBeGreaterThan(0.4);
    expect(r!.grain).toBeLessThan(0.03);
  });

  it('grades the heart still pink, the door still cyan, and the room\'s dark darker than the plate; the lit floor stays warm', () => {
    const k = proRoom(ROOM)!.colour;
    const heart = proColour([0.986, 0.449, 0.867], k);
    expect(heart[0]).toBeGreaterThan(heart[1] + 0.2);
    expect(heart[2]).toBeGreaterThan(heart[1] + 0.1);
    const door = proColour([0.15, 0.75, 0.9], k);
    expect(door[1]).toBeGreaterThan(door[0] + 0.2);
    expect(door[2]).toBeGreaterThan(door[0] + 0.2);
    const dark = proColour([0.06, 0.09, 0.16], k);
    expect(dark[0] + dark[1] + dark[2]).toBeLessThan(0.06 + 0.09 + 0.16 + 0.05);
    const floor = proColour([0.9, 0.7, 0.55], k);
    expect(floor[0]).toBeGreaterThan(floor[2]);
  });
});

describe('the follower camera on her plate', () => {
  const BEVELLE = { focus: PRO_AUTO_CAMERA.focus, homeAzimuthDeg: PRO_AUTO_CAMERA.homeAzimuthDeg };

  it("retargeting Chapter IV's own stage reproduces the lane's four candidates (the rule is the lane's, to its three decimals)", () => {
    const again = retargetAutoCamera(PRO_AUTO_CAMERA, BEVELLE);
    expect(again.cands).toHaveLength(4);
    again.cands.forEach((c, i) => {
      for (let k = 0; k < 3; k++) expect(c.eye[k]!, `cand ${i} axis ${k}`).toBeCloseTo(PRO_AUTO_CAMERA.cands[i]!.eye[k]!, 1);
      expect(c.azDeg).toBe(PRO_AUTO_CAMERA.cands[i]!.azDeg);
      expect(c.elDeg).toBe(PRO_AUTO_CAMERA.cands[i]!.elDeg);
      expect(c.fitM).toBe(PRO_AUTO_CAMERA.cands[i]!.fitM);
    });
    expect(again.follower).toEqual(PRO_AUTO_CAMERA.follower);
    expect(again.lensDeg).toBe(PRO_AUTO_CAMERA.lensDeg);
  });

  it("Chapter IV and every chapter without a row play the generated Bevelle camera, the very object (the booth pair's camera is untouched)", () => {
    expect(autoCameraFor('ffx2-bahamut')).toBe(PRO_AUTO_CAMERA);
    expect(autoCameraFor('seymour-flux')).toBe(PRO_AUTO_CAMERA);
    expect(autoCameraFor(undefined)).toBe(PRO_AUTO_CAMERA);
    expect(autoCameraFor('toString')).toBe(PRO_AUTO_CAMERA);
    expect(Object.keys(AUTO_STAGES)).toEqual(['ffx2-leblanc']);
  });

  it("Leblanc's focus is the Act III group's centroid at 0.9 of each height, and the home azimuth is her idle rig's eye seen from it", () => {
    const party: Array<[number, number]> = [[-2.05, 1.45], [-1.3, 0.1], [-0.9, -1.5]]; // `leblanc-last-room.ts` PARTY_SLOTS
    const foes: Array<{ id: string; spot: readonly number[] }> = ['ormi', 'logos', 'leblanc'].map((id) => ({ id, spot: LEBLANC_ENEMY_SPOTS[id]! }));
    const pts: Array<[number, number, number]> = [
      ...party.map(([x, z]): [number, number, number] => [x, 0.9 * LEBLANC_PARTY_HEIGHT, z]),
      ...foes.map((f): [number, number, number] => [f.spot[0]!, 0.9 * LEBLANC_FIGURE_HEIGHTS[f.id]!, f.spot[2]!]),
    ];
    const mean = (k: 0 | 1 | 2): number => pts.reduce((s, p) => s + p[k], 0) / pts.length;
    const st = AUTO_STAGES['ffx2-leblanc']!;
    expect(st.focus[0]).toBeCloseTo(mean(0), 1);
    expect(st.focus[1]).toBeCloseTo(mean(1), 1);
    expect(st.focus[2]).toBeCloseTo(mean(2), 1);
    const eye = [0, 2.8, 9.4]; // `LEBLANC_LAST_ROOM_RIGS.idle`
    expect(st.homeAzimuthDeg).toBeCloseTo((Math.atan2(eye[0]! - st.focus[0], eye[2]! - st.focus[2]) * 180) / Math.PI, 1);
  });

  it('her four candidates keep the angles of the lane\'s, about her own front: each eye is the focus plus fitM at (home + azDeg, elDeg), inside the 35 degree corridor', () => {
    const cam = autoCameraFor('ffx2-leblanc');
    const st = AUTO_STAGES['ffx2-leblanc']!;
    expect(cam).not.toBe(PRO_AUTO_CAMERA);
    expect(cam.focus).toEqual(st.focus);
    expect(cam.cands).toHaveLength(4);
    cam.cands.forEach((c, i) => {
      const d = [c.eye[0] - st.focus[0], c.eye[1] - st.focus[1], c.eye[2] - st.focus[2]];
      expect(Math.hypot(d[0]!, d[1]!, d[2]!), `cand ${i} distance`).toBeCloseTo(c.fitM, 1);
      const el = (Math.asin(d[1]! / c.fitM) * 180) / Math.PI;
      expect(el, `cand ${i} elevation`).toBeCloseTo(c.elDeg, 1);
      const az = (Math.atan2(d[0]!, d[2]!) * 180) / Math.PI;
      expect(az - st.homeAzimuthDeg, `cand ${i} azimuth from home`).toBeCloseTo(c.azDeg, 1);
      expect(Math.abs(az), `cand ${i} stays inside the corridor of the plate's front`).toBeLessThanOrEqual(35);
      expect(c.eye[1], `cand ${i} above the floor`).toBeGreaterThan(1);
    });
    // the ranking is the lane's
    expect(cam.cands.map((c) => [c.azDeg, c.elDeg])).toEqual(PRO_AUTO_CAMERA.cands.map((c) => [c.azDeg, c.elDeg]));
  });
});
