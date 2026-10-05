import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Object3D, Vector3 } from 'three';
import type { Actor, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { shiftOf, Staging, type Side } from '../../src/engine/fx/mix/staging.ts';
import { ALL_ROWS, CHAPTER_III_STAGED, onPhone, parseStand, readStand, setStageTable, setStandOverride, sideShift, standFor, STAGE_TABLE } from '../../src/engine/fx/mix/stageTable.ts';

/**
 * The chapter's staging table (round 19b, PR-0310; FFX only; Bailey 2026-10-03: Chapter II option C, Chapter III option B):
 * what the table says, where it says it applies, and how `Staging` writes it. The camera looks down -z in these poses, so screen-right
 * is +x and "toward the camera" is +z.
 */
const rest: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 2, 0), fov: 32 };

const actor = (name: string, facing: number, x = 0, z = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  a.position.set(x, 0, z);
  return a;
};

afterEach(() => {
  setStandOverride(null);
  vi.unstubAllGlobals();
});

describe('the table', () => {
  it('names an FFX boss in every row, with finite moves', () => {
    expect(ALL_ROWS.map((r) => r.chapter)).toEqual(['yunalesca', 'braskas-final-aeon', 'seymour-natus', 'seymour-omnis']);
    for (const r of ALL_ROWS) {
      for (const m of [r.party, r.enemy, ...(r.enemyBy ?? []).map((e) => e.move), ...(r.partyBy ?? []).map((p) => p.move)]) expect(Number.isFinite(m.right) && Number.isFinite(m.toward)).toBe(true);
      // FFX-2's bosses never match, nor do the chapters that have no row (rule 14: FFX only; Evrae waits for its mockups).
      // (Natus's own row, r39-natus, names Natus: it pins a colossus master and moves nobody; `fx-mix-colossus-pin.test.ts`. Chapter XII's, r391-ui, names Omnis.)
      for (const id of ['ffx2-bahamut', 'ffx2-trema', 'ffx2-vegnagun', 'ffx2-leblanc', 'seymour-flux-body', 'evrae', 'seymour-natus', 'seymour-omnis', 'yojimbo']) expect(r.boss.test(id)).toBe(id === r.chapter);
    }
  });

  it('Chapter II is option C: the party a little left, the boss right and back', () => {
    const s = standFor('ffx', ['yunalesca-1'], false)!;
    expect(s.chapter).toBe('yunalesca');
    expect(s.slots.party.right).toBeLessThan(0);
    expect(s.slots.enemy.right).toBeGreaterThan(0.4);
    expect(s.slots.enemy.toward).toBeLessThan(0);
  });

  it("plays Chapter III only behind its one-line switch: off, Chapter II ships alone and Chapter III is the stage's own", () => {
    expect(STAGE_TABLE.map((r) => r.chapter)).toEqual(CHAPTER_III_STAGED ? ['yunalesca', 'braskas-final-aeon', 'seymour-natus', 'seymour-omnis'] : ['yunalesca', 'seymour-natus', 'seymour-omnis']); // Natus's row (r39-natus) and Chapter XII's (r391-ui) play whatever Chapter III's switch says
    expect(standFor('ffx', ['yunalesca-1'], false)).not.toBeNull();
    expect(standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false) === null).toBe(!CHAPTER_III_STAGED);
  });
});

