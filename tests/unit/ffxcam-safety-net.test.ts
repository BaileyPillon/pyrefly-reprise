/**
 * **The tracking safety net** (`src/engine/ffxcam/safetyNet.ts`): synthetic poses and boxes only (rule 8: the chapter's real programs are never in the repo), plus the two default views and the party's slots,
 * which already are.
 *
 * Pins: a shot that keeps its subjects comes back as the same object, however long it runs; a shot that has lost them acts only after MORE than 6 logic steps (6 does nothing, 7 engages; a shot whose actor has
 * no figure, Cid, gets no grace); the blend from the shot to the safe framing is 12 steps with a cosine ease (0 at the start, half at 6, the framing at 12), the look-at running twice as fast as the eye so the
 * subject is back in frame by a third of the blend; the safe framing is the default view's direction and lens re-aimed at the subjects and pulled back just far enough
 * (not at all when it already holds them, never past the cap), and it holds each subject; the net holds through the shot's own motion, follows subjects that move, lets go with a hard cut at the next beat or program
 * when the new shot holds its subjects, stays (blending from where it stood) when the new shot has lost them too, and lets go with a blend when the shot holds them again for 12 steps; frames without a logic step
 * do not count; nothing to watch stands it down; every engagement, retarget, release and drop is an event and is handed to the log; the thresholds live in one constant.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { SEEN_MIN, visibleFraction, type Box } from '../../src/engine/ffxcam/framing.ts';
import { SAFETY_NET, SafetyNet, blendPoses, safeFraming, type HomeView, type NetEvent, type NetFrame } from '../../src/engine/ffxcam/safetyNet.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { FFX_FAR_VIEW, FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye, ffxVerticalFov } from '../../src/engine/ffx3d/ffxWorld.ts';

const A169 = 16 / 9;
const FOV = ffxVerticalFov(1024);

/** A pose looking along +z from (0, 0, -300) at the origin. */
const pose = (over: Partial<CameraPose> = {}): CameraPose => ({ eye: [0, 0, -300], ref: [0, 0, 0], roll: 0, scrDpt: 1024, fovDeg: FOV, ...over });
const box = (x: number, y: number, z: number, w = 8, h = 18, d = 8): Box => ({ min: [x - w / 2, y - h, z - d / 2], max: [x + w / 2, y, z + d / 2] });
const poseOf = (v: HomeView): CameraPose => ({ eye: ffxEye(v), ref: v.ref, roll: 0, scrDpt: v.scrDpt, fovDeg: ffxVerticalFov(v.scrDpt) });

/** The subject stands at the origin, in view of `pose()`. */
const inView = box(0, 9, 0);

/** A net frame at `steps` with the shot looking at the subject (`good`) or past it (`bad`). */
const home: HomeView = { ref: [0, 0, 0], thetaDeg: -90, phiDeg: -10, len: 300, scrDpt: 1024 };
const lostPose = pose({ ref: [900, 0, 0], eye: [900, 0, -300] }); // looks at a point far from the subject's, along +z
const frame = (steps: number, raw: CameraPose, over: Partial<NetFrame> = {}): NetFrame => ({ steps, raw, aspect: A169, watch: [inView], hold: [inView], home, key: 'a', ...over });

/** Run a net over consecutive logic steps, one publish each. */
function run(net: SafetyNet, from: number, count: number, raw: CameraPose, over: Partial<NetFrame> = {}): CameraPose[] {
  return Array.from({ length: count }, (_, i) => net.process(frame(from + i, raw, over)));
}

