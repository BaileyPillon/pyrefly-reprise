/**
 * BATCH 2's ROWS (release 70, branch `booth-ffx2-b2`; FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first). The data the treatment needs for the three rooms of Chapter V (the Heart of the Farplane, `farplane`),
 * Chapter XV (the Den of Woe, `den-of-woe`) and Chapter XI (the Road to the Farplane, `road-to-the-farplane`), from art already on disk: the HD-2D look rows, the arena grade and its cone, the follower camera, the rim-off foes, and the dress rule for the
 * real clips. Leblanc's are `booth-leblanc-rows.test.ts`. Every colour is `[ours]` (no source gives a grade); the numbers pinned here are measured off the plates (`docs/handoff/booth-ffx2-b2.md`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { setBossClean, bossCleanOn, bossCleanCard, BOSS_CLEAN_ARTS, BOSS_FEET } from '../../src/engine/look/pro/BossClean.ts';
import { setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proColour, proRoom, NEUTRAL_RECIPE } from '../../src/engine/look/pro/ProGrade.ts';
import { applyGrade, recipeFor } from '../../src/engine/look/LookGrades.ts';
import { rimSkipOf, tagRimFigure, TREATED_RIM_FOES } from '../../src/engine/look/pro/RimFigures.ts';
import { PRO_AUTO_CAMERA } from '../../src/data/procam/proShots.ts';
import { AUTO_STAGES, autoCameraFor } from '../../src/engine/procam/ProAutoStage.ts';
import { worstOver } from '../../src/engine/procam/ProFit.ts';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { DEN_FIGURE_HEIGHTS, DEN_IDS, DEN_PARTY_HEIGHT, DEN_RIGS, DEN_SPOTS } from '../../src/scenes/den-of-woe.ts';
import { ROAD_FIGURE_HEIGHTS, ROAD_IDS, ROAD_PARTY_HEIGHT, ROAD_RIGS, ROAD_SPOTS } from '../../src/scenes/road-to-the-farplane.ts';
import { COLOSSUS_TABLES, COLOSSUS_PART_BASE_HEIGHT } from '../../src/scenes/farplane-colossus.ts';
import { FARPLANE_SLOTS } from '../../src/scenes/farplane.ts';
import { isListed, stillListed } from './booth-r70-withdrawn.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setBossClean(null);
});

// Chapters V and XI left the treated list in the r70 verdicts: their rows stay in every table (the data cases below still read them) and the cases that need the treatment on read `isListed`.
const B2 = ['ffx2-vegnagun-shuyin', 'ffx2-den-of-woe', 'ffx2-fallen-aeons'] as const;
const ROOMS = { farplane: 'ffx2-vegnagun-shuyin', 'den-of-woe': 'ffx2-den-of-woe', 'road-to-the-farplane': 'ffx2-fallen-aeons' } as const;
/** What the plates say (offline read of `public/art/backdrops/<room>.png`, u from the left, v from the top; `docs/handoff/booth-ffx2-b2.md`): the spire's burst on the Farplane and the Road, the right-hand dome of the Den. */
const BURST = { u: 0.505, v: 0.285 };
const DOME = { u: 0.869, v: 0.599 };
const lum = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;

/** The neutral frame the arena grade works on (`LookGrades.lutBytes`: the engine's NEUTRAL recipe, then the room's colour transform), for one plate colour. */
function arena(room: string, c: [number, number, number]): [number, number, number] {
  const r = recipeFor('cinematic', 'ffx2', room, { key: 0xffe0b0, sky: 0x30405a }, 'bold', { ...NEUTRAL_RECIPE });
  return proColour(applyGrade(c, r), proRoom(room)!.colour);
}

describe('the chapters stand on the rooms the rows are keyed by', () => {
  it('Chapter V on `farplane`, Chapter XV on `den-of-woe`, Chapter XI on `road-to-the-farplane` (the look is keyed by scene key)', async () => {
    const { getChapter } = await import('../../src/data/encounters.ts');
    for (const [room, id] of Object.entries(ROOMS)) expect(getChapter(id)!.sceneKey, id).toBe(room);
  });
});

