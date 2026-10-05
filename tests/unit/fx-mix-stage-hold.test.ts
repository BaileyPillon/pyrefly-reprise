import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PerspectiveCamera, Object3D, Vector3 } from 'three';
import { relaxActorsOf, relaxField, STAGE_HOLD_KEY, type StagedForRelax } from '../../src/engine/StageRelax.ts';
import { Framing } from '../../src/engine/fx/mix/framing.ts';
import type { Actor, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { shiftOf, Staging, type Side } from '../../src/engine/fx/mix/staging.ts';
import { ALL_ROWS, parseStand, readStand, setStageTable, sideShift, standFor, STAGE_TABLE, type Slots } from '../../src/engine/fx/mix/stageTable.ts';
import type { DepthRect } from '../../src/engine/ScreenRects.ts';
import type { SceneSlots } from '../../src/scenes/index.ts';

/**
 * r38-restage repair (the CHECK's B1 and B2, traced on the branch, not guessed):
 *
 * B1. `StageRelax` (the formation relaxation) is a live solver: it runs on every frame of the battle's first seconds, measures the figures
 *     against the camera of the moment (the opening dolly, the idle drift) and the HUD's panels as they appear, and re-spreads whatever overlaps.
 *     The table's Chapter III formation (a rigid move of the pre-relaxation layout) gave it work: the boss ended 0.5 to 1.2 units from where the
 *     table put it on eight seeds of nine, and the right pagoda ended under the turn rail on four of 32 first menus. Now a fiend that carries
 *     the chapter's slots is held (`STAGE_HOLD_KEY`): the relaxation neither moves nor measures it, and the table says where each fiend stands.
 * B2. A figure that arrived later stood on the stage's own slot until the mix's 0.5 s scan found it (see `fx-mix-roster.test.ts`), and a write to
 *     its x alone (an arrival slide to the stage's slot) was read as a relaxation nudge, so the slot was lost. Any write to an axis that is not
 *     ours is now the stage's, and the share goes on top of it again.
 */
const rest: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 2, 0), fov: 32 };

const actor = (name: string, facing: number, x = 0, z = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  a.position.set(x, 0, z);
  return a;
};

describe('Staging: the slots hold through an arrival that slides to the stage\'s slot (B2)', () => {
  // The Chapter III party: right of where the stage seats it, none toward (a rig looking straight down -z: dz 0).
  const side: Side = { party: { dx: 0.35, dz: 0 }, enemy: { dx: 1.45, dz: -0.95 }, boss: null };

  it('draws a sliding arrival at its tween\'s place plus the slot on every frame, and ends in the slot', () => {
    const st = new Staging();
    st.side = side;
    const wakka = actor('wakka', 1, 0.22, 1.55);
    st.apply([wakka], true);
    expect(wakka.position.x).toBeCloseTo(0.57, 6);
    // An arrival: the actor slides in from the left to the stage's slot (PaintedActor.moveTo: absolute, lerped, written every frame; x alone).
    const from = -4.0;
    const to = 0.22;
    for (let i = 1; i <= 10; i++) {
      wakka.position.x = from + (to - from) * (i / 10);
      st.apply([wakka], true);
      expect(wakka.position.x).toBeCloseTo(from + (to - from) * (i / 10) + 0.35, 6);
    }
    expect(wakka.position.x).toBeCloseTo(0.22 + 0.35, 6); // the old write kept the tween's own value: 0.22, the slot gone
    st.apply([wakka], true);
    expect(wakka.position.x).toBeCloseTo(0.57, 6); // and it stays there, not once per frame
  });

  it('does the same on a fiend that is slid in or re-seated along x, with its z slot standing', () => {
    const st = new Staging();
    st.side = side;
    const e = actor('boss', -1, 2.05, -4);
    st.apply([e], true);
    expect(e.position.toArray()).toEqual([expect.closeTo(3.5, 6), 0, expect.closeTo(-4.95, 6)]);
    e.position.x = 2.0; // the stage re-seated it along x alone
    st.apply([e], true);
    expect(e.position.x).toBeCloseTo(3.45, 6);
    expect(e.position.z).toBeCloseTo(-4.95, 6); // z untouched: its slot still stands
    st.release();
    expect(e.position.toArray()).toEqual([expect.closeTo(2.0, 6), 0, expect.closeTo(-4, 6)]);
  });
});

