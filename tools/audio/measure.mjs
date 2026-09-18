/**
 * The measurements that stand in for ears.
 *
 * An agent cannot hear whether a cue sounds like an orchestra, so the pipeline
 * is held to numbers instead: loudness to the same target as a game mix, true
 * peak under the ceiling a lossy codec needs, a seam that does not click when
 * the loop wraps, and a spectrum that rolls off like an orchestra rather than
 * piling up buzz in the 1-4 kHz band where square and saw waves live.
 *
 * Bailey does the actual listening; these just stop obviously broken audio
 * from ever reaching him.
 */

// ------------------------------------------------------------------- biquad

function biquadRun(x, out, b, a) {
  const [b0, b1, b2] = b;
  const [a1, a2] = a;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    out[i] = yi;
  }
}

/**
 * The two K-weighting stages from ITU-R BS.1770-4, rebuilt from the analog
 * prototype parameters so they are correct at 44.1 kHz as well as 48 kHz.
 * (Quoting the published 48 kHz coefficient table and using it at 44.1 kHz
 * is a common and quietly wrong shortcut — it mis-measures by a few tenths.)
 */
function kWeightCoeffs(sampleRate) {
  // Stage 1: high shelf, +4 dB.
  const f1 = 1681.974450955533;
  const g1 = 3.999843853973347;
  const q1 = 0.7071752369554196;
  const A = Math.pow(10, g1 / 40);
  const w1 = (2 * Math.PI * f1) / sampleRate;
  const c1 = Math.cos(w1);
  const al1 = Math.sin(w1) / (2 * q1);
  const sa = 2 * Math.sqrt(A) * al1;
  const a0s = A + 1 - (A - 1) * c1 + sa;
  const shelf = {
    b: [
      (A * (A + 1 + (A - 1) * c1 + sa)) / a0s,
      (-2 * A * (A - 1 + (A + 1) * c1)) / a0s,
      (A * (A + 1 + (A - 1) * c1 - sa)) / a0s,
    ],
    a: [(2 * (A - 1 - (A + 1) * c1)) / a0s, (A + 1 - (A - 1) * c1 - sa) / a0s],
  };

  // Stage 2: RLB high pass.
  const f2 = 38.13547087602444;
  const q2 = 0.5003270373238773;
  const w2 = (2 * Math.PI * f2) / sampleRate;
  const c2 = Math.cos(w2);
  const al2 = Math.sin(w2) / (2 * q2);
  const a0h = 1 + al2;
  const hp = {
    b: [(1 + c2) / 2 / a0h, (-(1 + c2)) / a0h, (1 + c2) / 2 / a0h],
    a: [(-2 * c2) / a0h, (1 - al2) / a0h],
  };
  return { shelf, hp };
}

function kWeight(channel, sampleRate) {
  const { shelf, hp } = kWeightCoeffs(sampleRate);
  const mid = new Float32Array(channel.length);
  const out = new Float32Array(channel.length);
  biquadRun(channel, mid, shelf.b, shelf.a);
  biquadRun(mid, out, hp.b, hp.a);
  return out;
}

/**
 * Integrated loudness in LUFS, gated per BS.1770-4: 400 ms blocks at 75%
 * overlap, an absolute gate at -70 LUFS and a relative gate 10 LU below the
 * ungated mean.
 */
export function measureLufs(left, right, sampleRate) {
  const kl = kWeight(left, sampleRate);
  const kr = kWeight(right, sampleRate);
  const block = Math.round(0.4 * sampleRate);
  const step = Math.round(block / 4);
  if (kl.length < block) return -Infinity;

  const powers = [];
  for (let start = 0; start + block <= kl.length; start += step) {
    let sl = 0;
    let sr = 0;
    for (let i = start; i < start + block; i++) {
      sl += kl[i] * kl[i];
      sr += kr[i] * kr[i];
    }
    powers.push(sl / block + sr / block);
  }
  if (powers.length === 0) return -Infinity;

  const loudnessOf = (p) => -0.691 + 10 * Math.log10(Math.max(1e-30, p));
  const absGated = powers.filter((p) => loudnessOf(p) > -70);
  if (absGated.length === 0) return -Infinity;
  const mean = absGated.reduce((a, b) => a + b, 0) / absGated.length;
  const relThreshold = loudnessOf(mean) - 10;
  const gated = absGated.filter((p) => loudnessOf(p) > relThreshold);
  const finalSet = gated.length > 0 ? gated : absGated;
  const finalMean = finalSet.reduce((a, b) => a + b, 0) / finalSet.length;
  return loudnessOf(finalMean);
}

