/**
 * **The engine keeps the head steady: the band, what is left alone, the steadiness and the stage's pass** (D-510, Bailey's pick of 2026-10-06;
 * lane r394-headlock; both games). The real `PaintedActor` under real cameras (see `head-lock-fixture.ts`); the swap equality itself is
 * `head-lock-actor.test.ts`, the maths `head-lock.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Matrix4 } from 'three';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  CHECK, HEAD_BAND, HELD, POSE_REGISTRATION, PaintedActor, cameraAt, cameraWithPerspective, frame, headPx, holdHeads, painting, reset, setHeadLockOff, slotOf, slotsOf, swapRatio, swapping, viewOf, yuna,
  type Actor, type Build, type HeadBox,
} from './head-lock-fixture.ts';

afterEach(reset);

describe('the band, and the clamp that is reported', () => {
  const scaled = (box: HeadBox, k: number): HeadBox => {
    const cu = (box[0] + box[2]) / 2;
    const ct = (box[1] + box[3]) / 2;
    return [cu - ((box[2] - box[0]) / 2) * k, ct - ((box[3] - box[1]) / 2) * k, cu + ((box[2] - box[0]) / 2) * k, ct + ((box[3] - box[1]) / 2) * k];
  };
  const koBox = POSE_REGISTRATION['yuna']!['ko']!.head!;

  it('keeps a factor inside 0.9 to 1.1 when a head box asks for more, says so once, and counts every frame it did', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cam = cameraWithPerspective(1.0);
    const a = yuna({ life: false, interimYaw: false, over: { ko: { head: scaled(koBox, 0.7) } } }); // a head box 0.7 the size it should be: the plane would have to grow 43 percent
    swapping(a, cam, 'idle', 'ko');
    expect(slotOf(a, 'ko').lock).toBe(HEAD_BAND[1]);
    for (let i = 0; i < 5; i++) frame(a, cam);
    const s = a.headLock.snapshot();
    expect(s.clampedHigh).toBeGreaterThanOrEqual(6);
    expect(s.clampedLow).toBe(0);
    expect(s.worstRaw).toBeGreaterThan(1.35);
    expect(s.max).toBe(HEAD_BAND[1]);
    expect(s.last).toMatchObject({ pose: 'ko', clamp: 1 });
    const mine = warn.mock.calls.filter((c) => String(c[0]).startsWith('[headlock]'));
    expect(mine).toHaveLength(1); // once per pose
    expect(String(mine[0]![0])).toContain('"ko"');
    expect(String(mine[0]![0])).toContain('x1.1');
    // and the swap is no longer held: the report is what says so
    expect(Math.abs(swapRatio(a, cam, 'idle', 'ko') - 1)).toBeGreaterThan(CHECK);
  });

  it('keeps it from the other side too, and a pose that needs only a little is not clamped at all', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cam = cameraWithPerspective(1.0);
    const a = yuna({ life: false, interimYaw: false, over: { ko: { head: scaled(koBox, 1.4) } } });
    swapping(a, cam, 'idle', 'ko');
    expect(slotOf(a, 'ko').lock).toBe(HEAD_BAND[0]);
    expect(a.headLock.clampedLow).toBeGreaterThan(0);
    const fine = yuna({ life: false, interimYaw: false });
    swapping(fine, cam, 'idle', 'ko');
    frame(fine, cam);
    expect(fine.headLock.clamped).toBe(0);
    expect(fine.headLock.snapshot().min!).toBeGreaterThan(0.9);
    expect(fine.headLock.snapshot().max!).toBeLessThan(1.1);
  });
});

describe('what is not held stays exactly as it was', () => {
  /** Every plane's own transform, bit for bit. */
  const planes = (a: Actor): number[][] => slotsOf(a).map((s) => { s.mesh.updateMatrix(); return [...s.mesh.matrix.elements]; });
  const noHeads: Build['over'] = { idle: { head: undefined }, hurt: { head: undefined }, ko: { head: undefined }, victory: { head: undefined } };

  it('a figure with no registered head takes the table\'s scale to the bit, with or without a camera', () => {
    const cam = cameraWithPerspective(0.98);
    const never = yuna({ life: false, interimYaw: false, over: noHeads });
    swapping(never, cam, 'idle', 'ko', false);
    frame(never, cam, false);
    const held = yuna({ life: false, interimYaw: false, over: noHeads });
    swapping(held, cam, 'idle', 'ko');
    frame(held, cam);
    expect(planes(held)).toEqual(planes(never));
    expect(held.headLock.planes).toBe(0);
    expect(slotsOf(held).map((s) => s.lock)).toEqual([1, 1]);
    expect(slotOf(held, 'ko').scale).toBe(slotOf(held, 'ko').base);
  });

  it('an actor the stage never handed a camera (a cutscene, a portrait, the title) is never touched', () => {
    const cam = cameraWithPerspective(0.98);
    const bare = yuna({ life: false, interimYaw: false });
    swapping(bare, cam, 'idle', 'ko', false);
    frame(bare, cam, false);
    expect(slotsOf(bare).map((s) => s.lock)).toEqual([1, 1]);
    expect(bare.headLock.planes).toBe(0);
    expect(slotOf(bare, 'ko').scale).toBe(slotOf(bare, 'ko').base);
  });

  it('the idle itself, a pose that falls back to the idle\'s painting, a stand-in and another figure\'s painting are not held', () => {
    const cam = cameraWithPerspective(0.98);
    const a = yuna({ life: false, interimYaw: false, placeholder: ['victory'], urls: { hurt: '/art/characters/tidus/hurt.png' } });
    for (const pose of ['idle', 'victory', 'hurt'] as const) {
      a.setPose(pose, { immediate: true, force: true });
      frame(a, cam);
      expect(slotOf(a, pose).lock, pose).toBe(1);
      expect(slotOf(a, pose).scale, pose).toBe(slotOf(a, pose).base);
    }
    expect(a.headLock.planes).toBe(0);
    // the pose that falls back to the idle's painting (the very same object): nothing to hold it to
    const idle = painting('yuna', 'idle');
    const same = new PaintedActor({ name: 'yuna', worldHeight: 1.82, shadow: false, life: false });
    same.adoptPoses({ idle, cast: idle, ko: painting('yuna', 'ko') }, 'idle');
    same.setPose('cast', { immediate: true, force: true });
    same.holdHead(viewOf(cam));
    expect(slotOf(same, 'cast').lock).toBe(1);
  });

  it('an idle with no head box, a hand-shifted actor (FF7\'s Film set) and a reference that lies down hold nothing', () => {
    const cam = cameraWithPerspective(0.98);
    const noRef = yuna({ life: false, interimYaw: false, over: { idle: { head: undefined } } });
    swapping(noRef, cam, 'idle', 'ko');
    frame(noRef, cam);
    expect(slotOf(noRef, 'ko').lock).toBe(1);
    expect(noRef.headLock.planes).toBe(0);

    const shifted = yuna({ life: false, interimYaw: false, poseShiftPx: {} });
    swapping(shifted, cam, 'idle', 'ko');
    frame(shifted, cam);
    expect(slotOf(shifted, 'ko').lock).toBe(1);
    expect(shifted.headLock.planes).toBe(0);

    // an idle painted wider than tall (and not marked upright) is a body on the floor: there is no standing head to hold the others to
    const lying = yuna({ life: false, interimYaw: false, over: { idle: { width: 1400, height: 800, baselineY: 780 } } });
    swapping(lying, cam, 'idle', 'hurt');
    frame(lying, cam);
    expect(slotOf(lying, 'hurt').lock).toBe(1);
    expect(lying.headLock.planes).toBe(0);
  });

  it('a spherechange (the pose set adopted again from another figure) moves the reference with it: the new paintings are held to the NEW idle, an old painting that stays is not held to it', () => {
    const cam = cameraWithPerspective(0.98);
    const a = yuna({ life: false, interimYaw: false });
    swapping(a, cam, 'idle', 'victory');
    frame(a, cam);
    expect(slotOf(a, 'victory').lock).not.toBe(1);
    // Paine takes Yuna's place on the field: her idle and attack are adopted; Yuna's `victory` is still in the actor's pose map
    a.adoptPoses({ idle: painting('paine-warrior', 'idle'), attack: painting('paine-warrior', 'attack') }, 'idle');
    a.setPose('idle', { immediate: true, force: true });
    a.holdHead(viewOf(cam));
    a.setPose('attack', { force: true });
    frame(a, cam);
    expect(slotOf(a, 'attack').subject).toBe('paine-warrior');
    expect(slotOf(a, 'attack').lock).not.toBe(1);
    expect(Math.abs(swapRatio(a, cam, 'idle', 'attack') - 1)).toBeLessThan(HELD);
    // the plane that still holds Yuna's painting (visible, mid-crossfade) is another figure's: left at its table scale
    a.setPose('victory', { force: true });
    frame(a, cam);
    expect(slotOf(a, 'victory').subject).toBe('yuna');
    expect(slotOf(a, 'victory').lock).toBe(1);
  });

  it('a lock the actor can no longer keep is put back at the table\'s scale (a registration that went)', () => {
    const cam = cameraWithPerspective(0.98);
    const a = yuna({ life: false, interimYaw: false });
    swapping(a, cam, 'idle', 'ko');
    frame(a, cam);
    const ko = slotOf(a, 'ko');
    expect(ko.lock).not.toBe(1);
    ko.meta = { ...ko.meta, head: undefined };
    frame(a, cam);
    expect(ko.lock).toBe(1);
    expect(ko.scale).toBe(ko.base);
  });
});

