/**
 * MF-27 (motion-fluidity pass, lane L2 "moves"; timebase audit TB-11; both games): the camera shake's two axes run at 23.2 Hz and 33.5 Hz. 33.5 Hz is above a 60 Hz screen's Nyquist (30 Hz), so a 60 Hz
 * screen shows an aliased 26.5 Hz and a 120 or 144 Hz screen the true 33.5: not one picture. Behind `?shakeband=` (`today` default, `band`): both axes under 21 Hz, so every display shows the same shake.
 *
 * The real `BattleCamera`, stepped at 60, 120 and 144 Hz; the dominant frequency of the up-and-down axis is read with a plain DFT of the camera's height.
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { SHAKE_MULT, SHAKE_RAD_PER_S, shakeMultX, shakeMultY } from '../../src/engine/feel/TimeBased.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  resetFeelForTests('?timing=time');
  setFeelChapter('seymour-flux');
});
afterEach(() => {
  vi.restoreAllMocks();
  resetFeelForTests();
  setMoveWord('shakeband', null);
});

const hzOf = (mult: number): number => (SHAKE_RAD_PER_S * mult) / (2 * Math.PI);

function rig(): BattleCamera {
  const cam = new PerspectiveCamera(34, 16 / 9, 0.1, 200);
  const bc = new BattleCamera(cam, { rigs: { idle: { position: [0, 3.4, 9], lookAt: [0, 1.4, 0] } }, initial: 'idle' });
  bc.swayOff = () => true;
  return bc;
}

/** The dominant frequency, Hz, of `v` sampled at `hz`, by a DFT from 8 Hz to the display's Nyquist in half-hertz steps (the trend is removed first). */
function dominant(v: number[], hz: number): number {
  const n = v.length;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const x = v.map((s, i) => (s - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)))); // Hann window
  let best = 0;
  let at = 0;
  for (let f = 8; f <= hz / 2; f += 0.5) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * f * i) / hz;
      re += x[i]! * Math.cos(a);
      im += x[i]! * Math.sin(a);
    }
    const p = re * re + im * im;
    if (p > best) [best, at] = [p, f];
  }
  return at;
}

/** The camera's height at every frame of a long shake (amplitude 0.3, 3 s) sampled at `hz`, after the shake's first 200 ms. */
function ySeries(hz: number): number[] {
  const bc = rig();
  for (let i = 0; i < hz; i++) bc.update(1 / hz);
  bc.shake(0.3, 3000);
  const out: number[] = [];
  for (let i = 0; i < Math.round(1.2 * hz); i++) {
    bc.update(1 / hz);
    if (i >= Math.round(0.2 * hz)) out.push(bc.camera.position.y);
  }
  return out;
}

describe('the multipliers', () => {
  it('today: 2.7 and 3.9 (23.2 Hz and 33.5 Hz); band: 2.0 and 2.4 (17.2 Hz and 20.6 Hz), both under a 60 Hz screen\'s 30 Hz', () => {
    expect(shakeMultX()).toBe(2.7);
    expect(shakeMultY()).toBe(3.9);
    expect(hzOf(2.7)).toBeCloseTo(23.2, 1);
    expect(hzOf(3.9)).toBeCloseTo(33.5, 1);
    setMoveWord('shakeband', 'band');
    expect(shakeMultX()).toBe(SHAKE_MULT.band.x);
    expect(shakeMultY()).toBe(SHAKE_MULT.band.y);
    expect(hzOf(2.0)).toBeCloseTo(17.2, 1);
    expect(hzOf(2.4)).toBeCloseTo(20.6, 1);
    expect(hzOf(SHAKE_MULT.band.y)).toBeLessThan(21);
  });
});

describe('the camera, stepped at three rates', () => {
  it('today: a 60 Hz screen shows the aliased 26.5 Hz, a 120 and a 144 Hz screen the true 33.5 Hz (two pictures)', () => {
    expect(dominant(ySeries(60), 60)).toBeCloseTo(26.5, 0);
    expect(dominant(ySeries(120), 120)).toBeCloseTo(33.5, 0);
    expect(dominant(ySeries(144), 144)).toBeCloseTo(33.5, 0);
  });
  it('band: every display shows the same 20.6 Hz up and down', () => {
    setMoveWord('shakeband', 'band');
    for (const hz of [60, 120, 144]) expect(dominant(ySeries(hz), hz), `${hz} Hz`).toBeCloseTo(20.6, 0);
  });
  it('band keeps the shake the same size and its hit-stop hold: a field that stands still (dt 0) holds the shake', () => {
    setMoveWord('shakeband', 'band');
    const bc = rig();
    for (let i = 0; i < 60; i++) bc.update(1 / 60);
    bc.shake(0.12, 340);
    bc.update(1 / 60);
    const p0 = bc.camera.position.clone();
    for (let i = 0; i < 20; i++) bc.update(0);
    expect(bc.camera.position.distanceTo(p0)).toBe(0);
    const widest = Math.max(...ySeries(120).map((y) => Math.abs(y - ySeries(120)[0]!)));
    expect(widest).toBeGreaterThan(0.01);
  });
});
