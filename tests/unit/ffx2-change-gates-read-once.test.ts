/**
 * The array of gates a change carries is read only when the change uses it (FFX-2 only; `src/battle/ffx2/spherechange.ts#performSpherechange`; the review fix pass 5 of the Special Dress Up, 2026-11-10).
 *
 * Fix pass 4 copied `command.extra.gatesCrossed` in `execute.ts` before anything looked at the command. A girl whose grid the registry holds (all 79 girls of the 27 shipped builds) takes the LINK's own gates and
 * never reads the command's array, so that copy walked an array the engine otherwise ignores: a plain `new Array(2**32-1)` aborted the process, and an iterable that is not an `Array` (a one-shot generator, a
 * custom iterator) slipped past the `Array.isArray` guard and was walked twice by a grid the registry does not hold, so the gates banked differed from the gates reported. Pass 5 took the copy out:
 * a registered grid never touches the array; an unregistered one gets ONE plain copy, after the gate accepted the command and before `sphere.current` moves.
 *
 * Registered grid: every FFX-2 chapter build, the switch ABSENT, OFF and ON. Unregistered grid: the bahamut build with the first girl's `garmentGrid.id` changed on the engine to one `deps.grids` does not hold
 * (an input to the measurement, not game data; the same rig as `ffx2-change-gate-single-read.test.ts`).
 * NEVER run the sparse-array case against the code with the eager copy in it inside vitest: it aborts the worker with a 4 GB heap (the mutation round runs this file with `-t` leaving that one out).
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../src/battle/common/types.ts';
import type { RngSnapshot } from '../../src/battle/common/streams.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { isSpecialDress } from '../../src/battle/ffx2/special/forms.ts';
import { MODES, SPECIALS, ffx2Chapters, girlsOf, layoutOf, linkedNodes, messagesOf, openIn, rngOf, stateOf, toGirl, type Mode } from './helpers/changeGate.ts';
import { unit } from './helpers/specialDrive.ts';

const SEED = 1;
const chapters = ffx2Chapters();

/** A gates array that counts: an Array subclass counting its iterations, and a Proxy of an array counting every trap. */
class CountedArray extends Array<string> {
  iterations = 0;
  override [Symbol.iterator]() {
    this.iterations += 1;
    return super[Symbol.iterator]();
  }
}
const countedArray = (...items: string[]): CountedArray => Object.assign(new CountedArray(), items);
function watchedArray(items: string[]): { value: string[]; touches: () => number } {
  let n = 0;
  const value = new Proxy(items, {
    get: (t, k, r) => (n++, Reflect.get(t, k, r)),
    has: (t, k) => (n++, Reflect.has(t, k)),
    ownKeys: (t) => (n++, Reflect.ownKeys(t)),
    getOwnPropertyDescriptor: (t, k) => (n++, Reflect.getOwnPropertyDescriptor(t, k)),
    getPrototypeOf: (t) => (n++, Reflect.getPrototypeOf(t)),
  });
  return { value, touches: () => n };
}

interface Start {
  base: FFX2Engine;
  rng: RngSnapshot;
}
/** The command on a fork of the engine at the girl's first menu: the events it returns, the state and the random stream after. */
function run(g: Start, command: Command) {
  const f = g.base.fork(SEED, g.rng);
  const events = f.submit(command);
  return { f, events, state: stateOf(f), rng: rngOf(f) };
}
const spherechanges = (events: Array<{ type: string }>): number => events.filter((e) => e.type === 'spherechange').length;
const gatesOf = (events: Array<{ type: string }>): unknown => (events.find((e) => e.type === 'spherechange') as unknown as { gatesCrossed: string[] } | undefined)?.gatesCrossed;

interface Girl extends Start {
  id: string;
  /** One node linked to hers, with the gates on the link; `dress` is the ordinary dress on it (null in a build whose linked nodes hold none: the change is then refused). */
  link: { node: number; gates: string[] };
  dress: string | null;
}
const girlsAt = (chapter: (typeof chapters)[number], mode: Mode): Girl[] => {
  const ordinary = (d: string | null | undefined): d is string => typeof d === 'string' && d.length > 0 && !isSpecialDress(d);
  const girls: Girl[] = [];
  for (const id of girlsOf(chapter)) {
    const base = openIn(chapter, mode, SEED);
    if (toGirl(base, id) === null) continue;
    const layout = layoutOf(chapter, id, mode);
    const links = linkedNodes(base, id);
    const link = links.find((l) => ordinary(layout[l.node])) ?? links[0];
    if (link !== undefined) girls.push({ id, base, rng: rngOf(base), link, dress: ordinary(layout[link.node]) ? (layout[link.node] as string) : null });
  }
  return girls;
};

