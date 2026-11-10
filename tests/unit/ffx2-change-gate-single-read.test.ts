/**
 * A spherechange command is read ONCE (FFX-2 only; `src/battle/ffx2/execute.ts#performCommand`, the top of the spherechange branch; the review fix pass 4 of the Special Dress Up, 2026-11-10).
 *
 * The verifier of fix pass 3 found one gap in the gate on an ordinary Change (`spherechange.ts#ordinaryChangeAllowed`): the gate, the Special path and the change each read `command.extra`, so a command
 * whose `extra` has an accessor (a getter, or a Proxy answering differently per read) was checked with one value and worn with another. With the switch absent or off a Special (her own, another girl's) or
 * a made-up id was worn on the node of her own grid; a getter on `toNode` split the dress from the node. Only in-page JavaScript (the debug console) can build such a command; no menu does.
 * The engine now copies the command into plain data first. Every case below forges a command whose properties answer differently on later reads, hands it to `engine.submit` (the debug console's
 * `forceCommand` is the same call) on a copy of the engine at the girl's first menu, and demands that the result be exactly what a plain-data command holding the FIRST-read values gives: the same events, the
 * same state, the same random stream; that every property was read once; and that the case is a real one (the plain command is refused where it names a dress the node does not hold, accepted where it
 * names the node's own). Every FFX-2 chapter build the tree has, the switch ABSENT (the shipped default), OFF and ON. The Special path itself is untouched: with the switch on the complete walk still
 * puts her Special on her through a command of accessors (last test).
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../src/battle/common/types.ts';
import type { RngSnapshot } from '../../src/battle/common/streams.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { isSpecialDress } from '../../src/battle/ffx2/special/forms.ts';
import { MODES, OWN_SPECIAL, SPECIALS, ffx2Chapters, girlsOf, layoutOf, linkedNodes, messagesOf, openIn, rngOf, stateOf, toGirl, type Mode } from './helpers/changeGate.ts';
import { intoSpecial, makeInvincible, specialRow, unit, walkTo, type Unit } from './helpers/specialDrive.ts';

const SEED = 1;
const chapters = ffx2Chapters();

type Key = 'toDressphere' | 'toNode' | 'gatesCrossed' | 'specialDressUp';
/** Per property: what its 1st, 2nd, 3rd ... read answers (the last answer repeats). The engine that reads once sees the first. */
type Answers = Partial<Record<Key, unknown[]>>;
type Form = 'getter' | 'proxy';

/** `refuse`: the engine's own refusal of an unlinked Change (`Not linked`, her turn spent, nothing else). `accept`: the Change to `to` at `node`. `any`: the Special path's own command with the switch on, which the plain command decides. */
type Case = { label: string; form: Form; answers: Answers } & ({ wants: 'refuse' | 'any' } | { wants: 'accept'; to: string; node: number });

/** A command whose properties answer by read count: as accessors on `extra`, or through a Proxy standing for `extra`. `reads` counts every read of each property. */
function forge(form: Form, answers: Answers): { command: Command; reads: Record<string, number> } {
  const reads: Record<string, number> = {};
  const keys = Object.keys(answers);
  const answer = (key: string): unknown => {
    const list = answers[key as Key] as unknown[];
    const n = reads[key] ?? 0;
    reads[key] = n + 1;
    return list[Math.min(n, list.length - 1)];
  };
  let extra: object;
  if (form === 'getter') {
    extra = {};
    for (const key of keys) Object.defineProperty(extra, key, { enumerable: true, configurable: true, get: () => answer(key) });
  } else {
    extra = new Proxy(Object.fromEntries(keys.map((k) => [k, null])), { get: (_t, key) => (typeof key === 'string' && keys.includes(key) ? answer(key) : undefined) });
  }
  return { command: { kind: 'spherechange', targets: [], extra } as unknown as Command, reads };
}

/** The plain-data command that holds the first-read values: what the engine must do with the forged one. */
const plain = (answers: Answers): Command =>
  ({ kind: 'spherechange', targets: [], extra: Object.fromEntries(Object.entries(answers).map(([k, list]) => [k, (list as unknown[])[0]])) }) as unknown as Command;

interface Girl {
  id: string;
  base: FFX2Engine;
  rng: RngSnapshot;
  here: number;
  wearing: string;
  /** One node linked to hers, an ordinary dress on it if any is (a build with one dress has only empty nodes linked: `dress` is then null). */
  link: { node: number; gates: string[] };
  dress: string | null;
  /** Another node holding a different ordinary dress (a pair to split the first against), if the build has one. */
  other: { node: number; dress: string } | undefined;
  own: string;
}

