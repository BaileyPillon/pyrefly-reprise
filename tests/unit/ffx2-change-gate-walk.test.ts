/**
 * The gate on an ordinary Change leaves the honest walk alone (FFX-2 only; `src/battle/ffx2/spherechange.ts#ordinaryChangeAllowed`; the review fix pass 3 of the Special Dress Up, 2026-11-10).
 *
 * On every FFX-2 chapter build the tree has, for every girl who owns a Special: with the `specialDressUp` switch ON her complete walk along her own Garment Grid (every Change row the menu
 * offers, each one accepted by the gate) still ends in the offer of the Special Dress Up row, and picking it puts the Special on her; with the switch OFF or ABSENT the same walk never offers the row and
 * nobody wears a Special. The pure rule is pinned beside it on the forms a caller can hand it.
 */

import { describe, expect, it } from 'vitest';

import { ordinaryChangeAllowed } from '../../src/battle/ffx2/spherechange.ts';
import { isSpecialDress } from '../../src/battle/ffx2/special/forms.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { extraOf, ffx2Chapters, girlsOf, layoutOf, linkedNodes, messagesOf, openIn, OWN_SPECIAL, SPECIALS, toGirl } from './helpers/changeGate.ts';
import { changeRows, intoSpecial, logOf, makeInvincible, specialRow, unit, walkTo } from './helpers/specialDrive.ts';