describe('the HD-2D look and the rooms\' rows', () => {
  it('each chapter has the bold hd2d row, played only while the treatment reaches it (`?treated=pack` is release 68)', () => {
    for (const id of B2) {
      expect(CHAPTER_LOOKS[id], id).toEqual({ name: 'hd2d', strength: 'bold' });
      setTreatedScope('pack');
      expect(chapterLook(id), id).toBeNull();
      setTreatedScope('all');
      // the row stays; the look is unread while the chapter is off the list (IX is not here) and, for Chapters V and XI, while `hd2d` is held (booth-ffx2-b4-sky: the bold look clips the Farplane's sky); the Den of Woe plays it
      expect(chapterLook(id), id).toEqual(isListed(id) && treatedHold(id, 'hd2d') === undefined ? { name: 'hd2d', strength: 'bold' } : null);
    }
  });

  it("the authored light is the painting's own: the spire's burst on the Farplane and the Road, the right dome in the Den, in both looks the rooms are graded in", () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      for (const room of ['farplane', 'road-to-the-farplane'] as const) {
        const l = ROOM_LOOKS[look][room]?.light;
        expect(l, `${look} ${room}`).toBeDefined();
        expect(l!.u, `${look} ${room}`).toBeCloseTo(BURST.u, 2);
        expect(l!.v, `${look} ${room}`).toBeCloseTo(BURST.v, 2);
        expect(l!.color[2], `${look} ${room}`).toBeGreaterThanOrEqual(l!.color[1]); // white-lilac: blue over green
      }
      const d = ROOM_LOOKS[look]['den-of-woe']?.light;
      expect(d, look).toBeDefined();
      expect(d!.u).toBeCloseTo(DOME.u, 2);
      expect(d!.v).toBeCloseTo(DOME.v, 2);
      expect(d!.color[1]).toBeGreaterThan(d!.color[0] + 0.3); // the dome's cyan
    }
  });

  it("the sharp band is Chapter IV's 0.40 moved by where the girls' feet and knees fall from each rig: 0.41, and 0.405 for the Farplane (four colossus links, one plain)", () => {
    expect(ROOM_LOOKS.hd2d['road-to-the-farplane']?.focus).toBe(0.41);
    expect(ROOM_LOOKS.hd2d['den-of-woe']?.focus).toBe(0.41);
    expect(ROOM_LOOKS.hd2d['farplane']?.focus).toBe(0.405);
    for (const room of Object.keys(ROOMS)) expect(boldRoom('hd2d', room)?.focus, room).toBe(ROOM_LOOKS.hd2d[room]!.focus);
    // the calibration, rebuilt: the girls' feet-and-knee middle from each idle rig against Bevelle's, by the pinhole (0 bottom .. 1 top)
    const norm = (a: number[]) => a.map((x) => x / Math.hypot(...a));
    const mid = (cam: number[], look: number[], fov: number, slots: number[][]): number => {
      const f = norm(look.map((x, i) => x - cam[i]!));
      const r = norm([-f[2]!, 0, f[0]!]);
      const u = [r[1]! * f[2]! - r[2]! * f[1]!, r[2]! * f[0]! - r[0]! * f[2]!, r[0]! * f[1]! - r[1]! * f[0]!];
      const vOf = (p: number[]): number => {
        const d = p.map((x, i) => x - cam[i]!);
        const z = d[0]! * f[0]! + d[1]! * f[1]! + d[2]! * f[2]!;
        const y = d[0]! * u[0]! + d[1]! * u[1]! + d[2]! * u[2]!;
        return (y / z / Math.tan((fov * Math.PI) / 360) + 1) / 2;
      };
      const feet = slots.reduce((s, p) => s + vOf([p[0]!, 0, p[1]!]), 0) / slots.length;
      const knee = slots.reduce((s, p) => s + vOf([p[0]!, 0.5, p[1]!]), 0) / slots.length;
      return (feet + knee) / 2;
    };
    const bevelle = mid([0, 3.0, 9.6], [0.15, 1.5, -1.3], 32, [[-2.05, 1.45], [-1.3, 0.1], [-0.9, -1.5]]);
    const slots = [[-2.48, 1.45], [-1.44, 0.1], [-0.33, -1.3]];
    for (const rig of [DEN_RIGS.idle, ROAD_RIGS.idle]) {
      const delta = mid(rig.position as number[], rig.lookAt as number[], rig.fov ?? 32, slots) - bevelle;
      expect(0.4 + delta, 'the Farplane family rig').toBeCloseTo(0.41, 2);
    }
    const colossus = COLOSSUS_TABLES.desktop.idle;
    expect(0.4 + mid(colossus.position, colossus.lookAt, colossus.fov ?? 40, slots) - bevelle, 'the colossus master').toBeCloseTo(0.405, 2);
  });

  it('the bold grade has both looks for all three rooms, with each room\'s own hues pulled, and the fogs are the room\'s colours', () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      for (const room of Object.keys(ROOMS)) {
        const r = boldRoom(look, room);
        expect(r, `${look} ${room}`).toBeDefined();
        expect(r!.recipe?.hues?.length, `${look} ${room}`).toBeGreaterThanOrEqual(2);
      }
    }
    const fog = (room: string): number[] => ROOM_LOOKS.cinematic[room]!.fog!;
    expect(fog('farplane')[2]).toBeGreaterThan(fog('farplane')[1]!); // a violet haze
    expect(fog('road-to-the-farplane')).toEqual(fog('farplane')); // the same sky
    expect(fog('den-of-woe')[2]).toBeGreaterThan(fog('den-of-woe')[0]! + 0.2); // blue-teal
    expect(boldRoom('hd2d', 'den-of-woe')!.recipe!.hues!.map((h) => h.hue)).toEqual([180, 196]); // the domes' cyan, the lit floor's teal
  });

  it('NO EMBERS in any of the three: the Farplane\'s air is its live pyreflies and petals, the Den paints its own motes (the plates and the scenes carry the air)', () => {
    for (const room of Object.keys(ROOMS)) {
      const b = ROOM_BOLD[room]!;
      expect(b.embers, room).toEqual([]);
      expect(roomBold(room), room).toBe(b);
      expect(b.gloss, room).toBeLessThan(0.5);
      expect(b.fogScale!, room).toBeLessThanOrEqual(0.9);
    }
    expect(ROOM_BOLD['farplane']!.gloss).toBeLessThan(ROOM_BOLD['road-to-the-farplane']!.gloss); // a flower field against a polished stone platform
    expect(roomBold('no-such-room').embers).toEqual([]);
  });
});