describe("Chapter III's formation is written down, fiend by fiend (r38-restage repair, B1; read whether or not the switch plays it)", () => {
  // The relaxation used to re-spread a rigid move to the camera of the moment; now the fiends are held and the table says where each stands.
  beforeAll(() => setStageTable(ALL_ROWS));
  afterAll(() => setStageTable(STAGE_TABLE));
  const row = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;
  const move = (re: string): { right: number; toward: number } => row.enemyBy!.find((e) => e.id.test(re))!.move;

  it('is option B: every fiend right and back as one formation, the party where the old plan step put it', () => {
    const s = standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false)!;
    expect(s.chapter).toBe('braskas-final-aeon');
    expect(s.slots.enemy.right).toBeGreaterThan(0.9);
    expect(s.slots.enemy.toward).toBeLessThan(-0.5);
    expect(s.slots.party.right).toBeGreaterThanOrEqual(0);
    expect(s.slots.party.right).toBeLessThanOrEqual(0.7); // never further toward the fiends than the plan's largest step
  });

  it('moves nobody toward the party, the boss furthest right, the right pagoda drawn in toward it (off the turn rail)', () => {
    const left = move('yu-pagoda-left');
    const right = move('yu-pagoda-right');
    for (const m of [row.enemy, left, right]) expect(m.toward).toBeLessThan(0);
    expect(row.enemy.right).toBeGreaterThan(right.right);
    expect(right.right).toBeGreaterThan(left.right);
    expect(right.right).toBeGreaterThan(0);
  });
  it("stands the left pagoda off the party's heads (further back than the boss's own move) and keeps it from the boss's side", () => {
    expect(move('yu-pagoda-left').toward).toBeLessThan(row.enemy.toward);
    expect(move('yu-pagoda-left').right).toBeLessThan(1);
  });
  it('is the same on every call (a table, not a solve): a seed never reaches it', () => {
    const a = standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false)!;
    const b = standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false)!;
    expect(a.slots).toEqual(b.slots);
    expect(a.slots.enemyBy).toBe(row.enemyBy);
  });
});

describe('where it applies (FFX desktop, a named boss; checks only: ?stand=)', () => {
  it('is FFX only and desktop only', () => {
    expect(standFor('ffx2', ['yunalesca-1'], false)).toBeNull();
    expect(standFor('ffx', ['yunalesca-1'], true)).toBeNull();
  });
  it('leaves every other fight alone, Evrae included (it waits for its own mockups)', () => {
    for (const id of ['seymour-flux-body', 'evrae-1', 'yojimbo', 'isaaru', 'ffx2-bahamut']) expect(standFor('ffx', [id], false)).toBeNull();
  });
  it('reads ?stand= (off, or four numbers) and nothing else', () => {
    expect(parseStand('')).toBeNull();
    expect(parseStand('?stand=off')).toBe('off');
    expect(parseStand('?stand=-0.5,0.2,0.5,-0.3')).toEqual({ party: { right: -0.5, toward: 0.2 }, enemy: { right: 0.5, toward: -0.3 } });
    expect(parseStand('?stand=1,2,3')).toBeNull();
    expect(parseStand('?stand=a,b,c,d')).toBeNull();
  });
  it('off plays today\'s slots; four numbers play that move in any FFX desktop fight', () => {
    setStandOverride('off');
    expect(standFor('ffx', ['yunalesca-1'], false)).toBeNull();
    setStandOverride({ party: { right: -1, toward: 0 }, enemy: { right: 1, toward: 0 } });
    expect(standFor('ffx', ['evrae-1'], false)?.chapter).toBe('override');
    expect(standFor('ffx2', ['evrae-1'], false)).toBeNull();
  });
});

describe('the upright phone is never staged', () => {
  it('reads the window itself when the HUD has not set its flag yet', () => {
    expect(onPhone()).toBe(false);
    vi.stubGlobal('window', { matchMedia: (q: string) => ({ matches: q.includes('max-width: 599px') }) });
    expect(onPhone()).toBe(true);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(onPhone()).toBe(false);
    vi.stubGlobal('window', { matchMedia: () => { throw new Error('no media'); } });
    expect(onPhone()).toBe(false);
  });
});

