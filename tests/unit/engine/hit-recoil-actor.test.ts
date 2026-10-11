/**
 * **The knock-back on the real actor** (r40-recoil, FC-1; both games; Bailey's pick P3-80). The real `PaintedActor` (`head-lock-fixture.ts`) under a real camera at the battle's 148 px per
 * unit (the round-23 frames: Tidus, 1.82 units, about 270 px on a 1600 px screen), ticked the way the stage ticks it (`update(fieldDt, realDt)`: the field's `dt` is 0 while a hit-stop
 * holds), the figure read the way the harness reads it (the projected plane, 1600 px wide), and the steps judged by the harness's own `detectJerks` with the policy's numbers.
 *
 * The old curve is brought back through `?recoil=legacy`'s test hook so each assertion can fail: with a hit-stop it threw the whole distance on the first frame (33 px light, 50 px crit; the
 * 31 to 36 cell-px jump held for a frame and the swing back through zero in the stored strips of `docs/handoff/r40-recoil.md`).
 */
import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectJerks } from '../../../critic/runner/lib/continuity-pure.mjs';
import type { ContinuityConfig } from '../../../critic/runner/lib/continuity-pure.mjs';
import { setRecoilLegacy } from '../../../src/engine/HitRecoil.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { reset, slotsOf, yuna, type Actor } from './head-lock-fixture.ts';

const cfg = (JSON.parse(readFileSync('critic/policy.json', 'utf8')) as { continuity: ContinuityConfig }).continuity;

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady'); // the default pacing: action x1.2 in FFX
});
afterEach(() => {
  reset();
  setRecoilLegacy(null);
  setPace('steady');
  setPaceGame('other');
});

/** The battle camera of the stored frames: 34 degrees, 9.9 units back, 148 px per unit at the figure. */
function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(34, 1600 / 900, 0.1, 200);
  c.position.set(0, 1.6, 9.9);
  c.lookAt(0, 1, 0);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
}

interface Hit {
  /** Frames of the field held at 0 `dt` right from the frame of the hit (the stage's hit-stop: 40/85 ms FFX, 28/55 ms FFX-2, 2 to 5 frames). */
  freeze?: number;
  distance?: number;
  /** The hit's shake (`BattlePresenterBeats.damage`: 0.1, or 0.16 on a crit); 0 leaves it out. */
  shake?: number;
  phase?: number;
  side?: 'party' | 'enemy';
  /** A second recoil this many frames after the first. */
  again?: number;
  frames?: number;
}

interface Run {
  /** The figure's screen x on every frame, from the frame before the hit, at 1600 px wide. */
  x: number[];
  /** The recoil offset as the actor holds it, world units. */
  offset: number[];
  events: Array<{ px: number; dx: number; n: number }>;
  steps: number[];
}

function hit(h: Hit = {}): Run {
  vi.spyOn(Math, 'random').mockReturnValue(h.phase ?? 0.5);
  const a: Actor = yuna({ life: false, interimYaw: false, ...(h.side ? { side: h.side } : {}) });
  const cam = camera();
  const priv = a as unknown as { recoilOffset: number };
  const at = (): number => {
    a.updateMatrixWorld(true);
    const s = slotsOf(a).find((q) => q.fade > 0.5) ?? slotsOf(a)[0]!;
    const v = new Vector3().setFromMatrixPosition(s.mesh.matrixWorld).project(cam);
    return (v.x * 0.5 + 0.5) * 1600;
  };
  for (let i = 0; i < 4; i++) a.update(1 / 60);
  const x = [at()];
  const offset = [priv.recoilOffset];
  void a.recoil(360, h.distance ?? 0.22);
  if (h.shake) a.shake(h.shake, 340);
  for (let i = 0; i < (h.frames ?? 40); i++) {
    if (h.again !== undefined && i === h.again) void a.recoil(360, h.distance ?? 0.22);
    a.update(i < (h.freeze ?? 0) ? 0 : 1 / 60, 1 / 60);
    x.push(at());
    offset.push(priv.recoilOffset);
  }
  vi.restoreAllMocks();
  const track = x.map((v, n) => ({ n, t: n * (1000 / 60), feet: [v, 700] as [number, number], head: [v, 400] as [number, number], cam: [0, 0] as [number, number] }));
  const steps = x.slice(1).map((v, i) => v - x[i]!);
  return { x, offset, events: detectJerks(track, 1, cfg), steps };
}

const worst = (r: Run): number => Math.max(...r.steps.map(Math.abs));

