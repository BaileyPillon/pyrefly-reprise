import { afterEach, describe, expect, it, vi } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { boxesOf, bossCoverOf, clearBoxes, limitsFor, overlapOf, type Field } from '../../src/engine/fx/mix/clearance.ts';
import {
  cardBox,
  fitPinned,
  paintedCover,
  parsePin,
  pinFor,
  pinnedExcess,
  pinnedLens,
  pinnedPose,
  PINNED_SCORE,
  pinOverride,
  pinSafe,
  SENSOR_HOME,
  SENSOR_SIZE,
  setPinOverride,
  stageOf,
  textSizeKey,
  type ColossusPin,
} from '../../src/engine/fx/mix/colossusPin.ts';
import { cameraAt, subjectId, type Actor, type Fig, type Mask, type Pose } from '../../src/engine/fx/mix/geometry.ts';
import { hudFree, predictedPanels, sensorSlab } from '../../src/engine/fx/mix/hudPanels.ts';
import { master } from '../../src/engine/fx/mix/masters.ts';
import { separate } from '../../src/engine/fx/mix/separate.ts';
import { Staging } from '../../src/engine/fx/mix/staging.ts';
import { ALL_ROWS, standFor, STAGE_TABLE } from '../../src/engine/fx/mix/stageTable.ts';

/**
 * Seymour Natus's pinned colossus master (FFX only, Chapter X; PR-0331, option N; Bailey 2026-10-03 D-353 "waits until it is deterministic", the
 * round 21 judgment page card F "Natus only, built as a per-chapter table, about 270 px"). The table is `stageTable.ts`'s row for Natus; what plays is
 * `colossusPin.ts`, `separate.ts` (pinned) and `framing.ts`. The picture itself (Natus's height, the card, the overlaps, over seeds and sizes, by real
 * keys) is proved in a browser: `docs/handoff/r39-natus.md`. Here: the table, the maths of the one candidate, and that the move of `separate` out of
 * `framing.ts` changed nothing for any other fight.
 */

const W = 1600;
const H = 900;
const field = (panels: Field['panels'] = []): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
const fig = (x: number, z: number, h: number, enemy = false, id = 'f', mask?: Mask): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.25, enemy, id, ...(mask ? { mask } : {}) });
const pose = (z = 18, y = 4.2, ly = 1.6, fov = 28): Pose => ({ pos: new Vector3(0, y, z), look: new Vector3(0, ly, 0), fov });
const natusRow = ALL_ROWS.find((r) => r.chapter === 'seymour-natus')!;
const PIN = natusRow.colossus![0]!.pin;

afterEach(() => {
  setPinOverride(null);
  vi.unstubAllGlobals();
});

