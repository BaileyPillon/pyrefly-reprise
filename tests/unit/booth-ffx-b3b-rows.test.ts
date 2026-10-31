/**
 * THE ROWS OF BATCH 3b (release 71, branch `booth-ffx-b3b`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter III (`braskas-final-aeon`, Dream's End, seven links), Chapter XII (`seymour-omnis`, the Garden of Pain) and Chapter XIV
 * (`isaaru-via-purifico`, the Via Purifico, Yuna alone). The data the treatment needs for the three rooms, from art already on disk (no new art): the HD-2D look rows (the authored light, the sharp band), the bold facts (no embers on purpose), the arena grade
 * and its cone, the rim-off foes, and the things that must stay as they are. Every number pinned was read off the plates and the scenes by `docs/handoff/booth-ffx-b3b.md` section 3.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Object3D } from 'three';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { BOSS_CLEAN_ARTS, BOSS_FEET, BOSS_FEET_POSES, bossCleanCard, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, lutBytes } from '../../src/engine/look/LookGrades.ts';
import { boldRoom } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { FFX_B3B_ARENA } from '../../src/engine/look/pro/ProGradeFfx.ts';
import { TREATED_RIM_FOES, rimSkipOf, tagRimFigure } from '../../src/engine/look/pro/RimFigures.ts';
import { SCOPE_EXCEPTIONS, WIDE_CHAPTERS, chapterInScope, scopeExcepted, setCauseMode, setStanceMode, setSwapScope, stanceNow, swapHow, swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setSmearStyle, smearOn } from '../../src/engine/motion/SmearSwitch.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { victoryKind } from '../../src/engine/motion/MomentsPlan.ts';
import { realKeyOf, realRowOf } from '../../src/engine/motion/RealMotion.ts';
import { DREAMS_END_RIGS, DREAMS_END_SLOTS } from '../../src/scenes/dreams-end.ts';
import { GARDEN_BACKDROP, GARDEN_OF_PAIN_RIGS, GARDEN_OF_PAIN_SLOTS } from '../../src/scenes/garden-of-pain.ts';
import { VIA_BACKDROP, VIA_PURIFICO_RIGS, VIA_PURIFICO_SLOTS } from '../../src/scenes/via-purifico.ts';
import { liveFeet } from './booth-ffx-b3b-live-stage.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setBossClean(null);
  setPartyRim(null);
  setStanceMode(null);
  setCauseMode(null);
  setSmearStyle(null);
  setCurvesMode(null);
  setSwapScope(null);
});

type V3 = readonly [number, number, number];
interface Room {
  readonly chapter: string;
  readonly room: string;
  /** The painting's own light (plate u from the left, v from the top; offline read, section 3) and the colour the rows give it. */
  readonly light: { readonly u: number; readonly v: number };
  /** The sharp band the booth rule gives at this room's idle rig, with the party where the live game stands it (`booth-ffx-b3b-live-stage.ts`; review m1: the Garden's 0.34 was read at the scene's own slots). */
  readonly focus: number;
  /** The plane the plate hangs on (the scene's own constants: Dream's End and the Garden 80 wide at z -50, the Via Purifico 40 wide at z -20). */
  readonly plate: { readonly width: number; readonly distance: number; readonly centreY: number };
  readonly idle: { readonly position: V3; readonly lookAt: V3; readonly fov: number };
  readonly party: readonly V3[];
  /** The party's world height at that scene (Tidus 1.82, the Garden's 1.8, Yuna's own 1.68). */
  readonly height: number;
  /** The bands the scene hands the look (the plate's own means, `plate-measure-out.txt`). */
  readonly palette: { readonly key: number; readonly sky: number };
}
/** A scene rig (a position that may be a three vector) as plain numbers. */
const toV3 = (p: unknown): V3 => (Array.isArray(p) ? [p[0] as number, p[1] as number, p[2] as number] : [(p as { x: number }).x, (p as { y: number }).y, (p as { z: number }).z]);
const rigOf = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): Room['idle'] => ({ position: toV3(r.position), lookAt: toV3(r.lookAt), fov: r.fov ?? 32 });
const ROOMS: readonly Room[] = [
  { chapter: 'braskas-final-aeon', room: 'dreams-end', light: { u: 0.484, v: 0.286 }, focus: 0.41, plate: { width: 80, distance: -50, centreY: 1.23 }, idle: rigOf(DREAMS_END_RIGS['idle']!), party: DREAMS_END_SLOTS.party.map((s, i) => liveFeet('braskas-final-aeon', DREAMS_END_RIGS['idle']!, s, ['tidus', 'yuna', 'auron'][i]!)), height: 1.82, palette: { key: 0x431923, sky: 0x24141f } },
  { chapter: 'seymour-omnis', room: 'garden-of-pain', light: { u: 0.505, v: 0.337 }, focus: 0.39, plate: GARDEN_BACKDROP, idle: rigOf(GARDEN_OF_PAIN_RIGS['idle']!), party: GARDEN_OF_PAIN_SLOTS.party.map((s, i) => liveFeet('seymour-omnis', GARDEN_OF_PAIN_RIGS['idle']!, s, ['tidus', 'yuna', 'auron'][i]!)), height: 1.8, palette: { key: 0x574ba2, sky: 0x2e37a3 } },
  { chapter: 'isaaru-via-purifico', room: 'via-purifico', light: { u: 0.508, v: 0.542 }, focus: 0.34, plate: VIA_BACKDROP, idle: rigOf(VIA_PURIFICO_RIGS['idle']!), party: VIA_PURIFICO_SLOTS.party.slice(0, 1).map((s) => liveFeet('grothia', VIA_PURIFICO_RIGS['idle']!, s, 'yuna')), height: 1.68, palette: { key: 0x381f22, sky: 0x1d1b21 } },
];

