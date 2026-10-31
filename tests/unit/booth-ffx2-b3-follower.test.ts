/**
 * THE FOLLOWER CAMERA ON THE CLOISTER (release 71, branch `booth-ffx2-b3`; FFX-2 only; Chapter XIII, `ffx2-trema`; split out of `booth-ffx2-b3-rows.test.ts` by the review fixes so that file stays under 400 lines). The follower's stage row, its four candidates, the rig its seam
 * cuts to, and the offline read of defect class 3 (a retarget pushing a party figure's painted rectangle outside the viewport) with the REAL `ProFollower` and `ProFit`: why the camera piece is held although no girl is ever cropped (`DemoGate.PIECE_HOLDS['ffx2-trema'].cam`,
 * `docs/handoff/booth-ffx2-b3.md` section 4). The numbers are `[ours]`, read off the art mirror (alpha boxes times the registration scale); the review of this branch re-read them with its own boxes.
 *
 * Review fixes (booth-ffx2-b3 review, m10 and m13): the claim "no girl is ever cropped" is pinned for ANY dress with a painting (the party can Change mid-fight), not only the three the chapter starts in; and Paragon's boss box is ONE box on both sides of the crop comparison (his idle
 * painting is 3.049 of the actor's nominal 3.1 high, his cast painting 1.119 of that), so the follower's crop is 45 and 72 px against the approved frame's 19 and 30 (2.4 times), not the 56 and 90 px against 19 and 30 (three times) that mixed the nominal height with the painting's box.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { PRO_AUTO_CAMERA } from '../../src/data/procam/proShots.ts';
import { AUTO_STAGES, SCRIPTED_RIGS, autoCameraFor, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { ProFollower } from '../../src/engine/procam/ProFollower.ts';
import { fitDolly, ndcRect, type Box } from '../../src/engine/procam/ProFit.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';
import { ffx2GiantHeight } from '../../src/data/ffx2/fiend-stature.ts';
import { CLOISTER_100_RIGS, CLOISTER_100_SLOTS, CLOISTER_ACTOR_HEIGHTS, CLOISTER_BOSS_SPOT } from '../../src/scenes/cloister-100.ts';
import { CLOISTER_LINK_RIG, CLOISTER_WIDE_RIGS } from '../../src/scenes/cloister-100-rigs.ts';
import { GIANT_ROWS } from '../../src/engine/fx/mix/giants.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
});

const ID = 'ffx2-trema';
type V3 = [number, number, number];
const asRig = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): { cam: number[]; look: number[]; fov: number } => ({ cam: [...(r.position as readonly number[])], look: [...(r.lookAt as readonly number[])], fov: r.fov ?? 32 });

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
    /** His idle painting's tight box is 3.049 high on the actor's nominal 3.1 (offline read of the idle painting, re-measured by the review): the SAME box goes on every Paragon figure below, the cast painting included. */
    const PARAGON_BOX = 3.049 / 3.1;
    const tremaW = 0.72; // per unit of height (1.271 wide at 1.784, his widest, the attack)

    interface GirlBox {
      w: number;
      h: number;
      dx: number;
    }
    interface Boss {
      /** The actor's height (the follower's member height). */
      h: number;
      w: number;
      /** The cast painting over the idle's. */
      tall: number;
      /** The idle painting's tight box over the actor's height. */
      box: number;
    }
    const paragonH = ffx2GiantHeight('paragon', ID, heights.party, false)!;
    const PARAGON: Boss = { h: paragonH, w: paragonH * paragonW, tall: paragonTall, box: PARAGON_BOX };
    const PARAGON_WIDE: Boss = { h: 3.1, w: 3.1 * paragonW, tall: paragonTall, box: PARAGON_BOX }; // drawn 3.1 in a window wider than 1.79
    const TREMA: Boss = { h: heights.trema, w: heights.trema * tremaW, tall: 1.015, box: 1 };
    /** The chapter's own three dresses, standing: the idle's height, or the tallest pose's. */
    const startGirls = (tall: boolean): GirlBox[] => girls.map((g, i) => ({ w: partyWidths[i]!, h: g.h * (tall ? partyTall[i]! : 1), dx: 0 }));
    /**
     * ANY DRESS (review m10): the party owns more than the three dresses it starts in and can Change mid-fight (Garment Grid). For every dress that has a painting (27: eight Yuna, ten Rikku, nine Paine; offline read of `public/art/characters/<girl>-<dress>/<pose>.png`, the
     * pose's tight alpha box times its registration scale, a girl 1.75 tall) the envelope per girl is the widest standing pose and the tallest non-victory pose of ANY of her dresses (Yuna White Mage's `hurt`, Warrior's `defend`; Rikku Black Mage's `attack`, Gunner's `twirl-mid`;
     * Paine Warrior's `attack`, White Mage's `defend`) in one box, and the lying knock-out body is the widest and tallest KO of any of her dresses (Yuna Thief, Rikku Thief, Paine Lady Luck), with and without the slide `ProneLay` gives it (up to half its length).
     */
    const ANY_STANDING: GirlBox[] = [{ w: 1.763, h: 2.042, dx: 0 }, { w: 1.733, h: 2.011, dx: 0 }, { w: 1.769, h: 2.03, dx: 0 }];
    const ANY_KO = (slide: number): GirlBox[] => [{ w: 2.524, h: 0.852, dx: 0 }, { w: 2.14, h: 0.978, dx: 0 }, { w: 2.007, h: 1.244, dx: 0 }].map((b) => ({ ...b, dx: slide * b.w }));

    const run = (base: Pose, boss: Boss, aspect: number, bossCast: boolean, girlBoxes: GirlBox[]) => {
      const spot = CLOISTER_BOSS_SPOT;
      const boxes: Box[] = [
        ...girls.map((g, i) => ({ x0: g.x + girlBoxes[i]!.dx - girlBoxes[i]!.w / 2, x1: g.x + girlBoxes[i]!.dx + girlBoxes[i]!.w / 2, y0: 0, y1: girlBoxes[i]!.h, z0: g.z - 0.1, z1: g.z + 0.1 })),
        { x0: spot[0] - boss.w / 2, x1: spot[0] + boss.w / 2, y0: 0, y1: boss.h * boss.box * (bossCast ? boss.tall : 1), z0: spot[2] - 0.1, z1: spot[2] + 0.1 },
      ];
      const members = [...girls.map((g, i) => ({ id: `g${i}`, feet: [g.x, 0, g.z] as V3, height: g.h })), { id: 'boss', feet: [spot[0], 0, spot[2]] as V3, height: boss.h }];
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

    it("link 1 under the giants frame (a window up to 1.79 wide: 1600x900 and 2560x1440): no girl is cropped in any pose, but the fit sits on its 1.8 cap in every frame while he is in his cast painting (and in 20 to 40 percent while he idles) and the girls fall to 0.73 to 0.81 of the approved frame's size", () => {
      expect(PARAGON.h).toBeCloseTo(9.447, 2);
      for (const tall of [false, true]) {
        const r = run(GIANT, PARAGON, 16 / 9, tall, startGirls(tall));
        expect(r.girlsOut, `girls outside the frame (tall ${tall})`).toBe(0);
        if (tall) expect(r.kSat / r.frames, 'the fit at its cap (tall)').toBeGreaterThan(0.95); // the tallest poses need more than the cap in every frame
        else {
          expect(r.kSat / r.frames, 'the fit at its cap').toBeGreaterThan(0.2);
          expect(r.kSat / r.frames, 'the fit at its cap').toBeLessThan(0.4);
        }
        expect(r.ratioMin, `girls (tall ${tall})`).toBeGreaterThan(0.7);
        expect(r.ratioMin, `girls (tall ${tall})`).toBeLessThan(0.8);
        expect(r.ratioMedian, `girls (tall ${tall})`).toBeGreaterThan(0.75);
        expect(r.ratioMedian, `girls (tall ${tall})`).toBeLessThan(0.82);
      }
    });

    it("Paragon's cast painting passes the top of the frame by 0.10 of the half frame under the follower (45 px at 1600x900, 72 px at 2560x1440) where the approved frame, with no follower, has 0.04 (19 and 30 px): 2.4 times, on ONE box (review m13)", () => {
      const approved = (box: number) => ndcRect({ x0: CLOISTER_BOSS_SPOT[0] - 6, x1: CLOISTER_BOSS_SPOT[0] + 6, y0: 0, y1: PARAGON.h * paragonTall * box, z0: CLOISTER_BOSS_SPOT[2] - 0.1, z1: CLOISTER_BOSS_SPOT[2] + 0.1 }, GIANT, 16 / 9)!.y1 - 1;
      const base = approved(PARAGON_BOX);
      expect(base).toBeCloseTo(0.042, 2); // the approved frame, in the cast pose
      expect(base * 450).toBeCloseTo(19, 0);
      expect(base * 720).toBeCloseTo(30, 0);
      const idle = run(GIANT, PARAGON, 16 / 9, false, startGirls(false));
      expect(idle.bossOut, 'in his idle painting he stays inside the frame').toBe(0);
      expect(idle.bossTop).toBeLessThan(1);
      const cast = run(GIANT, PARAGON, 16 / 9, true, startGirls(true));
      const over = cast.bossTop - 1;
      expect(over, 'the cast painting under the follower').toBeGreaterThan(0.09);
      expect(over).toBeLessThan(0.11);
      expect(over * 450, 'px at 1600x900').toBeGreaterThan(42);
      expect(over * 450, 'px at 1600x900').toBeLessThan(48);
      expect(over * 720, 'px at 2560x1440').toBeGreaterThan(68);
      expect(over * 720, 'px at 2560x1440').toBeLessThan(76);
      expect(over / base, 'times the approved frame').toBeGreaterThan(2.2);
      expect(over / base, 'times the approved frame').toBeLessThan(2.6);
      expect(cast.bossOut / cast.frames).toBeGreaterThan(0.5);
      // The same comparison on the OTHER consistent box, the actor's nominal height both sides (what the first read mixed with the painting's box): 56 and 90 px against 31 and 49 (1.8 times). Either way the follower roughly doubles the crop; "three times" was the mixed number.
      const nominal = { ...PARAGON, box: 1 };
      const castNominal = run(GIANT, nominal, 16 / 9, true, startGirls(true)).bossTop - 1;
      expect(castNominal * 450).toBeGreaterThan(54);
      expect(castNominal * 720).toBeGreaterThan(86);
      expect(castNominal / approved(1)).toBeGreaterThan(1.7);
      expect(castNominal / approved(1)).toBeLessThan(1.95);
    });

    it("link 1 on today's rig (a wider window: 3440x1440) and link 2 on today's rig at both shapes read clean: no figure is cropped in any pose, the fit never reaches its cap and the girls keep 0.85 or more of the rig's own size", () => {
      for (const [name, boss, aspect] of [
        ['link 1, 21:9', PARAGON_WIDE, 3440 / 1440],
        ['link 2, 16:9', TREMA, 16 / 9],
        ['link 2, 21:9', TREMA, 3440 / 1440],
      ] as const) {
        for (const tall of [false, true]) {
          const r = run(IDLE, boss, aspect, tall, startGirls(tall));
          expect(r.girlsOut + r.bossOut, `${name} (tall ${tall}): figures outside the frame`).toBe(0);
          expect(r.kSat, `${name}: the fit at its cap`).toBe(0);
          expect(r.ratioMin, name).toBeGreaterThan(0.85);
        }
      }
    });

    it('ANY DRESS (review m10): the envelope of every dress with a painting, standing or lying (with and without the knock-out slide), is never cropped by the follower in either link at 16:9 and 21:9, so a Change mid-fight cannot push a girl out of the frame', () => {
      for (const [name, base, boss, aspect] of [
        ['link 1, giants, 16:9', GIANT, PARAGON, 16 / 9],
        ['link 1, today\'s rig, 21:9', IDLE, PARAGON_WIDE, 3440 / 1440],
        ['link 2, 16:9', IDLE, TREMA, 16 / 9],
        ['link 2, 21:9', IDLE, TREMA, 3440 / 1440],
      ] as const) {
        const cases: Array<[string, GirlBox[]]> = [['standing', ANY_STANDING], ['KO, no slide', ANY_KO(0)], ['KO, slid left half a length', ANY_KO(-0.5)], ['KO, slid right half a length', ANY_KO(0.5)]];
        for (const [what, boxes] of cases) {
          const r = run(base, boss, aspect, false, boxes);
          expect(r.frames, `${name} ${what}`).toBe(60 * 52);
          expect(r.girlsOut, `${name}, ${what}: frames with a girl outside the frame`).toBe(0);
        }
      }
    });

    it("the cam hold's reason says what the numbers say: any dress, one box, 45 and 72 px against 19 and 30 (2.4 times), no figure of the first read's mixed 56 and 90 px or `three times`", () => {
      const why = treatedHold(ID, 'cam')!;
      expect(why).toMatch(/any dress/);
      expect(why).toMatch(/45 px at 1600x900, 72 px at 2560x1440/);
      expect(why).toMatch(/19 and 30 px/);
      expect(why).toMatch(/2\.4 times/);
      expect(why).not.toMatch(/56 px|90 px|three times/);
      expect(why).toMatch(/0\.73 to 0\.81/);
      expect(why).toMatch(/Lifts when/);
    });
  });
});