/**
 * True peak in dBTP, by 4x oversampling with a windowed-sinc.
 *
 * Sample peak is not the number that matters: an MP3 decoder reconstructs the
 * waveform between our samples and can overshoot by a dB or more, which is
 * why a file that measures 0.0 dBFS clips on playback. Hence the -1 dBTP
 * ceiling the pipeline enforces.
 */
export function measureTruePeak(left, right, oversample = 4) {
  const taps = 16;
  const table = [];
  for (let p = 0; p < oversample; p++) {
    const frac = p / oversample;
    const row = new Float64Array(taps);
    let sum = 0;
    for (let t = 0; t < taps; t++) {
      const x = t - taps / 2 + 1 - frac;
      const s = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const w = (t + 1 - frac) / (taps + 1);
      const win = 0.42 - 0.5 * Math.cos(2 * Math.PI * w) + 0.08 * Math.cos(4 * Math.PI * w);
      row[t] = s * win;
      sum += row[t];
    }
    if (sum !== 0) for (let t = 0; t < taps; t++) row[t] /= sum;
    table.push(row);
  }

  let peak = 0;
  for (const ch of [left, right]) {
    for (let i = 0; i < ch.length; i++) {
      const direct = Math.abs(ch[i]);
      if (direct > peak) peak = direct;
      for (let p = 1; p < oversample; p++) {
        const row = table[p];
        let acc = 0;
        for (let t = 0; t < taps; t++) {
          const idx = i + t - taps / 2 + 1;
          acc += (idx < 0 || idx >= ch.length ? 0 : ch[idx]) * row[t];
        }
        const v = Math.abs(acc);
        if (v > peak) peak = v;
      }
    }
  }
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
}

// ---------------------------------------------------------------------- FFT

/** In-place iterative radix-2 FFT. `re`/`im` length must be a power of two. */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Octave band edges, in Hz, from sub-bass to air. */
export const BANDS = [
  ['sub', 20, 60],
  ['low', 60, 250],
  ['low-mid', 250, 800],
  ['mid', 800, 2000],
  ['high-mid', 2000, 4000],
  ['presence', 4000, 8000],
  ['air', 8000, 16000],
];

/**
 * Average band energy across the file, in dB relative to the loudest band.
 *
 * The check this feeds is blunt but catches the exact failure the brief names:
 * oscillator-based voices dump harmonic energy into 1-4 kHz and keep going
 * past 8 kHz, where a recorded orchestra in a hall has already rolled away.
 */