let memo: { key: string; girls: Girl[] } | null = null;
/** Each girl of the chapter at her first menu (the others defending), the engine opened as the app opens it. Kept for the (chapter, mode) being run: the cases of one pair run in a row. */
function girlsAt(chapter: (typeof chapters)[number], mode: Mode): Girl[] {
  const key = `${chapter.id}/${mode}`;
  if (memo?.key === key) return memo.girls;
  const ordinary = (d: string | null | undefined): d is string => typeof d === 'string' && d.length > 0 && !isSpecialDress(d);
  const girls: Girl[] = [];
  for (const id of girlsOf(chapter)) {
    const base = openIn(chapter, mode, SEED);
    if (toGirl(base, id) === null) continue;
    const sphere = unit(base, id).dresspheres!;
    const layout = layoutOf(chapter, id, mode);
    const links = linkedNodes(base, id);
    const link = links.find((l) => ordinary(layout[l.node])) ?? links[0];
    if (link === undefined) continue;
    const dress = ordinary(layout[link.node]) ? (layout[link.node] as string) : null;
    const otherNode = layout.findIndex((d, i) => i !== link.node && ordinary(d) && d !== dress);
    girls.push({
      id, base, rng: rngOf(base), here: sphere.garmentGrid.nodePosition, wearing: sphere.current, link, dress,
      other: otherNode < 0 ? undefined : { node: otherNode, dress: layout[otherNode] as string }, own: OWN_SPECIAL[id] ?? SPECIALS[0],
    });
  }
  memo = { key, girls };
  return girls;
}

const spherechanges = (events: Array<{ type: string }>): number => events.filter((e) => e.type === 'spherechange').length;

function run(g: { base: FFX2Engine; rng: RngSnapshot }, command: Command) {
  const f = g.base.fork(SEED, g.rng);
  const events = f.submit(command);
  return { f, events, state: stateOf(f), rng: rngOf(f) };
}

/** One forged command against the plain command of its first-read values, and the checks that make the case a real one. */
function check(chapterId: string, mode: Mode, g: Girl, c: Case): void {
  const who = `${chapterId} ${g.id} (${mode}) ${c.form}: ${c.label}`;
  const { command, reads } = forge(c.form, c.answers);
  const got = run(g, command);
  const ref = run(g, plain(c.answers));
  expect(got.events, `${who}: events`).toEqual(ref.events);
  expect(got.state, `${who}: state`).toEqual(ref.state);
  expect(got.rng, `${who}: random stream`).toEqual(ref.rng);
  for (const key of Object.keys(c.answers)) expect(reads[key], `${who}: ${key} read once`).toBe(1);
  if (mode !== 'on') for (const u of Object.values(got.f.state().combatants) as Unit[]) expect(isSpecialDress(u.dresspheres?.current), `${who}: ${u.id} wears no Special`).toBe(false);
  const after = unit(got.f, g.id).dresspheres!;
  if (c.wants === 'refuse') {
    expect(messagesOf(ref.events), `${who}: the plain command is refused`).toEqual(['Not linked']);
    expect(spherechanges(ref.events), who).toBe(0);
    expect([after.current, after.garmentGrid.nodePosition], `${who}: nothing changed`).toEqual([g.wearing, g.here]);
  } else if (c.wants === 'accept') {
    expect(spherechanges(ref.events), `${who}: the plain command is accepted`).toBe(1);
    expect([after.current, after.garmentGrid.nodePosition], `${who}: the pair is the node's own`).toEqual([c.to, c.node]);
  }
}

const refuse = (label: string, form: Form, answers: Answers): Case => ({ label, form, answers, wants: 'refuse' });
const accept = (label: string, form: Form, answers: Answers, to: string, node: number): Case => ({ label, form, answers, wants: 'accept', to, node });
/** The Change to the node's own dress; where the node holds none (a build with one dress) there is nothing to accept and the plain command is refused. */
const ownDress = (g: Girl, label: string, form: Form, answers: Answers, node = g.link.node): Case =>
  g.dress === null ? refuse(`${label} (the node holds no dress)`, form, answers) : accept(label, form, answers, g.dress, node);