describe('with the new curve', () => {
  it('moves the figure no more than a frame step of 17 px, whatever the hit-stop, for a light hit and a crit', () => {
    for (const [distance, label] of [[0.22, 'light'], [0.34, 'crit']] as const) {
      for (const freeze of [0, 2, 3, 5]) {
        const r = hit({ freeze, distance });
        expect(worst(r), `${label} freeze ${freeze}`).toBeLessThan(17);
        expect(r.events, `${label} freeze ${freeze}`).toEqual([]);
      }
    }
  });

  it('holds the figure still through the hit-stop and starts the push when the field lets go', () => {
    const r = hit({ freeze: 5, distance: 0.34 });
    expect(r.offset.slice(0, 6)).toEqual([0, 0, 0, 0, 0, 0]); // the frames of the stop: nothing moved
    expect(Math.abs(r.offset[6]!)).toBeGreaterThan(0.001); // and then it goes
  });

  it('is pushed back (a party member to -x, a foe to +x) by the whole distance at the end of the push, then springs home and past rest by under a tenth, then rests', () => {
    for (const [side, sign] of [['party', -1], ['enemy', 1]] as const) {
      const r = hit({ distance: 0.34, side });
      const away = r.x.map((v) => (v - r.x[0]!) * sign); // positive = away from the opponent
      expect(Math.max(...away)).toBeGreaterThan(0.34 * 148 * 0.9); // 45 px or so, back
      expect(Math.max(...away)).toBeLessThan(0.34 * 148 * 1.05);
      expect(Math.min(...away)).toBeLessThan(0); // the spring goes through rest
      expect(Math.min(...away)).toBeGreaterThan(-0.34 * 148 * 0.1);
      expect(Math.abs(away[away.length - 1]!)).toBeLessThan(0.01); // and ends at rest
    }
  });

  it('takes the same 360 ms of tween time as before (about 430 ms of real time at the FFX pacing, x1.2), and settles', () => {
    const r = hit({ frames: 60 });
    const settled = r.offset.findIndex((v, i) => i > 6 && Math.abs(v) < 1e-9);
    expect(settled).toBeGreaterThanOrEqual(25); // 26 frames of 16.7 ms = 433 ms
    expect(settled).toBeLessThanOrEqual(27);
    const legacy = (setRecoilLegacy(true), hit({ frames: 60 }));
    setRecoilLegacy(null);
    const lsettled = legacy.offset.findIndex((v, i) => i > 6 && Math.abs(v) < 1e-9);
    expect(Math.abs(settled - lsettled)).toBeLessThanOrEqual(1); // the same length of move
  });

  it('a second hit mid-spring starts from where the figure is: no step of more than 17 px', () => {
    for (const again of [3, 8, 14]) {
      const r = hit({ again, distance: 0.34, freeze: 0 });
      expect(worst(r), `again at ${again}`).toBeLessThan(17);
    }
  });

  it('with the hit shake on top (0.1, 0.16; not changed here) no frame passes the harness failing line of 40 px, over 8 shake phases', () => {
    for (const [distance, shake] of [[0.22, 0.1], [0.34, 0.16]] as const) {
      for (let k = 0; k < 8; k++) {
        for (const freeze of [0, 3]) {
          const r = hit({ distance, shake, phase: k / 8, freeze });
          expect(worst(r), `${distance} phase ${k} freeze ${freeze}`).toBeLessThan(cfg.motion.jerkFailPx);
        }
      }
    }
  });
});

describe('the guard can fail: the old curve (`?recoil=legacy`)', () => {
  it('with a hit-stop throws the whole distance in the first frame and is flagged by the harness', () => {
    setRecoilLegacy(true);
    for (const [distance, floor] of [[0.22, 30], [0.34, 45]] as const) {
      const r = hit({ freeze: 3, distance });
      expect(Math.abs(r.steps[0]!)).toBeGreaterThan(floor);
      expect(r.events.length).toBeGreaterThan(0);
      expect(r.events[0]!.px).toBeGreaterThan(floor);
      expect(Math.sign(r.events[0]!.dx)).toBe(-1); // backward for a party member, the stored strips' direction
    }
  });

  it('without a hit-stop the first step is half the distance, and the swing home goes through rest and 37 percent past it', () => {
    setRecoilLegacy(true);
    const r = hit({ distance: 0.34 });
    expect(Math.abs(r.steps[0]!)).toBeGreaterThan(20);
    const away = r.offset.map((v) => -v);
    expect(Math.min(...away)).toBeLessThan(-0.25 * 0.34); // overshoot: the new curve's is under 0.1
  });
});