describe('a steady head is a steady picture', () => {
  it('with a still camera the factor does not move however the idle breathes and sways (REDUCE MOTION stops the camera\'s sway; the lock adds no motion of its own)', () => {
    const cam = cameraWithPerspective(1.04); // a camera that looks down, so a head's height changes its depth: the breath does reach the sum
    const a = yuna({ alive: true, life: false, interimYaw: false });
    swapping(a, cam, 'idle', 'ko');
    const seen: number[] = [];
    for (let i = 0; i < 120; i++) {
      frame(a, cam);
      seen.push(slotOf(a, 'ko').lock);
    }
    expect(Math.max(...seen) - Math.min(...seen)).toBeLessThan(1e-3);
    expect(Math.abs(swapRatio(a, cam, 'idle', 'ko') - 1)).toBeLessThan(HELD);
  });

  it('under a camera that drifts from perspective 0.98 to 1.04 in a second the factor glides (no frame steps it by 0.15 percent) and the swap is held at every frame', () => {
    const a = yuna({ life: false, interimYaw: false });
    swapping(a, cameraAt(0.25), 'idle', 'ko');
    const first = slotOf(a, 'ko').lock;
    let last = first;
    let worstStep = 0;
    for (let i = 0; i <= 60; i++) {
      const cam = cameraAt(0.25 + (i / 60) * 2.2);
      frame(a, cam);
      const lock = slotOf(a, 'ko').lock;
      worstStep = Math.max(worstStep, Math.abs(lock - last));
      last = lock;
      expect(Math.abs(swapRatio(a, cam, 'idle', 'ko') - 1), `frame ${i}`).toBeLessThan(HELD);
    }
    expect(worstStep).toBeLessThan(0.0015);
    expect(Math.abs(last - first)).toBeGreaterThan(0.04); // the camera did ask for something: the whole move is five percent of the figure
  });

  it('through the collapse (the 26 degree interim yaw easing out, the landing squash) the head on screen stays within a percent and a half where the table\'s scale lets it drift three; the body\'s scale takes the difference, slowly', () => {
    const cam = cameraWithPerspective(1.0);
    const run = (held: boolean): { head: number[]; lock: number[] } => {
      const a = yuna();
      swapping(a, cam, 'idle', 'ko', held);
      const head: number[] = [];
      const lock: number[] = [];
      for (let i = 0; i < 40; i++) {
        frame(a, cam, held);
        head.push(headPx(a, cam, 'ko'));
        lock.push(slotOf(a, 'ko').lock);
      }
      return { head, lock };
    };
    const spread = (xs: number[]): number => (Math.max(...xs) - Math.min(...xs)) / Math.min(...xs);
    const on = run(true);
    const off = run(false);
    expect(spread(on.head)).toBeLessThan(0.015);
    expect(spread(off.head)).toBeGreaterThan(0.025); // the control: the swing the table cannot hold
    // what it costs: the lying body's scale moves by about what the head's drift was, over half a second, never in a step
    const steps = on.lock.slice(1).map((v, i) => Math.abs(v - on.lock[i]!));
    expect(Math.max(...steps)).toBeLessThan(0.004);
    expect(spread(on.lock)).toBeLessThan(0.04);
  });

  it('has no memory: the same view twice gives the same plane', () => {
    const cam = cameraWithPerspective(0.98);
    const a = yuna({ life: false, interimYaw: false });
    swapping(a, cam, 'idle', 'ko');
    frame(a, cam);
    const once = [...slotOf(a, 'ko').mesh.matrix.elements];
    a.holdHead(viewOf(cam));
    a.holdHead(viewOf(cam));
    a.updateMatrixWorld(true);
    expect([...slotOf(a, 'ko').mesh.matrix.elements]).toEqual(once);
  });
});