describe.each(chapters.map((c) => [c.id, c] as const))('the gates array of a change is read only when used (a registered grid), %s', (_id, chapter) => {
  // A registered grid takes the LINK's own gates: the engine never iterates, indexes or measures the command's `gatesCrossed`.
  const changeWith = (g: Girl, gatesCrossed?: unknown): Command =>
    ({ kind: 'spherechange', targets: [], extra: { toDressphere: g.dress, toNode: g.link.node, ...(gatesCrossed === undefined ? {} : { gatesCrossed }) } }) as unknown as Command;
  /** The forged command gives exactly what the same command without `gatesCrossed` gives. */
  const same = (who: string, g: Girl, forged: Command): void => {
    const got = run(g, forged);
    const ref = run(g, changeWith(g));
    expect(got.events, `${who}: events`).toEqual(ref.events);
    expect(got.state, `${who}: state`).toEqual(ref.state);
    expect(got.rng, `${who}: random stream`).toEqual(ref.rng);
    expect(spherechanges(ref.events), `${who}: accepted exactly where the node holds an ordinary dress`).toBe(g.dress === null ? 0 : 1);
    if (g.dress !== null) expect(gatesOf(got.events), `${who}: reports the link's own gates`).toEqual(g.link.gates);
  };

  for (const mode of MODES) {
    it(`switch ${mode}: an array that counts iterations, a Proxy that counts touches, an iterator that throws: never read, the result is the command without gatesCrossed`, () => {
      const girls = girlsAt(chapter, mode);
      expect(girls.length, `${chapter.id}: at least one girl was run`).toBeGreaterThan(0);
      for (const g of girls) {
        const counted = countedArray('red', 'green', 'blue', 'yellow');
        same(`${g.id} counting subclass`, g, changeWith(g, counted));
        expect(counted.iterations, `${g.id}: iterated 0 times`).toBe(0);
        const watched = watchedArray(['red', 'green', 'blue', 'yellow']);
        same(`${g.id} counting Proxy`, g, changeWith(g, watched.value));
        expect(watched.touches(), `${g.id}: touched 0 times`).toBe(0);
        const throwing = Object.defineProperty(['red'], Symbol.iterator, { value: () => { throw new Error('the engine iterated the gates of a registered grid'); } });
        same(`${g.id} throwing iterator`, g, changeWith(g, throwing));
      }
    });
  }

  it('a plain new Array(2**32-1) is accepted in under a second, the same result as the command without gatesCrossed', () => {
    for (const g of girlsAt(chapter, 'absent')) {
      const started = performance.now();
      same(`${g.id} sparse 2**32-1`, g, changeWith(g, new Array(2 ** 32 - 1)));
      expect(performance.now() - started, `${g.id}: both runs together`).toBeLessThan(1000);
    }
  });
});