export function measureSpectrum(left, right, sampleRate, fftSize = 4096) {
  const n = fftSize;
  const hop = n;
  const window = new Float64Array(n);
  for (let i = 0; i < n; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);

  const mag = new Float64Array(n / 2);
  let frames = 0;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let start = 0; start + n <= left.length; start += hop) {
    for (let i = 0; i < n; i++) {
      re[i] = ((left[start + i] + right[start + i]) * 0.5) * window[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < n / 2; k++) mag[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    frames++;
  }
  if (frames === 0) return null;

  const binHz = sampleRate / n;
  const bands = {};
  let loudest = 0;
  for (const [name, lo, hi] of BANDS) {
    let sum = 0;
    for (let k = 0; k < n / 2; k++) {
      const f = k * binHz;
      if (f >= lo && f < hi) sum += (mag[k] / frames) ** 2;
    }
    bands[name] = sum;
    if (sum > loudest) loudest = sum;
  }
  const out = {};
  for (const [name] of BANDS) {
    out[name] = loudest > 0 ? 10 * Math.log10(Math.max(1e-30, bands[name] / loudest)) : -Infinity;
  }
  return out;
}

/**
 * How much of an orchestra's shape the spectrum has.
 *
 * The tempting rule — "1-4 kHz must not be the loudest band" — is wrong, and
 * it fails good music. A cue led by a solo flute genuinely peaks there: the
 * instrument's own fundamentals run up to 2 kHz and its second harmonic sits
 * on top of them. Rejecting that would be rejecting the orchestration.
 *
 * What actually distinguishes an orchestra in a hall from a stack of
 * oscillators is the TILT. Above the low mids a recorded ensemble slopes
 * steadily down — instrument bodies radiate less up there, air absorbs it,
 * and the hall soaks up what is left. A saw or square wave has harmonics at
 * 1/n forever and comes out nearly flat, which is exactly what "buzzy" and
 * "arcade-y" describe. So the checks are:
 *
 *   - air (8-16 kHz) well below the loudest band — the roll-off has to exist;
 *   - presence (4-8 kHz) below it too, by less;
 *   - and the run low-mid -> mid -> high-mid -> presence -> air must slope
 *     downwards overall, with room for one band to buck it (a piccolo, a
 *     glockenspiel, a cymbal) without failing the cue.
 */
export function checkSpectralBalance(spectrum) {
  if (!spectrum) return { ok: false, problems: ['no spectrum (file too short)'] };
  const problems = [];
  if (spectrum.air > -12) {
    problems.push(
      `air (8-16k) is only ${spectrum.air.toFixed(1)} dB below the loudest band; ` +
        'an orchestral recording rolls off past 8k (want <= -12 dB)',
    );
  }
  if (spectrum.presence > -5) {
    problems.push(
      `presence (4-8k) is only ${spectrum.presence.toFixed(1)} dB below the loudest band ` +
        '(want <= -5 dB)',
    );
  }

  // Overall tilt across the upper five bands, in dB per band.
  const run = ['low-mid', 'mid', 'high-mid', 'presence', 'air'].map((b) => spectrum[b]);
  const tilt = (run[run.length - 1] - run[0]) / (run.length - 1);
  if (tilt > -2) {
    problems.push(
      `spectrum is nearly flat above 250 Hz (${tilt.toFixed(1)} dB per band); a recorded ` +
        'ensemble slopes down, an oscillator stack does not',
    );
  }
  // Allow exactly one band to rise against the trend.
  let rises = 0;
  for (let i = 1; i < run.length; i++) {
    if (run[i] > run[i - 1] + 0.5) rises++;
  }
  if (rises > 1) {
    problems.push(`${rises} bands rise against the roll-off; expected at most one`);
  }
  return { ok: problems.length === 0, problems, tilt };
}

/**
 * Seam check: does the loop wrap sound any different from the first pass?
 *
 * The naive test — "is the step across the wrap small?" — is wrong, and
 * rejects good loops. A cue whose loop body opens on a downbeat has a real
 * transient at `loopStart`; the jump from the sample before it to the sample
 * on it is genuinely large, and the listener already heard exactly that jump
 * when the intro ran into the loop for the first time. It is music, not a
 * click.
 *
 * So the reference is the entry, not zero. We compare the step across the
 * wrap (`loopEnd - 1` -> `loopStart`) against the step the listener already
 * accepted on the way in (`loopStart - 1` -> `loopStart`). Equal means the
 * wrap is indistinguishable from the first pass, which is the real goal.
 * `crossfadeLoopSeam` makes them equal by construction.
 */
export function measureSeam(left, right, loopStartSample, loopEndSample) {
  const n = left.length;
  if (loopEndSample <= loopStartSample || loopEndSample > n) {
    return { ok: false, step: Infinity, note: 'loop points out of range' };
  }
  const window = 512;
  let energy = 0;
  let motion = 0;
  let count = 0;
  for (let i = Math.max(1, loopEndSample - window); i < loopEndSample; i++) {
    energy += left[i] * left[i] + right[i] * right[i];
    motion += Math.abs(left[i] - left[i - 1]) + Math.abs(right[i] - right[i - 1]);
    count++;
  }
  const rms = Math.sqrt(energy / Math.max(1, count * 2));
  const avgMotion = motion / Math.max(1, count * 2);

  const step = Math.max(
    Math.abs(left[loopStartSample] - left[loopEndSample - 1]),
    Math.abs(right[loopStartSample] - right[loopEndSample - 1]),
  );
  // What entering the loop for the first time already sounded like.
  const entryStep =
    loopStartSample > 0
      ? Math.max(
          Math.abs(left[loopStartSample] - left[loopStartSample - 1]),
          Math.abs(right[loopStartSample] - right[loopStartSample - 1]),
        )
      : 0;

  const allowed = Math.max(entryStep * 1.5 + avgMotion * 4, rms * 0.25, 0.002);
  return {
    ok: step <= allowed,
    step,
    entryStep,
    allowed,
    rms,
    note:
      step <= allowed
        ? 'wrap matches the first pass into the loop'
        : 'wrap steps harder than the entry — expect a click the music does not have',
  };
}

/** Everything at once, for the render report. */
export function measureAll(left, right, sampleRate, loopStartSample, loopEndSample) {
  const spectrum = measureSpectrum(left, right, sampleRate);
  return {
    lufs: measureLufs(left, right, sampleRate),
    truePeakDb: measureTruePeak(left, right),
    spectrum,
    balance: checkSpectralBalance(spectrum),
    seam: measureSeam(left, right, loopStartSample, loopEndSample),
  };
}