describe('a shot that keeps its subjects is never touched', () => {
  it('returns the same pose object, however long it runs', () => {
    const net = new SafetyNet();
    const good = pose();
    expect(visibleFraction(good, inView, A169)).toBeGreaterThanOrEqual(SEEN_MIN);
    for (const out of run(net, 1, 300, good)) expect(out).toBe(good);
    expect(net.events).toEqual([]);
    expect(net.state).toBe('idle');
  });

  it('a shot that is only part in frame (30 percent or more) is left alone', () => {
    const net = new SafetyNet();
    const edge = pose({ eye: [-122, 0, -300], ref: [-122, 0, 0] }); // the subject stands on the right edge of the window: about half of it is in view
    const f = visibleFraction(edge, inView, A169);
    expect(f).toBeGreaterThanOrEqual(SEEN_MIN);
    expect(f).toBeLessThan(1);
    for (const out of run(net, 1, 40, edge)) expect(out).toBe(edge);
  });
});

describe('when it acts', () => {
  it('six lost steps do nothing; the seventh engages', () => {
    const net = new SafetyNet();
    const outs = run(net, 1, 6, lostPose);
    for (const out of outs) expect(out).toBe(lostPose);
    expect(net.state).toBe('idle');
    expect(SAFETY_NET.triggerSteps).toBe(6);
    net.process(frame(7, lostPose));
    expect(net.state).toBe('in');
    expect(net.engagements).toBe(1);
    expect(net.events.map((e) => e.kind)).toEqual(['engage']);
    expect(net.events[0]?.lostSteps).toBe(7);
  });

  it('a shot whose actor has no figure (Cid is never drawn) is waiting for nothing: it engages on its first lost step', () => {
    const net = new SafetyNet();
    expect(SAFETY_NET.triggerStepsNoActor).toBe(0);
    const out = net.process(frame(1, lostPose, { noActor: true }));
    expect(net.state).toBe('in');
    expect(net.events[0]?.lostSteps).toBe(1);
    expect(out).toBe(lostPose); // the engaging publish is the shot's own pose: step 0 of the blend
    const kept = new SafetyNet();
    const good = pose();
    for (const o of run(kept, 1, 60, good, { noActor: true })) expect(o).toBe(good); // a shot that keeps its targets is left alone all the same
    expect(kept.events).toEqual([]);
  });

  it('a recovery inside the count starts the count again', () => {
    const net = new SafetyNet();
    run(net, 1, 5, lostPose);
    net.process(frame(6, pose())); // the shot finds the subject
    run(net, 7, 6, lostPose);
    expect(net.state).toBe('idle');
    net.process(frame(13, lostPose));
    expect(net.state).toBe('in');
  });

  it('a new beat or program restarts the count', () => {
    const net = new SafetyNet();
    run(net, 1, 6, lostPose, { key: 'a' });
    run(net, 7, 6, lostPose, { key: 'b' }); // six lost steps of the new shot
    expect(net.state).toBe('idle');
    net.process(frame(13, lostPose, { key: 'b' }));
    expect(net.state).toBe('in');
  });

  it('frames without a logic step do not count', () => {
    const net = new SafetyNet();
    for (let i = 0; i < 50; i++) net.process(frame(10, lostPose)); // fifty publishes, one step
    expect(net.state).toBe('idle');
  });

  it('with nothing to watch the net stands down', () => {
    const net = new SafetyNet();
    run(net, 1, 20, lostPose, { watch: [], hold: [] });
    expect(net.state).toBe('idle');
    run(net, 21, 8, lostPose);
    expect(net.state).toBe('in');
    net.process(frame(30, lostPose, { watch: [], hold: [] }));
    expect(net.state).toBe('idle');
    expect(net.events.map((e) => e.kind)).toEqual(['engage', 'drop']);
  });
});