describe('sideShift', () => {
  const slots = { party: { right: -0.5, toward: 0.2 }, enemy: { right: 0.5, toward: -0.3 } };
  it('means left, right, nearer and farther on the screen', () => {
    const s = sideShift(slots, rest);
    expect(s.party.dx).toBeCloseTo(-0.5, 6);
    expect(s.party.dz).toBeCloseTo(0.2, 6);
    expect(s.enemy.dx).toBeCloseTo(0.5, 6);
    expect(s.enemy.dz).toBeCloseTo(-0.3, 6);
  });
  it('turns with the scene\'s yaw (a rig looking down +x: screen-right is +z, toward the camera is -x)', () => {
    const turned: Pose = { pos: new Vector3(-10, 2, 0), look: new Vector3(0, 2, 0), fov: 32 };
    const s = sideShift(slots, turned);
    expect(s.party.dz).toBeCloseTo(-0.5, 6);
    expect(s.party.dx).toBeCloseTo(-0.2, 6);
    expect(s.enemy.dz).toBeCloseTo(0.5, 6);
    expect(s.enemy.dx).toBeCloseTo(0.3, 6);
  });
  it('moves nothing for a rig that looks straight down', () => {
    const down: Pose = { pos: new Vector3(0, 10, 0), look: new Vector3(0, 0, 0), fov: 32 };
    const s = sideShift(slots, down);
    expect(Math.hypot(s.party.dx, s.party.dz, s.enemy.dx, s.enemy.dz)).toBe(0);
  });
});

describe('readStand', () => {
  it('reads the chapter from the fiends on the stage and reports the move', () => {
    const roster = [actor('tidus', 1), actor('yunalesca-1', -1)];
    const r = readStand('ffx', roster, rest, false);
    expect(r.side).not.toBeNull();
    expect(r.report?.chapter).toBe('yunalesca');
    expect(r.report?.party[0]).toBeLessThan(0);
    expect(r.report?.enemy[0]).toBeGreaterThan(0);
  });
  it("reads Natus's row (r39-natus): a side that moves nobody, and the colossus master it pins", () => {
    const r = readStand('ffx', [actor('tidus', 1), actor('seymour-natus', -1), actor('mortibody', -1)], rest, false);
    expect(r.side).not.toBeNull();
    expect(r.report).toMatchObject({ chapter: 'seymour-natus', party: [0, 0], enemy: [0, 0] });
    expect(r.colossus).toHaveLength(1);
    expect(readStand('ffx', [actor('tidus', 1), actor('seymour-natus', -1)], rest, true).side).toBeNull();
  });
  it('reads nothing for another chapter, the phone or FFX-2', () => {
    expect(readStand('ffx', [actor('tidus', 1), actor('yojimbo', -1)], rest, false)).toEqual({ side: null, report: null });
    expect(readStand('ffx', [actor('tidus', 1), actor('yunalesca-1', -1)], rest, true).side).toBeNull();
    expect(readStand('ffx2', [actor('tidus', 1), actor('yunalesca-1', -1)], rest, false).side).toBeNull();
  });
});