describe("Natus's row (FFX only, Chapter X; PR-0331)", () => {
  it('is the only row that pins a colossus: Yunalesca, Braska\'s Final Aeon and Evrae keep what they had', () => {
    expect(ALL_ROWS.filter((r) => r.colossus).map((r) => r.chapter)).toEqual(['seymour-natus']);
    expect(STAGE_TABLE.map((r) => r.chapter)).toContain('seymour-natus');
    for (const id of ['yunalesca', 'braskas-final-aeon-1', 'evrae', 'yojimbo']) expect(natusRow.boss.test(id)).toBe(false);
  });

  it('moves nobody on the stage\'s own account (the scene pins both fiends and holds the party); the pinned master carries the whole answer', () => {
    expect(natusRow.party).toEqual({ right: 0, toward: 0 });
    expect(natusRow.enemy).toEqual({ right: 0, toward: 0 });
    expect(natusRow.enemyBy).toBeUndefined();
  });

  it('is found by the fiends of the fight, on a desktop FFX fight only (FFX-2 and the phone never see it)', () => {
    const s = standFor('ffx', ['seymour-natus', 'mortibody'], false)!;
    expect(s.chapter).toBe('seymour-natus');
    expect(s.colossus).toHaveLength(1);
    expect(standFor('ffx2', ['seymour-natus', 'mortibody'], false)).toBeNull();
    expect(standFor('ffx', ['seymour-natus', 'mortibody'], true)).toBeNull();
    expect(standFor('ffx', ['yojimbo'], false)).toBeNull();
  });

  it('writes one finite answer within the search\'s own limits, the same on every call (a table, not a solve)', () => {
    expect(PIN.frac).toBeGreaterThan(0);
    expect(PIN.frac).toBeLessThanOrEqual(1);
    expect(PIN.blend).toBeGreaterThanOrEqual(0);
    expect(PIN.blend).toBeLessThanOrEqual(1);
    expect(PIN.back).toBeGreaterThanOrEqual(1); // never closer than the master as authored
    expect(Math.abs(PIN.lens[0])).toBeLessThanOrEqual(0.08); // `fitClear` caps the lens shift at 8 % of the width
    expect(Math.abs(PIN.lens[1])).toBeLessThanOrEqual(0.04);
    expect(PIN.apart).toBeGreaterThanOrEqual(0);
    expect(PIN.bossApart).toBeGreaterThanOrEqual(0);
    expect(standFor('ffx', ['seymour-natus', 'mortibody'], false)!.colossus![0]!.pin).toBe(standFor('ffx', ['seymour-natus', 'mortibody'], false)!.colossus![0]!.pin);
    const [lo, hi] = natusRow.colossus![0]!.aspect;
    expect(lo).toBeLessThanOrEqual(1280 / 720);
    expect(hi).toBeGreaterThan(2000 / 1012); // the three sizes the critic reads, and the wide one between them
  });

  it('puts the Sensor card on the stage, clear of the turn rail and above the boss (the top band), not where the stylesheet leaves it', () => {
    const [cx, cy] = PIN.card;
    expect(cx - SENSOR_SIZE.lead).toBeGreaterThanOrEqual(0);
    expect(cx - SENSOR_SIZE.lead + SENSOR_SIZE.w).toBeLessThan(547.6); // the turn rail's left edge on the stage (`ffx-hud.css`, "clears the CTB rail's 547.6")
    expect(cy).toBeGreaterThanOrEqual(0);
    expect(cy + SENSOR_SIZE.h).toBeLessThan(166); // wholly above the stylesheet's own place, so it is off the boss's body whatever its height
    expect(cx).not.toBe(SENSOR_HOME[0]);
  });
});

describe('which answer plays (pinFor)', () => {
  const classes = natusRow.colossus;

  it('answers every window shape the table was proved at, and nothing outside it', () => {
    for (const a of [1280 / 720, 1366 / 768, 16 / 9, 1920 / 1080, 2000 / 1012, 2560 / 1080]) expect(pinFor(classes, a)).toBe(PIN);
    for (const a of [1440 / 900, 1024 / 768, 1.3, 2.6, 3.2]) expect(pinFor(classes, a)).toBeNull(); // 16:10 is not proved yet: it plays as today
    expect(pinFor(undefined, 16 / 9)).toBeNull();
    expect(pinFor([], 16 / 9)).toBeNull();
  });

  it('is off at TEXT SIZE 115 and 130 (the card grows about its bottom-right corner) and back at 100', () => {
    for (const ts of ['115', '130']) {
      vi.stubGlobal('document', { documentElement: { dataset: { textSize: ts } } });
      expect(textSizeKey()).toBe(ts);
      expect(pinFor(classes, 16 / 9)).toBeNull();
    }
    vi.stubGlobal('document', { documentElement: { dataset: { textSize: '100' } } });
    expect(textSizeKey()).toBe('');
    expect(pinFor(classes, 16 / 9)).toBe(PIN);
  });

  it('obeys a checks-only override: off plays today\'s framing, nine numbers play that answer in any window', () => {
    setPinOverride('off');
    expect(pinFor(classes, 16 / 9)).toBeNull();
    const o = parsePin('?natus=0.3,0.5,1.04,0.01,0,0.5,0.2,400,10')!;
    expect(o).toEqual({ frac: 0.3, blend: 0.5, back: 1.04, lens: [0.01, 0], apart: 0.5, bossApart: 0.2, card: [400, 10] });
    setPinOverride(o as ColossusPin);
    expect(pinOverride()).toBe(o);
    expect(pinFor(classes, 1.25)).toBe(o);
    expect(pinFor(undefined, 1.25)).toBeNull(); // a fight whose row pins nothing (any other chapter, FFX-2) is never asked
  });

  it('reads the query: off, nine numbers, anything else is no override', () => {
    expect(parsePin('')).toBeNull();
    expect(parsePin('?x=1')).toBeNull();
    expect(parsePin('?natus=off')).toBe('off');
    expect(parsePin('?natus=1,2,3')).toBeNull();
    expect(parsePin('?natus=0.3,0.5,1.04,0.01,0,0.5,0.2,400,abc')).toBeNull();
    expect(parsePin('?natus=0.3,0.5,1.04,0.01,0,0.5,0.2,400,10,5')).toBeNull();
  });
});

