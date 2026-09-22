/**
 * A synthesised concert-hall impulse response and an FFT convolver.
 *
 * Plan §A2 wants convolution with a REAL hall IR. Every real IR we could take
 * (OpenAIR, the Theatre Acoustique library, Voxengo) is a download, and hall
 * impulse responses still need Bailey's yes (NOW.md, the music downloads
 * entry). So this sketch convolves with a SYNTHESISED one, built to the
 * figures the brief sets:
 *
 *   - pre-delay 20 ms;
 *   - early reflections: 16 discrete taps from 20 to ~110 ms after the direct
 *     sound, laid out like a shoebox hall (first lateral pair early and
 *     strong, ceiling and rear later and softer), alternating sides so the
 *     room has width before the tail arrives, each tap slightly smeared
 *     (a wall is not a mirror);
 *   - a late tail: decorrelated noise per ear with an exponential decay of
 *     RT60 2.2 s in the mids, 2.6 s in the lows and 1.3 s in the highs (air
 *     and seats absorb the top end first), faded in over the reflections.
 *
 * Its energy is matched to the shipped FDN `Hall` (render.mjs hallFor) so the
 * dry/wet balance of the mix is the one the cues already have; what changes is
 * the room's shape, not how much of it there is.
 */

import { fft } from '../measure.mjs';
import { rngFor } from './perform.mjs';

/** One-pole low-pass in place. */
function lowpass(buf, rate, hz) {
  const a = Math.exp((-2 * Math.PI * hz) / rate);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y = (1 - a) * buf[i] + a * y;
    buf[i] = y;
  }
}

export function synthHallIr(rate, { rt60 = 2.2, rtLow = 2.6, rtHigh = 1.3, preDelay = 0.02, lengthSec = 3.2, seed = 'pyrefly-hall' } = {}) {
  const n = Math.round(lengthSec * rate);
  const pre = Math.round(preDelay * rate);
  const ir = [new Float32Array(n), new Float32Array(n)];

  // --- early reflections ---------------------------------------------------
  const rnd = rngFor(`${seed}|er`);
  const taps = [
    [0.021, 0.62], [0.024, 0.58], [0.031, 0.5], [0.036, 0.47], [0.043, 0.42], [0.049, 0.4],
    [0.055, 0.34], [0.061, 0.33], [0.068, 0.28], [0.074, 0.27], [0.081, 0.23], [0.088, 0.22],
    [0.095, 0.19], [0.101, 0.17], [0.108, 0.15], [0.115, 0.13],
  ];
  taps.forEach(([t, g], k) => {
    const side = k % 2;
    const at = pre + Math.round((t - 0.02 + (rnd() - 0.5) * 0.002) * rate);
    const smear = 3 + Math.round(rnd() * 6);
    for (let s = 0; s < smear; s++) {
      const w = (g * (1 - s / smear)) / (smear / 2);
      ir[side][at + s] += w * (0.95 + rnd() * 0.1);
      ir[1 - side][at + s + Math.round(rate * 0.0006)] += w * 0.45;
    }
  });

  // --- late tail -------------------------------------------------------------
  const tailStart = pre + Math.round(0.03 * rate);
  const fadeIn = Math.round(0.07 * rate);
  for (let ch = 0; ch < 2; ch++) {
    const r = rngFor(`${seed}|tail|${ch}`);
    const white = new Float32Array(n);
    for (let i = tailStart; i < n; i++) white[i] = r() * 2 - 1;
    // Three bands from the same noise: low (< ~300 Hz), high (> ~4 kHz), mid = rest.
    const low = Float32Array.from(white);
    lowpass(low, rate, 300);
    lowpass(low, rate, 300);
    const notHigh = Float32Array.from(white);
    lowpass(notHigh, rate, 4000);
    for (let i = tailStart; i < n; i++) {
      const t = (i - tailStart) / rate;
      const high = white[i] - notHigh[i];
      const mid = notHigh[i] - low[i];
      const env = (rt) => Math.exp((-6.9078 * t) / rt);
      const ramp = Math.min(1, (i - tailStart) / fadeIn);
      ir[ch][i] += ramp * 0.5 * (low[i] * 1.6 * env(rtLow) + mid * env(rt60) + high * 0.7 * env(rtHigh));
    }
  }
  return ir;
}