describe('the blend and the safe framing', () => {
  it('blends over 12 steps with a cosine ease: the shot at the start, half way at 6, the framing at 12', () => {
    const net = new SafetyNet();
    run(net, 1, 7, lostPose); // engaged on step 7
    const target = safeFraming(home, [inView], A169)!.pose;
    const at = (step: number): CameraPose => net.process(frame(step, lostPose));
    const w7 = at(7); // the engaging publish (steps since engagement: 0)
    expect(w7.eye[0]).toBeCloseTo(lostPose.eye[0], 6);
    const w13 = at(13); // 6 steps in
    expect(w13.eye[0]).toBeCloseTo((lostPose.eye[0] + target.eye[0]) / 2, 6);
    const w19 = at(19); // 12 steps in
    expect(w19.eye[0]).toBeCloseTo(target.eye[0], 6);
    expect(w19.ref[0]).toBeCloseTo(target.ref[0], 6);
    expect(net.state).toBe('hold');
    expect(SAFETY_NET.blendSteps).toBe(12);
  });

  it('the look-at leads the eye: the subject is back in frame by a third of the blend, not at its end', () => {
    const net = new SafetyNet();
    run(net, 1, 7, lostPose);
    expect(visibleFraction(lostPose, inView, A169)).toBeLessThan(SEEN_MIN);
    let seenAt = -1;
    for (let i = 1; i <= SAFETY_NET.blendSteps && seenAt < 0; i++) {
      if (visibleFraction(net.process(frame(7 + i, lostPose)), inView, A169) >= SEEN_MIN) seenAt = i;
    }
    expect(seenAt).toBeGreaterThan(0);
    expect(seenAt).toBeLessThanOrEqual(Math.ceil(SAFETY_NET.blendSteps / 3));
  });

  it('the look-at is on its target after blendSteps / aimLead steps while the eye is half way', () => {
    const target = safeFraming(home, [inView], A169)!.pose;
    const net = new SafetyNet();
    run(net, 1, 7, lostPose);
    const mid = net.process(frame(7 + SAFETY_NET.blendSteps / SAFETY_NET.aimLead, lostPose));
    expect(mid.ref[0]).toBeCloseTo(target.ref[0], 6);
    expect(mid.eye[0]).toBeCloseTo((lostPose.eye[0] + target.eye[0]) / 2, 6);
  });

  it('blendPoses can run the look-at ahead of the eye', () => {
    const a = pose({ eye: [0, 0, 0], ref: [0, 0, 100] });
    const b = pose({ eye: [100, 0, 0], ref: [100, 0, 100] });
    const m = blendPoses(a, b, 0.25, 0.75);
    expect(m.eye[0]).toBeCloseTo(25, 9);
    expect(m.ref[0]).toBeCloseTo(75, 9);
    expect(blendPoses(a, b, 0, 0)).toBe(a);
    expect(blendPoses(a, b, 1, 1)).toBe(b);
  });

  it('the blend is a cosine, not a line: a quarter of the way in is a seventh of the way, not a quarter', () => {
    const e = (1 - Math.cos(Math.PI * 0.25)) / 2;
    const a = pose({ eye: [0, 0, 0] });
    const b = pose({ eye: [100, 0, 0] });
    expect(blendPoses(a, b, e).eye[0]).toBeCloseTo(14.6, 1);
    expect(blendPoses(a, b, 0)).toBe(a);
    expect(blendPoses(a, b, 1)).toBe(b);
  });

  it('the safe framing keeps the default view\'s direction and lens, aims at the subjects and holds them', () => {
    const s = safeFraming(home, [inView], A169)!;
    expect(s.holds).toBe(true);
    expect(s.pose.roll).toBe(0);
    expect(s.pose.fovDeg).toBeCloseTo(FOV, 6);
    expect(visibleFraction(s.pose, inView, A169)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction);
    // aimed at the centre of the subject box
    expect(s.pose.ref[0]).toBeCloseTo(0, 9);
    expect(s.pose.ref[1]).toBeCloseTo(0, 9);
    // the eye is on the default view's line through the aim point: the same direction as the home view's own eye from its look-at
    const homeDir = [poseOf(home).eye[0] - home.ref[0], poseOf(home).eye[1] - home.ref[1], poseOf(home).eye[2] - home.ref[2]].map((n) => n / home.len);
    const dir = [s.pose.eye[0] - s.pose.ref[0], s.pose.eye[1] - s.pose.ref[1], s.pose.eye[2] - s.pose.ref[2]].map((n) => n / (home.len * s.pullback));
    for (let i = 0; i < 3; i++) expect(dir[i]).toBeCloseTo(homeDir[i]!, 9);
  });

  it('pulls back just far enough: not at all when the default distance holds them, more for subjects far apart, never past the cap', () => {
    expect(safeFraming(home, [inView], A169)!.pullback).toBe(1);
    const apart = [box(-200, 9, 0), box(200, 9, 0)];
    const two = safeFraming(home, apart, A169)!;
    expect(two.pullback).toBeGreaterThan(1);
    expect(two.holds).toBe(true);
    for (const b of apart) expect(visibleFraction(two.pose, b, A169)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction - 1e-9);
    // a little less pull-back would not hold them all (the factor is the smallest that does, to the bisection's precision)
    const tighter = safeFraming({ ...home, len: home.len * 0.97 }, apart, A169)!; // a home view that is nearer: needs more of the cap, same answer in absolute distance
    expect(tighter.pullback * home.len * 0.97).toBeCloseTo(two.pullback * home.len, 0);
    // two subjects too far apart for any pull-back within the cap: the first (the actor) is held, the last is let go
    const huge = [box(-5000, 9, 0), box(5000, 9, 0)];
    const capped = safeFraming(home, huge, A169)!;
    expect(capped.held).toBe(1);
    expect(capped.holds).toBe(true);
    expect(visibleFraction(capped.pose, huge[0]!, A169)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction - 1e-9);
    expect(capped.pullback).toBeLessThanOrEqual(SAFETY_NET.maxPullback + 1e-9);
    // a lone subject too big for the cap gets the pull-back that holds it best, and says it does not hold
    const vast = safeFraming(home, [{ min: [-9000, -9, -9], max: [9000, 9, 9] }], A169)!;
    expect(vast.holds).toBe(false);
    expect(vast.held).toBe(1);
    expect(vast.pullback).toBeLessThanOrEqual(SAFETY_NET.maxPullback + 1e-9);
  });

  it('nothing to hold gives nothing', () => {
    expect(safeFraming(home, [], A169)).toBeNull();
  });

  it('the FAR default view, re-aimed at the party, holds all three at 16:9 and at 4:3 with no pull-back at all', () => {
    const party = FFX_PARTY_SLOTS.map((s): Box => ({ min: [s[0] - 4, s[1] - 18, s[2] - 4], max: [s[0] + 4, s[1], s[2] + 4] }));
    for (const aspect of [A169, 4 / 3]) {
      const s = safeFraming(FFX_FAR_VIEW, party, aspect)!;
      expect(s.holds).toBe(true);
      expect(s.pullback).toBe(1);
      for (const b of party) expect(visibleFraction(s.pose, b, aspect)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction);
    }
    // while the script's own FAR view holds none of them at 4:3
    for (const b of party) expect(visibleFraction(poseOf(FFX_FAR_VIEW), b, 4 / 3)).toBe(0);
  });

  it('the NEAR default view re-aimed at the party also holds them without pulling back', () => {
    const party = FFX_PARTY_SLOTS.map((s): Box => ({ min: [s[0] - 4, s[1] - 18, s[2] - 4], max: [s[0] + 4, s[1], s[2] + 4] }));
    expect(safeFraming(FFX_NEAR_VIEW, party, A169)!.pullback).toBe(1);
  });
});