describe('Staging.hold: a fiend that carries the slots is held against the formation relaxation (B1)', () => {
  it('flags every fiend of the fight and never the party, and takes the flag off with the row', () => {
    const st = new Staging();
    const party = actor('tidus', 1);
    const boss = actor('braskas-final-aeon', -1);
    const left = actor('yu-pagoda-left', -1);
    st.hold([party, boss, left], true);
    expect(party.userData[STAGE_HOLD_KEY]).toBeUndefined();
    expect(boss.userData[STAGE_HOLD_KEY]).toBe(true);
    expect(left.userData[STAGE_HOLD_KEY]).toBe(true);
    st.hold([party, boss], true); // the left pagoda left the stage: it is let go, the boss still held
    expect(left.userData[STAGE_HOLD_KEY]).toBeUndefined();
    expect(boss.userData[STAGE_HOLD_KEY]).toBe(true);
    st.hold([party, boss], false); // CHAPTER FRAMING off, or the next link's fiends: nobody held
    expect(boss.userData[STAGE_HOLD_KEY]).toBeUndefined();
  });

  it('is a no-op for a fight with no row (nothing flagged, nothing written)', () => {
    const st = new Staging();
    const e = actor('yojimbo', -1);
    st.hold([actor('tidus', 1), e], false);
    expect(e.userData[STAGE_HOLD_KEY]).toBeUndefined();
  });

  const camera = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  camera.position.set(0, 2, 10);
  camera.lookAt(0, 2, 0);
  camera.updateMatrixWorld(true);
  const slots = { party: [[0, 0, 1.5]], enemy: [[2, 0, -5], [3.5, 0, -6]], holdParty: true } as unknown as SceneSlots;
  const fiend = (id: string, x: number, held: boolean): [string, StagedForRelax] => {
    const o = new Object3D();
    o.position.set(x, 0, -6);
    if (held) o.userData[STAGE_HOLD_KEY] = true;
    return [id, { kind: 'enemy', actor: o }];
  };
  const rect = (x: number, depth: number): DepthRect => ({ x, y: 100, w: 200, h: 300, depth });
  const run = (held: boolean): number[] => {
    const staged = new Map([fiend('a', 2, held), fiend('b', 2.3, held)]);
    const actors = relaxActorsOf(staged);
    // two fiends whose silhouettes cross on screen: the relaxation separates them along world x
    const rects = (): Map<string, DepthRect> => new Map([['a', rect(100, 12)], ['b', rect(160, 10)]]);
    relaxField({ actors, rects, panels: [], camera, canvasW: 1600, slots }, 14);
    return [...staged.values()].map((s) => s.actor.position.x);
  };

  it('a fiend that is held is `fixed` for the relaxation: it is neither moved nor measured', () => {
    expect(relaxActorsOf(new Map([fiend('a', 2, true)])).get('a')?.fixed).toBe(true);
    expect(relaxActorsOf(new Map([fiend('a', 2, false)])).get('a')?.fixed).toBe(false);
  });

  it('the relaxation separates two crossing fiends, and leaves them where they stand when they are held', () => {
    const moved = run(false);
    expect(Math.abs(moved[0]! - 2) + Math.abs(moved[1]! - 2.3)).toBeGreaterThan(0.2); // the control: it does move them
    expect(run(true)).toEqual([2, 2.3]);
  });
});

