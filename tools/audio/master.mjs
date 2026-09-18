/**
 * The offline master chain: bus compressor, loudness match, limiter.
 *
 * Deliberately gentle. The point is not loudness — the cues are normalised to
 * -16 LUFS, which is quiet by pop standards and right for a game where sound
 * effects have to sit on top. The point is to stop a tutti from eating the
 * headroom that a fortissimo timpani stroke needs, and to guarantee no cue
 * ever hands the MP3 encoder something that clips on decode.
 */

import { measureLufs, measureTruePeak } from './measure.mjs';

/**
 * Soft-knee bus compressor, feed-forward, with a peak/RMS hybrid detector.
 * 2:1 at a high threshold: it should be doing almost nothing most of the time
 * and only leaning on the loudest bars.
 */
export function busCompress(mix, sampleRate, options = {}) {
  const thresholdDb = options.thresholdDb ?? -18;
  const ratio = options.ratio ?? 2;
  const kneeDb = options.kneeDb ?? 8;
  const attack = Math.exp(-1 / (sampleRate * (options.attackSec ?? 0.02)));
  const release = Math.exp(-1 / (sampleRate * (options.releaseSec ?? 0.28)));
  const makeup = options.makeup ?? 1;

  let env = 0;
  const { left, right } = mix;
  for (let i = 0; i < left.length; i++) {
    const peak = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    // Fast up, slow down: attack catches transients, release breathes.
    env = peak > env ? attack * env + (1 - attack) * peak : release * env + (1 - release) * peak;
    const db = env > 0 ? 20 * Math.log10(env) : -120;
    let overDb = db - thresholdDb;
    let reductionDb = 0;
    if (overDb > kneeDb / 2) {
      reductionDb = overDb - overDb / ratio;
    } else if (overDb > -kneeDb / 2) {
      // Quadratic soft knee, so the compressor engages without a seam.
      const x = overDb + kneeDb / 2;
      reductionDb = ((1 - 1 / ratio) * x * x) / (2 * kneeDb);
    }
    const gain = Math.pow(10, -reductionDb / 20) * makeup;
    left[i] *= gain;
    right[i] *= gain;
  }
}

/**
 * Look-ahead brickwall limiter.
 *
 * The look-ahead delay is what makes it transparent: the gain is already down
 * by the time the transient arrives, so a cymbal is quieter rather than
 * distorted. Ceiling is in linear gain, set from the true-peak target.
 */
export function limit(mix, sampleRate, ceiling = 0.85, lookaheadSec = 0.005) {
  const look = Math.max(1, Math.round(lookaheadSec * sampleRate));
  const release = Math.exp(-1 / (sampleRate * 0.12));
  const { left, right } = mix;
  const n = left.length;

  // Rolling maximum over the look-ahead window, computed as a prefix pass.
  const target = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const peak = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    target[i] = peak > ceiling ? ceiling / peak : 1;
  }
  // Propagate each required reduction backwards over the look-ahead window,
  // so the gain ramps down before the peak rather than on it.
  const need = new Float32Array(n);
  need.fill(1);
  for (let i = 0; i < n; i++) {
    if (target[i] >= 1) continue;
    const from = Math.max(0, i - look);
    for (let j = from; j <= i; j++) {
      if (target[i] < need[j]) need[j] = target[i];
    }
  }

  let gain = 1;
  for (let i = 0; i < n; i++) {
    const want = need[i];
    gain = want < gain ? want : release * gain + (1 - release) * want;
    left[i] *= gain;
    right[i] *= gain;
  }
}

/**
 * Normalise to an integrated-loudness target, then limit to the true-peak
 * ceiling. Loudness first, because limiting changes loudness by a fraction of
 * a dB and we would rather be a hair quiet than over the peak ceiling.
 *
 * Returns what it measured, for the render report.
 */
export function masterToTarget(mix, sampleRate, options = {}) {
  const targetLufs = options.targetLufs ?? -16;
  const ceilingDbtp = options.ceilingDbtp ?? -1;

  busCompress(mix, sampleRate, options.compressor);

  const before = measureLufs(mix.left, mix.right, sampleRate);
  if (Number.isFinite(before)) {
    // Cap the boost: a nearly silent cue should stay quiet rather than have
    // its noise floor dragged up to match a battle theme.
    const gainDb = Math.min(options.maxGainDb ?? 18, targetLufs - before);
    const gain = Math.pow(10, gainDb / 20);
    for (let i = 0; i < mix.left.length; i++) {
      mix.left[i] *= gain;
      mix.right[i] *= gain;
    }
  }

  // Limit a little under the ceiling, then verify: the MP3 encoder will add
  // its own overshoot on top of whatever we hand it.
  const ceilingLinear = Math.pow(10, (ceilingDbtp - 0.4) / 20);
  limit(mix, sampleRate, ceilingLinear);

  const lufs = measureLufs(mix.left, mix.right, sampleRate);
  const truePeakDb = measureTruePeak(mix.left, mix.right);
  return { lufs, truePeakDb, targetLufs, ceilingDbtp };
}
