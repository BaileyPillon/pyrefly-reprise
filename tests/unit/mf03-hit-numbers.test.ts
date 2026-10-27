/**
 * MF-03, the plan's measures of a hit, in the engine (no GPU): the REAL `PaintedActor`, struck through the presenter's own call (`HitBeat.hitReact`: `shake` and `recoil` today, the ramped rattle, or the knock),
 * 120 blows per variant with different seeds, stepped on a virtual 60 and 120 Hz clock; the figure's world x is read every frame. The curves audit's table (68 painted-figure hits in the r64 runs, px at 1600
 * wide, per 60 Hz frame): first-frame displacement median 12.5, min 8.1, p90 17.6; 22 of 68 first moves toward the attacker; a median 7 sign reversals; 74 to 76 percent of all velocity jolts; a 29-damage and
 * a 553-damage hit identical. Targets for the knock: first frame 3 or less, none toward the attacker, three reversals or fewer, jolts under 20 percent of today's, the amplitude following `hitPower`.
 * `MF_LOG=1` prints the numbers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { hitReact } from '../../src/engine/motion/HitBeat.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setCurvesChapter, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

beforeEach(() => {
  setCurvesChapter('seymour-flux'); // the live default in Chapter I: the pack is on, the knock-back is the new curve
  setCurvesMode('new');
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  reset();
  vi.restoreAllMocks();
  setMoveWord('hit', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setPaceGame('other');
});

const PX = 146;
const lcg = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};

interface Blow {
  amount: number;
  crit: boolean;
}

/** One blow on a fresh party figure, the attacker at the right; the world x of the figure per frame, px. */
function strike(word: 'today' | 'ramp' | 'knock', blow: Blow, seed: number, hz: number): { x: number[]; dt: number } {
  setMoveWord('hit', word);
  const rnd = lcg(seed * 7919 + 13);
  vi.spyOn(Math, 'random').mockImplementation(rnd);
  const a: Actor = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('yuna', 'idle'), hurt: painting('yuna', 'hurt') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  a.update(0);
  const attacker = { position: { x: 2, y: 0, z: 0 } };
  const ctx = { stage: { actor: (id: string) => (id === 'flux' ? attacker : a), sideOf: () => 'party' }, hpMaxOf: () => 1100 } as never;
  hitReact(ctx, { type: 'damage', seq: seed, targetId: 'yuna', sourceId: 'flux', amount: blow.amount, element: 'physical', crit: blow.crit, hitIndex: 0, hitCount: 1 } as never, a as never, 360);
  const dt = 1000 / hz;
  const x: number[] = [];
  const inner = a as unknown as { inner: { position: { x: number } } };
  for (let t = 0; t < 700; t += dt) {
    a.update(dt / 1000);
    x.push(inner.inner.position.x * PX);
  }
  vi.restoreAllMocks();
  return { x, dt };
}

/** The curves audit's jolt probe: a speed change of 2.5 px per 60 Hz frame or more and 30 percent of the local peak (40 frames either side). */
function jolts(x: number[], hz: number): number {
  const v = x.map((p, i) => (i ? (p - x[i - 1]!) * hz : 0));
  let n = 0;
  for (let i = 3; i < x.length - 3; i++) {
    const dv = Math.abs(v[i]! - v[i - 1]!);
    if (dv / 60 < 2.5) continue;
    let peak = 0;
    for (let k = Math.max(1, i - 40); k < Math.min(x.length, i + 40); k++) peak = Math.max(peak, Math.abs(v[k]!));
    if (dv / (peak || 1) >= 0.3) n++;
  }
  return n;
}

const median = (a: number[]): number => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)]!;

interface Stats {
  first: { median: number; min: number; p90: number };
  toward: number;
  reversals: number;
  jolts: number;
  peak: number;
}