describe('the one candidate (pinnedPose, pinnedLens, cardBox)', () => {
  const master0: Pose = { pos: new Vector3(0, 2, 12), look: new Vector3(0.5, 2.4, 0), fov: 28 };
  const today: Pose = { pos: new Vector3(0, 5, 18), look: new Vector3(1, 1.8, 0), fov: 32 };

  it('is the master at blend 0 and today\'s rig at blend 1, stood back along its own view line', () => {
    const a = pinnedPose(master0, today, { blend: 0, back: 1 });
    expect(a.pos.distanceTo(master0.pos)).toBeLessThan(1e-9);
    expect(a.fov).toBe(28);
    const b = pinnedPose(master0, today, { blend: 1, back: 1 });
    expect(b.pos.distanceTo(today.pos)).toBeLessThan(1e-9);
    expect(b.look.distanceTo(today.look)).toBeLessThan(1e-9);
    expect(b.fov).toBe(32);
    const c = pinnedPose(master0, today, { blend: 0.5, back: 1.5 });
    const d = pinnedPose(master0, today, { blend: 0.5, back: 1 });
    expect(c.pos.distanceTo(c.look)).toBeCloseTo(1.5 * d.pos.distanceTo(d.look), 9);
    expect(c.look.distanceTo(d.look)).toBe(0);
    expect(c.fov).toBe(30);
  });

  it('is pure: the same inputs give the same pose, and the inputs are not written', () => {
    const before = master0.pos.clone();
    const a = pinnedPose(master0, today, PIN);
    const b = pinnedPose(master0, today, PIN);
    expect(a.pos.equals(b.pos)).toBe(true);
    expect(master0.pos.equals(before)).toBe(true);
  });

  it('turns the lens shares into canvas px', () => {
    expect(pinnedLens({ lens: [0.03, 0] }, 1600, 900)).toEqual([48, 0]);
    expect(pinnedLens({ lens: [0.03, -0.02] }, 2560, 1440)).toEqual([77, -29]);
  });

  it('puts the card where the HUD draws it: the open card\'s box at home matches what the DOM measured (1600x900 and 2000x1012)', () => {
    const a = cardBox(SENSOR_HOME, 1600, 900);
    expect([Math.round(a.l), Math.round(a.t), Math.round(a.r - a.l), Math.round(a.b - a.t)]).toEqual([1068, 415, 298, 220]); // measured: 1067, 415, 297, 220
    const b = cardBox(SENSOR_HOME, 2000, 1012);
    expect([Math.round(b.l), Math.round(b.t), Math.round(b.r - b.l), Math.round(b.b - b.t)]).toEqual([1301, 467, 335, 247]); // measured: 1300, 467, 334, 247
    expect(stageOf(2000, 1012).ox).toBeCloseTo(100.5, 0);
    expect(stageOf(1600, 900).ox).toBe(0);
    // and the pinned place is far from that home: the table's card is above the home slab the framing used to hold
    expect(cardBox(PIN.card, 1600, 900).b).toBeLessThan(sensorSlab('ffx', 1600, 900, false)!.t);
  });
});