describe('the stage\'s pass (HeadLockStage.holdHeads)', () => {
  const fake = (): { actor: { holdHead: Mock<(view: Matrix4) => void> } } => ({ actor: { holdHead: vi.fn<(view: Matrix4) => void>() } });

  it('hands every figure the view-projection of the camera as it is NOW (the rig has moved it, the renderer has not yet updated its matrices)', () => {
    const cam = cameraAt(1);
    const staged = [fake(), fake()];
    cam.position.set(2, 3, 9);
    cam.lookAt(0, 1, 0); // position and look-at set, matrixWorldInverse stale
    holdHeads(staged, cam);
    const now = viewOf(cam); // after holdHeads updated the camera's matrices
    for (const s of staged) {
      expect(s.actor.holdHead).toHaveBeenCalledTimes(1);
      const got = s.actor.holdHead.mock.calls[0]![0].elements;
      for (let i = 0; i < 16; i++) expect(got[i]).toBeCloseTo(now.elements[i]!, 12);
    }
  });

  it('does nothing with ?headlock=off, and a figure with no pass to take (a part, a stand-in in a test) is skipped', () => {
    const staged = [fake()];
    setHeadLockOff(true);
    holdHeads(staged, cameraAt(1));
    expect(staged[0]!.actor.holdHead).not.toHaveBeenCalled();
    setHeadLockOff(false);
    expect(() => holdHeads([{ actor: {} }], cameraAt(1))).not.toThrow();
  });

  it('runs in the stage after the actors have moved and after layProneFigures, which slides a body along the floor on the very frame it lies down', () => {
    const src = readFileSync(resolve(__dirname, '..', '..', '..', 'src', 'engine', 'BattlePresenterStage.ts'), 'utf8');
    const at = (needle: string): number => src.indexOf(needle);
    const calls = src.split('holdHeads(').length - 1;
    expect(calls, 'one import and one call: "holdHeads(" is written once').toBe(1);
    expect(at('actor.update(dt)')).toBeGreaterThan(-1);
    expect(at('layProneFigures(')).toBeGreaterThan(at('actor.update(dt)'));
    expect(at('holdHeads(figures')).toBeGreaterThan(at('layProneFigures('));
  });

  it('with the switch off a real figure is never held, with it on she is (the A/B the captures use)', () => {
    const cam = cameraWithPerspective(0.98);
    const run = (off: boolean): number => {
      setHeadLockOff(off);
      const a = yuna({ life: false, interimYaw: false });
      a.setPose('idle', { immediate: true, force: true });
      holdHeads([{ actor: a }], cam);
      a.setPose('ko', { force: true });
      a.update(1 / 60);
      holdHeads([{ actor: a }], cam);
      return swapRatio(a, cam, 'idle', 'ko');
    };
    expect(Math.abs(run(true) - 1)).toBeGreaterThan(CHECK);
    expect(Math.abs(run(false) - 1)).toBeLessThan(HELD);
  });
});