describe('the pro arena', () => {
  it('has a row for each room, with the one cone of light anchored to the painted light (none follows a moon, none is a fixed frame point)', () => {
    for (const room of Object.keys(ROOMS)) {
      const r = proRoom(room);
      expect(r, room).toBe(PRO_ARENA[room]);
      expect(r!.cone, room).toBeDefined();
      expect(r!.cone!.follow, room).toBe(false);
      expect(r!.cone!.paint, room).toBeDefined();
      expect(r!.vignette.amount, room).toBeGreaterThan(0.4);
      expect(r!.grain, room).toBeLessThan(0.03);
    }
    for (const room of ['farplane', 'road-to-the-farplane']) {
      expect(PRO_ARENA[room]!.cone!.paint!.u).toBeCloseTo(BURST.u, 2);
      expect(PRO_ARENA[room]!.cone!.paint!.v).toBeCloseTo(BURST.v, 2);
    }
    expect(PRO_ARENA['den-of-woe']!.cone!.paint!.u).toBeCloseTo(DOME.u, 2);
    expect(PRO_ARENA['den-of-woe']!.cone!.paint!.v).toBeCloseTo(DOME.v, 2);
    // the cone starts where the painted light lands in the frame (idle rig, 16:9): the burst near the top edge on the Farplane and above it on the Road, the dome at the right edge
    expect(PRO_ARENA['farplane']!.cone!.v).toBeGreaterThan(0.85);
    expect(PRO_ARENA['road-to-the-farplane']!.cone!.v).toBeGreaterThan(0.95);
    expect(PRO_ARENA['den-of-woe']!.cone!.u).toBeGreaterThan(0.9);
    // the den's is weaker than the cones that fall from a light above (Chapter IV's skylight, Leblanc's heart, the two Farplane spires): a pooled glow, not a beam
    for (const room of ['bevelle-underground', 'leblanc-last-room', 'farplane', 'road-to-the-farplane']) expect(PRO_ARENA[room]!.cone!.strength, room).toBeGreaterThan(PRO_ARENA['den-of-woe']!.cone!.strength);
  });

  it("the one light stays the brightest thing and the rest falls: the burst keeps over 0.78 and a sky or a flower falls under a third of its plate luminance (Farplane and Road); the dome keeps its cyan and the cave floor falls (Den)", () => {
    for (const room of ['farplane', 'road-to-the-farplane']) {
      const burst = arena(room, [1.0, 0.97, 1.0]);
      expect(lum(burst), room).toBeGreaterThan(0.78);
      const sky = arena(room, [0.5, 0.5, 0.95]); // the sky's blue-violet
      expect(lum(sky), room).toBeLessThan(0.33 * lum([0.5, 0.5, 0.95]));
      const flower = arena(room, [0.62, 0.45, 0.8]); // the lilac stone and flowers
      expect(lum(flower), room).toBeLessThan(0.33 * lum([0.62, 0.45, 0.8]));
      expect(sky[2], room).toBeGreaterThan(sky[0]); // still blue: the descent cools, it does not grey
    }
    const dome = arena('den-of-woe', [0.45, 0.97, 0.97]);
    expect(dome[1], 'dome').toBeGreaterThan(0.5);
    expect(dome[1], 'dome').toBeGreaterThan(dome[0] + 0.2);
    const floor = arena('den-of-woe', [0.16, 0.39, 0.48]);
    expect(lum(floor), 'floor').toBeLessThan(0.6 * lum([0.16, 0.39, 0.48]));
    expect(floor[2], 'floor').toBeGreaterThan(floor[0]); // blue-black, not grey
  });

  it("the arena's key light is the colour of the room's own painted light (review of booth-b2, observation o2): the Den's is cyan, the two Farplane rooms' are lilac-white, each within 0.15 of the HD-2D row's light on every channel", () => {
    for (const room of Object.keys(ROOMS)) {
      const painted = ROOM_LOOKS.hd2d[room]!.light!.color;
      const key = proRoom(room)!.lightColor;
      for (let i = 0; i < 3; i++) expect(Math.abs(key[i]! - painted[i]!), `${room} channel ${i}`).toBeLessThanOrEqual(0.15);
    }
    const den = proRoom('den-of-woe')!.lightColor;
    expect(den[1], 'den green').toBeGreaterThan(den[0] + 0.3); // cyan: green and blue stand over red
    expect(den[2], 'den blue').toBeGreaterThan(den[0] + 0.3);
    for (const room of ['farplane', 'road-to-the-farplane']) {
      const k = proRoom(room)!.lightColor;
      expect(k[2], room).toBeGreaterThanOrEqual(k[1]); // lilac-white: blue at least green
      expect(k[0], room).toBeGreaterThan(0.9);
    }
  });

  it('the Farplane family is cooled and held under full saturation ("desaturate and cool as the player descends", `research/ffx2-vegnagun-shuyin.md` 10.4): the pink flowers lose saturation against the sky\'s blue', () => {
    const sat = (c: number[]): number => (Math.max(...c) - Math.min(...c)) / Math.max(...c, 1e-6);
    for (const room of ['farplane', 'road-to-the-farplane']) {
      expect(sat(arena(room, [0.95, 0.62, 0.95])), room).toBeLessThan(0.75); // pink cloud / blossom
      expect(proRoom(room)!.colour.sat, room).toBeLessThanOrEqual(1);
    }
  });
});