describe('the gate for a pinned master (painted pixels, not boxes)', () => {
  /** A boss painted only in its lower half (the wings and ring fill the box with air above). */
  const lowerHalf: Mask = { at: (_x: number, y: number) => (y > 0.5 ? 1 : 0) };

  it('counts only the boss\'s painted pixels under the card: the card over the empty top covers nothing, over the painted half it covers its share', () => {
    const box = { l: 100, r: 300, t: 100, b: 500 };
    expect(paintedCover(box, lowerHalf, { l: 0, r: 400, t: 0, b: 250 })).toBe(0);
    const half = paintedCover(box, lowerHalf, { l: 0, r: 400, t: 400, b: 500 }); // the bottom quarter of the box: half of the painted rows, read on the gate's 14-row grid
    expect(half).toBeGreaterThan(0.4);
    expect(half).toBeLessThan(0.7);
    expect(paintedCover(box, lowerHalf, { l: 0, r: 400, t: 300, b: 500 })).toBe(1); // the whole painted half
    expect(paintedCover(box, lowerHalf, { l: 0, r: 400, t: 0, b: 600 })).toBe(1);
    expect(paintedCover(box, undefined, { l: 0, r: 400, t: 300, b: 500 })).toBeCloseTo(0.5, 5); // no silhouette: the box's own share
  });

  it('lets a card brush a boss part (a few percent) and not sit on one, and never lets it sit on a member', () => {
    const figs = [fig(-2, 5, 1.75, false, 'tidus'), fig(3, -2.6, 4, true, 'seymour-natus', lowerHalf)];
    const boxes = [
      { l: 500, r: 700, t: 500, b: 800 },
      { l: 1000, r: 1200, t: 200, b: 600 },
    ];
    const clear = { l: 900, r: 1300, t: 0, b: 260 }; // over the top (empty) of the boss: nothing painted
    expect(pinnedExcess(boxes, figs, clear, W)).toBe(0);
    const brush = { l: 900, r: 1300, t: 0, b: 420 }; // 20 of 200 painted rows of the lower half: 10 % of the painted pixels
    expect(pinnedExcess(boxes, figs, brush, W)).toBeGreaterThan(0.04);
    const onMember = { l: 450, r: 760, t: 450, b: 860 };
    expect(pinnedExcess(boxes, figs, onMember, W)).toBeGreaterThan(0.5);
  });

  it('holds a member inside the boss at rest (the rest gap), as before', () => {
    const figs = [fig(2.9, -2.5, 1.75, false, 'tidus'), fig(3, -2.6, 4, true, 'seymour-natus')];
    const boxes = boxesOf(cameraAt(pose(), W / H), figs, field());
    expect(pinnedExcess(boxes, figs, { l: 0, r: 10, t: 0, b: 10 }, W)).toBeGreaterThan(0);
  });
});