// ---- the camera maths of the reads (a pinhole, as `ProFit.ndcRect`): where a world point stands in the frame at a rig, 0..1 from the bottom-left
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
function frameOf(rig: Room['idle'], p: V3, aspect = 16 / 9): [number, number] {
  const f = norm(sub(rig.lookAt, rig.position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(p, rig.position);
  const z = dot(d, f);
  const th = Math.tan((rig.fov * Math.PI) / 360);
  return [0.5 + dot(d, r) / (z * th * 2 * aspect), 0.5 + dot(d, u) / (z * th * 2)];
}
const plateWorld = (R: Room, u: number, v: number): V3 => [(u - 0.5) * R.plate.width, R.plate.centreY + (0.5 - v) * ((R.plate.width * 1536) / 2688), R.plate.distance];

/** The colour each room's light is authored in (the same in both looks; review m5: the cinematic Dream's End light's colour was the one unpinned number of the rows). */
const LIGHT_COLOUR: Readonly<Record<string, readonly number[]>> = { 'dreams-end': [1.0, 0.76, 0.27], 'garden-of-pain': [0.82, 0.55, 0.82], 'via-purifico': [0.9, 0.42, 0.38] };

describe.each(ROOMS)('$chapter ($room): the HD-2D look and the room rows', (R) => {
  const lights = [ROOM_LOOKS.hd2d[R.room]?.light, ROOM_LOOKS.cinematic[R.room]?.light];

  it('the chapter has the bold hd2d row, played only while the treatment reaches it (`?treated=pack` is release 68)', () => {
    expect(CHAPTER_LOOKS[R.chapter]).toEqual({ name: 'hd2d', strength: 'bold' });
    setTreatedScope('pack');
    expect(chapterLook(R.chapter)).toBeNull();
    setTreatedScope('all');
    expect(chapterLook(R.chapter)).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(getChapter(R.chapter)?.game).toBe('ffx');
  });

  it("the authored light is the painting's own, the same in both looks the room is graded in, and it is not the place `findLight` would take", () => {
    for (const l of lights) {
      expect(l).toBeDefined();
      expect(l!.u).toBeCloseTo(R.light.u, 2);
      expect(l!.v).toBeCloseTo(R.light.v, 2);
      expect([...l!.color], 'the light colour').toEqual(LIGHT_COLOUR[R.room]);
    }
    if (R.room === 'dreams-end') {
      expect(lights[0]!.v).toBeLessThan(0.4); // the burning eye in the upper half, not the flame wall at the base (v 0.82), which `findLight` takes with its default cut
      expect(lights[0]!.color[0]).toBeGreaterThan(lights[0]!.color[1]); // gold: red over green over blue
      expect(lights[0]!.color[1]).toBeGreaterThan(lights[0]!.color[2]);
    }
    if (R.room === 'garden-of-pain') {
      expect(lights[0]!.v).toBeLessThan(0.45); // the glow behind the dais, not a terrace tile (v 0.68), which `findLight` takes
      expect(lights[0]!.color[0]).toBeGreaterThan(lights[0]!.color[1]); // dusty pink: red and blue over green
      expect(lights[0]!.color[2]).toBeGreaterThan(lights[0]!.color[1]);
    }
    if (R.room === 'via-purifico') expect(lights[0]!.color[0]).toBeGreaterThan(lights[0]!.color[2]); // the lamps' red haze
  });

  it("the sharp band follows the booth rule at this room's idle rig (focus = 0.36 + 0.727 x (the feet-and-knee middle - 0.187): Chapter I 0.187 gives 0.36, Chapter II 0.167 gives 0.35)", () => {
    const vs = R.party.flatMap((s) => [frameOf(R.idle, [s[0], 0, s[2]])[1], frameOf(R.idle, [s[0], 0.28 * R.height, s[2]])[1]]);
    const mid = vs.reduce((a, b) => a + b, 0) / vs.length;
    expect(ROOM_LOOKS.hd2d[R.room]?.focus).toBe(R.focus);
    expect(boldRoom('hd2d', R.room)?.focus).toBe(R.focus);
    expect(Math.abs(R.focus - (0.36 + 0.727 * (mid - 0.187)))).toBeLessThan(0.012);
  });

  it("the bold grade has both looks, with the plate's own two hues pulled (the dominant colour and the accent), a fog colour, and an exposure inside the booth rows' range (0.5 to 1.0)", () => {
    for (const look of ['hd2d', 'cinematic'] as const) {
      const r = boldRoom(look, R.room);
      expect(r, look).toBeDefined();
      expect((r!.recipe?.hues ?? []).length, look).toBe(2);
    }
    for (const look of ['hd2d', 'cinematic'] as const) {
      expect(boldRoom(look, R.room)!.recipe!.exposure!, look).toBeGreaterThan(0.5);
      expect(boldRoom(look, R.room)!.recipe!.exposure!, look).toBeLessThan(1.0);
    }
    expect(boldRoom('cinematic', R.room)!.fog).toBeDefined();
  });

  it('the bold facts: NO embers on purpose (the scene carries its own, or no source asks for any), a rim in the room\'s own key, the unlisted room still gets none', () => {
    const b = ROOM_BOLD[R.room]!;
    expect(b.embers).toEqual([]);
    expect(roomBold(R.room)).toBe(b);
    expect(roomBold('no-such-room').embers).toEqual([]);
    expect(b.rim).toBeDefined();
    expect(b.gloss).toBeGreaterThan(0);
    expect(b.gloss).toBeLessThanOrEqual(1);
  });
});

describe('the rooms differ the way the plates do', () => {
  it("the rims are each room's own key (the eye's gold, the scene's cold violet 0xc9a6ff, the lamps' red) and the floors' gloss ranks cracked stone < pale tiles < the wet stone", () => {
    const rim = (room: string): readonly number[] => ROOM_BOLD[room]!.rim!;
    expect(rim('dreams-end')[0]).toBeGreaterThan(rim('dreams-end')[2]!); // warm
    expect(rim('garden-of-pain')[2]).toBeGreaterThan(rim('garden-of-pain')[1]!); // violet-blue
    expect(rim('garden-of-pain')[0]).toBeGreaterThan(rim('garden-of-pain')[1]!);
    expect(rim('via-purifico')[0]).toBeGreaterThan(rim('via-purifico')[1]! * 2); // red
    expect(ROOM_BOLD['dreams-end']!.gloss).toBeLessThan(ROOM_BOLD['garden-of-pain']!.gloss);
    expect(ROOM_BOLD['garden-of-pain']!.gloss).toBeLessThan(ROOM_BOLD['via-purifico']!.gloss);
  });
});

describe.each(ROOMS)('$room: the pro arena, one light and one accent, the rest to shadow', (R) => {
  const room = PRO_ARENA[R.room]!;
  const N = 32;
  const lut = lutBytes('cinematic', 'ffx', R.room, R.palette as never, 'bold', null, true);
  const grade = (c: readonly number[]): number[] => {
    const k = c.map((x) => Math.min(N - 1, Math.max(0, Math.round(Math.sqrt(x / 2) * (N - 1)))));
    const o = ((k[2]! * N + k[1]!) * N + k[0]!) * 4;
    return [lut[o]! / 255, lut[o + 1]! / 255, lut[o + 2]! / 255];
  };
  const luma = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;

  it('has a row the engine finds, in the table `ProGradeFfx` supplies, with the light as the fixed cone the camera carries (the painted point the cone follows)', () => {
    expect(proRoom(R.room)).toBe(room);
    expect(FFX_B3B_ARENA[R.room]).toBe(room);
    expect(room.cone).toBeDefined();
    expect(room.cone!.follow).toBe(false);
    const paint = room.cone!.paint!;
    // the arena's cone is anchored to the light the look rows name (the via's cone sits at the far door, 0.16 lower on the plate than the haze that `findLight` picks)
    if (R.room === 'via-purifico') {
      expect(paint.u).toBeCloseTo(0.5, 2);
      expect(paint.v).toBeCloseTo(0.7, 2);
    } else {
      expect(paint.u).toBeCloseTo(R.light.u, 2);
      expect(paint.v).toBeCloseTo(R.light.v, 2);
    }
    // the frame point it starts from is where that painted point stands at the idle rig (16:9; uv from the bottom-left): offline projection through the scene's own rig
    const [fu, fv] = frameOf(R.idle, plateWorld(R, paint.u, paint.v));
    expect(Math.abs(room.cone!.u - fu)).toBeLessThan(0.03);
    expect(Math.abs(room.cone!.v - fv)).toBeLessThan(0.03);
    expect(room.cone!.strength).toBeGreaterThan(0);
    expect(room.cone!.strength).toBeLessThan(0.4); // a cone, not a floodlight: Chapter II's is 0.30, Chapter I's 0.16
  });

  it('grades the plate to the booth grammar: the light and the accent stay bright, the bulk falls to deep shadow (the engine\'s own LUT over colours read off the plate)', () => {
    if (R.room === 'dreams-end') {
      const eye = grade([0.998, 0.741, 0.267]);
      const flame = grade([0.989, 0.695, 0.395]);
      const cloud = grade([0.35, 0.1, 0.12]);
      const dark = grade([0.15, 0.05, 0.07]);
      expect(luma(eye)).toBeGreaterThan(0.85);
      expect(luma(flame)).toBeGreaterThan(0.85); // the one accent
      expect(luma(cloud)).toBeLessThan(0.1);
      expect(luma(dark)).toBeLessThan(0.03);
      expect(luma(eye)).toBeGreaterThan(luma(cloud) * 8);
      expect(eye[0]).toBeGreaterThan(eye[2]!); // warm: red over blue
    } else if (R.room === 'garden-of-pain') {
      const glow = grade([0.6, 0.35, 0.59]);
      const terrace = grade([0.774, 0.328, 0.512]);
      const sky = grade([0.18, 0.22, 0.64]);
      const rock = grade([0.12, 0.1, 0.3]);
      expect(luma(glow)).toBeGreaterThan(0.4);
      expect(luma(terrace)).toBeGreaterThan(0.4); // the pink accent is kept
      expect(luma(sky)).toBeLessThan(0.15);
      expect(luma(rock)).toBeLessThan(0.05);
      expect(luma(glow)).toBeGreaterThan(luma(sky) * 3);
      expect(terrace[0]).toBeGreaterThan(terrace[1]! * 2); // pink, not grey
    } else {
      const floor = grade([0.476, 0.579, 0.708]); // the far door's light lying in the wet floor
      const lamp = grade([0.82, 0.154, 0.105]);
      const wall = grade([0.1, 0.1, 0.12]);
      expect(luma(floor)).toBeGreaterThan(0.85);
      expect(lamp[0]).toBeGreaterThan(0.6); // Bailey's red lamps (O-3 A) stay red and bright
      expect(lamp[0]).toBeGreaterThan(lamp[1]! * 4);
      expect(luma(wall)).toBeLessThan(0.08);
      expect(luma(floor)).toBeGreaterThan(luma(wall) * 10);
    }
  });

  it("grades the air in its own colours (the haze and the vignette tint are the room's, not Chapter I's teal)", () => {
    const h = room.haze.colour;
    if (R.room === 'dreams-end') expect(h[0]).toBeGreaterThan(h[2]!); // ember-red
    if (R.room === 'garden-of-pain') expect(h[2]).toBeGreaterThan(h[0]!); // violet
    if (R.room === 'via-purifico') expect(h[0]).toBeGreaterThan(h[1]!); // dull red
    expect(room.vignette.amount).toBeGreaterThan(0.4);
    expect(room.lightColor.every((x) => x >= 0 && x <= 1)).toBe(true);
  });
});

describe('the arena is [ours] and says so: the rows name their still, the handoff that carries it is committed and names it (hard rule 9: a still beside Chapter I is owed)', () => {
  it('ProGradeFfx.ts, the handoff and the plate-grade still all say the same name', () => {
    const root = resolve(__dirname, '../..');
    const src = readFileSync(resolve(root, 'src/engine/look/pro/ProGradeFfx.ts'), 'utf8');
    expect(src).toMatch(/Every number is \[ours\]/);
    expect(src).toMatch(/booth-ffx-b3b-plate-grade\.png/);
    expect(src).toMatch(/a still beside Chapter I is owed/);
    const handoff = resolve(root, 'docs/handoff/booth-ffx-b3b.md');
    expect(existsSync(handoff)).toBe(true);
    const note = readFileSync(handoff, 'utf8');
    expect(note).toContain('booth-ffx-b3b-plate-grade.png');
    // a source comment that cites "job J<n> of the handoff" names the job the note defines under that number (the earlier batches' review found three citing another note's numbers)
    for (const m of src.matchAll(/job J(\d+) of the handoff/g)) expect(note, `J${m[1]}`).toMatch(new RegExp(`\\*\\*J${m[1]}, the before and after still pair`));
  });

  it('every job a hold in DemoGate.PIECE_HOLDS cites is defined in the note under that number and for that piece (J2 decides `cam`, J5 is the KO per dress that decides `moments`)', () => {
    const note = readFileSync(resolve(__dirname, '../..', 'docs/handoff/booth-ffx-b3b.md'), 'utf8');
    const JOB: Readonly<Record<string, RegExp>> = { cam: /\*\*J2 \(decides `cam`\)/, moments: /\*\*J5, a KO per dress/ };
    let cited = 0;
    for (const id of ['braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico'])
      for (const piece of ['cam', 'moments'] as const) {
        const why = treatedHold(id, piece);
        if (why === undefined) continue;
        const jobs = [...why.matchAll(/job J(\d+) of docs\/handoff\/booth-ffx-b3b\.md/g)].map((m) => m[1]);
        expect(jobs, `${id} ${piece}`).toEqual([piece === 'cam' ? '2' : '5']);
        expect(note, `${id} ${piece}`).toMatch(JOB[piece]!);
        cited++;
      }
    expect(cited).toBe(5); // III moments, XII cam and moments, XIV cam and moments (booth-b3 M1)
  });
});

/** The combatant ids every link of each chapter stages, and the ones with no actor to tag (the Mortiphasm discs are figure-less anchors, `isPart`). */
const NO_ACTOR = new Set(['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4']);
async function idsOf(id: string): Promise<string[]> {
  const out: string[] = [];
  let g: NonNullable<Awaited<ReturnType<typeof findEnemyGroup>>> | undefined = getChapter(id)!.enemyGroupRef;
  while (g !== undefined) {
    for (const e of g.enemies) out.push(e.id);
    g = g.nextGroupId === undefined ? undefined : ((await findEnemyGroup(g.nextGroupId)) ?? undefined);
  }
  return out;
}

describe('the boss and the rim', () => {
  it('every foe of every link of the three chapters (the default roster of Chapter III) is flagged by combatant id, FFX only, except the figure-less discs; nothing else is flagged by accident', async () => {
    const all: string[] = [];
    for (const R of ROOMS) all.push(...(await idsOf(R.chapter)));
    expect(new Set(all).size).toBeGreaterThanOrEqual(14); // BFA, two Pagodas, five possessed aeons, Yu Yevon, Omnis, four discs, Isaaru and his three aeons
    for (const id of all) {
      if (NO_ACTOR.has(id)) {
        expect(Object.keys(TREATED_RIM_FOES), id).not.toContain(id);
        continue;
      }
      expect(TREATED_RIM_FOES[id], id).toBe('ffx');
    }
    // the roster beyond the default (the aeons Yuna may own: Anima, Yojimbo and the Magus Sisters) is flagged too, so a longer gauntlet draws one clean edge
    for (const id of ['possessed-anima', 'possessed-yojimbo', 'possessed-cindy', 'possessed-sandy', 'possessed-mindy']) expect(TREATED_RIM_FOES[id], id).toBe('ffx');
  });

  it('under all the foes draw no screen-space rim in their chapter (the aeons are the party\'s own paintings, whose side draws none), the party draws none, a stranger keeps its rim; under `?treated=pack` and in another chapter nothing is flagged', () => {
    setTreatedScope('all');
    setDemoChapter('braskas-final-aeon');
    setBossClean('clean');
    setPartyRim('off');
    const rim = (id: string, side: string): boolean => {
      const o = new Object3D();
      tagRimFigure(o, id, side);
      return rimSkipOf(o);
    };
    for (const id of ['braskas-final-aeon', 'yu-pagoda-left', 'yu-yevon', 'possessed-ifrit']) expect(rim(id, 'enemy'), id).toBe(true);
    expect(rim('tidus', 'party')).toBe(true);
    expect(rim('valefor', 'aeon')).toBe(true);
    expect(rim('some-other-foe', 'enemy')).toBe(false);
    setDemoChapter('isaaru-via-purifico');
    for (const id of ['isaaru', 'grothia', 'pterya', 'spathi']) expect(rim(id, 'enemy'), id).toBe(true);
    setDemoChapter('seymour-omnis');
    expect(rim('seymour-omnis', 'enemy')).toBe(true);
    setTreatedScope('pack');
    expect(rim('seymour-omnis', 'enemy')).toBe(false);
    setTreatedScope('all');
    setDemoChapter('mirror-aeons'); // a chapter nobody has treated yet
    expect(rim('seymour-omnis', 'enemy')).toBe(false);
  });

  it('has NO footprint rows and NO re-cut art entries, on purpose (the measured reasons are in `RimFigures.ts` and the handoff): the foes\' art ids are not `BOSS_CLEAN_ARTS`, so `bossCleanOn(art)` and the cut-out card stay false', () => {
    setTreatedScope('all');
    setDemoChapter('braskas-final-aeon');
    setBossClean('clean');
    for (const art of ['braskas-final-aeon-1', 'braskas-final-aeon-2', 'yu-pagoda', 'yu-yevon', 'valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'seymour-omnis', 'isaaru', 'grothia', 'pterya', 'spathi']) {
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
  it('none of the three is a swap-scope exception, so the stance and cause picks and the smear all play (no `smear` hold is owed); all three are in the wide scope', () => {
    setTreatedScope('all');
    setSwapScope('wide'); // the page's default (`SCOPE_DEFAULT`): under node there is no page, and the scope would read `pack`
    setCurvesMode('real-snappy');
    setSmearStyle('paint');
    setStanceMode('v1a');
    setCauseMode('pick');
    for (const R of ROOMS) {
      expect(scopeExcepted(R.chapter), R.chapter).toBe(false);
      expect(Object.keys(SCOPE_EXCEPTIONS), R.chapter).not.toContain(R.chapter);
      expect(WIDE_CHAPTERS, R.chapter).toContain(R.chapter);
      expect(chapterInScope(R.chapter, 'wide'), R.chapter).toBe(true);
      setDemoChapter(R.chapter);
      expect(swapsInScope(), R.chapter).toBe(true);
      expect(smearOn(), R.chapter).toBe(true);
      expect(stanceNow(), R.chapter).toBe('v1a');
      expect(swapHow('contact'), R.chapter).not.toBe('today');
    }
  });

  it('the victory is the FFX cheer (`pose`: only Zanarkand withholds it, research/ffx-vs-ffx2-presentation.md 2.1), the registry says FFX, and the shipped scene is the room the rows are for (the registered record of Chapters XII and XIV names a placeholder scene: the ship layer sets the real one)', () => {
    for (const R of ROOMS) {
      expect(getChapterMeta(R.chapter)?.victoryPose ?? 'pose', R.chapter).toBe('pose');
      expect(victoryKind(getChapterMeta(R.chapter)?.victoryPose), R.chapter).toBe('cheer');
      expect(getChapter(R.chapter)?.game, R.chapter).toBe('ffx');
      expect(getChapter(R.chapter)?.sceneKey, R.chapter).toBe(R.room);
    }
  });

  it("the real clips are FFX rows by name: Tidus, Yuna and Auron have rows (the party of III and XII, Yuna alone in XIV), the foes and the aeons play the house curves; the FFX-2 dress rule never applies here", () => {
    setTreatedScope('all');
    for (const id of ['tidus', 'yuna', 'auron']) expect(realRowOf('ffx', id), id).toBeDefined();
    for (const id of ['braskas-final-aeon-1', 'yu-yevon', 'seymour-omnis', 'isaaru', 'grothia', 'spathi']) expect(realRowOf('ffx', id), id).toBeUndefined();
    expect(realKeyOf('yuna', 'ffx')).toBe('yuna');
    expect(realKeyOf('yuna-gunner', 'ffx2', true)).toBeUndefined(); // and FFX-2's strict rule is unchanged
  });
});
