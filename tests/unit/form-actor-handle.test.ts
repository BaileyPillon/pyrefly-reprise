/**
 * Test 13, the handle half, of the FFX-2 Special look (step C1; game case: FFX-2 only in what is seen, the plumbing inert): `FormActorHandle.ts` and the hit gate (D-9).
 *
 * A fake figure (a recording `Object3D` whose prototype chain runs through `PaintedActor`, so `instanceof PaintedActor` is the real check) and a fake stub stand in for the two actors. The
 * replay of a recorded burst through the handle and the presenter is step C2's.
 */
import { Group, Object3D, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createFormActorHandle, createHitGatedActor } from '../../src/engine/FormActorHandle.ts';
import { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { HANDLE_MEMBERS } from '../../src/engine/SpecialReactions.ts';
import { formHandleOf, setSpecialLook, setStageForm, type StageForm } from '../../src/engine/SpecialStaging.ts';

type Call = [name: string, args: unknown[]];

/** Every member of `ActorHandle` that is a method (the position is a property). */
const METHODS = Object.keys(HANDLE_MEMBERS).filter((k) => k !== 'position');

/** The value each fake method answers, so a caller's await or branch has something to read. */
const ANSWER: Record<string, (self: Fake) => unknown> = {
  recoil: () => Promise.resolve('recoiled'),
  hitReact: () => true,
  centerPoint: (self) => ({ who: self.label, point: 'center' }),
  headPoint: (self) => ({ who: self.label, point: 'head' }),
  strikeHeft: () => 0.5,
};

class Fake extends Object3D {
  readonly calls: Call[] = [];
  label = 'figure';
  height = 2.8;
  contentQuad(): string {
    return `${this.label}-quad`;
  }
}
// The real chain: Fake -> PaintedActor -> ... -> Object3D. The recording methods below are own members of Fake, so they shadow the real ones.
Object.setPrototypeOf(Fake.prototype, PaintedActor.prototype);
for (const name of METHODS) {
  (Fake.prototype as unknown as Record<string, unknown>)[name] = function (this: Fake, ...args: unknown[]): unknown {
    this.calls.push([name, args]);
    return ANSWER[name]?.(this);
  };
}

function make(label: string, at: [number, number, number]): Fake {
  const f = new Fake();
  f.label = label;
  f.position.set(...at);
  return f;
}
const as = (f: Fake): PaintedActor => f as unknown as PaintedActor;
const names = (f: Fake): string[] => f.calls.map(([n]) => n);

describe('the member table', () => {
  it('has 29 members: 16 forward, 10 swallow, 3 source', () => {
    const rules = Object.values(HANDLE_MEMBERS);
    expect(rules.length).toBe(29);
    expect(rules.filter((r) => r === 'forward').length).toBe(16);
    expect(rules.filter((r) => r === 'swallow').length).toBe(10);
    expect(rules.filter((r) => r === 'source').length).toBe(3);
  });

  it('the seven members with a stated default: waitMs, strikeHeft, moveTo, leap, strike and setFacing forward, standDown is swallowed', () => {
    for (const k of ['waitMs', 'strikeHeft', 'moveTo', 'leap', 'strike', 'setFacing']) expect(HANDLE_MEMBERS[k as keyof typeof HANDLE_MEMBERS], k).toBe('forward');
    expect(HANDLE_MEMBERS.standDown).toBe('swallow');
  });
});

describe('a part\'s handle', () => {
  const gate = { blocked: false };

  it('forwards setPose and the other forward members to the figure, with the arguments, and never to the stub', () => {
    const figure = make('figure', [1, 0, 0]);
    const stub = make('stub', [9, 9, 9]);
    const h = createFormActorHandle(as(figure), as(stub), 'a', gate);
    h.setPose('cast');
    h.setPose('idle', { immediate: true });
    h.hop(0.4, 300);
    h.setFacing(-1);
    h.waitMs(120);
    h.moveTo(new Vector3(1, 2, 3), 200);
    h.leap(1, 400);
    h.strikeHeft();
    expect(figure.calls.map(([n]) => n)).toEqual(['setPose', 'setPose', 'hop', 'setFacing', 'waitMs', 'moveTo', 'leap', 'strikeHeft']);
    expect(figure.calls[0]).toEqual(['setPose', ['cast']]);
    expect(figure.calls[1]).toEqual(['setPose', ['idle', { immediate: true }]]);
    expect(stub.calls).toEqual([]);
  });

  it('swallows fadeTo, dissolveTo, setStone, lieDown, setAlpha (and the rest): nothing reaches the figure, the promises resolve', async () => {
    const figure = make('figure', [1, 0, 0]);
    const h = createFormActorHandle(as(figure), as(make('stub', [0, 0, 0])), 'b', gate);
    await expect(h.fadeTo(0, 300)).resolves.toBeUndefined();
    await expect(h.dissolveTo(1, 900)).resolves.toBeUndefined();
    await expect(h.lieDown!(520)).resolves.toBeUndefined();
    await expect(h.ramp!('stone', 1, 400)).resolves.toBeUndefined();
    expect(h.setAlpha(0.5)).toBeUndefined();
    expect(h.setDissolve(0.5)).toBeUndefined();
    expect(h.setStone!(1)).toBeUndefined();
    expect(h.setBrightness(2)).toBeUndefined();
    expect(h.standDown!()).toBeUndefined();
    expect(h.noteStatus!('poison', true)).toBeUndefined(); // a status on a part never shows on the figure (reactionOf: none), even if a call site forgets the guard
    expect(figure.calls).toEqual([]);
  });

  it('position, centerPoint and headPoint follow the stub under (b) and the figure under (a)', () => {
    const figure = make('figure', [1, 0, 0]);
    const stub = make('stub', [9, 8, 7]);
    const a = createFormActorHandle(as(figure), as(stub), 'a', gate);
    const b = createFormActorHandle(as(figure), as(stub), 'b', gate);
    expect(a.position).toBe(figure.position);
    expect(b.position).toBe(stub.position);
    expect(a.centerPoint()).toEqual({ who: 'figure', point: 'center' });
    expect(a.headPoint()).toEqual({ who: 'figure', point: 'head' });
    expect(b.centerPoint()).toEqual({ who: 'stub', point: 'center' });
    expect(b.headPoint()).toEqual({ who: 'stub', point: 'head' });
  });

  it('a missing stub under (b) degrades to the figure and never throws', () => {
    const figure = make('figure', [1, 0, 0]);
    const h = createFormActorHandle(as(figure), undefined, 'b', gate);
    expect(h.position).toBe(figure.position);
    expect(h.centerPoint()).toEqual({ who: 'figure', point: 'center' });
  });

  it('every other member is the figure\'s own: visible, contentQuad, height, and a write goes to the figure', () => {
    const figure = make('figure', [1, 0, 0]);
    const stub = make('stub', [9, 9, 9]);
    stub.visible = false; // a figure-less stub is not shown
    stub.height = 0.3;
    const h = createFormActorHandle(as(figure), as(stub), 'b', gate);
    expect(h.visible).toBe(true); // `SpectacleFx` reads a.visible
    expect((h as unknown as Fake).contentQuad()).toBe('figure-quad');
    expect((h as unknown as Fake).height).toBe(2.8);
    h.visible = false;
    expect(figure.visible).toBe(false);
    expect(stub.visible).toBe(false);
    // without the handle the camera and motion modules would receive the stub: its answers are the other figure's
    expect((as(stub) as unknown as Fake).height).toBe(0.3);
    figure.userData['mark'] = 'x';
    expect(h.userData['mark']).toBe('x');
  });

  it('is an instance of PaintedActor, is not an Object3D child of anything, and is not the figure', () => {
    const figure = make('figure', [1, 0, 0]);
    const group = new Group();
    group.add(figure);
    const h = createFormActorHandle(as(figure), as(make('stub', [0, 0, 0])), 'a', gate);
    expect(h instanceof PaintedActor).toBe(true);
    expect(h).not.toBe(figure);
    expect(group.children).toEqual([figure]);
    expect(group.children.includes(h)).toBe(false);
    expect(h.parent).toBe(group); // it reads the figure's own parent, but it is not in the graph
  });
});

describe('the hit gate (D-9): the figure hurts once per enemy action', () => {
  const GATED = ['flash', 'shake', 'recoil', 'hitReact'] as const;
  const fire = (h: PaintedActor): unknown[] => [h.flash(0xffffff, 100), h.shake(0.1, 200), h.recoil(300), h.hitReact!({} as never)];

  for (const kind of ['a part handle', 'the main\'s actor'] as const) {
    it(`${kind}: each gated member reaches the figure once while the gate is open and none while it is blocked (recoil still resolves, hitReact is false)`, async () => {
      const figure = make('figure', [1, 0, 0]);
      const gate = { blocked: false };
      const h = kind === 'a part handle' ? createFormActorHandle(as(figure), as(make('stub', [0, 0, 0])), 'a', gate) : createHitGatedActor(as(figure), gate);
      const open = fire(h);
      expect(names(figure)).toEqual([...GATED]);
      expect(open[3]).toBe(true);
      await expect(open[2]).resolves.toBe('recoiled');
      figure.calls.length = 0;
      gate.blocked = true; // the gate is read at call time: flipped between two calls
      const shut = fire(h);
      expect(figure.calls).toEqual([]);
      expect(shut[0]).toBeUndefined();
      expect(shut[1]).toBeUndefined();
      await expect(shut[2]).resolves.toBeUndefined();
      expect(shut[3]).toBe(false);
      gate.blocked = false;
      fire(h);
      expect(names(figure)).toEqual([...GATED]);
    });

    it(`${kind}: setPose, hop, lunge and the rest are untouched by the gate`, () => {
      const figure = make('figure', [1, 0, 0]);
      const gate = { blocked: true };
      const h = kind === 'a part handle' ? createFormActorHandle(as(figure), undefined, 'a', gate) : createHitGatedActor(as(figure), gate);
      h.setPose('cast');
      void h.hop(0.4, 300);
      void h.lunge(1, 200);
      void h.squash(100);
      expect(names(figure).slice(0, 4)).toEqual(['setPose', 'hop', 'lunge', 'squash']);
    });
  }

  it('the main\'s actor forwards the members a part handle swallows (the figure is the figure)', async () => {
    const figure = make('figure', [1, 0, 0]);
    const main = createHitGatedActor(as(figure), { blocked: true });
    await main.fadeTo(0, 100);
    await main.lieDown!(520);
    main.setAlpha(0.5);
    main.setStone!(1);
    main.noteStatus!('poison', true);
    expect(names(figure)).toEqual(['fadeTo', 'lieDown', 'setAlpha', 'setStone', 'noteStatus']);
    expect(main instanceof PaintedActor).toBe(true);
    expect(main.position).toBe(figure.position);
  });
});

describe('one handle per (figure, stub, mode), cached by the registry', () => {
  const form: StageForm = { girl: 'yuna', special: 'floral-fallal', main: 'yuna', right: 'pod-r', left: 'pod-l', parked: ['rikku', 'paine'], gate: { blocked: false } };
  const actors = (m: Record<string, Fake>): { get(id: string): { actor: PaintedActor } | undefined } => ({ get: (id) => (m[id] ? { actor: as(m[id]!) } : undefined) });

  it('asks for the same handle again and again, and builds another when the figure, the stub or the mode changes; dropping the form drops them', () => {
    const stage = {};
    const m = { yuna: make('figure', [0, 0, 0]), 'pod-r': make('stub', [1, 0, 0]), 'pod-l': make('stub', [2, 0, 0]) };
    setSpecialLook(null);
    setStageForm(stage, form);
    const r1 = formHandleOf(stage, 'pod-r', actors(m));
    expect(r1).toBeDefined();
    expect(formHandleOf(stage, 'pod-r', actors(m))).toBe(r1);
    expect(formHandleOf(stage, 'pod-l', actors(m))).not.toBe(r1);
    const main1 = formHandleOf(stage, 'yuna', actors(m));
    expect(main1).toBeDefined();
    expect(main1).not.toBe(r1);
    expect(formHandleOf(stage, 'yuna', actors(m))).toBe(main1);
    expect(formHandleOf(stage, 'tidus', actors(m))).toBeUndefined();
    // a re-stage that replaces a stub builds a new handle
    expect(formHandleOf(stage, 'pod-r', actors({ ...m, 'pod-r': make('stub', [5, 0, 0]) }))).not.toBe(r1);
    // the mark mode is part of the key
    setSpecialLook({ mark: 'b' });
    expect(formHandleOf(stage, 'pod-r', actors(m))).not.toBe(r1);
    setSpecialLook(null);
    setStageForm(stage, form); // the same form again keeps the cache
    expect(formHandleOf(stage, 'yuna', actors(m))).toBe(main1);
    setStageForm(stage, null);
    expect(formHandleOf(stage, 'pod-r', actors(m))).toBeUndefined();
    expect(formHandleOf(stage, 'yuna', actors(m))).toBeUndefined();
  });

  it('answers for a part with no figure on the stage? it answers nothing', () => {
    const stage = {};
    setStageForm(stage, form);
    expect(formHandleOf(stage, 'pod-r', actors({ 'pod-r': make('stub', [0, 0, 0]) }))).toBeUndefined();
    setStageForm(stage, null);
  });

  it('the form\'s gate is the handle\'s gate', () => {
    const stage = {};
    const gate = { blocked: false };
    const m = { yuna: make('figure', [0, 0, 0]), 'pod-r': make('stub', [1, 0, 0]) };
    setStageForm(stage, { ...form, gate });
    const h = formHandleOf(stage, 'pod-r', actors(m))!;
    gate.blocked = true;
    h.shake(0.1, 100);
    expect(m.yuna.calls).toEqual([]);
    gate.blocked = false;
    h.shake(0.1, 100);
    expect(names(m.yuna)).toEqual(['shake']);
    setStageForm(stage, null);
  });
});