describe('Staging writes the chapter\'s slots', () => {
  const side: Side = { party: { dx: -0.5, dz: 0.2 }, enemy: { dx: 0.5, dz: -0.3 }, boss: null };
  const stage = (): { st: Staging; p: Actor; e: Actor } => ({ st: new Staging(), p: actor('tidus', 1, 0.1, 1.8), e: actor('boss', -1, 2.8, -4) });

  it('moves every figure of a side by its side\'s move and puts them back on release', () => {
    const { st, p, e } = stage();
    st.side = side;
    st.apply([p, e], true);
    expect([p.position.x, p.position.z]).toEqual([expect.closeTo(-0.4, 6), expect.closeTo(2.0, 6)]);
    expect([e.position.x, e.position.z]).toEqual([expect.closeTo(3.3, 6), expect.closeTo(-4.3, 6)]);
    st.release();
    expect([p.position.x, p.position.z]).toEqual([expect.closeTo(0.1, 6), expect.closeTo(1.8, 6)]);
    expect([e.position.x, e.position.z]).toEqual([expect.closeTo(2.8, 6), expect.closeTo(-4, 6)]);
  });

  it('writes once however many frames apply it (no drift), and nothing with CHAPTER FRAMING off', () => {
    const { st, p } = stage();
    st.side = side;
    for (let i = 0; i < 50; i++) st.apply([p], true);
    expect(p.position.x).toBeCloseTo(-0.4, 6);
    st.apply([p], false);
    expect(p.position.x).toBeCloseTo(0.1, 6);
    st.apply([p], false);
    expect(p.position.x).toBeCloseTo(0.1, 6);
  });

  it('survives release (a plan search stages and releases within a frame) and a figure that arrives later stands in the formation', () => {
    const { st, p, e } = stage();
    st.side = side;
    st.apply([p, e], true);
    st.release();
    expect(st.side).toBe(side);
    st.apply([p, e], true);
    const late = actor('aeon', 1, 0.5, 1.0);
    st.apply([p, e, late], true);
    expect(late.position.x).toBeCloseTo(0, 6);
    expect(late.position.z).toBeCloseTo(1.2, 6);
  });

  it('respects a stage that re-seats a figure (a formation relax): the move goes on top of the new place', () => {
    const { st, p } = stage();
    st.side = side;
    st.apply([p], true);
    p.position.set(1.0, 0, 1.0); // the stage moved her
    st.apply([p], true);
    expect(p.position.x).toBeCloseTo(0.5, 6);
    expect(p.position.z).toBeCloseTo(1.2, 6);
    st.apply([p], true);
    expect(p.position.x).toBeCloseTo(0.5, 6);
  });

  it('puts the slots on top of a write along x alone (a slide, a re-seat) and does not add them again per frame (r38-restage CHECK B2)', () => {
    const { st, e } = stage();
    st.side = side;
    st.apply([e], true);
    expect(e.position.x).toBeCloseTo(3.3, 6);
    // The old write read this as a nudge by the formation relaxation (x alone, from where the fiend stands) and kept the figure where the
    // write left it, without the slots. The relaxation now leaves a figure that carries them alone (`STAGE_HOLD_KEY`), so it is the stage's.
    e.position.x = 2.9;
    st.apply([e], true);
    expect(e.position.x).toBeCloseTo(3.4, 6);
    expect(e.position.z).toBeCloseTo(-4.3, 6);
    for (let i = 0; i < 12; i++) st.apply([e], true); // twelve more frames of nothing: the slots are on it once
    expect(e.position.x).toBeCloseTo(3.4, 6);
    st.release();
    expect(e.position.x).toBeCloseTo(2.9, 6);
    expect(e.position.z).toBeCloseTo(-4, 6);
  });

  it('a change in z alone leaves the x slots standing, and a change in both drops them', () => {
    const { st, e } = stage();
    st.side = side;
    st.apply([e], true);
    e.position.z += 0.5; // a tween in z only
    st.apply([e], true);
    expect(e.position.x).toBeCloseTo(3.3, 6);
    expect(e.position.z).toBeCloseTo(-3.8 - 0.3, 6); // -3.8 is read as the stage's own place, the slot goes on top of it once
    e.position.set(2.8, 0, -4); // a spot: x and z both
    st.apply([e], true);
    expect(e.position.x).toBeCloseTo(3.3, 6);
    expect(e.position.z).toBeCloseTo(-4.3, 6);
  });

  it('lets go once the boss of the chapter is off the stage (the next link), and takes hold again with it back', () => {
    const { st, p, e } = stage();
    st.side = { ...side, boss: /^boss/ };
    st.apply([p, e], true);
    expect(p.position.x).toBeCloseTo(-0.4, 6);
    const aeon = actor('aeon-valefor', -1, 1.7, -8);
    st.apply([p, aeon], true); // the boss left: every figure is the stage's own again, the new fiend untouched
    expect(p.position.x).toBeCloseTo(0.1, 6);
    expect(p.position.z).toBeCloseTo(1.8, 6);
    expect(aeon.position.toArray()).toEqual([1.7, 0, -8]);
    st.apply([p, aeon, e], true); // the boss is back on the stage
    expect(p.position.x).toBeCloseTo(-0.4, 6);
    expect(e.position.x).toBeCloseTo(3.3, 6);
    expect(aeon.position.x).toBeCloseTo(2.2, 6); // and a fiend beside it stands in the same formation
  });

  it('keeps BOSS SCALE and SPACING working on top of the slots', () => {
    const { st, p } = stage();
    st.side = side;
    st.plan.set(p, { k: 1.5, dx: 0.3 });
    st.apply([p], true);
    expect(p.scale.y).toBeCloseTo(1.5, 6);
    expect(p.position.x).toBeCloseTo(0.1 + 0.3 - 0.5, 6);
    st.clearPlan();
    st.apply([p], true);
    expect(p.scale.y).toBeCloseTo(1, 6);
    expect(p.position.x).toBeCloseTo(-0.4, 6);
  });

  it('reports each figure\'s move (checks only) and writes nothing with no side', () => {
    const { st, p, e } = stage();
    st.apply([p, e], true);
    expect(p.position.toArray()).toEqual([0.1, 0, 1.8]);
    expect(st.stats()).toEqual({});
    st.side = side;
    st.apply([p, e], true);
    expect(st.stats()['tidus']).toMatchObject({ sx: -0.5, sz: 0.2 });
    expect(st.stats()['boss']).toMatchObject({ sx: 0.5, sz: -0.3 });
  });
});