describe('the follower camera on their plates', () => {
  const party = [[-2.48, 1.45], [-1.44, 0.1], [-0.33, -1.3]];
  /** The centroid of a group at 0.9 of each height, the follower's own rule. */
  const centroid = (members: Array<{ x: number; y: number; z: number; h: number }>): number[] => {
    const f = [0, 0, 0];
    for (const m of members) {
      f[0]! += m.x;
      f[1]! += m.y + 0.9 * m.h;
      f[2]! += m.z;
    }
    return f.map((v) => v / members.length);
  };
  const girls = (h: number) => party.map(([x, z]) => ({ x: x!, y: 0, z: z!, h }));
  const azimuth = (eye: readonly number[], f: number[]): number => (Math.atan2(eye[0]! - f[0]!, eye[2]! - f[2]!) * 180) / Math.PI;

  it("Chapter XV's focus is the group of a shade's link (the girls and a shade on the boss spot) and the home azimuth is the idle eye seen from it", () => {
    const f = centroid([...girls(DEN_PARTY_HEIGHT), { x: DEN_SPOTS[DEN_IDS.baralai]![0], y: 0, z: DEN_SPOTS[DEN_IDS.baralai]![2], h: DEN_FIGURE_HEIGHTS[DEN_IDS.baralai]! }]);
    const st = AUTO_STAGES['ffx2-den-of-woe']!;
    for (let k = 0; k < 3; k++) expect(st.focus[k]!, `axis ${k}`).toBeCloseTo(f[k]!, 1);
    expect(st.homeAzimuthDeg).toBeCloseTo(azimuth(DEN_RIGS.idle.position as number[], st.focus as unknown as number[]), 1);
  });

  it("Chapter XI's focus is the Sisters' link, the widest (Sandy, Cindy and Mindy hovering 0.55 over the stone)", () => {
    const sis = [ROAD_IDS.sandy, ROAD_IDS.cindy, ROAD_IDS.mindy].map((id) => ({ x: ROAD_SPOTS[id]![0], y: ROAD_SPOTS[id]![1], z: ROAD_SPOTS[id]![2], h: ROAD_FIGURE_HEIGHTS[id]! }));
    const f = centroid([...girls(ROAD_PARTY_HEIGHT), ...sis]);
    const st = AUTO_STAGES['ffx2-fallen-aeons']!;
    for (let k = 0; k < 3; k++) expect(st.focus[k]!, `axis ${k}`).toBeCloseTo(f[k]!, 1);
    expect(st.homeAzimuthDeg).toBeCloseTo(azimuth(ROAD_RIGS.idle.position as number[], st.focus as unknown as number[]), 1);
  });

  it("Chapter V's focus is the last link's group: the girls at the stage default 1.82 and Shuyin on the boss slot at the default boss height 4.1 (the Farplane publishes neither)", () => {
    const s = FARPLANE_SLOTS.enemy[0]!;
    const f = centroid([...girls(1.82), { x: s[0], y: 0, z: s[2], h: 4.1 }]);
    const st = AUTO_STAGES['ffx2-vegnagun-shuyin']!;
    for (let k = 0; k < 3; k++) expect(st.focus[k]!, `axis ${k}`).toBeCloseTo(f[k]!, 1);
    expect(st.homeAzimuthDeg).toBeCloseTo(azimuth([0, 2.7, 9.8], st.focus as unknown as number[]), 1);
  });

  it("each chapter's four candidates keep the lane's angles about its own front, inside the 35 degree corridor, above the floor; Chapter IV, Chapter I and every other chapter keep the generated camera, the very object", () => {
    for (const id of B2) {
      const cam = autoCameraFor(id);
      const st = AUTO_STAGES[id]!;
      expect(cam, id).not.toBe(PRO_AUTO_CAMERA);
      expect(cam.cands, id).toHaveLength(4);
      cam.cands.forEach((c, i) => {
        const d = [c.eye[0] - st.focus[0], c.eye[1] - st.focus[1], c.eye[2] - st.focus[2]];
        expect(Math.hypot(d[0]!, d[1]!, d[2]!), `${id} cand ${i} distance`).toBeCloseTo(c.fitM, 1);
        const az = (Math.atan2(d[0]!, d[2]!) * 180) / Math.PI;
        expect(az - st.homeAzimuthDeg, `${id} cand ${i} azimuth from home`).toBeCloseTo(c.azDeg, 1);
        expect(Math.abs(az), `${id} cand ${i} corridor`).toBeLessThanOrEqual(35);
        expect(c.eye[1], `${id} cand ${i} above the floor`).toBeGreaterThan(1);
      });
      expect(cam.cands.map((c) => [c.azDeg, c.elDeg]), id).toEqual(PRO_AUTO_CAMERA.cands.map((c) => [c.azDeg, c.elDeg]));
    }
    for (const id of ['ffx2-bahamut', 'seymour-flux', undefined, 'toString']) expect(autoCameraFor(id)).toBe(PRO_AUTO_CAMERA);
  });
});

