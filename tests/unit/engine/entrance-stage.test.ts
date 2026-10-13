/**
 * E-PYRE on the REAL `PaintedActor` (`src/engine/entrance/StageEntrances.ts`; decision 61e; round 25's PR-0380; both games, shared plumbing).
 *
 * The stage holds each enemy and aeon figure it builds for a fight unseen (alpha under every "is it showing" line, the dissolve all the way up), the opening lets them in, and each plays
 * its entrance once it has stood still. This file: the hold, the gate and the gather. The other entrances and the opening's end are `entrance-stage-modes.test.ts`. The actor is the real one,
 * headless (the head-lock fixture), stepped at 60 fps the way the stage steps it: the actor first, then the entrances (`entrance-stage-fixture.ts`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRAME, frames, reset, rig, type Actor, type Rig } from './entrance-stage-fixture.ts';
import { HOLD_MAX_MS, MIN_AGE_MS, PATIENCE_MS, QUIET_MS } from '../../../src/engine/entrance/StageEntrances.ts';
import { GATHER_MS, HOLD_ALPHA, LAND_FLASH, frameAt } from '../../../src/engine/entrance/entranceLook.ts';

afterEach(reset);

describe('a figure the stage is holding', () => {
  let r: Rig;
  beforeEach(() => {
    r = rig();
  });

  it('rests under every "is it showing" line with the dissolve all the way up: no figure on the field to the player, the continuity probe or the art governor', () => {
    const a = r.figure('overdrive-sin');
    r.ent.hold(a, 'overdrive-sin');
    expect(a.alpha).toBe(HOLD_ALPHA);
    expect(a.alpha).toBeLessThan(0.02); // the probe's `showing` and the governor's `drawn`
    expect(a.dissolveLevel).toBe(1);
    expect(r.hushed.has(a)).toBe(true); // the death's rising motes are not read into it
    expect(r.ent.snapshot()).toEqual({ held: ['overdrive-sin'], playing: [] });
    r.step(frames(5000));
    expect(a.alpha).toBe(HOLD_ALPHA); // five seconds on, with no opening, nothing has changed
    expect(r.motes).toHaveLength(0);
  });

  it("holds a figure that a scene's director shows (its bind sets alpha 1) back at rest every frame, and whatever the scene does to its size and place while it is held is unseen", () => {
    const a = r.figure('left-fin');
    r.ent.hold(a, 'left-fin');
    a.setAlpha(1); // a director's bind
    a.scale.setScalar(3.4); // a scene's placement
    a.position.set(11, 2.5, -30);
    r.step();
    expect(a.alpha).toBe(HOLD_ALPHA);
  });

  it('a person is held with no dissolve (nothing to gather): the opacity alone', () => {
    const a = r.figure('leblanc');
    r.ent.hold(a, 'leblanc');
    expect(a.alpha).toBe(HOLD_ALPHA);
    expect(a.dissolveLevel).toBe(0);
  });

  it('is let in by nothing but the opening: a figure held a long time with no `enter` is let in by the watchdog on the stage clock, never left invisible', () => {
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(HOLD_MAX_MS - 500));
    expect(a.alpha).toBe(HOLD_ALPHA);
    r.step(frames(1000));
    expect(a.alpha).toBe(1);
    expect(a.dissolveLevel).toBe(0);
    expect(r.ent.busy).toBe(false);
    expect(r.hushed.size).toBe(0);
  });

  it("a figure whose scene stages its own entrance (Chapter IX's Yojimbo and Daigoro, the night-sakura arrival) is not held: the scene's opacity is the only one", () => {
    const a = r.figure('yojimbo');
    expect(r.ent.hold(a, 'yojimbo')).toBe(false);
    expect(a.alpha).toBe(1);
    expect(r.ent.busy).toBe(false);
    expect(r.hushed.size).toBe(0);
    const g = r.figure('ginnem');
    expect(r.ent.hold(g, 'ginnem')).toBe(true);
  });

  it('a figure that leaves the field is forgotten, with its hush', () => {
    const a = r.figure('x2-anima');
    r.ent.hold(a, 'x2-anima');
    r.ent.forget('x2-anima');
    expect(r.ent.busy).toBe(false);
    expect(r.hushed.size).toBe(0);
  });
});

describe('the gate: a figure is played where it will stand', () => {
  let r: Rig;
  beforeEach(() => {
    r = rig();
  });

  const playing = (): number => r.ent.snapshot().playing.length;

  it('a figure the opening finds old and still is played the frame it opens (a card that held the field 3 s)', () => {
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(3000));
    void r.ent.enter(false);
    r.step();
    expect(playing()).toBe(1);
  });

  it(`is not played before it is ${MIN_AGE_MS} ms old (CHAPTER FRAMING decides 0.6 s after a figure changes, and puts it on at once)`, () => {
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(100));
    void r.ent.enter(false);
    r.step(frames(MIN_AGE_MS - 200));
    expect(playing()).toBe(0);
    r.step(frames(300));
    expect(playing()).toBe(1);
  });

  it(`waits for the figure to stand still for ${QUIET_MS} ms: a plan that lands late (a scale step) is not played over`, () => {
    const a = r.figure('paragon');
    r.ent.hold(a, 'paragon');
    r.step(frames(2000));
    void r.ent.enter(false);
    a.scale.setScalar(3.047); // the plan lands
    r.step(frames(QUIET_MS - 80));
    expect(playing()).toBe(0);
    r.step(frames(200));
    expect(playing()).toBe(1);
    // and the figure that is played stood at the size the plan gave it
    expect(a.scale.x).toBeCloseTo(3.047, 9);
  });

  it(`never waits longer than ${PATIENCE_MS} ms for a figure that never stands still: it is played where it is`, () => {
    const a = r.figure('x2-anima');
    r.ent.hold(a, 'x2-anima');
    r.step(frames(2000));
    void r.ent.enter(false);
    let wobble = 1;
    let began = -1;
    for (let i = 0; i < frames(PATIENCE_MS + 400); i++) {
      wobble += 0.05;
      a.position.x = 3 + wobble; // never quiet
      r.step();
      if (playing() && began < 0) began = i * FRAME;
    }
    expect(began).toBeGreaterThan(PATIENCE_MS - 100);
    expect(began).toBeLessThan(PATIENCE_MS + 100);
  });
});

describe('the gather (E-PYRE)', () => {
  let r: Rig;
  let a: Actor;
  /** The frame each reading was taken on, from the frame the entrance began. */
  const trace: Array<{ t: number; alpha: number; dissolve: number }> = [];
  beforeEach(() => {
    r = rig();
    trace.length = 0;
    a = r.figure('overdrive-sin');
    r.ent.hold(a, 'overdrive-sin');
    r.tracked.add('overdrive-sin');
    r.step(frames(2000));
  });

  function play(): { began: number; ended: number; done: Promise<void> } {
    const done = r.ent.enter(false);
    let began = -1;
    let ended = -1;
    for (let i = 0; i < frames(GATHER_MS + 500); i++) {
      r.step();
      const s = r.ent.snapshot();
      if (s.playing.length && began < 0) began = i;
      if (began >= 0) trace.push({ t: (i - began) * FRAME, alpha: a.alpha, dissolve: a.dissolveLevel });
      if (began >= 0 && !r.ent.busy && ended < 0) ended = i;
    }
    return { began, ended, done };
  }

  it('plays the page\'s 900 ms: 54 frames from the first the figure is drawn to the one it is whole on, and nothing waits for it', async () => {
    const { began, ended, done } = play();
    expect(began).toBeGreaterThanOrEqual(0);
    const length = (ended - began) * FRAME;
    expect(length).toBeGreaterThanOrEqual(GATHER_MS - 2 * FRAME);
    expect(length).toBeLessThanOrEqual(GATHER_MS + FRAME);
    await expect(done).resolves.toBeUndefined();
    expect(a.alpha).toBe(1);
    expect(a.dissolveLevel).toBe(0);
  });

  it("every frame shows what `frameAt` says: the figure comes up through the dissolve, from the head down, and its own opacity first", () => {
    play();
    for (const f of trace.slice(0, -2)) {
      const want = frameAt('gather', GATHER_MS, f.t + FRAME); // the entrance had run one more step when the frame was read
      expect(f.dissolve).toBeCloseTo(want.dissolve, 1);
    }
    let prev = 1;
    for (const f of trace) {
      expect(f.dissolve).toBeLessThanOrEqual(prev + 1e-9);
      prev = f.dissolve;
    }
    expect(trace[0]!.dissolve).toBeGreaterThan(0.95);
    expect(trace[trace.length - 1]!.dissolve).toBe(0);
  });

  it("the figure's step in any one frame is at most what the sweep takes (no frame pops the painting), and its plane never moves", () => {
    const quad0 = a.contentQuad().map((v) => v.clone());
    play();
    let worst = 0;
    for (let i = 1; i < trace.length; i++) worst = Math.max(worst, Math.abs(trace[i]!.dissolve - trace[i - 1]!.dissolve));
    expect(worst).toBeLessThan(0.06);
    const quad1 = a.contentQuad();
    quad0.forEach((v, i) => expect(v.distanceTo(quad1[i]!)).toBeLessThan(1e-9));
  });

  it('releases pyreflies that come from the air round the figure and fly INTO it, never rising away as a death does, about 500 of them, and they are the stage\'s motes (the emitter\'s spec)', () => {
    play();
    expect(r.motes.length).toBeGreaterThan(300);
    expect(r.motes.length).toBeLessThan(600);
    const q = a.contentQuad();
    const cx = (q[0].x + q[1].x) / 2;
    const top = q[3].y;
    let bornAbove = 0;
    for (const m of r.motes) {
      expect(Number.isFinite(m.x + m.y + m.z + m.vx + m.vy + m.vz + m.life + m.size)).toBe(true);
      const t = { x: m.x + m.vx * m.life, y: m.y + m.vy * m.life };
      // arrives on the painting's quad (x within its width, y within its height)
      expect(t.x).toBeGreaterThan(q[0].x - 1e-6);
      expect(t.x).toBeLessThan(q[1].x + 1e-6);
      expect(t.y).toBeGreaterThan(q[0].y - 1e-6);
      expect(t.y).toBeLessThan(top + 1e-6);
      if (m.y > t.y) bornAbove++;
    }
    expect(Math.abs(cx - 3)).toBeLessThan(3); // the quad is where the figure stands
    // more of them come down from above than up from below (a death's rise is the other way)
    expect(bornAbove).toBeGreaterThan(r.motes.length * 0.5);
  });

  it('mutes the death\'s release while it plays and puts the figure back as the stage had it: still tracked for the death\'s sweep, its motes un-hushed, whole', () => {
    const setStyle = vi.spyOn(a, 'setDissolveStyle');
    r.step(); // nothing yet
    const done = r.ent.enter(false);
    r.step();
    expect(r.hushed.has(a)).toBe(true);
    r.step(frames(GATHER_MS + 100));
    expect(r.hushed.has(a)).toBe(false);
    expect(setStyle).toHaveBeenLastCalledWith('pyrefly'); // tracked: a death will dissolve it
    void done;
  });

  it('lands with a short gold flash on the painting, which REDUCE FLASHES leaves out', () => {
    const flash = vi.spyOn(a, 'flash');
    play();
    expect(flash).toHaveBeenCalledTimes(1);
    expect(flash).toHaveBeenCalledWith(LAND_FLASH.colour, LAND_FLASH.ms, LAND_FLASH.peak);

    const r2 = rig();
    r2.flags.reduceFlashes = true;
    const b = r2.figure('overdrive-sin');
    r2.ent.hold(b, 'overdrive-sin');
    r2.step(frames(2000));
    const flash2 = vi.spyOn(b, 'flash');
    void r2.ent.enter(false);
    r2.step(frames(GATHER_MS + 200));
    expect(flash2).not.toHaveBeenCalled();
  });

  it('LOW EFFECTS keeps the sweep and drops the motes; the phone tier releases 0.6 of them', () => {
    const lowFx = rig();
    lowFx.comfort.lowEffects = true;
    const b = lowFx.figure('paragon');
    lowFx.ent.hold(b, 'paragon');
    lowFx.step(frames(2000));
    void lowFx.ent.enter(false);
    lowFx.step(frames(GATHER_MS / 2));
    expect(b.dissolveLevel).toBeGreaterThan(0);
    expect(b.dissolveLevel).toBeLessThan(1);
    lowFx.step(frames(GATHER_MS));
    expect(lowFx.motes).toHaveLength(0);

    play();
    const full = r.motes.length;
    const phone = rig();
    phone.flags.tier = 'phone';
    const c = phone.figure('paragon');
    phone.ent.hold(c, 'paragon');
    phone.step(frames(2000));
    void phone.ent.enter(false);
    phone.step(frames(GATHER_MS + 200));
    expect(phone.motes.length).toBeGreaterThan(full * 0.5);
    expect(phone.motes.length).toBeLessThan(full * 0.72);
  });
});

