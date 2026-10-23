/**
 * The PRO CAMERA's pure core (`src/engine/procam`, lane "pro-camera", `?camera=pro`): the maths, the keyed tracks and their registration onto live figures, the real shot table's integrity, the
 * never-crop dolly, the damped glide, the layer's blends and the switch. The director and the camera hook have their own files.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PRO_AUTO_CAMERA, PRO_SHOTS } from '../../../src/data/procam/proShots.ts';
import { dollyPose, ease, eyeDistance, lerpPose, samePose, yawEyeAbout } from '../../../src/engine/procam/ProMath.ts';
import { keysOf, pickWeighted, registerKeys, registrationOf, sampleKeys, timeScale, type Key } from '../../../src/engine/procam/ProTrack.ts';
import { bandOf, fitDolly, frameShare, ndcRect, worstOver, type Box } from '../../../src/engine/procam/ProFit.ts';
import { DampedV3, smoothDamp } from '../../../src/engine/procam/ProSmooth.ts';
import { ProLayer } from '../../../src/engine/procam/ProLayer.ts';
import { castShotChoice, parseProCamKeys, proCamConfigured, proCamOn, resetProCamForTests, setProCam } from '../../../src/engine/procam/ProCamSwitch.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import type { Pose, ProRun } from '../../../src/engine/procam/ProTypes.ts';

const P = (x: number, y: number, z: number, lx = 0, ly = 1.5, lz = 0, fov = 32, roll = 0): Pose => ({ pos: [x, y, z], look: [lx, ly, lz], fov, roll });

afterEach(() => {
  resetProCamForTests();
  setDemoChapter(undefined);
});

describe('maths', () => {
  it('every easing runs 0 to 1 and never leaves the range', () => {
    for (const n of ['linear', 'cosine', 'cubic', 'outCubic', 'inCubic', 'outQuad', 'outSine', 'inOutSine', 'outExpo'] as const) {
      expect(ease(n, 0)).toBeCloseTo(0, 6);
      expect(ease(n, 1)).toBeCloseTo(1, 6);
      for (let u = 0; u <= 1; u += 0.05) {
        const e = ease(n, u);
        expect(e).toBeGreaterThanOrEqual(-1e-9);
        expect(e).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
  it('lerpPose blends eye, aim, lens and roll', () => {
    const m = lerpPose(P(0, 0, 0, 0, 0, 0, 30, 0), P(10, 4, 2, 2, 2, 2, 50, 4), 0.5);
    expect(m.pos).toEqual([5, 2, 1]);
    expect(m.fov).toBe(40);
    expect(m.roll).toBe(2);
  });
  it('a dolly keeps the aim and the lens, and eyeDistance sets the standing distance', () => {
    const p = P(0, 2, 10, 0, 2, 0);
    expect(dollyPose(p, 0.5).pos).toEqual([0, 2, 5]);
    expect(eyeDistance(p, 4).pos).toEqual([0, 2, 4]);
    expect(dollyPose(p, 0.5).look).toEqual(p.look);
  });
  it('yawEyeAbout swings the eye about a pivot and keeps its distance and height', () => {
    const p = P(0, 2, 10, 0, 2, 0);
    const q = yawEyeAbout(p, [0, 0, 0], 90);
    expect(Math.hypot(q.pos[0], q.pos[2])).toBeCloseTo(10, 6);
    expect(q.pos[1]).toBe(2);
    expect(Math.abs(q.pos[0])).toBeCloseTo(10, 6);
  });
});

describe('damped glide', () => {
  it('arrives without overshoot, at rest, whatever the frame rate', () => {
    for (const fps of [30, 60, 144]) {
      const s = { value: 0, velocity: 0 };
      let max = 0;
      for (let i = 0; i < fps * 4; i++) {
        smoothDamp(s, 10, 0.5, 1 / fps);
        max = Math.max(max, s.value);
      }
      expect(max).toBeLessThanOrEqual(10.0001);
      expect(s.value).toBeCloseTo(10, 3);
      expect(Math.abs(s.velocity)).toBeLessThan(0.01);
    }
  });
  it('starts with no jump: the first frame moves far less than an exponential would', () => {
    const s = { value: 0, velocity: 0 };
    smoothDamp(s, 10, 0.9, 1 / 60);
    expect(s.value).toBeLessThan(0.1);
  });
  it('a max speed caps the glide', () => {
    const v = new DampedV3([0, 0, 0]);
    let top = 0;
    for (let i = 0; i < 600; i++) {
      v.step([30, 0, 0], 0.5, 1 / 60, 2.2);
      top = Math.max(top, v.speed);
    }
    expect(top).toBeLessThanOrEqual(2.2 * 1.05);
  });
});

describe('keyed tracks', () => {
  const keys: Key[] = [
    { t: 0, pose: P(0, 0, 0), ease: 'cut' },
    { t: 1000, pose: P(10, 0, 0), ease: 'linear' },
    { t: 1500, pose: P(10, 5, 0), ease: 'cut' },
    { t: 2000, pose: P(0, 5, 0), ease: 'cosine' },
  ];
  it('holds the first key before it, the last after, interpolates between and cuts where a key says cut', () => {
    expect(sampleKeys(keys, -50).pos[0]).toBe(0);
    expect(sampleKeys(keys, 500).pos[0]).toBeCloseTo(5, 6);
    expect(sampleKeys(keys, 1200).pos).toEqual([10, 0, 0]); // 1000..1500 is a hold on the 1000 key, then a cut
    expect(sampleKeys(keys, 1500).pos).toEqual([10, 5, 0]);
    expect(sampleKeys(keys, 1750).pos[0]).toBeCloseTo(5, 6); // cosine halfway
    expect(sampleKeys(keys, 9999).pos).toEqual([0, 5, 0]);
  });
  it('timeScale stretches every key time', () => {
    const k = timeScale(keys, 2);
    expect(k.map((x) => x.t)).toEqual([0, 2000, 3000, 4000]);
  });
  it('a weighted pick honours the draw', () => {
    const rows = [{ weight: 0.2, n: 'a' }, { weight: 0.2, n: 'b' }, { weight: 0.6, n: 'c' }];
    expect(pickWeighted(rows, 0.0)?.n).toBe('a');
    expect(pickWeighted(rows, 0.3)?.n).toBe('b');
    expect(pickWeighted(rows, 0.9)?.n).toBe('c');
    expect(pickWeighted([], 0.5)).toBeUndefined();
  });
});

describe('the real shot table', () => {
  const rows = Object.values(PRO_SHOTS).flat();
  it('holds the groups the director reads', () => {
    for (const g of ['cast.start.tidus', 'cast.start.yuna', 'cast.start.yuna.ally', 'cast.start.kimahri', 'attack.tidus.finisher', 'victory.tidus', 'skill.start.tidus', 'enemy.start.total-annihilation.v0', 'enemy.launch.flare', 'enemy.launch.banish', 'cast.launch.fire.tidus']) {
      expect(PRO_SHOTS[g]?.length, g).toBeGreaterThan(0);
    }
  });
  it('the caster close shot has its five real variants for each caster', () => {
    for (const g of ['cast.start.tidus', 'cast.start.yuna', 'cast.start.kimahri']) expect(PRO_SHOTS[g]!.map((r) => r.id.split('#')[1])).toEqual(['0', '1', '2', '3', '4']);
  });
  it('every shot is well formed: ascending key times from 0, sane lenses, a pair design, finite numbers', () => {
    expect(rows.length).toBeGreaterThan(60);
    for (const r of rows) {
      expect(r.keys.length, r.id).toBeGreaterThanOrEqual(2);
      expect(r.keys[0]![0], r.id).toBe(0);
      for (let i = 1; i < r.keys.length; i++) expect(r.keys[i]![0], r.id).toBeGreaterThanOrEqual(r.keys[i - 1]![0]);
      for (const k of r.keys) {
        expect(k.every((n) => Number.isFinite(n)), r.id).toBe(true);
        expect(k[7]).toBeGreaterThan(8);
        expect(k[7]).toBeLessThan(80);
        expect([0, 1, 2]).toContain(k[9]);
      }
      expect(r.ms).toBeGreaterThan(0);
      expect(r.design.scope).toBe('pair');
    }
  });
  it('nothing in the table flies off the stage: every eye is within 25 m of the party\'s slots', () => {
    for (const r of rows) for (const k of r.keys) expect(Math.hypot(k[1] - r.design.A[0], k[3] - r.design.A[2]), r.id).toBeLessThan(25);
  });
  it('the FFX-2 constants are the decoded ones: four ranked, plate-clamped candidates and the follower gains', () => {
    expect(PRO_AUTO_CAMERA.cands.length).toBe(4);
    expect(PRO_AUTO_CAMERA.follower).toEqual({ focusGain: 0.25, angGain: 0.125, angCapDeg: 5.625, radGain: 0.125 });
    expect(PRO_AUTO_CAMERA.lensDeg).toBeCloseTo(32.18, 1);
    for (const c of PRO_AUTO_CAMERA.cands) expect(Math.abs(c.azDeg)).toBeLessThanOrEqual(35); // the corridor
  });
});

describe('registration onto the live figures', () => {
  const row = PRO_SHOTS['cast.start.tidus']![1]!; // a mirrored design: laid for the actor on the left of his target
  const design = { actor: row.design.A, target: row.design.T, height: row.design.H };
  it('on the design pair it is the shot itself', () => {
    const reg = registrationOf(row, design);
    expect(reg).toEqual({ scale: 1, mirror: false });
    const live = registerKeys(row, design, reg);
    const raw = keysOf(row.keys);
    for (let i = 0; i < live.length; i++) {
      expect(live[i]!.pose.pos[0]).toBeCloseTo(raw[i]!.pose.pos[0], 6);
      expect(live[i]!.pose.look[2]).toBeCloseTo(raw[i]!.pose.look[2], 6);
      expect(live[i]!.pose.roll).toBe(raw[i]!.pose.roll);
    }
  });
  it('a shift of the actor shifts the whole shot by the same amount', () => {
    const moved = { ...design, actor: [design.actor[0] + 0.6, design.actor[1], design.actor[2] - 0.4] as [number, number, number] };
    const a = registerKeys(row, design)[0]!.pose;
    const b = registerKeys(row, moved)[0]!.pose;
    expect(b.pos[0] - a.pos[0]).toBeCloseTo(0.6, 6);
    expect(b.pos[2] - a.pos[2]).toBeCloseTo(-0.4, 6);
    expect(b.fov).toBe(a.fov);
  });
  it('a target on the other side mirrors the shot about the actor and flips the roll', () => {
    const flipped = { ...design, target: [design.actor[0] - 4, 0, design.actor[2]] as [number, number, number] };
    const reg = registrationOf(row, flipped);
    expect(reg.mirror).toBe(true);
    const a = registerKeys(row, design)[0]!.pose;
    const b = registerKeys(row, flipped, reg)[0]!.pose;
    expect(b.pos[0] - design.actor[0]).toBeCloseTo(-(a.pos[0] - design.actor[0]), 6);
    expect(b.pos[2]).toBeCloseTo(a.pos[2], 6);
  });
  it('"live" scale follows a boss\'s height over the design height', () => {
    const boss = PRO_SHOTS['enemy.start.total-annihilation.v0']![0]!;
    const d = { actor: boss.design.A, target: boss.design.T, height: boss.design.H * 0.5 };
    expect(registrationOf(boss, d, 'live').scale).toBeCloseTo(0.5, 6);
    expect(registrationOf(boss, d, 'party').scale).toBe(1);
  });
});

describe('never crop', () => {
  const box = (cx: number, w: number, h: number, z = 0): Box => ({ x0: cx - w / 2, x1: cx + w / 2, y0: 0, y1: h, z0: z - 0.2, z1: z + 0.2 });
  const cam = P(0, 1.5, 10, 0, 1.2, 0, 32);
  it('a figure in the middle projects inside the frame, and a big one near the lens does not', () => {
    const r = ndcRect(box(0, 1, 1.8), cam, 16 / 9)!;
    expect(Math.abs(r.x0)).toBeLessThan(0.3);
    expect(r.y1 - r.y0).toBeGreaterThan(0.2);
    expect(worstOver([box(0, 1, 1.8)], cam, 16 / 9, { x: 0.9, y: 0.9 })).toBeLessThanOrEqual(1);
    expect(worstOver([box(0, 1, 1.8, 8)], cam, 16 / 9, { x: 0.9, y: 0.9 })).toBeGreaterThan(1);
  });
  it('a box behind the lens counts as a miss', () => {
    expect(ndcRect(box(0, 1, 1.8, 14), cam, 16 / 9)).toBeNull();
  });
  it('fitDolly backs the eye off along the view until everyone is inside, and leaves a pose that fits alone', () => {
    const close = P(0, 1.5, 5.2, 0, 1.2, 0, 32);
    const boxes = [box(-3, 1, 1.8), box(3, 1, 1.8)];
    const safe = { x: 0.86, y: 0.9 };
    expect(worstOver(boxes, close, 16 / 9, safe)).toBeGreaterThan(1);
    const fit = fitDolly(close, 16 / 9, boxes, safe);
    expect(fit.k).toBeGreaterThan(1);
    expect(worstOver(boxes, fit.pose, 16 / 9, safe)).toBeLessThanOrEqual(1.01);
    expect(fit.pose.look).toEqual(close.look);
    expect(fit.pose.fov).toBe(close.fov);
    const far = P(0, 1.5, 14, 0, 1.2, 0, 32);
    expect(fitDolly(far, 16 / 9, boxes, safe).k).toBe(1);
  });
  it('is bounded by maxK', () => {
    const fit = fitDolly(P(0, 1.5, 3, 0, 1.2, 0, 32), 16 / 9, [box(0, 9, 6)], { x: 0.5, y: 0.5 }, 1.5);
    expect(fit.k).toBeLessThanOrEqual(1.5 + 1e-9);
  });
  it('a band limits a tall figure to its body', () => {
    const tall: Box = { x0: -1, x1: 1, y0: 0, y1: 4, z0: -1, z1: 1 };
    const b = bandOf(tall, 0, 0.5);
    expect(b.y1).toBe(2);
    expect(frameShare(b, cam, 16 / 9)).toBeLessThan(frameShare(tall, cam, 16 / 9));
  });
});

describe('the layer', () => {
  const rest = P(0, 3, 9.5, 0, 1.4, -1, 32);
  const far = P(6, 2, 4, 4, 1.4, -2, 40, 3);
  const run = (over: Partial<ProRun> = {}): ProRun => ({ id: 't', inMs: 400, inEase: 'linear', outMs: 600, outEase: 'linear', sample: () => far, ...over });

  it('answers null with nothing to do: the game\'s own camera, untouched', () => {
    const l = new ProLayer();
    expect(l.step(0.016, rest, 16 / 9)).toBeNull();
    expect(l.active).toBe(false);
  });
  it('blends in from where the camera was, holds, and blends out to the rig', () => {
    const l = new ProLayer();
    l.step(0.016, rest, 16 / 9); // last = null (no run): the rig
    l.play(run());
    let out = l.step(0.2, rest, 16 / 9)!;
    expect(out.pose.pos[0]).toBeGreaterThan(0.5);
    expect(out.pose.pos[0]).toBeLessThan(5.5); // part way
    out = l.step(0.3, rest, 16 / 9)!;
    expect(out.pose.pos).toEqual(far.pos);
    expect(l.runId).toBe('t');
    l.stop();
    out = l.step(0.3, rest, 16 / 9)!;
    expect(out.pose.pos[0]).toBeGreaterThan(0);
    expect(out.pose.pos[0]).toBeLessThan(6);
    expect(l.step(0.4, rest, 16 / 9)).toBeNull(); // out: the run is over, the rig is back
    expect(l.active).toBe(false);
  });
  it('a cut in and a cut out take no frames', () => {
    const l = new ProLayer();
    l.play(run({ inMs: 0, outMs: 0 }));
    expect(l.step(0.016, rest, 16 / 9)!.pose.pos).toEqual(far.pos);
    l.stop();
    expect(l.step(0.016, rest, 16 / 9)).toBeNull();
  });
  it('rate 0 holds the first pose; a rate of 2 runs twice as fast', () => {
    const l = new ProLayer();
    const seen: number[] = [];
    l.play(run({ inMs: 0, rate: 2, sample: (t) => { seen.push(t); return far; } }));
    l.step(0.5, rest, 16 / 9);
    expect(seen[0]).toBeCloseTo(1000, 3);
    const h = new ProLayer();
    const held: number[] = [];
    h.play(run({ inMs: 0, rate: 0, sample: (t) => { held.push(t); return far; } }));
    h.step(1, rest, 16 / 9);
    expect(held[0]).toBe(0);
  });
  it('maxMs stops the run on its own', () => {
    const l = new ProLayer();
    l.play(run({ inMs: 0, outMs: 0, maxMs: 500 }));
    l.step(0.4, rest, 16 / 9);
    expect(l.active).toBe(true);
    l.step(0.2, rest, 16 / 9);
    l.step(0.016, rest, 16 / 9);
    expect(l.active).toBe(false);
  });
  it('keeps the ambient follower\'s pose when a run ends', () => {
    const l = new ProLayer();
    const amb = P(1, 3, 9, 0, 1.4, -1, 32);
    l.setAmbient((_dt, b) => ({ ...b, pos: amb.pos }));
    expect(l.step(0.016, rest, 16 / 9)!.pose.pos).toEqual(amb.pos);
    l.play(run({ inMs: 0, outMs: 0 }));
    l.step(0.016, rest, 16 / 9);
    l.stop();
    expect(l.step(0.016, rest, 16 / 9)!.pose.pos).toEqual(amb.pos);
  });
  it('the never-crop dolly widens at once and relaxes slowly, and lens breathing moves the lens a little', () => {
    const l = new ProLayer();
    let w = 6; // box width in metres
    l.setBoxes(() => ({ x0: -w / 2, x1: w / 2, y0: 0, y1: 1.8, z0: -0.2, z1: 0.2 }));
    const near = P(0, 1.5, 5, 0, 1, 0, 32);
    l.play(run({ inMs: 0, sample: () => near, fit: { ids: ['a'], safe: { x: 0.7, y: 0.9 } }, breathe: 0.3 }));
    const wide = l.step(0.016, rest, 16 / 9)!.pose;
    expect(wide.pos[2]).toBeGreaterThan(near.pos[2] + 0.5);
    w = 0.2;
    const later = l.step(0.016, rest, 16 / 9)!.pose;
    expect(later.pos[2]).toBeGreaterThan(near.pos[2] + 0.4); // still wide one frame on: it relaxes at a measured rate
    expect(Math.abs(later.fov - near.fov)).toBeLessThan(0.31);
  });
});

describe('the switch', () => {
  it('reads the keys', () => {
    expect(parseProCamKeys('?camera=pro')).toMatchObject({ camera: true, pack: false });
    expect(parseProCamKeys('?pack=demo&camera=off')).toMatchObject({ camera: false, pack: true });
    expect(parseProCamKeys('?camera=today').camera).toBe(false);
    expect(parseProCamKeys('?camdof=on&castshot=3')).toMatchObject({ dof: true, castshot: 3 });
    expect(parseProCamKeys('?castshot=random').castshot).toBe('random');
    expect(parseProCamKeys('?castshot=9').castshot).toBeNull();
    expect(parseProCamKeys(undefined).camera).toBeNull();
  });
  it('is off by default, on with the pack, and off again with camera=off', () => {
    resetProCamForTests('');
    expect(proCamConfigured()).toBe(false);
    resetProCamForTests('?pack=demo');
    expect(proCamConfigured()).toBe(true);
    resetProCamForTests('?pack=demo&camera=off');
    expect(proCamConfigured()).toBe(false);
    resetProCamForTests('?camera=pro');
    expect(proCamConfigured()).toBe(true);
  });
  it('acts only in Chapter I and Chapter IV', () => {
    resetProCamForTests('?pack=demo');
    expect(proCamOn()).toBe(false); // no chapter named
    setDemoChapter('seymour-flux');
    expect(proCamOn()).toBe(true);
    setDemoChapter('ffx2-bahamut');
    expect(proCamOn()).toBe(true);
    setDemoChapter('yunalesca');
    expect(proCamOn()).toBe(false);
    setDemoChapter('seymour-flux');
    setProCam(false);
    expect(proCamOn()).toBe(false);
  });
  it('the cast shot is variant 2 unless named', () => {
    resetProCamForTests('');
    expect(castShotChoice()).toBe(2);
    resetProCamForTests('?castshot=random');
    expect(castShotChoice()).toBe('random');
  });
});

describe('samePose', () => {
  it('compares eye, aim, lens and roll', () => {
    expect(samePose(P(1, 2, 3), P(1, 2, 3))).toBe(true);
    expect(samePose(P(1, 2, 3), P(1, 2, 3.1))).toBe(false);
  });
});