/** toDressphere answers differently per read: the forged dress on the first read or on a later one. */
function dressCases(g: Girl, form: Form): Case[] {
  const { node, gates } = g.link;
  const still = { toNode: [node], gatesCrossed: [gates] };
  const out: Case[] = [];
  for (const forged of [g.own, SPECIALS.find((s) => s !== g.own)!, 'no-such-dress']) {
    out.push(refuse(`${forged} first, then the node's ${g.dress}`, form, { toDressphere: [forged, g.dress], ...still }));
    out.push(ownDress(g, `${g.dress} first, then ${forged}`, form, { toDressphere: [g.dress, forged], ...still }));
    out.push(ownDress(g, `${g.dress} twice, then ${forged}`, form, { toDressphere: [g.dress, g.dress, forged], ...still }));
  }
  return out;
}

/** toNode answers differently per read: the dress of one node on the node of another (the pair split), in both orders. */
function nodeCases(g: Girl, form: Form): Case[] {
  const { node, gates } = g.link;
  if (g.other === undefined || g.dress === null) return [];
  const { other } = g;
  return [
    refuse(`${other.dress}: node ${node} first, then node ${other.node} (the dress of the second on the first)`, form, { toDressphere: [other.dress], toNode: [node, other.node], gatesCrossed: [gates] }),
    refuse(`${g.dress}: node ${other.node} first, then node ${node}`, form, { toDressphere: [g.dress], toNode: [other.node, node], gatesCrossed: [gates] }),
    ownDress(g, `${g.dress}: node ${node} first, then node ${other.node}`, form, { toDressphere: [g.dress], toNode: [node, other.node], gatesCrossed: [gates] }),
  ];
}

/** specialDressUp answers differently per read: with an ordinary dress (a flagged ordinary Change is no ordinary Change) and with her own Special (the Special path's own command). */
function flagCases(g: Girl, form: Form, mode: Mode): Case[] {
  const { node, gates } = g.link;
  const ordinary = { toDressphere: [g.dress], toNode: [node], gatesCrossed: [gates] };
  const special = { toDressphere: [g.own], toNode: [g.here], gatesCrossed: [[]] };
  return [
    refuse(`${g.dress}: flag true, then false`, form, { ...ordinary, specialDressUp: [true, false] }),
    ownDress(g, `${g.dress}: flag false, then true`, form, { ...ordinary, specialDressUp: [false, true] }),
    ownDress(g, `${g.dress}: flag absent, then true`, form, { ...ordinary, specialDressUp: [undefined, true] }),
    refuse(`${g.own}: flag false, then true`, form, { ...special, specialDressUp: [false, true] }),
    // the Special path's own command (the flag true on her own Special): refused as a Change with the switch absent or off; with it on the plain command decides (`Not ready` where the walk is not done)
    { label: `${g.own}: flag true, then false`, form, answers: { ...special, specialDressUp: [true, false] }, wants: mode === 'on' ? 'any' : 'refuse' },
  ];
}

/** An accessor that answers the same every time is a plain command: the Change is accepted, in the same shape. */
const honestCases = (g: Girl, form: Form): Case[] => [
  ownDress(g, `${g.dress} on node ${g.link.node}, every property answering the same`, form, { toDressphere: [g.dress], toNode: [g.link.node], gatesCrossed: [g.link.gates], specialDressUp: [false] }),
];

const GROUPS: Array<[string, (g: Girl, mode: Mode) => Case[]]> = [
  ['a getter on toDressphere', (g) => dressCases(g, 'getter')],
  ['a Proxy standing for extra', (g, mode) => [...dressCases(g, 'proxy'), ...nodeCases(g, 'proxy'), ...flagCases(g, 'proxy', mode)]],
  ['a getter on toNode (the pair split)', (g) => nodeCases(g, 'getter')],
  ['a getter on specialDressUp', (g, mode) => flagCases(g, 'getter', mode)],
  ['accessors that answer the same every time (the control)', (g) => [...honestCases(g, 'getter'), ...honestCases(g, 'proxy')]],
];

describe.each(chapters.map((c) => [c.id, c] as const))('a spherechange command is read once, %s', (_id, chapter) => {
  for (const mode of MODES) {
    for (const [group, casesOf] of GROUPS) {
      it(`switch ${mode}, ${group}: the result is the plain command of the first-read values`, () => {
        let exercised = 0;
        for (const g of girlsAt(chapter, mode)) {
          for (const c of casesOf(g, mode)) {
            check(chapter.id, mode, g, c);
            exercised += 1;
          }
        }
        // a build with no second ordinary dress has no pair to split (the other groups cover it)
        if (!group.includes('toNode')) expect(exercised, `${chapter.id}: at least one forged command was run`).toBeGreaterThan(0);
      });
    }
  }
});