describe('the gates array of a change is read once, and only when used (a grid the registry does not hold)', () => {
  // With no link to read, `performSpherechange` takes the command's own `gatesCrossed`: one plain copy, after the gate accepted and before the state moves. The command moves her to another node of her grid, with the dress on it.
  const chapter = chapters.find((c) => c.id === 'ffx2-bahamut')!;
  const fixture = () => {
    const base = openIn(chapter, 'absent', SEED);
    const girl = girlsOf(chapter)[0] as string;
    toGirl(base, girl);
    const sphere = unit(base, girl).dresspheres!;
    sphere.garmentGrid.id = 'a-grid-the-registry-does-not-hold';
    const nodes = (base as unknown as { gridNodes: Record<string, Array<string | null>> }).gridNodes[girl] as Array<string | null>;
    // she moves to a node of her own grid that holds a different ordinary dress (no link is checked without a registered grid), so a change that lands before the array fails would show
    const toNode = nodes.findIndex((d, i) => i !== sphere.garmentGrid.nodePosition && typeof d === 'string' && !isSpecialDress(d) && d !== sphere.current);
    expect(toNode, 'the rig: her grid has a node holding another ordinary dress').toBeGreaterThanOrEqual(0);
    const extra = { toDressphere: nodes[toNode], toNode };
    const change = (gatesCrossed: unknown, over: object = {}): Command => ({ kind: 'spherechange', targets: [], extra: { ...extra, gatesCrossed, ...over } }) as unknown as Command;
    return { g: { base, rng: rngOf(base) }, girl, change, passed: [...sphere.garmentGrid.passedGates] };
  };
  const banked = (f: FFX2Engine, girl: string, passed: string[]): string[] => unit(f, girl).dresspheres!.garmentGrid.passedGates.slice(passed.length);

  it("the gates banked and the gates reported are the first walk's, as for a plain command; a Proxy array is walked once", () => {
    const { g, girl, change } = fixture();
    let walks = 0;
    const gates = new Proxy(['red'], { get: (t, key) => (key === Symbol.iterator ? () => (walks++ === 0 ? ['red'] : ['blue'])[Symbol.iterator]() : Reflect.get(t, key)) });
    const got = run(g, change(gates));
    const ref = run(g, change(['red']));
    expect(walks, 'walked once (copied), not once per reader').toBe(1);
    expect(got.events).toEqual(ref.events);
    expect(got.state).toEqual(ref.state);
    expect(got.rng).toEqual(ref.rng);
    expect(gatesOf(got.events), 'reported').toEqual(['red']);
    expect(unit(got.f, girl).dresspheres!.garmentGrid.passedGates, 'banked').toEqual(['red']);
  });

  const walkedOnce: Array<[string, () => { gates: unknown; walks: () => number }]> = [
    ['a one-shot generator', () => ({ gates: (function* () { yield 'red'; yield 'blue'; })(), walks: () => 1 })],
    [
      'a custom iterable handing out one iterator',
      () => {
        let walks = 0;
        const it = ['red', 'blue'][Symbol.iterator]();
        return { gates: { [Symbol.iterator]: () => (walks++, it) }, walks: () => walks };
      },
    ],
    ['an Array subclass counting its iterations', () => { const a = countedArray('red', 'blue'); return { gates: a, walks: () => a.iterations }; }],
  ];
  it.each(walkedOnce)('%s is walked exactly once; the gates banked equal the gates reported, as for the same gates in a plain array', (_name, make) => {
    const { g, girl, change, passed } = fixture();
    const { gates, walks } = make();
    const got = run(g, change(gates));
    const ref = run(g, change(['red', 'blue']));
    expect(walks(), 'walked once').toBe(1);
    expect(gatesOf(got.events), 'reported').toEqual(['red', 'blue']);
    expect(banked(got.f, girl, passed), 'banked').toEqual(['red', 'blue']);
    expect(got.events).toEqual(ref.events);
    expect(got.state).toEqual(ref.state);
    expect(got.rng).toEqual(ref.rng);
  });

  it('an absent or null gatesCrossed banks nothing and reports none, as an empty array does', () => {
    const { g, change } = fixture();
    for (const none of [undefined, null]) {
      const got = run(g, change(none));
      const ref = run(g, change([]));
      expect(got.events).toEqual(ref.events);
      expect(got.state).toEqual(ref.state);
      expect(gatesOf(got.events)).toEqual([]);
    }
  });

  it('a command the gate refuses never walks the array', () => {
    const { g, change } = fixture();
    const counted = countedArray('red', 'blue');
    const got = run(g, change(counted, { toDressphere: SPECIALS[0] }));
    const ref = run(g, change([], { toDressphere: SPECIALS[0] }));
    expect(messagesOf(ref.events), 'the plain command is refused').toEqual(['Not linked']);
    expect(counted.iterations, 'walked 0 times').toBe(0);
    expect(got.events).toEqual(ref.events);
    expect(got.state).toEqual(ref.state);
  });

  /** What the unit holds apart from the ATB gauge (`performCommand` marks the gauge as executing before it looks at the command, as it always has: a pre-existing, informational point). */
  const heldBy = (f: FFX2Engine, girl: string): unknown => {
    const { gauge: _gauge, atb: _atb, ...rest } = JSON.parse(JSON.stringify(unit(f, girl))) as Record<string, unknown>;
    return rest;
  };
  const throwingIterator = (): object => ({ [Symbol.iterator]: () => { throw new Error('boom'); } });
  const throwsLate = (): object => {
    let n = 0;
    return { [Symbol.iterator]: () => ({ next: () => { if (n++ === 0) return { value: 'red', done: false }; throw new Error('boom'); } }) };
  };
  it.each([['a number (not iterable)', () => 5], ['an iterator that throws at once', throwingIterator], ['an iterator that throws on its second step', throwsLate]] as Array<[string, () => unknown]>)(
    '%s fails before the state moves: the unit holds exactly what it held',
    (_name, make) => {
      const { g, girl, change } = fixture();
      const f = g.base.fork(SEED, g.rng);
      const before = heldBy(f, girl);
      expect(() => f.submit(change(make()))).toThrow();
      expect(heldBy(f, girl)).toEqual(before);
    },
  );
});
