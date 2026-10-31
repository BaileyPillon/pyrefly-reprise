/**
 * THE ROWS OF THE LAST FIVE LISTED CHAPTERS (release 71, branch `booth-b4-last`; Bailey 2026-10-30: the booth treatment for every listed chapter). Evrae (Chapter VIII, FFX) and Sin's face (Chapter XVIII, FFX) are the two chapters with the HD-2D look and its rows: both are the Fahrenheit's deck,
 * the party stands on one arc, and the plates are Evrae's blue sky and the Bevelle plate at golden dusk (mean luminance 0.373 and 0.388, against Chapter I's 0.418 and the Farplane's clipped 0.628). The Mirror Aeons chapter and Chapter XVI hold the room looks (`PieceHoldsLast.ts`), so they have NO rows
 * here and answer release 68's frame; Chapter XVII is out, with none.
 *
 * Pinned: the look rows exist in every table the engine reads and say what the handoff says (the sharp band 0.42 at the NEAR idle rig, the lights the plates' own brightest blobs); the rooms have no embers (the sources give the open sky no pyreflies) and every row is the engine's own LUT, graded
 * offline beside Chapter I and II (`docs/screenshots/booth-b4-last-plate-grade.png`), whose grey ramp is monotone and whose highlights do not clip (white in leaves under 0.98, a bright cloud under 0.93); the rim flags and the holds' rows are in `booth-b4-last-classes` and `booth-b4-last-holds`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, lutBytes } from '../../src/engine/look/LookGrades.ts';
import { BOLD_ROOMS } from '../../src/engine/look/LookGradesBold.ts';
import { ROOM_BOLD, roomBold } from '../../src/engine/look/LookBoldConfig.ts';
import { PRO_ARENA, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { FFX_LAST_ARENA } from '../../src/engine/look/pro/ProGradeFfxLast.ts';
import { setTreatedScope } from '../../src/engine/motion/DemoGate.ts';

afterEach(() => setTreatedScope(null));

const ROOT = join(__dirname, '..', '..');
const ROOMS = {
  'evrae-airship': { room: 'evrae-airship-deck', light: { u: 0.311, v: 0.361 }, palette: { key: 0x827b7f, sky: 0x656d7e } }, // the scenes' own sample bands over the plate (`evrae-airship-deck.ts`): key [0.3, 0.44], sky [0.02, 0.2]
  'sin-face': { room: 'sin-fahrenheit-bevelle', light: { u: 0.483, v: 0.522 }, palette: { key: 0x9f806d, sky: 0x77636f } },
} as const;

describe('the look rows of Evrae and Sin\'s face, in every table the engine reads', () => {
  it('both chapters have the bold HD-2D row and answer it under all (and release 68 under pack); the Mirror Aeons chapter and Chapter XVI have none; Chapter XVII has none', () => {
    for (const id of Object.keys(ROOMS)) expect(CHAPTER_LOOKS[id], id).toEqual({ name: 'hd2d', strength: 'bold' });
    for (const id of ['mirror-aeons', 'ffx2-ixion-djose', 'sin-fins-core']) expect(Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, id), id).toBe(false);
    setTreatedScope('all');
    for (const id of Object.keys(ROOMS)) expect(chapterLook(id), id).toEqual({ name: 'hd2d', strength: 'bold' });
    for (const id of ['mirror-aeons', 'ffx2-ixion-djose', 'sin-fins-core']) expect(chapterLook(id), id).toBeNull();
    setTreatedScope('pack');
    for (const id of Object.keys(ROOMS)) expect(chapterLook(id), id).toBeNull();
  });

  it("the sharp band is the booth rule at the NEAR idle rig (0.42: the figures stand higher than in any approved room, the middle of their feet and knees 0.272 against Chapter I's 0.187) and the light is the plate's own brightest blob, in both looks", () => {
    for (const { room, light } of Object.values(ROOMS)) {
      expect(ROOM_LOOKS.hd2d[room]!.focus, room).toBe(0.42);
      expect(ROOM_LOOKS.hd2d[room]!.light!.u, room).toBe(light.u);
      expect(ROOM_LOOKS.hd2d[room]!.light!.v, room).toBe(light.v);
      expect(ROOM_LOOKS.cinematic[room]!.light, room).toEqual(ROOM_LOOKS.hd2d[room]!.light);
      expect(BOLD_ROOMS.hd2d[room]!.focus, room).toBe(0.42);
      expect(BOLD_ROOMS.cinematic[room], room).toBeDefined();
      expect(BOLD_ROOMS.cinematic[room]!.fog, room).toBeDefined();
    }
  });

  it("the exposure is Chapter I's (0.7 for the hd2d bold grade, 0.64 for the cinematic one): the plates are as luminous as its snow, and nowhere near the Farplane's 0.628 that clipped", () => {
    for (const { room } of Object.values(ROOMS)) {
      expect(BOLD_ROOMS.hd2d[room]!.recipe!.exposure, room).toBe(0.7);
      expect(BOLD_ROOMS.hd2d[room]!.recipe!.exposure!, room).toBeLessThanOrEqual(BOLD_ROOMS.hd2d['gagazet']!.recipe!.exposure!);
      expect(BOLD_ROOMS.cinematic[room]!.recipe!.exposure, room).toBe(0.64);
    }
  });

  it('NO EMBERS in either room (`pyreflyCanon`: the airship\'s open sky has no pyreflies), a moderate metal gloss, the rim the key\'s warm colour and the fog tinted to the sky; unlisted rooms of the other three chapters keep the default (no row, no gloss)', () => {
    for (const { room } of Object.values(ROOMS)) {
      expect(ROOM_BOLD[room]!.embers, room).toEqual([]);
      expect(ROOM_BOLD[room]!.gloss, room).toBe(0.45);
      expect(roomBold(room)).toBe(ROOM_BOLD[room]);
    }
    expect(ROOM_BOLD['evrae-airship-deck']!.rim![2]).toBeGreaterThan(0.7); // the cream key, never a white line
    for (const room of ['sin-fahrenheit-flight', 'mirror-aeons', 'djose-chamber-provisional']) expect(Object.prototype.hasOwnProperty.call(ROOM_BOLD, room), room).toBe(false);
  });
});

describe("the pro arenas, graded through the engine's own LUT", () => {
  it("each room's row is the table's (`PRO_ARENA` spreads `ProGradeFfxLast`), one cone from the plate's light (the frame point it starts from is the light at the NEAR idle rig), exposure Chapter I's or under the largest approved (1.5)", () => {
    for (const { room, light } of Object.values(ROOMS)) {
      expect(PRO_ARENA[room], room).toBe(FFX_LAST_ARENA[room]);
      expect(proRoom(room), room).toBeDefined();
      const cone = proRoom(room)!.cone!;
      expect(cone.follow, room).toBe(false);
      expect(cone.paint, room).toEqual(light);
      expect(proRoom(room)!.colour.exposure, room).toBeLessThanOrEqual(1.5);
    }
    expect(proRoom('evrae-airship-deck')!.cone).toMatchObject({ u: 0.138, v: 0.833 }); // frame u, v from the bottom at 16:9: the cloud bank upper left, through the deck's roll of -11.6 degrees
    expect(proRoom('sin-fahrenheit-bevelle')!.cone).toMatchObject({ u: 0.375, v: 0.483 }); // the sun, behind the party's heads
    for (const room of ['sin-fahrenheit-flight', 'mirror-aeons', 'djose-chamber-provisional']) expect(proRoom(room), room).toBeUndefined();
  });

  it("each arena's light is the colour of its plate's own light (review m4, a mutation that survived the family): Evrae's cloud bank is a warm cream, Sin's setting sun a deeper gold, and neither is blue", () => {
    expect(proRoom('evrae-airship-deck')!.lightColor).toEqual([1.0, 0.9, 0.78]);
    expect(proRoom('sin-fahrenheit-bevelle')!.lightColor).toEqual([1.0, 0.86, 0.6]);
    for (const room of ['evrae-airship-deck', 'sin-fahrenheit-bevelle']) {
      const [r, g, b] = proRoom(room)!.lightColor!;
      expect(r, room).toBeGreaterThanOrEqual(g);
      expect(g, room).toBeGreaterThan(b);
    }
    // the plate's own light samples (rows above): the cloud bank rgb 0.99 0.92 0.88, the sun 0.98 0.94 0.77; the arena's light is warmer than the sample (a cone's colour is the light's, not the paint's)
    expect(proRoom('sin-fahrenheit-bevelle')!.lightColor![2]).toBeLessThan(proRoom('evrae-airship-deck')!.lightColor![2]);
  });

  it('the LUTs are monotone along the grey diagonal and clip nothing: white in leaves under 0.98 and a bright cloud (0.85 grey) under 0.93, in the hd2d bold grade and in the arena, for both rooms', () => {
    for (const { room, palette } of Object.values(ROOMS)) {
      for (const [kind, lut] of [['hd2d bold', lutBytes('hd2d', 'ffx', room, palette, 'bold', null, false)], ['pro arena', lutBytes('cinematic', 'ffx', room, palette, 'bold', null, true)]] as const) {
        const at = (c: number): number => {
          const k = Math.round(Math.sqrt(c / 2) * 31);
          const o = ((k * 32 + k) * 32 + k) * 4;
          return (0.2126 * lut[o]! + 0.7152 * lut[o + 1]! + 0.0722 * lut[o + 2]!) / 255;
        };
        let prev = -1;
        for (let k = 0; k < 32; k++) {
          const v = (0.2126 * lut[((k * 32 + k) * 32 + k) * 4]! + 0.7152 * lut[((k * 32 + k) * 32 + k) * 4 + 1]! + 0.0722 * lut[((k * 32 + k) * 32 + k) * 4 + 2]!) / 255;
          expect(v, `${room} ${kind} node ${k}`).toBeGreaterThanOrEqual(prev - 0.002);
          prev = v;
        }
        expect(at(1.0), `${room} ${kind} white`).toBeLessThan(0.98);
        expect(at(0.85), `${room} ${kind} cloud`).toBeLessThan(0.93);
        expect(at(0.3), `${room} ${kind} mid-grey`).toBeGreaterThan(0.04);
      }
    }
  });
});

describe('the rows are [ours] and say so: set from the plates, graded offline, a still owed beside Chapter I (hard rule 9)', () => {
  it('ProGradeFfxLast.ts names the lane, the handoff and the still; the handoff is committed and names the still and the jobs that read it', () => {
    const src = readFileSync(join(ROOT, 'src/engine/look/pro/ProGradeFfxLast.ts'), 'utf8');
    expect(src).toMatch(/booth-b4-last/);
    expect(src).toMatch(/docs\/handoff\/booth-b4-last\.md/);
    expect(src).toMatch(/docs\/screenshots\/booth-b4-last-plate-grade\.png/);
    expect(src).toMatch(/\[ours\]/);
    expect(existsSync(join(ROOT, 'docs/screenshots/booth-b4-last-plate-grade.png'))).toBe(true);
    const doc = readFileSync(join(ROOT, 'docs/handoff/booth-b4-last.md'), 'utf8');
    expect(doc).toMatch(/booth-b4-last-plate-grade\.png/);
    expect(doc).toMatch(/Lifts when/);
  });
});
