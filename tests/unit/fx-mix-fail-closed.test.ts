/**
 * Round 19's fix batch for the MAX mix's CHAPTER FRAMING (D-316), `critic/rounds/round-19.md`:
 *
 * - PR-0307 (FFX Ch II): Yunalesca is not a colossus (her master pulled the camera past the Zanarkand Dome plate's edge at every
 *   aspect), and a colossus master is held when it shows more of the plate's edge than today's rig does;
 * - PR-0310 (both): the rest gap between party and boss is enforced, not promised;
 * - PR-0312, the FFX half: the Sensor card's pinned place is counted for a colossus master.
 * (The DRESSPHERE SHOT's rules are `fx-mix-dressphere-shot.test.ts`; the FFX-2 cards' fade is `ffx2-action-fade-menu.test.ts`.)
 *
 * Game case per describe name. The recorded plate coverage of every chapter still in COLOSSUS at five aspects is
 * `tests/fixtures/colossus-plate.json` (measured from real runs; see docs/handoff/r36fix.md).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three';
import { classify, keepsToday, scaleTarget } from '../../src/engine/fx/mix/masters.ts';
import { cameraAt, figBox, type Fig, type Mask, type Pose } from '../../src/engine/fx/mix/geometry.ts';
import { fitClear, limitsFor, type Field } from '../../src/engine/fx/mix/clearance.ts';
import { plateExcess, plateMiss, plateOf, restGap, type Plate } from '../../src/engine/fx/mix/plate.ts';
import { sensorSlab } from '../../src/engine/fx/mix/hudPanels.ts';

const W = 1600;
const H = 900;
const field = (panels: Field['panels'] = []): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
const fig = (x: number, z: number, h: number, enemy = false, id = 'f', mask?: Mask): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.25, enemy, id, ...(mask ? { mask } : {}) });
const pose = (z = 12, y = 1.6, ly = 1.2, fov = 32): Pose => ({ pos: new Vector3(0, y, z), look: new Vector3(0, ly, 0), fov });
/** A plate hung at the floor line, 34 wide, 20 tall, at z = -12 (the Highbridge's shape). */
const plate = (): Plate => ({ o: new Vector3(0, 10, -12), u: new Vector3(1, 0, 0), v: new Vector3(0, 1, 0), n: new Vector3(0, 0, 1), hw: 17, hh: 10 });

describe('Yunalesca keeps today\'s rig (FFX only, Chapter II; PR-0307)', () => {
  it('is no colossus, so there is no master and no BOSS SCALE for her', () => {
    expect(classify(['yunalesca'])).not.toBe('colossus');
    expect(classify(['yunalesca', 'yunalesca-2'])).not.toBe('colossus');
    expect(scaleTarget('yunalesca')).toBeNull();
    expect(keepsToday(['yunalesca'])).toBe(false); // today's rig through the clearance, as ever
  });

  it('every other FFX colossus and Bahamut still is one', () => {
    for (const id of ['seymour-natus', 'yojimbo', 'braskas-final-aeon', 'evrae', 'ffx2-bahamut', 'bahamut']) expect(classify([id])).toBe('colossus');
    expect(scaleTarget('seymour-natus')).toBe(2.2);
    expect(scaleTarget('ffx2-bahamut')).toBe(2.0);
  });
});