describe('fitPinned and pinSafe: the table\'s candidate is kept by hand, never by the search\'s strict limits', () => {
  const figs = [fig(-1.3, 5, 1.75, false, 'tidus'), fig(-0.2, 4.5, 1.75, false, 'yuna'), fig(1.2, 5, 1.75, false, 'kimahri'), fig(4.2, -2.6, 4, true, 'seymour-natus'), fig(2.4, -1.8, 1.7, true, 'mortibody')];
  const today = pose(17.6, 5.1, 1.8, 28);
  const m = pose(18.3, 5.2, 1.8, 28);
  const f = field([]);
  const { limits, rule } = limitsFor(figs, today, f);

  it('keeps a candidate that passes with a score no searched candidate reaches, so the plan stops on it', () => {
    const fit = fitPinned(m, today, figs, f, limits, rule, () => 0, { ...PIN, blend: 0.65, lens: [0, 0] }, () => 1);
    expect(fit.gate).toBe(0);
    expect(fit.score).toBe(PINNED_SCORE);
    expect(PINNED_SCORE).toBeGreaterThan(1e6); // `fitClear`'s best possible passing score is about 1e6
    expect(fit.blend).toBe(0.65);
  });

  it('ranks a candidate the gate holds, or one that is not safe, under everything the search could pick', () => {
    const held = fitPinned(m, today, figs, f, limits, rule, () => 0.02, PIN, () => 1);
    expect(held.gate).toBe(0.02);
    expect(held.score).toBeLessThan(-1e7);
    const inside = fitPinned(m, today, figs, f, limits, rule, () => 0, PIN, () => -40); // a member inside a boss
    expect(inside.score).toBeLessThan(0);
  });

  it('pinSafe: a member out of view, far under a panel, the party below its floor, inside a boss, or covered by a boss fails; today\'s edge cases pass', () => {
    const boxes = boxesOf(cameraAt(m, W / H), figs, f);
    const clear = clearBoxes(boxes, figs, m.pos, f, [0, 0], limits, rule);
    expect(pinSafe(clear, rule, 1)).toBe(true);
    expect(pinSafe(clear, rule, 0)).toBe(false); // the rest gap (nobody inside a boss)
    expect(pinSafe({ ...clear, figs: clear.figs.map((r, i) => (i === 0 ? { ...r, inView: 0.5 } : r)) }, rule, 1)).toBe(false);
    expect(pinSafe({ ...clear, figs: clear.figs.map((r, i) => (i === 0 ? { ...r, underHud: 0.4 } : r)) }, rule, 1)).toBe(false);
    expect(pinSafe({ ...clear, figs: clear.figs.map((r, i) => (i === 0 ? { ...r, underHud: 0.17 } : r)) }, rule, 1)).toBe(true); // 17 % under the command list is today's own reading
    expect(pinSafe({ ...clear, partyPx: rule.floorPx * 0.9 }, rule, 1)).toBe(false);
    expect(pinSafe({ ...clear, bossCover: rule.bossCoverMax + 0.2 }, rule, 1)).toBe(false);
  });
});

// ---- `separate` moved out of `framing.ts`: the search is as it was, and the pinned step is a fixed write -------------------------------------------

const actor = (name: string, facing: number, x: number, z: number, h: number): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { baseH: number }).baseH = h;
  a.position.set(x, 0, z);
  return a;
};
/** Figures read off the actors where the staging has put them (position and group scale), as `figOf` reads a painted figure. */
const figsOfActors = (actors: readonly Actor[]) => (): Fig[] => actors.map((a) => fig(a.position.x, a.position.z, (a as unknown as { baseH: number }).baseH * a.scale.y, a.facing < 0, subjectId(a)));

/** The method as `framing.ts` had it before this lane (copied, only `this` swapped for the arguments): the oracle for "nothing changed for any other fight". */
function separateBefore(game: 'ffx' | 'ffx2', staging: Staging, figsOf: () => Fig[], actors: readonly Actor[], cls: Parameters<typeof master>[0]['cls'], base: Pose, f: Field, rule: ReturnType<typeof limitsFor>['rule']): Pose {
  const free = hudFree(f.W, f.H);
  const plan = (): Pose => master({ cls, game, base, figs: figsOf(), W: f.W, H: f.H, free });
  let m = plan();
  const cap = game === 'ffx2' ? 1.6 : 1.4;
  let spread = game === 'ffx2' ? 1.15 : 1;
  let apart = 0;
  const bossH = Math.max(1, ...figsOf().filter((x) => x.enemy).map((x) => x.h));
  const apartMax = 0.3 * bossH;
  for (let i = 0; i < 8; i++) {
    const figs = figsOf();
    const boxes = boxesOf(cameraAt(m, f.W / f.H), figs, f);
    const needSpread = overlapOf(boxes, figs, m.pos) > rule.overlapMax && spread < cap - 1e-6;
    const needApart = bossCoverOf(boxes, figs) > rule.bossCoverMax && apart < apartMax - 1e-6;
    if (!needSpread && !needApart && i > 0) break;
    if (needSpread) spread = Math.min(cap, spread + 0.08);
    if (needApart) apart = Math.min(apartMax, apart + apartMax / 6);
    staging.planSpread(actors, spread);
    for (const a of actors) {
      const p = staging.plan.get(a) ?? { k: 1, dx: 0 };
      if (a.facing < 0) p.dx = apart;
      else p.dx -= apart * 0.3;
      staging.plan.set(a, p);
    }
    staging.apply(actors, true);
    m = plan();
  }
  return m;
}