/**
 * A fight with no row is staged exactly as before this change (the Chapter IV, IX and Natus plans must not move): the previous
 * `Staging.write`, kept here as it was, and the new one with no side, driven through the same random run of plans, frames, the
 * stage's re-seats (x and z), the relaxation's nudges (x alone), re-scales and releases, leave the figures bit for bit alike.
 */
describe('Staging with no chapter slots is the old Staging', () => {
  interface OldRec {
    k: number;
    wroteK: number;
    dx: number;
    wroteX: number;
  }
  class Old {
    private readonly recs = new Map<Actor, OldRec>();
    readonly plan = new Map<Actor, { k: number; dx: number }>();
    apply(actors: readonly Actor[], on: boolean): void {
      for (const a of actors) {
        const p = this.plan.get(a);
        this.write(a, on ? (p?.k ?? 1) : 1, on ? (p?.dx ?? 0) : 0);
      }
    }
    private write(a: Actor, k: number, dx: number): void {
      let r = this.recs.get(a);
      if (!r) {
        if (k === 1 && dx === 0) return;
        r = { k: 1, wroteK: a.scale.y, dx: 0, wroteX: a.position.x };
        this.recs.set(a, r);
      }
      if (Math.abs(a.scale.y - r.wroteK) > 1e-6) r.k = 1;
      if (Math.abs(a.position.x - r.wroteX) > 1e-6) r.dx = 0;
      const baseK = a.scale.y / r.k;
      const baseX = a.position.x - r.dx;
      a.scale.set((a.scale.x / r.k) * k, baseK * k, (a.scale.z / r.k) * k);
      a.position.x = baseX + dx;
      r.k = k;
      r.dx = dx;
      r.wroteK = a.scale.y;
      r.wroteX = a.position.x;
    }
    release(): void {
      for (const a of this.recs.keys()) this.write(a, 1, 0);
      this.recs.clear();
      this.plan.clear();
    }
  }

  it('matches the old write on 4000 random operations over five figures', () => {
    let seed = 20261003;
    const rnd = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
    const mk = (): Actor[] => [actor('tidus', 1, -1.47, 1.6), actor('yuna', 1, 0.22, 1.55), actor('auron', 1, -0.8, -1), actor('boss', -1, 2.05, -4), actor('part', -1, 4, -7.4)];
    const A = mk();
    const B = mk();
    const oldS = new Old();
    const newS = new Staging();
    for (let step = 0; step < 4000; step++) {
      const i = Math.floor(rnd() * A.length);
      const op = pick(['plan', 'plan', 'apply', 'apply', 'apply', 'off', 'nudge', 'reseat', 'rescale', 'release', 'clear'] as const);
      if (op === 'plan') {
        const p = { k: pick([1, 1, 1.4, 2.2]), dx: pick([0, 0.35, 0.7, -0.3, 1.2]) };
        oldS.plan.set(A[i]!, { ...p });
        newS.plan.set(B[i]!, { ...p });
      } else if (op === 'apply' || op === 'off') {
        oldS.apply(A, op === 'apply');
        newS.apply(B, op === 'apply');
      } else if (op === 'nudge') {
        const d = (rnd() - 0.5) * 0.4;
        A[i]!.position.x += d;
        B[i]!.position.x += d;
      } else if (op === 'reseat') {
        const x = rnd() * 6 - 3;
        const z = rnd() * 8 - 7;
        A[i]!.position.set(x, 0, z);
        B[i]!.position.set(x, 0, z);
      } else if (op === 'rescale') {
        const k = pick([1, 1.1, 0.9]);
        A[i]!.scale.set(k, k, k);
        B[i]!.scale.set(k, k, k);
      } else if (op === 'release') {
        oldS.release();
        newS.release();
      } else {
        oldS.plan.clear();
        newS.clearPlan();
      }
      for (let j = 0; j < A.length; j++) {
        expect(B[j]!.position.toArray()).toEqual(A[j]!.position.toArray());
        expect(B[j]!.scale.toArray()).toEqual(A[j]!.scale.toArray());
      }
    }
  });
});

