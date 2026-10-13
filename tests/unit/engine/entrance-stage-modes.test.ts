/**
 * E-PYRE's other entrances and the opening's end, on the REAL `PaintedActor` (`StageEntrances.ts`; decision 61e; both games, shared plumbing): a plain fade for a living person or a machine
 * (E-FADE), a short fade for REDUCE MOTION, nothing at all for a hurried or skipped opening, and what the opening's end does (a hurried end lands every figure, an ordinary one cuts nothing
 * short and begins a figure the gate was still holding, the next link waits for its own opening). The rig is `entrance-stage-fixture.ts`'s; the gather itself is `entrance-stage.test.ts`.
 */
import { Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FRAME, frames, reset, rig } from './entrance-stage-fixture.ts';
import { FADE_MS, GATHER_MS, HOLD_ALPHA, REDUCED_FADE_MS } from '../../../src/engine/entrance/entranceLook.ts';

afterEach(reset);

describe('the other entrances', () => {
  it("a living person fades in over E-FADE's 300 ms with no dissolve and no motes", () => {
    const r = rig();
    const a = r.figure('leblanc');
    r.ent.hold(a, 'leblanc');
    r.step(frames(2000));
    void r.ent.enter(false);
    let began = -1;
    let ended = -1;
    for (let i = 0; i < frames(FADE_MS + 300); i++) {
      r.step();
      if (r.ent.snapshot().playing.length && began < 0) began = i;
      if (began >= 0) expect(a.dissolveLevel).toBe(0);
      if (began >= 0 && !r.ent.busy && ended < 0) ended = i;
    }
    expect(r.motes).toHaveLength(0);
    expect((ended - began) * FRAME).toBeGreaterThanOrEqual(FADE_MS - 2 * FRAME);
    expect((ended - began) * FRAME).toBeLessThanOrEqual(FADE_MS + FRAME);
    expect(a.alpha).toBe(1);
  });

  it('REDUCE MOTION gets a plain short fade for every body, a gather included: no sweep, no motes, no flash', () => {
    const r = rig();
    r.comfort.reduceMotion = true;
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(2000));
    const flash = vi.spyOn(a, 'flash');
    void r.ent.enter(false);
    let began = -1;
    let ended = -1;
    for (let i = 0; i < frames(REDUCED_FADE_MS + 300); i++) {
      r.step();
      if (r.ent.snapshot().playing.length && began < 0) began = i;
      if (began >= 0 && ended < 0) expect(a.dissolveLevel).toBe(0);
      if (began >= 0 && !r.ent.busy && ended < 0) ended = i;
    }
    expect(r.motes).toHaveLength(0);
    expect(flash).not.toHaveBeenCalled();
    expect((ended - began) * FRAME).toBeLessThanOrEqual(REDUCED_FADE_MS + FRAME);
    expect((ended - began) * FRAME).toBeGreaterThanOrEqual(REDUCED_FADE_MS - 2 * FRAME);
    expect(a.alpha).toBe(1);
  });

  it('a hurried or skipped opening (`instant`) shows every figure at once, with nothing played', async () => {
    const r = rig();
    const a = r.figure('paragon');
    const b = r.figure('leblanc');
    r.ent.hold(a, 'paragon');
    r.ent.hold(b, 'leblanc');
    await expect(r.ent.enter(true)).resolves.toBeUndefined();
    for (const f of [a, b]) {
      expect(f.alpha).toBe(1);
      expect(f.dissolveLevel).toBe(0);
    }
    expect(r.ent.busy).toBe(false);
    expect(r.motes).toHaveLength(0);
  });
});

describe('the opening ends', () => {
  it('a hurried end (`settle(true)`) lands everything at once, mid-gather included, and the entrance promise resolves', async () => {
    const r = rig();
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(2000));
    const done = r.ent.enter(false);
    r.step(frames(300));
    expect(a.dissolveLevel).toBeGreaterThan(0.3);
    r.ent.settle(true);
    expect(a.alpha).toBe(1);
    expect(a.dissolveLevel).toBe(0);
    await expect(done).resolves.toBeUndefined();
  });

  it('an ordinary end (`settle(false)`) cuts nothing short and begins a figure the gate was still holding; the first menu waits for neither', async () => {
    const r = rig();
    const early = r.figure('paragon');
    r.ent.hold(early, 'paragon');
    r.step(frames(3000));
    const late = r.figure('x2-anima');
    r.ent.hold(late, 'x2-anima'); // built a moment ago: the gate would hold it for most of a second
    r.step(frames(100));
    const done = r.ent.enter(false);
    r.step(frames(500)); // `early` is mid-gather, `late` is waiting
    expect(r.ent.snapshot().playing.map((p) => p.id)).toEqual(['paragon']);
    const before = early.dissolveLevel;
    r.ent.settle(false);
    r.step();
    expect(r.ent.snapshot().playing.map((p) => p.id).sort()).toEqual(['paragon', 'x2-anima']); // the late one begins now
    expect(early.dissolveLevel).toBeLessThan(before); // the early one went on, uncut
    expect(early.dissolveLevel).toBeGreaterThan(0);
    r.step(frames(GATHER_MS + 100));
    expect(r.ent.busy).toBe(false);
    await expect(done).resolves.toBeUndefined();
  });

  it('the next link\'s figures wait for their own opening: a new field closes the last one', () => {
    const r = rig();
    const a = r.figure('x2-shiva');
    r.ent.hold(a, 'x2-shiva');
    r.step(frames(2000));
    void r.ent.enter(false);
    r.step(frames(GATHER_MS + 200));
    expect(r.ent.busy).toBe(false);
    const b = r.figure('x2-anima');
    r.ent.hold(b, 'x2-anima'); // the next link
    r.step(frames(5000)); // old enough, still: but no opening has asked for it
    expect(b.alpha).toBe(HOLD_ALPHA);
    expect(r.ent.snapshot().held).toEqual(['x2-anima']);
  });
});

describe('the actor it drives', () => {
  it('only needs the slice `EntranceActor` names, and the real one has it (a contract that would fail a rename)', () => {
    const r = rig();
    const a = r.figure('overdrive-sin');
    for (const m of ['setAlpha', 'setDissolve', 'setDissolveStyle', 'flash', 'contentQuad'] as const) expect(typeof (a as unknown as Record<string, unknown>)[m]).toBe('function');
    expect(a.position).toBeInstanceOf(Vector3);
    expect(a.scale).toBeInstanceOf(Vector3);
  });
});