describe('separate (moved out of framing.ts; both games)', () => {
  const scenes: { name: string; game: 'ffx' | 'ffx2'; party: [number, number][]; enemies: [string, number, number, number][] }[] = [
    { name: 'a loose party and a distant boss (nothing to separate)', game: 'ffx', party: [[-4, 5], [-1.5, 5], [1, 5]], enemies: [['yojimbo', 6, -3, 3]] },
    { name: 'a party in a tight bunch with a boss on its heels (spread and step apart)', game: 'ffx', party: [[-0.4, 5], [0, 4.8], [0.5, 5]], enemies: [['evrae', 1.2, 1, 4.5]] },
    { name: 'FFX-2 with its looser spread', game: 'ffx2', party: [[-2, 5], [-1.2, 5.2], [-0.3, 5]], enemies: [['ffx2-bahamut', 2, 0, 5]] },
  ];

  for (const sc of scenes) {
    it(`does what it did before: ${sc.name}`, () => {
      const build = () => {
        const actors = [...sc.party.map(([x, z], i) => actor(`p${i}`, 1, x, z, 1.75)), ...sc.enemies.map(([id, x, z, h]) => actor(id, -1, x, z, h))];
        return { actors, staging: new Staging(), figsOf: undefined as unknown as () => Fig[] };
      };
      const a = build();
      const b = build();
      a.figsOf = figsOfActors(a.actors);
      b.figsOf = figsOfActors(b.actors);
      const base = pose(17.6, 5.1, 1.8, 28);
      const f = field([{ l: 70, r: 550, t: 445, b: 836 }]);
      const { rule } = limitsFor(a.figsOf(), base, f);
      const before = separateBefore(sc.game, a.staging, a.figsOf, a.actors, 'colossus', base, f, rule);
      const after = separate(sc.game, b.staging, b.figsOf, b.actors, 'colossus', base, f, rule);
      expect(after.pos.distanceTo(before.pos)).toBeLessThan(1e-9);
      expect(after.look.distanceTo(before.look)).toBeLessThan(1e-9);
      expect(after.fov).toBe(before.fov);
      a.actors.forEach((x, i) => {
        expect(b.actors[i]!.position.x).toBeCloseTo(x.position.x, 9);
        expect(b.actors[i]!.scale.y).toBeCloseTo(x.scale.y, 9);
      });
    });
  }

  it('pinned: no search, the table\'s step for the fiends (the boss\'s own further step for the one `lead` names), the party back by 0.3 of it, no spread', () => {
    const actors = [actor('tidus', 1, -1.1, 5, 1.75), actor('yuna', 1, -0.2, 4.5, 1.75), actor('kimahri', 1, 1.2, 5, 1.75), actor('seymour-natus', -1, 2.9, -2.6, 2.4), actor('mortibody', -1, 1.35, -1.8, 1.7)];
    const staging = new Staging();
    const calls = { n: 0 };
    const figs = figsOfActors(actors);
    const counted = (): Fig[] => (calls.n++, figs());
    const base = pose(17.6, 5.1, 1.8, 28);
    const f = field();
    const { rule } = limitsFor(figs(), base, f);
    calls.n = 0;
    separate('ffx', staging, counted, actors, 'colossus', base, f, rule, { apart: 0.6, bossApart: 0.4 }, /^seymour-natus/);
    const dx = (name: string): number => staging.plan.get(actors.find((a) => a.name === name)!)!.dx;
    expect(dx('seymour-natus')).toBeCloseTo(1.0, 9);
    expect(dx('mortibody')).toBeCloseTo(0.6, 9);
    for (const n of ['tidus', 'yuna', 'kimahri']) expect(dx(n)).toBeCloseTo(-0.18, 9);
    expect(calls.n).toBe(1); // the master is made once, from the figures where the write left them
    // the same call again: the same answer (a table, not a search)
    const again = new Staging();
    const actors2 = [actor('tidus', 1, -1.1, 5, 1.75), actor('yuna', 1, -0.2, 4.5, 1.75), actor('kimahri', 1, 1.2, 5, 1.75), actor('seymour-natus', -1, 2.9, -2.6, 2.4), actor('mortibody', -1, 1.35, -1.8, 1.7)];
    separate('ffx', again, figsOfActors(actors2), actors2, 'colossus', base, f, rule, { apart: 0.6, bossApart: 0.4 }, /^seymour-natus/);
    expect(actors2.map((a) => a.position.x)).toEqual(actors.map((a) => a.position.x));
  });

  it('pinned with no lead: every fiend takes the same step', () => {
    const actors = [actor('tidus', 1, -1.1, 5, 1.75), actor('seymour-natus', -1, 2.9, -2.6, 2.4), actor('mortibody', -1, 1.35, -1.8, 1.7)];
    const staging = new Staging();
    const figs = figsOfActors(actors);
    const base = pose(17.6, 5.1, 1.8, 28);
    const f = field();
    separate('ffx', staging, figs, actors, 'colossus', base, f, limitsFor(figs(), base, f).rule, { apart: 0.5, bossApart: 0.4 });
    expect(staging.plan.get(actors[1]!)!.dx).toBeCloseTo(0.5, 9);
    expect(staging.plan.get(actors[2]!)!.dx).toBeCloseTo(0.5, 9);
  });
});

