/**
 * `felt-piano` — the Salamander grand with a felt strip under the hammers.
 *
 * Plan §A1 "Felt / soft piano": no free SFZ felt piano is clear about
 * redistributing rendered audio, and the one good free one needs an email
 * signup (account creation, which only Bailey may do). The cheaper first move
 * the plan names, built here with zero downloads:
 *
 *  1. only the BOTTOM of Salamander's 16 recorded velocity layers — a written
 *     fortissimo reaches the layer a real mezzo-piano was recorded at, because
 *     felt takes the hard attack out of every stroke;
 *  2. a darker top: a two-pole low-pass that opens a little with velocity
 *     (1.3 kHz at the softest, ~3 kHz at the hardest), since felt kills the
 *     hammer's upper partials;
 *  3. the mechanism made audible: a soft felt thump at the key-down and a
 *     damper settle at the key-up, both seeded per occurrence, a few dB
 *     louder in proportion than on a concert grand — the "close-miked upright
 *     in a quiet room" sound of the modern soft-piano repertoire.
 *
 * It is a voice with the same call shape as the shipped sampled voices, so
 * any caller that renders a `piano` channel can render `felt-piano` instead.
 */

import * as presets from '../../../src/audio/voices/presets/index.ts';
import { voiceForPreset, loadLib } from '../libs.mjs';
import { findPreset, regionsOf } from '../sf2.mjs';
import { rngFor } from './perform.mjs';

/** Velocity window into Salamander: written 0..1 -> this range. */
export const FELT_VEL = { lo: 0.06, hi: 0.42 };

function onePole(buf, rate, hz, state = 0) {
  const a = Math.exp((-2 * Math.PI * hz) / rate);
  let y = state;
  for (let i = 0; i < buf.length; i++) {
    y = (1 - a) * buf[i] + a * y;
    buf[i] = y;
  }
}

/** Salamander's velocity layers at one key, and which of them felt-piano reaches. */
export function salamanderLayerReport(key = 60) {
  const font = loadLib('salamander');
  const regions = regionsOf(font, findPreset(font, { bank: 0, program: 0 }));
  const at = regions.filter((r) => r.keyLo <= key && key <= r.keyHi);
  const ranges = [...new Set(at.map((r) => `${r.velLo}-${r.velHi}`))]
    .map((s) => s.split('-').map(Number))
    .sort((a, b) => a[0] - b[0]);
  const lo = Math.round(FELT_VEL.lo * 127);
  const hi = Math.round(FELT_VEL.hi * 127);
  const reached = ranges.filter(([a, b]) => b >= lo && a <= hi);
  return { key, layers: ranges.length, feltReaches: reached.length, feltVelocityRange: [lo, hi] };
}

export function makeFeltPiano() {
  const base = presets.getPreset('piano');
  const voice = voiceForPreset({ ...base, name: 'felt-piano', timingJitterMs: 0, releaseSec: 1.4, gain: 1 }, 'felt');
  return function feltPiano(ctx) {
    const v = Math.max(0, Math.min(1, ctx.velocity));
    const velocity = FELT_VEL.lo + (FELT_VEL.hi - FELT_VEL.lo) * v;
    const out = voice({ ...ctx, velocity });
    const cutoff = 1300 + 1700 * v;
    onePole(out.left, ctx.sampleRate, cutoff);
    onePole(out.left, ctx.sampleRate, cutoff);
    onePole(out.right, ctx.sampleRate, cutoff);
    onePole(out.right, ctx.sampleRate, cutoff);
    // The bottom layers are recorded quietly: bring the voice back up so a
    // felt piano sits where the concert one did in the mix (about +9 dB).
    const make = 2.8;
    let peak = 0;
    for (let i = 0; i < out.left.length; i++) {
      out.left[i] *= make;
      out.right[i] *= make;
      peak = Math.max(peak, Math.abs(out.left[i]), Math.abs(out.right[i]));
    }
    // Mechanism noise, seeded per occurrence.
    const rnd = rngFor(`felt|${ctx.seed}`);
    const rate = ctx.sampleRate;
    const burst = (at, len, level, hz) => {
      const n = Math.round(len * rate);
      const noise = new Float32Array(n);
      for (let i = 0; i < n; i++) noise[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3);
      onePole(noise, rate, hz);
      onePole(noise, rate, hz);
      const start = Math.round(at * rate);
      for (let i = 0; i < n && start + i < out.left.length; i++) {
        out.left[start + i] += noise[i] * level;
        out.right[start + i] += noise[i] * level * 0.9;
      }
    };
    burst(0, 0.03, peak * (0.05 + 0.07 * v), 700);
    burst(Math.max(0, ctx.dur), 0.045, peak * 0.03, 450);
    return out;
  };
}
