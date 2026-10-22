/**
 * The big-hit camera punch (`?punch=new`; motion program, lane "feel", 2026-10-22; both games): the envelope, the sizes per blow, the REAL magnification on a three camera, the
 * trauma kick it rides on, `planHit`'s switches (default = today exactly), REDUCE MOTION and FFX-2's open command menu.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';
import {
  KICK_WORLD_TODAY,
  PUNCH_FRACTION,
  SETTLE_BACK,
  SETTLE_KICK,
  TODAY_KICK,
  kickArgs,
  kickEnvelope,
  kickSeconds,
  momentPunch,
  newPunchFraction,
  punchDepth,
  settleKickOf,
} from '../../src/engine/feel/PunchCurve.ts';
import { planHit, type HitInfo, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';
import { Trauma } from '../../src/engine/fx/c/Trauma.ts';

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });
const hit = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: false, speed: 'normal', ...o });
const NEW = { punch: 'new', stop: 'today' } as const;

/** Today's envelope, copied from `Trauma.ts` before this lane: the reference the default shape must still equal. */
function todayEnvelope(age: number): number {
  const kIn = 0.09;
  const kOut = 0.38;
  if (age < kIn) return age / kIn;
  const b = (age - kIn) / kOut;
  return b >= 1 ? 0 : 1 - b * b * (3 - 2 * b);
}