describe('the foes draw no screen-space rim in their own chapter, and nowhere else', () => {
  /** The foes of each chapter that draw no rim there. Shuyin and the three shades of the Den are NOT here: they keep their rim (the research asks for an additive rim on Shuyin; the shades keep release 68's rim: pale translucent paintings, measured, on which the rim is an untested second glow, job J4). */
  const FOES: Record<(typeof B2)[number], string[]> = {
    'ffx2-vegnagun-shuyin': ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head'],
    'ffx2-den-of-woe': [],
    'ffx2-fallen-aeons': Object.values(ROAD_IDS),
  };

  it('under all, in their chapter: the machine parts and the aeons are tagged and skip the rim, Shuyin and the shades keep theirs, and the re-cut half (feet rows, art ids) stays the booth bosses\' two', () => {
    setBossClean('clean');
    setTreatedScope('all');
    for (const id of B2) {
      setDemoChapter(id);
      for (const foe of FOES[id]) {
        expect(Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, foe), foe).toBe(true);
        expect(TREATED_RIM_FOES[foe], foe).toBe('ffx2');
        const o = new Object3D();
        tagRimFigure(o, foe, 'enemy');
        expect(rimSkipOf(o), `${id} ${foe}`).toBe(isListed(id)); // the flag is the row's; it is read only while the chapter is treated
      }
    }
    for (const kept of ['shuyin', ...Object.values(DEN_IDS)]) {
      expect(Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, kept), kept).toBe(false); // kept with their rim, with the reason in RimFigures
      for (const id of B2) {
        setDemoChapter(id);
        const o = new Object3D();
        tagRimFigure(o, kept, 'enemy');
        expect(rimSkipOf(o), `${id} ${kept}`).toBe(false);
      }
    }
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    expect(Object.keys(BOSS_FEET).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    for (const art of ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin', 'baralai-shade', 'gippal-shade', 'nooj-shade', 'x2-shiva', 'sandy', 'cindy', 'mindy', 'x2-anima']) {
      expect(bossCleanOn(art), art).toBe(false); // no re-cut art, no footprint row: the rim half alone
      expect(bossCleanCard(art), art).toBe(false);
    }
  });

  it('under pack (release 68) and in any other chapter the same foes keep their rim', () => {
    setBossClean('clean');
    for (const [scope, chapter] of [['pack', 'ffx2-vegnagun-shuyin'], ['pack', 'ffx2-den-of-woe'], ['pack', 'ffx2-fallen-aeons'], ['all', 'ffx2-ixion-djose'], ['all', 'exp-leblanc']] as const) {
      setTreatedScope(scope);
      setDemoChapter(chapter);
      for (const foe of ['vegnagun-tail', 'x2-shiva', 'sandy']) {
        const o = new Object3D();
        tagRimFigure(o, foe, 'enemy');
        expect(rimSkipOf(o), `${scope} ${chapter} ${foe}`).toBe(false);
      }
    }
  });
});