describe("the HUD's predicted panels on the stage (a pinned master's plan only; both games' plumbing)", () => {
  const f = (list: ReturnType<typeof predictedPanels>): number[][] => list.map((b) => [Math.round(b.l), Math.round(b.t), Math.round(b.r), Math.round(b.b)]);

  it('are the same as the window fractions where the stage fills the window (16:9), so no 16:9 plan changes', () => {
    expect(f(predictedPanels('ffx', 1600, 900, false, true))).toEqual(f(predictedPanels('ffx', 1600, 900, false)));
    expect(f(predictedPanels('ffx', 2560, 1440, false, true))).toEqual(f(predictedPanels('ffx', 2560, 1440, false)));
  });

  it("land where the letterboxed stage draws them in a wider window (the command list starts at the stage's left, 90 px in at 2000x1012) and a 16:10 one (its bottom is 39 px higher)", () => {
    const wide = predictedPanels('ffx', 2000, 1012, false, true)[0]!;
    const wideOld = predictedPanels('ffx', 2000, 1012, false)[0]!;
    expect(wide.l - wideOld.l).toBeGreaterThan(80);
    const tall = predictedPanels('ffx', 1440, 900, false, true)[0]!;
    const tallOld = predictedPanels('ffx', 1440, 900, false)[0]!;
    expect(tallOld.b - tall.b).toBeGreaterThan(35);
    expect(tall.l).toBeCloseTo(tallOld.l, 0);
  });

  it('leave the phone alone, and are asked for only by a pinned plan (FFX desktop: nothing else passes the flag)', () => {
    expect(f(predictedPanels('ffx', 390, 844, true, true))).toEqual(f(predictedPanels('ffx', 390, 844, true)));
    expect(f(predictedPanels('ffx', 1440, 900, false))).toEqual(f(predictedPanels('ffx', 1440, 900, false, false))); // the default is the window fractions, as before
  });
});