describe('the envelope', () => {
  it('today\'s shape is exactly the old one', () => {
    for (let age = 0; age < 0.6; age += 0.003) expect(kickEnvelope(age, TODAY_KICK)).toBeCloseTo(todayEnvelope(age), 12);
  });

  it('the settle rises to 1 in 70 ms, falls below 0 by about an eighth, and rests at exactly 0 from 370 ms on', () => {
    expect(kickSeconds(SETTLE_KICK)).toBeCloseTo(0.37, 9);
    expect(kickEnvelope(0, SETTLE_KICK)).toBe(0);
    expect(kickEnvelope(0.07, SETTLE_KICK)).toBeCloseTo(1, 9);
    let min = 1;
    let max = 0;
    for (let age = 0; age < 0.5; age += 0.0005) {
      const v = kickEnvelope(age, SETTLE_KICK);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(max).toBeCloseTo(1, 3);
    expect(min).toBeLessThan(-0.08); // the undershoot, the "settle"
    expect(min).toBeGreaterThan(-0.15); // small: about 12 percent of the punch
    expect(min).toBeCloseTo(-((4 / 27) * SETTLE_BACK ** 3) / (SETTLE_BACK + 1) ** 2, 2);
    expect(kickEnvelope(0.37, SETTLE_KICK)).toBe(0);
    expect(kickEnvelope(5, SETTLE_KICK)).toBe(0);
  });

  it('settleKickOf keeps the 7 : 30 proportion for any length', () => {
    const s = settleKickOf(740);
    expect(s.inS).toBeCloseTo(0.14, 9);
    expect(s.outS).toBeCloseTo(0.6, 9);
    expect(s.settle).toBe(SETTLE_BACK);
  });
});

describe('how big, per blow', () => {
  const f = { crit: false, heavy: false, big: false, last: false, bossBig: false, first: true };
  it('2 to 3 percent on big blows, nothing on an ordinary one', () => {
    expect(newPunchFraction({ ...f, crit: true, heavy: true })).toBe(0.025);
    expect(newPunchFraction({ ...f, heavy: true })).toBe(0.025);
    expect(newPunchFraction({ ...f, big: true, last: true })).toBe(0.03);
    expect(newPunchFraction({ ...f, bossBig: true })).toBe(0.03);
    expect(newPunchFraction({ ...f })).toBe(0);
    expect(newPunchFraction({ ...f, big: true, last: false })).toBe(0); // the middle of an Overdrive's flurry
    for (const v of Object.values(PUNCH_FRACTION)) {
      expect(v).toBeGreaterThanOrEqual(0.02);
      expect(v).toBeLessThanOrEqual(0.03);
    }
  });

  it('the moment punch: 0.11 today, none when off, none under new while the spectacle carries it, the same small size under new without it', () => {
    expect(momentPunch('today', true)).toBe(0.11);
    expect(momentPunch('today', false)).toBe(0.11);
    expect(momentPunch('off', false)).toBe(0);
    expect(momentPunch('new', true)).toBe(0);
    expect(momentPunch('new', false)).toBe(0.025);
  });
});

describe('2 to 3 percent is 2 to 3 percent on screen', () => {
  /** The battle camera of the stored frames: 34 degrees, about 9.9 units back, looking at the middle of the field. */
  function camera(z = 9.9): PerspectiveCamera {
    const c = new PerspectiveCamera(34, 1600 / 900, 0.1, 200);
    c.position.set(0, 1.6, z);
    c.lookAt(0, 1, 0);
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    return c;
  }
  /** On-screen height in px of a figure standing at `x`, `h` tall, feet on the floor. */
  function screenHeight(c: PerspectiveCamera, x: number, z: number, h: number): number {
    const top = new Vector3(x, h, z).project(c);
    const foot = new Vector3(x, 0, z).project(c);
    return Math.abs(top.y - foot.y) * 0.5 * 900;
  }

  it('punchDepth is the distance along the view axis, not the straight-line distance', () => {
    const c = camera();
    const centred = punchDepth(c, new Vector3(0, 1, 0));
    expect(centred).toBeCloseTo(c.position.distanceTo(new Vector3(0, 1, 0)), 6);
    const off = punchDepth(c, new Vector3(4, 1, 0)); // off to the side: the depth is what a dolly closes, which is less than the line to it
    expect(off).toBeLessThan(c.position.distanceTo(new Vector3(4, 1, 0)));
    expect(off).toBeCloseTo(centred, 0);
    expect(punchDepth(c, new Vector3(0, 1, 40))).toBe(2); // behind the camera: the floor
  });

  it('a punch of f of the depth magnifies the struck figure by 1 / (1 - f): 2.5 percent is 2.56 percent, 3 percent is 3.09, wherever the figure stands', () => {
    for (const [x, z, f] of [[0, 0, 0.025], [3.2, -1, 0.025], [-2.5, 0.5, 0.03], [0.5, -6, 0.03], [4, -2, 0.02]] as const) {
      const c = camera();
      const at = new Vector3(x, 1, z);
      const before = screenHeight(c, x, z, 1.8);
      const depth = punchDepth(c, at);
      const fwd = new Vector3(0, 0, -1).applyQuaternion(c.quaternion);
      c.position.addScaledVector(fwd, f * depth);
      c.updateMatrixWorld(true);
      const after = screenHeight(c, x, z, 1.8);
      expect(after / before - 1, `x ${x} z ${z} f ${f}`).toBeCloseTo(1 / (1 - f) - 1, 2);
    }
  });

  it('through Trauma and kickArgs the dolly at the peak is the fraction of the depth, in world units', () => {
    const c = camera();
    const at = new Vector3(2, 1, -3);
    const depth = punchDepth(c, at);
    const t = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
    t.kick(...kickArgs({ kick: 0.025, kickMode: 'settle' }, c, at));
    t.update(0.07);
    const o = t.offset();
    expect(o.dolly * t.dollyWorld).toBeCloseTo(0.025 * depth, 6);
    // today's: unchanged units
    const u = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
    u.kick(...kickArgs({ kick: 0.05, kickMode: 'today' }, c, at));
    u.update(0.09);
    expect(u.offset().dolly * u.dollyWorld).toBeCloseTo(0.05 * KICK_WORLD_TODAY, 9);
  });
});

describe('the moment punch BattleMoments makes on a heavy blow', () => {
  afterEach(() => resetFeelForTests());

  /** The fractions the camera was punched by for one heavy blow's impact, in the given address and chapter, with the spectacle on or off. */
  function punches(search: string, chapter: string | null, spectacleOn: boolean, heavy = true): number[] {
    resetFeelForTests(search);
    setFeelChapter(chapter);
    const stage = new FakeStage(['tidus'], ['seymour-flux']);
    (stage as unknown as { fx?: { enabled(): boolean } }).fx = { enabled: () => spectacleOn };
    const fractions: number[] = [];
    const orig = stage.camera.punch.bind(stage.camera);
    vi.spyOn(stage.camera, 'punch').mockImplementation((f?: number, ms?: number) => (fractions.push(f ?? -1), orig(f, ms)));
    const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => 'normal' });
    moments.impact('seymour-flux', { hitIndex: 0, heavy });
    return fractions;
  }

  it('is 0.11 today, in every chapter, with the spectacle on or off', () => {
    expect(punches('', 'seymour-flux', true)).toEqual([0.11]);
    expect(punches('', null, false)).toEqual([0.11]);
    expect(punches('?pack=demo', 'yunalesca', true)).toEqual([0.11]); // the pack does not reach Chapter II
    expect(punches('?pack=demo&punch=today', 'ffx2-bahamut', true)).toEqual([0.11]);
  });

  it('?punch=new: none while the spectacle kick carries the punch, 0.025 without it; ?punch=off: none', () => {
    expect(punches('?pack=demo', 'seymour-flux', true)).toEqual([]);
    expect(punches('?pack=demo', 'ffx2-bahamut', false)).toEqual([0.025]);
    expect(punches('?punch=off', 'seymour-flux', true)).toEqual([]);
  });

  it('a light blow never punches', () => {
    expect(punches('', 'seymour-flux', true, false)).toEqual([]);
  });
});