describe("Chapter XII's party stands apart (r391-ui, PR-0382; FFX only)", () => {
  const row = ALL_ROWS.find((r) => r.chapter === 'seymour-omnis')!;
  const step = (id: string): { right: number; toward: number } => row.partyBy!.find((p) => p.id.test(id))!.move;
  const slot = (right: number, toward: number): { dx: number; dz: number } => ({ dx: right, dz: toward }); // the camera looks down -z in these poses (`rest`): toward the camera is +z

  it('names Omnis, and gives each of the three starters a step of his own', () => {
    expect(row.boss.test('seymour-omnis')).toBe(true);
    expect(row.boss.test('mortiphasm')).toBe(false);
    expect(row.partyBy?.map((p) => p.id.source)).toEqual(['^tidus', '^yuna', '^auron']);
  });

  it('opens the heap up: Tidus left, Yuna right, Auron between and further back, all of them back from the camera', () => {
    const t = step('tidus');
    const y = step('yuna');
    const a = step('auron');
    expect(t.right).toBeLessThan(0);
    expect(y.right).toBeGreaterThan(0);
    expect(y.right - t.right).toBeGreaterThan(1); // the front pair a figure-width and more further apart than the scene stands them
    expect(Math.abs(a.right - (t.right + y.right) / 2)).toBeLessThan(0.6); // Auron stays in the gap
    expect(a.toward).toBeLessThan(Math.min(t.toward, y.toward)); // ...and behind the two
    for (const m of [t, y, a]) expect(m.toward).toBeLessThan(0); // none nearer the camera than the scene put him
  });

  it('is a table, not a solve, and a member with no step of his own (a Switch brings Wakka in) stands as far back as the three', () => {
    const s = standFor('ffx', ['mortiphasm', 'mortiphasm', 'seymour-omnis'], false)!;
    expect(s.chapter).toBe('seymour-omnis');
    expect(s.slots.partyBy).toBe(row.partyBy);
    expect(s.slots.party.right).toBe(0);
    expect(s.slots.party.toward).toBe(step('tidus').toward);
    expect(s.calm).toBeNull();
    expect(s.colossus).toBeUndefined();
    expect(s.slots.follow).toBeUndefined(); // the presenter runs the figure to its target; the move is not a lunge's to follow
  });

  it('is FFX desktop only', () => {
    expect(standFor('ffx2', ['seymour-omnis'], false)).toBeNull();
    expect(standFor('ffx', ['seymour-omnis'], true)).toBeNull();
  });

  it('reads as three steps in the report and moves each member by his own', () => {
    const roster = [actor('tidus', 1), actor('yuna', 1), actor('auron', 1), actor('wakka', 1), actor('seymour-omnis', -1)];
    const r = readStand('ffx', roster, rest, false);
    expect(r.report?.chapter).toBe('seymour-omnis');
    expect(r.report?.byParty?.map((p) => p[0])).toEqual(['^tidus', '^yuna', '^auron']);
    const s = r.side!;
    expect(shiftOf(s, roster[0]!)).toBe(s.partyBy![0]!.shift);
    expect(shiftOf(s, roster[1]!)).toBe(s.partyBy![1]!.shift);
    expect(shiftOf(s, roster[2]!)).toBe(s.partyBy![2]!.shift);
    expect(shiftOf(s, roster[3]!)).toBe(s.party); // Wakka has none: the side's
    expect(shiftOf(s, roster[4]!)).toBe(s.enemy);
    expect(s.partyBy![0]!.shift.dx).toBeCloseTo(step('tidus').right, 6);
    expect(s.partyBy![2]!.shift.dz).toBeCloseTo(step('auron').toward, 6);
  });

  it('writes each figure at his own place and puts them back on release', () => {
    const base = { tidus: [-0.85, 1.6], yuna: [0.22, 1.55], auron: [-0.4, -1.0] } as const; // the scene's own slots (`scenes/garden-of-pain.ts`)
    const roster = (Object.entries(base) as [string, readonly [number, number]][]).map(([id, [x, z]]) => actor(id, 1, x, z));
    const omnis = actor('seymour-omnis', -1, 2.15, -4);
    const st = new Staging();
    st.side = readStand('ffx', [...roster, omnis], rest, false).side;
    st.apply([...roster, omnis], true);
    const at = (a: Actor): [number, number] => [a.position.x, a.position.z];
    const want = (id: 'tidus' | 'yuna' | 'auron'): [number, number] => {
      const m = step(id);
      const [x, z] = base[id];
      return [x + slot(m.right, m.toward).dx, z + slot(m.right, m.toward).dz];
    };
    roster.forEach((a, i) => {
      const [x, z] = want((['tidus', 'yuna', 'auron'] as const)[i]!);
      expect(at(a)).toEqual([expect.closeTo(x, 6), expect.closeTo(z, 6)]);
    });
    expect(at(omnis)).toEqual([expect.closeTo(2.15, 6), expect.closeTo(-4, 6)]); // the boss stays
    for (let i = 0; i < 20; i++) st.apply([...roster, omnis], true); // once, however many frames
    expect(roster[0]!.position.x).toBeCloseTo(want('tidus')[0], 6);
    st.release();
    roster.forEach((a, i) => expect(at(a)).toEqual(Object.values(base)[i]!.map((v) => expect.closeTo(v, 9))));
  });

  it('reads ?standp= (a sweep): a step for each member whose id it names', () => {
    const o = parseStand('?stand=0,0,0,0&standp=tidus:-0.9,-1.5;yuna:0.5,-1.5')! as { partyBy?: { id: RegExp; move: { right: number; toward: number } }[] };
    expect(o.partyBy?.map((p) => [p.id.source, p.move])).toEqual([
      ['tidus', { right: -0.9, toward: -1.5 }],
      ['yuna', { right: 0.5, toward: -1.5 }],
    ]);
    expect((parseStand('?stand=0,0,0,0')! as { partyBy?: unknown }).partyBy).toBeUndefined();
    expect(parseStand('?standp=tidus:1,2')).toBeNull(); // the four numbers are what turns a sweep on
  });
});
