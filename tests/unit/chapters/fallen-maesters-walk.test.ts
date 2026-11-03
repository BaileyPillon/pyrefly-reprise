/**
 * The Fallen Maesters' floor 60 is reachable by a player: Paine's walk across The End's grid (the review of `ch-maesters`, major 1; **FFX-2 only** [AGENTS.md rule 14]).
 *
 * Concherer's shell breaks on ONE result of 10,000 HP or more (about 20,000 before its Protect and Shell). The chapter's party is Chapter XIII's Lv 99 three as it is (FM3 a), and Paine's grid, The End, pays its Break Damage Limit
 * only once the red and the green gate have been crossed (`garment-grids.ts`); the build starts with none crossed. The player-facing words (the prep tip, the guide line, the build's header) say so and name the walk, so this file
 * pins that the walk is REAL, taken through the menu's own Change rows and not a state written by a test:
 *
 * 1. Paine starts on The End at node 0 as the Dark Knight with the limit off, and Charon is capped at 9,999 (the shell holds).
 * 2. The shortest walk is four Changes (two to cross both gates, two home to the Dark Knight), each one a row the menu offers; afterwards the limit is on, she wears the Dark Knight again, and the same Charon breaks the shell.
 * 3. The bench (`fallen-maesters-bench.test.ts`) plays whole fights on that walk and measures the floor.
 */
import { describe, expect, it } from 'vitest';

import type { GateColour } from '../../../src/battle/common/types.ts';
import { fallenMaestersBuild } from '../../../src/data/ffx2/builds/fallen-maesters.ts';
import { nextNodeOnWalk, walkChange } from '../helpers/fallenMaestersWalk.ts';
import { bossOf, damageOn, forced, logOf, nextInput, openFloor, rowOf, unit } from '../helpers/fallenMaestersDrive.ts';

const BOTH: GateColour[] = ['red', 'green'];

/** A floor-60 engine whose fiend does nothing (an empty forced queue): the test owns the whole fight. */
const quiet = (seed = 1) => openFloor(2, seed, { group: forced(2).group, immortal: true });

/** Paine's turns until `done` holds (every other girl defends), taking `walkChange` rows; returns the Changes taken. */
function walkPaine(engine: ReturnType<typeof quiet>, stopWhen: () => boolean): number {
  for (let i = 0; i < 400 && !stopWhen(); i++) {
    const d = nextInput(engine, 4000);
    if (!d) break;
    const change = d.actorId === 'paine' ? walkChange(d, engine, 'paine', BOTH) : null;
    engine.submit(change ?? { kind: 'defend', targets: [] });
  }
  return logOf(engine).filter((e) => e.type === 'spherechange' && (e as { who?: string }).who === 'paine').length;
}

/** Paine casts Charon at Concherer once; returns the biggest single result on the fiend. */
function charonFrom(engine: ReturnType<typeof quiet>): number {
  const boss = bossOf(2);
  for (let i = 0; i < 400; i++) {
    const d = nextInput(engine, 4000);
    if (!d) break;
    const cast = d.actorId === 'paine' ? rowOf(d, 'ability', 'x2-dark-knight-charon', [boss]) : null;
    if (cast) {
      engine.submit(cast);
      break;
    }
    engine.submit({ kind: 'defend', targets: [] });
  }
  for (let i = 0; i < 400 && damageOn(engine, boss).length === 0; i++) {
    const d = nextInput(engine, 4000);
    if (!d) break;
    engine.submit({ kind: 'defend', targets: [] });
  }
  return Math.max(0, ...damageOn(engine, boss).map((e) => e.amount ?? 0));
}

describe('Paine\'s grid at the start of the chapter', () => {
  it('is The End at node 0, as the Dark Knight, with no gate crossed and the Break Damage Limit OFF (the build header says so)', () => {
    const paine = fallenMaestersBuild.members.find((m) => m.id === 'paine')!;
    expect(paine.garmentGrid).toMatchObject({ id: 'the-end', nodePosition: 0, passedGates: [] });
    expect(paine.currentDressphere).toBe('dark-knight');
    const engine = quiet();
    expect(unit(engine, 'paine').aiMemory?.['bdl'], 'the limit is not broken before the gates are crossed').toBeFalsy();
    expect(unit(engine, 'paine').dresspheres?.garmentGrid.passedGates).toEqual([]);
  });

  it('Charon from the start is capped at 9,999: the shell holds (so the walk is not optional)', () => {
    const engine = quiet(3);
    const biggest = charonFrom(engine);
    expect(biggest).toBeGreaterThan(0);
    expect(biggest).toBeLessThanOrEqual(9_999);
    expect((unit(engine, bossOf(2)).aiMemory as Record<string, unknown>)['conchererShellBroken']).toBeUndefined();
  });
});

describe('the walk is four Changes, each a row of the menu', () => {
  it('plans the shortest route on the card: from node 0 with nothing crossed it names a node, and from home with both crossed it names none', () => {
    expect(nextNodeOnWalk('the-end', 0, [], BOTH)).not.toBeNull();
    expect(nextNodeOnWalk('the-end', 0, ['red', 'green'], BOTH)).toBeNull();
    expect(nextNodeOnWalk('the-end', 2, ['red', 'green'], BOTH), 'away from home with both crossed: the way back').not.toBeNull();
    expect(nextNodeOnWalk('no-such-grid', 0, [], BOTH)).toBeNull();
  });

  it('four spherechanges cross both gates and return Paine to the Dark Knight with the limit on; she keeps it', () => {
    const engine = quiet();
    const paine = unit(engine, 'paine');
    const done = (): boolean => paine.dresspheres?.current === 'dark-knight' && (paine.dresspheres?.garmentGrid.passedGates.length ?? 0) >= 2 && paine.dresspheres?.garmentGrid.nodePosition === 0;
    const changes = walkPaine(engine, done);
    expect(done()).toBe(true);
    expect(changes, 'the shortest walk on The End\'s card').toBe(4);
    expect(paine.dresspheres?.garmentGrid.passedGates).toEqual(expect.arrayContaining(BOTH));
    expect(paine.aiMemory?.['bdl']).toBe(true);
  });

  it('and then the same Charon is a result of 10,000 or more and breaks Concherer\'s shell', () => {
    const engine = quiet(3);
    const paine = unit(engine, 'paine');
    walkPaine(engine, () => paine.dresspheres?.current === 'dark-knight' && paine.aiMemory?.['bdl'] === true && paine.dresspheres?.garmentGrid.nodePosition === 0);
    const biggest = charonFrom(engine);
    expect(biggest).toBeGreaterThanOrEqual(10_000);
    const boss = unit(engine, bossOf(2));
    expect((boss.aiMemory as Record<string, unknown>)['conchererShellBroken']).toBe(1);
    expect([boss.stats.def, boss.stats.mdef]).toEqual([1, 1]);
  });
});