describe('holding, following, and letting go', () => {
  /** An engaged net, 12 steps into the hold. */
  function engaged(over: Partial<NetFrame> = {}): { net: SafetyNet; step: number } {
    const net = new SafetyNet();
    run(net, 1, 7, lostPose, over);
    run(net, 8, 12, lostPose, over);
    expect(net.state).toBe('hold');
    return { net, step: 20 };
  }

  it('holds through the shot\'s own motion while the beat and program stay', () => {
    const { net, step } = engaged();
    const outs = run(net, step, 60, lostPose);
    expect(net.state).toBe('hold');
    for (const out of outs) expect(visibleFraction(out, inView, A169)).toBeGreaterThanOrEqual(SAFETY_NET.holdFraction - 1e-9);
  });

  it('follows a subject that moves', () => {
    const { net, step } = engaged();
    const moved = box(40, 9, 0);
    const out = net.process(frame(step, lostPose, { watch: [moved], hold: [moved] }));
    expect(out.ref[0]).toBeCloseTo(40, 6);
  });

  it('lets go with a hard cut at the next beat when the new shot holds its subjects', () => {
    const { net, step } = engaged();
    const good = pose();
    const out = net.process(frame(step, good, { key: 'b' }));
    expect(out).toBe(good);
    expect(net.state).toBe('idle');
    expect(net.events.at(-1)?.kind).toBe('drop');
  });

  it('stays at the next beat when the new shot has lost its subjects too, and blends from where it stood', () => {
    const { net, step } = engaged();
    const stood = net.process(frame(step, lostPose)); // the framing it holds
    const out = net.process(frame(step + 1, lostPose, { key: 'b', hold: [box(60, 9, 0)], watch: [box(60, 9, 0)] }));
    expect(net.state).toBe('in');
    expect(net.events.at(-1)?.kind).toBe('retarget');
    expect(out.eye[0]).toBeCloseTo(stood.eye[0], 3); // no pop: it starts where it was
    expect(net.engagements).toBe(1); // the same engagement
  });

  it('lets go on its own when the shot has held its subjects for 12 steps running, with a cosine blend back', () => {
    const { net, step } = engaged();
    const good = pose();
    let released = -1;
    for (let i = 0; i < 40; i++) {
      net.process(frame(step + i, good));
      if (released < 0 && net.state === 'out') released = i;
    }
    expect(released).toBe(SAFETY_NET.releaseSteps - 1);
    expect(net.state).toBe('idle');
    expect(net.events.map((e) => e.kind)).toEqual(['engage', 'release']);
    expect(net.process(frame(step + 41, good))).toBe(good);
  });

  it('a shot that comes and goes does not make it let go early', () => {
    const { net, step } = engaged();
    const good = pose();
    for (let i = 0; i < 30; i++) net.process(frame(step + i, i % 8 === 7 ? lostPose : good)); // never 12 good steps running
    expect(net.state).toBe('hold');
  });

  it('a new beat during the blend in carries on from where the picture is', () => {
    const net = new SafetyNet();
    run(net, 1, 7, lostPose);
    const mid = net.process(frame(10, lostPose));
    const next = net.process(frame(11, lostPose, { key: 'b' }));
    expect(net.state).toBe('in');
    expect(next.eye[0]).toBeCloseTo(mid.eye[0], 3);
  });
});

describe('the log', () => {
  it('hands every event to the callback, in order, and keeps them', () => {
    const seen: NetEvent[] = [];
    const net = new SafetyNet({ log: (e) => seen.push(e) });
    run(net, 1, 7, lostPose);
    run(net, 8, 12, lostPose);
    net.process(frame(20, pose(), { key: 'b' }));
    expect(seen.map((e) => e.kind)).toEqual(['engage', 'drop']);
    expect(net.events).toEqual(seen);
    expect(seen[0]).toMatchObject({ kind: 'engage', key: 'a', step: 7, lostSteps: 7 });
    expect(seen[0]?.pullback).toBeGreaterThanOrEqual(1);
  });

  it('keeps at most the newest maxEvents', () => {
    const net = new SafetyNet();
    let step = 0;
    for (let i = 0; i < SAFETY_NET.maxEvents; i++) {
      run(net, step + 1, 8, lostPose, { key: `k${i}` });
      step += 8;
      net.process(frame(step + 1, pose(), { key: `k${i}-good` }));
      step += 1;
    }
    expect(net.events.length).toBeLessThanOrEqual(SAFETY_NET.maxEvents);
    expect(net.engagements).toBe(SAFETY_NET.maxEvents);
  });
});