/** Scale an IR pair to a target total energy (sum of squares over both ears). */
export function matchEnergy(ir, energy) {
  let e = 0;
  for (const ch of ir) for (let i = 0; i < ch.length; i++) e += ch[i] * ch[i];
  const g = Math.sqrt(energy / Math.max(1e-20, e));
  for (const ch of ir) for (let i = 0; i < ch.length; i++) ch[i] *= g;
  return g;
}

/** Energy of the shipped FDN Hall's own impulse response (both ears). */
export function hallEnergy(HallClass, rate, opts) {
  const len = Math.round(4 * rate);
  const bus = { left: new Float32Array(len), right: new Float32Array(len) };
  bus.left[0] = 1;
  bus.right[0] = 1;
  const wet = new HallClass(rate, opts).render(bus);
  let e = 0;
  for (let i = 0; i < wet.left.length; i++) e += wet.left[i] ** 2 + wet.right[i] ** 2;
  return e;
}

function nextPow2(x) {
  let p = 1;
  while (p < x) p <<= 1;
  return p;
}

/** FFT overlap-add convolution of one channel with one IR channel. */
export function convolve(signal, ir) {
  const N = nextPow2(Math.max(2 * ir.length, 1 << 17));
  const B = N - ir.length + 1;
  const hRe = new Float64Array(N);
  const hIm = new Float64Array(N);
  hRe.set(ir);
  fft(hRe, hIm);
  const out = new Float32Array(signal.length + ir.length - 1);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let start = 0; start < signal.length; start += B) {
    re.fill(0);
    im.fill(0);
    const end = Math.min(signal.length, start + B);
    let any = false;
    for (let i = start; i < end; i++) {
      re[i - start] = signal[i];
      if (signal[i] !== 0) any = true;
    }
    if (!any) continue;
    fft(re, im);
    for (let k = 0; k < N; k++) {
      const a = re[k];
      const b = im[k];
      re[k] = a * hRe[k] - b * hIm[k];
      // Conjugate on the way back in: ifft(X) = conj(fft(conj(X))) / N.
      im[k] = -(a * hIm[k] + b * hRe[k]);
    }
    fft(re, im);
    const lim = Math.min(out.length - start, N);
    for (let i = 0; i < lim; i++) out[start + i] += re[i] / N;
  }
  return out;
}

/**
 * The reverb stage: high-pass the send (a hall does not boom), convolve each
 * ear with a little of the other ear's send for width, return the wet bus the
 * same length as the input.
 */
export function convolutionHall(bus, rate, ir, { lowCutHz = 110, cross = 0.3 } = {}) {
  const hp = (x) => {
    const lp = Float32Array.from(x);
    lowpass(lp, rate, lowCutHz);
    lowpass(lp, rate, lowCutHz);
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] - lp[i];
    return y;
  };
  const l = hp(bus.left);
  const r = hp(bus.right);
  const inL = new Float32Array(l.length);
  const inR = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) {
    inL[i] = l[i] * (1 - cross) + r[i] * cross;
    inR[i] = r[i] * (1 - cross) + l[i] * cross;
  }
  const wl = convolve(inL, ir[0]);
  const wr = convolve(inR, ir[1]);
  return { left: wl.subarray(0, bus.left.length), right: wr.subarray(0, bus.right.length) };
}

/**
 * Reverberation time of an IR by Schroeder backward integration, fitted over
 * -5 to -25 dB (T20) and extrapolated to 60 dB. Both ears summed.
 */
export function estimateRt60(ir, rate) {
  const n = ir[0].length;
  const edc = new Float64Array(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) {
    acc += ir[0][i] ** 2 + ir[1][i] ** 2;
    edc[i] = acc;
  }
  const db = (i) => 10 * Math.log10(edc[i] / edc[0]);
  let i5 = 0;
  while (i5 < n && db(i5) > -5) i5++;
  let i25 = i5;
  while (i25 < n && db(i25) > -25) i25++;
  return Number((((i25 - i5) / rate) * 3).toFixed(2));
}