describe('the plate gate (both games; PR-0307)', () => {
  it('a frame inside the plate shows none of the void; one that looks over its top shows some, and the corners say so', () => {
    const inside = plateMiss(plate(), pose(14, 4, 6, 30), W, H);
    expect(inside.share).toBe(0);
    expect(inside.corners).toBe(0);
    const over = plateMiss(plate(), pose(14, 4, 14, 30), W, H); // aimed high: the top rows run past the plate
    expect(over.share).toBeGreaterThan(0.1);
    expect(over.corners).toBeGreaterThanOrEqual(2);
  });

  it('below the plate\'s bottom edge is the ground plane, not a void', () => {
    const down = plateMiss(plate(), pose(14, 4, -2, 30), W, H); // looks down past the plate's foot
    expect(down.share).toBe(0);
  });

  it('a frame wider than the plate misses it at the sides', () => {
    const wide = plateMiss(plate(), pose(30, 4, 6, 50), W, H);
    expect(wide.share).toBeGreaterThan(0);
  });

  it('the lens shift moves the frame over the plate\'s edge too', () => {
    const base = pose(14, 4, 9, 30);
    const edge = plateMiss(plate(), base, W, H, [0, 0]);
    const shifted = plateMiss(plate(), base, W, H, [0, 260]); // content down 260 px: the frame's top shows what lay above
    expect(shifted.share).toBeGreaterThanOrEqual(edge.share);
  });

  it('the excess is over today\'s own miss plus a sliver: a plate today already runs past is never held against a master that shows no more', () => {
    const today = plateMiss(plate(), pose(14, 4, 12, 30), W, H);
    expect(today.share).toBeGreaterThan(0);
    expect(plateExcess(plate(), today, pose(14, 4, 12, 30), W, H, [0, 0])).toBe(0);
    expect(plateExcess(plate(), today, pose(14, 4, 16, 30), W, H, [0, 0])).toBeGreaterThan(0);
    expect(plateExcess(null, today, pose(14, 4, 16, 30), W, H, [0, 0])).toBe(0); // no plate known: no gate
  });

  it('reads the plate of a scene from the mesh Backdrop hangs, with its world matrix and scale', () => {
    const root = new Mesh();
    const main = new Mesh(new PlaneGeometry(34, 20), new MeshBasicMaterial());
    main.name = 'backdrop-painting';
    main.position.set(0, 8, -12);
    main.scale.setScalar(2);
    root.add(main);
    const p = plateOf(root)!;
    expect(p.hw).toBeCloseTo(34, 6);
    expect(p.hh).toBeCloseTo(20, 6);
    expect(p.o.toArray()).toEqual([0, 8, -12]);
    expect(p.n.z).toBeCloseTo(1, 6);
    expect(plateOf(new Mesh())).toBeNull();
  });

  it('the fit fails closed: a pose the gate holds ranks under every pose that passes it, and the pick shows no more edge than today rig', () => {
    const today = pose(14, 3, 5, 30);
    const master = pose(14, 2, 16, 30); // authored low-and-looking-up: its top rows run past the plate
    const party = [fig(-2.2, 0, 1.8, false, 'a'), fig(-1.2, 0.2, 1.7, false, 'b')];
    const boss = fig(2.5, -2, 4.5, true, 'boss');
    const figs = [...party, boss];
    const { limits, rule } = limitsFor(figs, today, field());
    const todayMiss = plateMiss(plate(), today, W, H);
    expect(todayMiss.share).toBe(0);
    expect(plateExcess(plate(), todayMiss, master, W, H, [0, 0])).toBeGreaterThan(0); // the master itself is held
    const closed = fitClear(master, today, figs, field(), true, limits, rule, (p, lens) => plateExcess(plate(), todayMiss, p, W, H, lens));
    expect(closed.gate).toBe(0);
    expect(plateMiss(plate(), closed.pose, W, H, closed.lens).share).toBeLessThanOrEqual(todayMiss.share + 0.004);
    // A gate that holds everything short of today's rig itself leaves exactly today's rig (blend 1): the fallback is always there.
    const todayOnly = fitClear(master, today, figs, field(), true, limits, rule, (p) => (p.look.distanceTo(today.look) < 1e-6 ? 0 : 1));
    expect(todayOnly.blend).toBe(1);
    expect(todayOnly.gate).toBe(0);
  });
});

describe('the rest gap (both games; PR-0310)', () => {
  const cam = cameraAt(pose(), W / H);
  const box = (f: Fig) => figBox(f, cam, W, H);

  it('is positive when the party stands clear of the boss and negative when a member stands inside it', () => {
    const party = fig(0, 0, 1.8, false, 'paine');
    const clear = fig(6, -3, 6, true, 'bahamut', { at: () => 1 });
    const inside = fig(0.1, -3, 6, true, 'bahamut', { at: () => 1 });
    expect(restGap([box(party), box(clear)], [party, clear])).toBeGreaterThan(0);
    expect(restGap([box(party), box(inside)], [party, inside])).toBeLessThanOrEqual(0);
  });

  it('a member in a serpent\'s empty sky (a box overlap with no painted pixel behind it) is a hairline gap, not a hit', () => {
    const party = fig(0, 0, 1.8, false, 'paine');
    const sky = fig(0.2, -3, 6, true, 'bahamut', { at: () => 0 });
    expect(restGap([box(party), box(sky)], [party, sky])).toBeGreaterThan(0);
  });

  it('the nearest approach rules: any member inside makes the gap non-positive', () => {
    const a = fig(-3, 0, 1.8, false, 'a');
    const b = fig(0.1, 0, 1.8, false, 'b');
    const boss = fig(0.2, -3, 6, true, 'boss', { at: () => 1 });
    expect(restGap([box(a), box(b), box(boss)], [a, b, boss])).toBeLessThanOrEqual(0);
  });
});