describe('the trauma kick', () => {
  it('stays active for exactly the shape\'s length and is silent after it (so the camera stops being touched)', () => {
    const t = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
    expect(t.active).toBe(false);
    t.kick(0.025, SETTLE_KICK, 9.5);
    expect(t.active).toBe(true);
    for (let i = 0; i < 22; i++) t.update(1 / 60); // 367 ms
    expect(t.active).toBe(true);
    for (let i = 0; i < 3; i++) t.update(1 / 60);
    expect(t.active).toBe(false);
  });

  it('a second kick inside the first takes the larger and restarts the clock', () => {
    const t = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
    t.kick(0.025, SETTLE_KICK, 9.5);
    t.update(0.07);
    t.kick(0.03, SETTLE_KICK, 9.5);
    t.update(0.07);
    expect(t.offset().dolly).toBeCloseTo(0.03, 6);
  });
});

describe('planHit', () => {
  it('without the feel flags, or with both on today, is exactly today\'s plan (kick 0.05 / 0.035, smoothstep kick)', () => {
    for (const h of [hit({ crit: true, heavy: true }), hit({ heavy: true }), hit(), hit({ big: true, hitIndex: 3, hitCount: 4 })]) {
      const bare = planHit('ffx', h, flags());
      const today = planHit('ffx', h, flags({ feel: { punch: 'today', stop: 'today' } }));
      expect(today).toEqual(bare);
      expect(bare.kickMode).toBe('today');
    }
    expect(planHit('ffx', hit({ crit: true, heavy: true }), flags()).kick).toBe(0.05);
    expect(planHit('ffx', hit({ heavy: true }), flags()).kick).toBe(0.035);
  });

  it('?punch=new: 2.5 percent on a crit or heavy blow, 3 on an Overdrive finisher and a boss headline move, none on a light one; shape settle', () => {
    const p = (h: Partial<HitInfo>): ReturnType<typeof planHit> => planHit('ffx', hit(h), flags({ feel: NEW }));
    expect(p({ crit: true, heavy: true }).kick).toBe(0.025);
    expect(p({ heavy: true }).kick).toBe(0.025);
    expect(p({ big: true, hitIndex: 3, hitCount: 4 }).kick).toBe(0.03);
    expect(p({ bossBig: true }).kick).toBe(0.03);
    expect(p({}).kick).toBe(0);
    expect(p({ crit: true }).kickMode).toBe('settle');
    expect(planHit('ffx2', hit({ big: true, crit: false }), flags({ feel: NEW })).kick).toBe(0.03); // FFX-2: a Special's last blow
  });

  it('?punch=off: no kick at all, the shake stays', () => {
    const off = planHit('ffx', hit({ crit: true, heavy: true }), flags({ feel: { punch: 'off', stop: 'today' } }));
    expect(off.kick).toBe(0);
    expect(off.trauma).toBeGreaterThan(0);
  });

  it('REDUCE MOTION: no punch, no shake, no stop, in every mode', () => {
    for (const punch of ['today', 'new', 'off'] as const) {
      for (const stop of ['today', 'short', 'off'] as const) {
        const rm = planHit('ffx', hit({ crit: true, heavy: true, big: true, bossBig: true }), flags({ reduceMotion: true, feel: { punch, stop } }));
        expect([rm.kick, rm.trauma, rm.freezeMs], `${punch}/${stop}`).toEqual([0, 0, 0]);
      }
    }
  });

  it('FFX-2: no camera punch over an open command menu (the target frame hold, D-316); the shake passes as it always did', () => {
    const open = planHit('ffx2', hit({ crit: true, heavy: true, menuOpen: true }), flags({ feel: NEW }));
    expect(open.kick).toBe(0);
    expect(open.trauma).toBeGreaterThan(0);
    expect(planHit('ffx2', hit({ crit: true, heavy: true, menuOpen: false }), flags({ feel: NEW })).kick).toBe(0.025);
  });

  it('the strength dial for the shake does not scale the punch', () => {
    const f = flags({ feel: NEW, dial: (n) => (n === 'shake' ? 0.5 : 1) });
    expect(planHit('ffx', hit({ crit: true, heavy: true }), f).kick).toBe(0.025);
  });
});