describe('the array of gates a change walks twice is copied too', () => {
  // A girl whose grid the registry does not know takes the command's own `gatesCrossed` (`performSpherechange`): it is walked once to bank the gates and once to report them. An array whose
  // iterator answers differently per walk banked one set and reported another. Rigged on the engine after init (an input to the measurement, not game data).
  const chapter = chapters.find((c) => c.id === 'ffx2-bahamut')!;

  it("the gates banked and the gates reported are the first walk's, as for a plain command; the array is walked once", () => {
    const base = openIn(chapter, 'absent', SEED);
    const girl = girlsOf(chapter)[0] as string;
    toGirl(base, girl);
    const sphere = unit(base, girl).dresspheres!;
    sphere.garmentGrid.id = 'a-grid-the-registry-does-not-hold';
    const nodes = (base as unknown as { gridNodes: Record<string, Array<string | null>> }).gridNodes[girl] as Array<string | null>;
    expect(nodes[sphere.garmentGrid.nodePosition], 'the rig: the node she stands on holds her dress').toBe(sphere.current);
    const g = { base, rng: rngOf(base) };
    const extra = { toDressphere: sphere.current, toNode: sphere.garmentGrid.nodePosition };
    let walks = 0;
    const gates = new Proxy(['red'], { get: (t, key) => (key === Symbol.iterator ? () => (walks++ === 0 ? ['red'] : ['blue'])[Symbol.iterator]() : Reflect.get(t, key)) });
    const got = run(g, { kind: 'spherechange', targets: [], extra: { ...extra, gatesCrossed: gates } } as unknown as Command);
    const ref = run(g, { kind: 'spherechange', targets: [], extra: { ...extra, gatesCrossed: ['red'] } } as unknown as Command);
    expect(walks, 'walked once (copied), not once per reader').toBe(1);
    expect(got.events).toEqual(ref.events);
    expect(got.state).toEqual(ref.state);
    expect(got.rng).toEqual(ref.rng);
    expect((got.events.find((e) => e.type === 'spherechange') as unknown as { gatesCrossed: string[] }).gatesCrossed, 'reported').toEqual(['red']);
    expect(unit(got.f, girl).dresspheres!.garmentGrid.passedGates, 'banked').toEqual(['red']);
  });
});

describe('the Special path is untouched: the complete walk, switch on, still puts her Special on her through a command of accessors', () => {
  const GIRLS = ['yuna', 'rikku', 'paine'];
  /** The first chapter build with a girl who owns her Special (the walk test covers every owner). */
  const firstOwner = () => {
    for (const chapter of chapters) {
      const probe = openIn(chapter, 'on');
      const girl = girlsOf(chapter).find((g) => OWN_SPECIAL[g] !== undefined && unit(probe, g).dresspheres!.owned.includes(OWN_SPECIAL[g] as string));
      if (girl !== undefined) return { chapter, girl };
    }
    throw new Error('no chapter build has a girl who owns her Special');
  };
  const { chapter, girl } = firstOwner();

  it(`${chapter.id}: ${girl} is offered the Special Dress Up row; the row picked as a command of getters puts ${OWN_SPECIAL[girl]} on her, as the plain row does`, () => {
    const present = girlsOf(chapter);
    const make = () => {
      const engine = openIn(chapter, 'on');
      for (const id of present) makeInvincible(unit(engine, id));
      const done = walkTo(engine, girl, { immortal: GIRLS.every((g) => present.includes(g)), maxDecisions: 1500 });
      expect(done.input, 'offered after the walk').not.toBeNull();
      return { engine, input: done.input! };
    };
    const plainRun = make();
    intoSpecial(plainRun.engine, plainRun.input);
    const forgedRun = make();
    const { extra } = specialRow(forgedRun.input)!.command as unknown as { extra: Record<string, unknown> };
    const reads: Record<string, number> = {};
    const accessor = {};
    for (const key of Object.keys(extra)) Object.defineProperty(accessor, key, { enumerable: true, get: () => ((reads[key] = (reads[key] ?? 0) + 1), extra[key]) });
    forgedRun.engine.submit({ kind: 'spherechange', targets: [], extra: accessor } as unknown as Command);
    expect(unit(forgedRun.engine, girl).dresspheres!.current).toBe(OWN_SPECIAL[girl]);
    expect(stateOf(forgedRun.engine)).toEqual(stateOf(plainRun.engine));
    expect(rngOf(forgedRun.engine)).toEqual(rngOf(plainRun.engine));
    for (const key of Object.keys(extra)) expect(reads[key], key).toBe(1);
  });
});