function stats(word: 'today' | 'ramp' | 'knock', blow: Blow, hz: number, n = 120): Stats {
  const first: number[] = [];
  const rev: number[] = [];
  const peaks: number[] = [];
  let toward = 0;
  let j = 0;
  for (let s = 1; s <= n; s++) {
    const { x, dt } = strike(word, blow, s, hz);
    const per60 = hz / 60;
    const v = x.map((p, i) => (i ? (p - x[i - 1]!) * per60 : p * per60)); // px per 60 Hz frame, the first frame from rest
    first.push(Math.abs(v[0]!));
    const mv = v.find((s2) => Math.abs(s2) > 0.2);
    if (mv !== undefined && mv > 0) toward++; // the attacker is at +x
    let r = 0;
    let last = 0;
    for (const s2 of v) {
      const sg = Math.abs(s2) > 1.5 ? Math.sign(s2) : 0;
      if (sg && last && sg !== last) r++;
      if (sg) last = sg;
    }
    rev.push(r);
    peaks.push(Math.max(...x.map((p) => Math.abs(p))));
    j += jolts(x, hz);
    void dt;
  }
  const f = [...first].sort((p, q) => p - q);
  return { first: { median: +median(first).toFixed(2), min: +f[0]!.toFixed(2), p90: +f[Math.floor(n * 0.9)]!.toFixed(2) }, toward, reversals: median(rev), jolts: j, peak: +median(peaks).toFixed(1) };
}

const MID: Blow = { amount: 300, crit: false }; // 300 on a girl of 1,100 HP: power 0.68
const LIGHT: Blow = { amount: 29, crit: false };
const HEAVY: Blow = { amount: 553, crit: false };

describe('MF-03 in the engine: 120 blows per variant', () => {
  const rows: Record<string, Stats> = {};
  for (const hz of [60, 120]) {
    it(`at ${hz} Hz: today's numbers are the audit's (a first frame of 8 to 18 px, a third toward the attacker, many reversals)`, () => {
      const s = stats('today', MID, hz);
      rows[`today ${hz}`] = s;
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, word: 'today', ...s }));
      expect(s.first.median).toBeGreaterThan(6);
      expect(s.toward).toBeGreaterThan(20);
      expect(s.reversals).toBeGreaterThanOrEqual(5);
    });
    it(`at ${hz} Hz: ramp: the first frame is well under today's and the envelope still rattles`, () => {
      const s = stats('ramp', MID, hz);
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, word: 'ramp', ...s }));
      const today = stats('today', MID, hz);
      expect(s.first.median).toBeLessThan(today.first.median * 0.85); // the rest of the first frame is the recoil's first push and the hurt posture's lean, which V1 leaves alone
      expect(s.reversals).toBeGreaterThanOrEqual(5);
    });
    it(`at ${hz} Hz: knock: first frame 3 px or less, none toward the attacker, three reversals or fewer, under 20 percent of today's jolts (120 Hz)`, () => {
      const s = stats('knock', MID, hz);
      const today = stats('today', MID, hz);
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, word: 'knock', ...s, joltsToday: today.jolts }));
      expect(s.first.median).toBeLessThanOrEqual(3);
      expect(s.first.p90).toBeLessThanOrEqual(3.5);
      expect(s.toward).toBe(0);
      expect(s.reversals).toBeLessThanOrEqual(3);
      if (hz >= 120) expect(s.jolts).toBeLessThan(today.jolts * 0.2);
    });
  }

  it('knock: a 29-damage hit and a 553-damage hit no longer move the figure the same; today they do', () => {
    const k29 = stats('knock', LIGHT, 120, 20).peak;
    const k553 = stats('knock', HEAVY, 120, 20).peak;
    const t29 = stats('today', LIGHT, 120, 40).peak;
    const t553 = stats('today', HEAVY, 120, 40).peak;
    if (process.env['MF_LOG']) console.log(JSON.stringify({ knock29: k29, knock553: k553, today29: t29, today553: t553 }));
    expect(k553).toBeGreaterThan(k29 * 1.5);
    expect(Math.abs(t553 - t29)).toBeLessThan(2); // the same rattle
  });
});