const chapters = ffx2Chapters();
const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The rig of every Special walk (the `immortal` of `specialDrive.openSpecial`, an input to a measurement, never game data): the girls cannot be defeated before the walk is done (Angra Mainyu's script ends the fight otherwise). */
function walk(chapter: (typeof chapters)[number], mode: 'absent' | 'off' | 'on', girl: string, maxDecisions: number) {
  const engine = openIn(chapter, mode);
  const present = girlsOf(chapter);
  for (const g of present) makeInvincible(unit(engine, g));
  return { engine, walk: walkTo(engine, girl, { immortal: GIRLS.every((g) => present.includes(g)), maxDecisions }) };
}

describe.each(chapters.map((c) => [c.id, c] as const))('the complete walk, %s', (_id, chapter) => {
  const owners = girlsOf(chapter).filter((g) => OWN_SPECIAL[g] !== undefined && unit(openIn(chapter, 'on'), g).dresspheres!.owned.includes(OWN_SPECIAL[g] as string));

  it('owns Specials only where the build lists them (the walk below is run for each owner)', () => {
    expect(owners.every((g) => OWN_SPECIAL[g] !== undefined)).toBe(true);
  });

  for (const girl of owners) {
    it(`${girl}: switch ON, the walk offers the Special Dress Up row and the row puts ${OWN_SPECIAL[girl]} on her`, () => {
      const { engine, walk: done } = walk(chapter, 'on', girl, 1500);
      expect(done.input, `${chapter.id}: ${girl} was offered her Special after ${done.changes} Changes`).not.toBeNull();
      expect(specialRow(done.input!)).toBeDefined();
      expect(isSpecialDress(unit(engine, girl).dresspheres!.current), 'a Special is not worn before the pick').toBe(false);
      intoSpecial(engine, done.input!);
      expect(unit(engine, girl).dresspheres!.current).toBe(OWN_SPECIAL[girl]);
      expect(logOf(engine).some((e) => e.type === 'spherechange' && (e as unknown as { special?: string }).special === OWN_SPECIAL[girl])).toBe(true);
    });

    for (const mode of ['absent', 'off'] as const) {
      it(`${girl}: switch ${mode}, the same walk never offers the row and nobody wears a Special`, () => {
        const { engine, walk: done } = walk(chapter, mode, girl, 600);
        expect(done.input, `${chapter.id}: no row offered after ${done.changes} Changes`).toBeNull();
        expect(girlsOf(chapter).filter((g) => isSpecialDress(unit(engine, g).dresspheres?.current))).toEqual([]);
      });
    }
  }
});

describe('ordinaryChangeAllowed, the pure rule', () => {
  const chapter = chapters.find((c) => c.id === 'ffx2-leblanc')!;
  const engine = openIn(chapter, 'absent');
  const yuna = unit(engine, 'yuna');
  const layout = layoutOf(chapter, 'yuna', 'absent');
  const deps = (gridNodes: Record<string, Array<string | null>>) => ({ grids: { get: () => undefined }, dresspheres: { get: () => undefined }, gridNodes }) as never;
  const ask = (extra: Record<string, unknown>, nodes: Record<string, Array<string | null>> = { yuna: layout }): boolean =>
    ordinaryChangeAllowed(yuna as never, { kind: 'spherechange', targets: [], extra: { gatesCrossed: [], ...extra } } as never, deps(nodes));

  it('accepts the dress on the node, with or without the flag field false', () => {
    expect(ask({ toDressphere: layout[1], toNode: 1 })).toBe(true);
    expect(ask({ toDressphere: layout[1], toNode: 1, specialDressUp: false })).toBe(true);
  });

  it('refuses another dress for the node, an empty or missing dress, and any node that is out of range or not a whole number', () => {
    expect(ask({ toDressphere: layout[2], toNode: 1 })).toBe(false);
    expect(ask({ toDressphere: 'no-such-dress', toNode: 1 })).toBe(false);
    expect(ask({ toDressphere: null, toNode: layout.length - 1 }, { yuna: [...layout.slice(0, -1), null] })).toBe(false);
    expect(ask({ toDressphere: '', toNode: 1 }, { yuna: ['', '', ''] })).toBe(false);
    for (const node of [-1, 99, 1.5, Number.NaN, 'length', '__proto__', '1']) expect(ask({ toDressphere: layout[1], toNode: node }), String(node)).toBe(false);
  });

  it('refuses a Special even when a build put it on a node, and any command that carries the Special flag', () => {
    for (const special of SPECIALS) expect(ask({ toDressphere: special, toNode: 1 }, { yuna: [layout[0] ?? null, special] }), special).toBe(false);
    expect(ask({ toDressphere: layout[1], toNode: 1, specialDressUp: true })).toBe(false);
  });

  it('refuses when the engine holds no node contents for her (a unit it never built a grid for)', () => {
    expect(ask({ toDressphere: layout[1], toNode: 1 }, {})).toBe(false);
    expect(ask({ toDressphere: layout[1], toNode: 1 }, { rikku: layout })).toBe(false);
  });

  it('reads HER grid, not another girl\'s', () => {
    const rikku = layoutOf(chapter, 'rikku', 'absent');
    const other = rikku.findIndex((d, i) => d !== layout[i] && d != null);
    expect(other, 'the two girls\' grids differ somewhere').toBeGreaterThan(-1);
    expect(ask({ toDressphere: rikku[other], toNode: other }, { yuna: layout, rikku })).toBe(false);
  });
});

describe('a Special that a build lists within the grid\'s node count (no shipped chapter does; the layout of the switch OFF is "as it always was")', () => {
  const chapter = chapters.find((c) => c.id === 'ffx2-leblanc')!;
  const rig = (party: FFX2PartyBuild): void => {
    const yuna = party.members.find((m) => m.id === 'yuna')!;
    yuna.owned = [yuna.currentDressphere, 'floral-fallal', ...yuna.owned.filter((d) => d !== yuna.currentDressphere && d !== 'floral-fallal')];
  };
  const nodesOfYuna = (engine: ReturnType<typeof openIn>): Array<string | null> => (engine as unknown as { gridNodes: Record<string, Array<string | null>> }).gridNodes['yuna'] as Array<string | null>;

  it('switch OFF: the Special takes node 1, the menu offers no Change row to it, and the command the old menu built is refused', () => {
    const engine = openIn(chapter, 'off', 1, rig);
    expect(nodesOfYuna(engine)[1], 'the rig took: the layout of the switch OFF puts the Special on node 1').toBe('floral-fallal');
    const menu = toGirl(engine, 'yuna')!;
    const linked = linkedNodes(engine, 'yuna').map((l) => l.node);
    expect(linked).toContain(1);
    const rows = changeRows(menu).map((r) => extraOf(r).toNode);
    expect(rows).not.toContain(1);
    expect(rows.sort()).toEqual(linked.filter((n) => n !== 1 && nodesOfYuna(engine)[n] != null).sort());
    const wore = unit(engine, 'yuna').dresspheres!.current;
    const events = engine.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: 'floral-fallal', toNode: 1, gatesCrossed: [] } });
    expect(unit(engine, 'yuna').dresspheres!.current).toBe(wore);
    expect(messagesOf(events)).toEqual(['Not linked']);
  });

  it('switch ON: a Special never takes a node, so the same build lays out without it', () => {
    const engine = openIn(chapter, 'on', 1, rig);
    expect(nodesOfYuna(engine)).not.toContain('floral-fallal');
  });
});