describe('the Sensor card under a colossus (FFX only; PR-0312)', () => {
  it('FFX: the Sensor card\'s pinned place is on the stage grid (430,166, 119 x 88) and only in FFX on the desktop', () => {
    const s = sensorSlab('ffx', 1600, 900, false)!;
    expect(s.l).toBeCloseTo(430 * 2.5, 6);
    expect(s.t).toBeCloseTo(166 * 2.5, 6);
    expect(s.r - s.l).toBeCloseTo(119 * 2.5, 6);
    const wide = sensorSlab('ffx', 2000, 1012, false)!; // letterboxed: the stage is centred
    expect(wide.l).toBeCloseTo((2000 - 640 * (1012 / 360)) / 2 + 430 * (1012 / 360), 4);
    expect(sensorSlab('ffx2', 1600, 900, false)).toBeNull();
    expect(sensorSlab('ffx', 390, 844, true)).toBeNull();
  });
});


describe('every colossus chapter keeps its frustum on its painted plate (both games; PR-0307)', () => {
  type Rec = { chosen: number; today: number; corners: number; todayCorners: number; scale: number };
  const fixture = JSON.parse(readFileSync(new URL('../fixtures/colossus-plate.json', import.meta.url), 'utf8')) as { chapters: Record<string, Record<string, Rec>> };
  /** Each chapter's enemy subjects (the painted subject ids the framing classifies, read from `framing.report.tries`). */
  const ENEMIES: Record<string, string[]> = {
    'yunalesca': ['yunalesca-1'],
    'seymour-natus': ['seymour-natus', 'mortibody'],
    'yojimbo-cavern': ['yojimbo-cavern', 'ginnem', 'daigoro'],
    'braskas-final-aeon': ['braskas-final-aeon-1', 'yu-pagoda'],
    'evrae-airship': ['evrae'],
    'ffx2-bahamut': ['ffx2-bahamut'],
  };
  const SIZES = ['1600x900', '1920x1080', '2000x1012', '2560x1440', '2560x1080'];
  const colossus = Object.keys(ENEMIES).filter((c) => classify(ENEMIES[c]!) === 'colossus' && !keepsToday(ENEMIES[c]!));

  it('Yunalesca is out of the set and the other five are in it', () => {
    expect(colossus.sort()).toEqual(['braskas-final-aeon', 'evrae-airship', 'ffx2-bahamut', 'seymour-natus', 'yojimbo-cavern']);
  });

  it('has a recorded run for every chapter in the set at 1600x900, 1920x1080, 2000x1012, 2560x1440 and 2560x1080', () => {
    expect(Object.keys(fixture.chapters).sort()).toEqual(colossus.sort());
    for (const c of colossus) expect(Object.keys(fixture.chapters[c]!).sort()).toEqual([...SIZES].sort());
  });

  it('no frame corner leaves the plate beyond where the chapter own rig already does, and the share past it is no larger', () => {
    for (const c of colossus)
      for (const s of SIZES) {
        const r = fixture.chapters[c]![s]!;
        expect(r.corners, `${c} ${s} corners`).toBeLessThanOrEqual(r.todayCorners);
        expect(r.chosen, `${c} ${s} share`).toBeLessThanOrEqual(r.today + 0.004);
      }
  });

  it('where the chapter own rig keeps the whole frame on the plate (the four 16:9-ish aspects, bar Evrae at 2000x1012), so does the pick: no corner leaves it', () => {
    for (const c of colossus)
      for (const s of SIZES) {
        const r = fixture.chapters[c]![s]!;
        if (r.todayCorners === 0) expect(r.corners, `${c} ${s}`).toBe(0);
      }
  });
});