describe('the real clips follow the dress in all three (the dress guard of `booth-leblanc`, FFX-2 only)', () => {
  it('Yuna White Mage and Rikku Dark Knight play the rows decoded for them; Paine Dark Knight has none and plays the house curves; Chapter IV is untouched', () => {
    setTreatedScope('all');
    for (const id of stillListed(B2)) {
      setDemoChapter(id);
      expect(realRowOf('ffx2', 'yuna-white-mage'), id).toBe(REAL_MOTION.ffx2['yuna']);
      expect(realRowOf('ffx2', 'rikku-dark-knight'), id).toBe(REAL_MOTION.ffx2['rikku']);
      expect(realRowOf('ffx2', 'paine-dark-knight'), id).toBeUndefined();
    }
    setDemoChapter('ffx2-bahamut');
    expect(realRowOf('ffx2', 'paine-dark-knight'), 'the booth pair keeps the prefix rule, byte for byte').toBe(REAL_MOTION.ffx2['paine']);
  });
});

describe("why Chapter V's follower is held: the approved colossus frame does not fit the never-crop rectangle", () => {
  it('at each part\'s master rig the part alone is over the follower\'s safe rectangle (0.84 by 0.9): the Body 1.2 to 1.3 times, the Leg 1.9 to 2.0, the Tail and the Head between, all under the 2.2 cap (the numbers in the hold text)', () => {
    const aspect = { tail: 2352 / 1644, leg: 1554 / 2350, body: 2426 / 1654, head: 2432 / 1664 } as const; // the idle@2x masters
    const t = COLOSSUS_TABLES.desktop;
    const pose = { pos: t.idle.position as [number, number, number], look: t.idle.lookAt as [number, number, number], fov: t.idle.fov ?? 40, roll: 0 };
    const over = (link: keyof typeof aspect): number => {
      const p = t.parts[link];
      const h = COLOSSUS_PART_BASE_HEIGHT * p.scale;
      const w = h * aspect[link];
      return worstOver([{ x0: p.spot[0] - w / 2, x1: p.spot[0] + w / 2, y0: p.spot[1], y1: p.spot[1] + h, z0: p.spot[2] - 0.2, z1: p.spot[2] + 0.2 }], pose, 16 / 9, { x: 0.84, y: 0.9 });
    };
    expect(over('body')).toBeGreaterThan(1.2);
    expect(over('body')).toBeLessThan(1.3);
    expect(over('leg')).toBeGreaterThan(1.9);
    expect(over('leg')).toBeLessThan(2.0);
    for (const link of ['tail', 'head'] as const) {
      expect(over(link), link).toBeGreaterThan(1.4);
      expect(over(link), link).toBeLessThan(2.2);
    }
  });
});