describe('a row can give a fiend a move of its own (Chapter III: the boss and the two pagodas; read whether or not its switch plays it)', () => {
  beforeAll(() => setStageTable(ALL_ROWS));
  afterAll(() => setStageTable(STAGE_TABLE));
  const row = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;

  it('Chapter III names each pagoda by its combatant id, and the boss takes the side\'s move', () => {
    expect(row.enemyBy?.map((e) => e.id.source)).toEqual(['^yu-pagoda-left', '^yu-pagoda-right']);
    const s = sideShift({ party: row.party, enemy: row.enemy, enemyBy: row.enemyBy }, rest);
    const boss = actor('braskas-final-aeon', -1);
    const left = actor('yu-pagoda-left', -1);
    const right = actor('yu-pagoda-right', -1);
    expect(shiftOf(s, boss)).toBe(s.enemy);
    expect(shiftOf(s, left)).toBe(s.enemyBy![0]!.shift);
    expect(shiftOf(s, right)).toBe(s.enemyBy![1]!.shift);
    expect(shiftOf(s, actor('tidus', 1))).toBe(s.party);
    // the pagodas paint the same art (`yu-pagoda`), so it is the combatant id that tells them apart
    const painted = (name: string): Actor => {
      const a = actor(name, -1);
      (a as unknown as { poseUrls: Record<string, string> }).poseUrls = { idle: '/art/characters/yu-pagoda/idle.png' };
      return a;
    };
    expect(shiftOf(s, painted('yu-pagoda-left'))).toBe(s.enemyBy![0]!.shift);
    expect(shiftOf(s, painted('yu-pagoda-right'))).toBe(s.enemyBy![1]!.shift);
  });

  it('puts each fiend of the fight where its own move says, and reports them', () => {
    const roster = [actor('tidus', 1, -1.47, 1.6), actor('braskas-final-aeon', -1, 2.03, -8), actor('yu-pagoda-left', -1, 1.27, -5.15), actor('yu-pagoda-right', -1, 3.33, -6.25)];
    const r = readStand('ffx', roster, rest, false);
    expect(r.report?.by?.map((b) => b[0])).toEqual(['^yu-pagoda-left', '^yu-pagoda-right']);
    const st = new Staging();
    st.side = r.side;
    st.apply(roster, true);
    const [, boss, left, right] = roster;
    // each at its stage slot plus its own move; the moves differ, so the formation is the table's, not a rigid copy of the boss's
    expect(boss!.position.x - 2.03).toBeCloseTo(r.report!.enemy[0], 6);
    expect(left!.position.x - 1.27).toBeCloseTo(r.report!.by![0]![1], 6);
    expect(right!.position.x - 3.33).toBeCloseTo(r.report!.by![1]![1], 6);
    expect(right!.position.x - boss!.position.x).not.toBeCloseTo(3.33 - 2.03, 1);
    expect(st.stats()['braskas-final-aeon']).toMatchObject({ sx: expect.closeTo(r.report!.enemy[0], 2) });
  });

  it('reads &standf= (checks only): a move of its own for the fiends whose id contains the text', () => {
    const o = parseStand('?stand=0.35,0,1.9,-0.95&standf=yu-pagoda-left:0,-0.95;yu-pagoda-right:2.5,-0.9');
    expect(o).toMatchObject({ party: { right: 0.35, toward: 0 }, enemy: { right: 1.9, toward: -0.95 } });
    const by = (o as Slots).enemyBy!;
    expect(by.map((e) => [e.id.test('yu-pagoda-left'), e.id.test('yu-pagoda-right'), e.move.right, e.move.toward])).toEqual([[true, false, 0, -0.95], [false, true, 2.5, -0.9]]);
    expect(parseStand('?stand=0.35,0,1.9,-0.95')).toEqual({ party: { right: 0.35, toward: 0 }, enemy: { right: 1.9, toward: -0.95 } });
    expect(parseStand('?stand=0.35,0,1.9,-0.95&standf=garbage')).toEqual({ party: { right: 0.35, toward: 0 }, enemy: { right: 1.9, toward: -0.95 } });
    expect(standFor('ffx', ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'], false)?.slots.enemyBy).toHaveLength(2);
  });
});

describe('Framing holds the fiends of a table fight from the first frame it sees them (B1; every row read, whether or not Chapter III\'s switch plays it)', () => {
  // The relaxation runs in the very frame the mix first sees the figures (the mix updates first, the relaxation second), and well before the plan is
  // committed on a slow load: holding only once the slots are written would leave the first seconds to the relaxation.
  beforeAll(() => setStageTable(ALL_ROWS));
  afterAll(() => setStageTable(STAGE_TABLE));
  const roster = (): Actor[] => [actor('tidus', 1, -1.47, 1.6), actor('braskas-final-aeon', -1, 2.03, -8), actor('yu-pagoda-left', -1, 1.27, -5.15), actor('yu-pagoda-right', -1, 3.33, -6.25)];
  const held = (r: readonly Actor[]): boolean[] => r.map((a) => a.userData[STAGE_HOLD_KEY] === true);
  const framing = (game: 'ffx' | 'ffx2'): Framing => new Framing(null, new PerspectiveCamera(32, 16 / 9), game);

  it('holds every fiend of Chapter III and none of the party, at once', () => {
    const r = roster();
    framing('ffx').update(0.016, r, true);
    expect(held(r)).toEqual([false, true, true, true]);
  });
  it('holds Yunalesca too (a row of the table), and nothing in a chapter that has no row, in FFX-2, or with CHAPTER FRAMING off', () => {
    const y = [actor('tidus', 1), actor('yunalesca-1', -1)];
    framing('ffx').update(0.016, y, true);
    expect(held(y)).toEqual([false, true]);
    const yojimbo = [actor('tidus', 1), actor('yojimbo', -1)];
    framing('ffx').update(0.016, yojimbo, true);
    expect(held(yojimbo)).toEqual([false, false]);
    // Natus has a row since r39-natus (it pins his colossus master): his fiends are held like Chapter II's and III's.
    const natus = [actor('tidus', 1), actor('seymour-natus', -1), actor('mortibody', -1)];
    framing('ffx').update(0.016, natus, true);
    expect(held(natus)).toEqual([false, true, true]);
    const ffx2 = roster();
    framing('ffx2').update(0.016, ffx2, true);
    expect(held(ffx2)).toEqual([false, false, false, false]);
    const off = roster();
    const f = framing('ffx');
    f.update(0.016, off, true);
    f.update(0.016, off, false); // switched off: let go
    expect(held(off)).toEqual([false, false, false, false]);
  });
  it("lets go when the chapter's boss leaves the stage (the next link's fiends), and when it is disposed", () => {
    const r = roster();
    const f = framing('ffx');
    f.update(0.016, r, true);
    const link2 = [r[0]!, actor('aeon-valefor', -1)];
    f.update(0.016, link2, true);
    expect(held(link2)).toEqual([false, false]);
    expect(held(r)).toEqual([false, false, false, false]); // the old fiends left the list: they are let go too
    f.update(0.016, r, true);
    expect(held(r)).toEqual([false, true, true, true]);
    f.dispose();
    expect(held(r)).toEqual([false, false, false, false]);
  });
});
