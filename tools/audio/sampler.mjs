/**
 * The sampled voice engine.
 *
 * Turns a preset (see src/audio/voices/presets/) plus a SoundFont into a
 * `Voice`: the same `(ctx) => Stereo` contract the synthesised voices in
 * src/audio/voices use, so `renderTrack` can swap one for the other without
 * knowing the difference.
 *
 * What makes it sound like an instrument rather than a pitch-shifted blip:
 *
 *   - nearest-sample selection by key, so a cello note plays the cello
 *     sample recorded closest to it and shifts a couple of semitones at most;
 *   - windowed-sinc resampling (not linear), so the shift does not dull the
 *     top octave or alias on bright brass;
 *   - velocity picks the layer AND opens a gentle tilt filter, so soft notes
 *     are darker as well as quieter;
 *   - sustain looping, so a held string note lasts as long as the score says
 *     instead of running out of tape;
 *   - a real release tail past the note-off, rendered into the buffer, which
 *     is what the sequencer's overlap-mixing turns into legato.
 *
 * Node-only. Nothing in src/audio imports this.
 */

import { GEN, regionsFor } from './sf2.mjs';

// ------------------------------------------------------------- resampling

/**
 * Windowed-sinc interpolation, 8 taps, Blackman window.
 *
 * Linear interpolation costs about 6 dB of high end at a fifth up and folds
 * audible aliasing back down into the 2-4 kHz range — exactly the band the
 * brief says must not sound buzzy. Sinc costs ~8x more arithmetic and that is
 * fine offline.
 */
const SINC_TAPS = 8;
const SINC_TABLE_SIZE = 512;
const SINC_TABLE = buildSincTable();

function buildSincTable() {
  // table[phase][tap] for tap in -3..4 relative to floor(position)
  const table = new Float32Array(SINC_TABLE_SIZE * SINC_TAPS);
  const half = SINC_TAPS / 2;
  for (let p = 0; p < SINC_TABLE_SIZE; p++) {
    const frac = p / SINC_TABLE_SIZE;
    let sum = 0;
    for (let t = 0; t < SINC_TAPS; t++) {
      const x = t - half + 1 - frac;
      const s = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      // Blackman window over the tap span.
      const w = (t + 1 - frac) / (SINC_TAPS + 1);
      const win = 0.42 - 0.5 * Math.cos(2 * Math.PI * w) + 0.08 * Math.cos(4 * Math.PI * w);
      const v = s * win;
      table[p * SINC_TAPS + t] = v;
      sum += v;
    }
    // Normalise each phase so a DC input comes back at unity (no ripple).
    if (sum !== 0) {
      for (let t = 0; t < SINC_TAPS; t++) table[p * SINC_TAPS + t] /= sum;
    }
  }
  return table;
}

/**
 * Read `source` at fractional index `pos`, wrapping into [loopStart, loopEnd)
 * when the region loops. `read` is the raw Int16Array pool; indices are
 * absolute into it.
 */
function sincRead(source, pos, lo, hi, looping, loopStart, loopEnd) {
  const base = Math.floor(pos);
  const frac = pos - base;
  const phase = Math.min(SINC_TABLE_SIZE - 1, (frac * SINC_TABLE_SIZE) | 0);
  const off = phase * SINC_TAPS;
  const half = SINC_TAPS / 2;
  let acc = 0;
  for (let t = 0; t < SINC_TAPS; t++) {
    let idx = base + t - half + 1;
    if (looping) {
      const len = loopEnd - loopStart;
      if (len > 0 && idx >= loopEnd) idx = loopStart + ((idx - loopStart) % len);
      else if (idx < lo) idx = lo;
    } else {
      if (idx < lo) idx = lo;
      else if (idx >= hi) idx = hi - 1;
    }
    acc += source[idx] * SINC_TABLE[off + t];
  }
  return acc;
}

// ---------------------------------------------------------------- filters

/** One-pole low-pass, used for the velocity brightness tilt. */
function onePoleCoeff(cutoffHz, sampleRate) {
  const x = Math.exp((-2 * Math.PI * Math.min(cutoffHz, sampleRate * 0.45)) / sampleRate);
  return 1 - x;
}

// ------------------------------------------------------------- the voice

/**
 * Build a `Voice` for one preset.
 *
 * `preset` is the plain-data description from src/audio/voices/presets.
 * `layers` is one entry per `preset.layers` element, already resolved:
 * `{ source, font, regions }`. Stacking two or three of them slightly
 * detuned is what turns one recorded desk into a section.
 */
export function makeSampledVoice({ preset, layers }) {
  const tailFloor = preset.tailSec ?? 0.6;
  const gain = preset.gain ?? 1;
  const prepared = layers.map((l) => ({
    ...l,
    roundRobin: groupRoundRobin(l.regions),
  }));

  return function sampledVoice(ctx) {
    const { sampleRate, freq, dur, velocity, seed } = ctx;
    const hold = Math.max(0, dur);
    const release = Math.max(preset.releaseSec ?? 0, tailFloor);
    const total = Math.max(2, Math.ceil((hold + release) * sampleRate));
    const out = { left: new Float32Array(total), right: new Float32Array(total) };

    // MIDI key from the frequency the sequencer asked for. Working in key
    // space (not Hz) is what lets us pick the right multisample.
    const scoreKey = Math.round(69 + 12 * Math.log2(Math.max(1e-6, freq) / 440));
    const vel = Math.max(1, Math.min(127, Math.round(velocity * 127)));

    // A drum patch is keyed by the GM percussion note, not by what the score
    // wrote. `pitchRef` lets a tuned drum still follow the score's pitches.
    let lookupKey = scoreKey;
    let drumCents = 0;
    const drum = preset.drum;
    if (drum) {
      lookupKey = drum.key;
      if (drum.longKey !== undefined && hold >= (drum.longSec ?? 0.25)) lookupKey = drum.longKey;
      if (drum.pitchRef !== undefined) {
        drumCents = (scoreKey - drum.pitchRef) * 100 * (drum.pitchFollow ?? 1);
      }
    }

    for (const layer of prepared) {
      const transpose = layer.source.transpose ?? 0;
      const key = Math.max(0, Math.min(127, lookupKey + transpose));
      let regions = regionsFor(layer.regions, key, vel);
      if (regions.length === 0) continue;
      if (layer.roundRobin.size > 0) regions = pickRoundRobin(regions, layer.roundRobin, seed);
      const extraCents = drumCents + (layer.source.tuneCents ?? 0) - transpose * 100;
      for (const region of regions) {
        renderRegion({
          region,
          pool: layer.font.sampleData,
          out,
          sampleRate,
          key,
          velocity,
          hold,
          preset,
          gain: gain * (layer.source.gain ?? 1),
          panOffset: layer.source.pan ?? 0,
          extraCents,
          // Deterministic, but different per layer, so two desks do not share
          // the exact same jitter and round-robin choice.
          seed: (seed ^ (layer.index * 0x9e3779b1)) | 0,
          // A drum's key lookup must not also transpose the sample: the GM
          // note IS the sample's root, so hold the pitch where the font put it.
          fixedPitch: !!drum,
        });
      }
    }

    if (preset.amp) applyAmp(out, sampleRate, preset.amp);
    return out;
  };
}

/**
 * Amp-style post-processing for the electric guitars.
 *
 * A SoundFont "distortion guitar" is a sample with some grit already on it and
 * no speaker behind it, which is why played straight it reads as a keyboard
 * patch. tanh saturation supplies the compression and the odd harmonics an amp
 * adds; the cabinet low-pass takes off the fizz above ~5 kHz that no real 4x12
 * ever produced; the body high-pass clears the mud underneath.
 */
function applyAmp(out, sampleRate, amp) {
  const drive = Math.max(0.01, amp.drive ?? 1);
  const mix = amp.mix ?? 1;
  const norm = Math.tanh(drive);
  const cab = amp.cabinetHz ? onePoleCoeff(amp.cabinetHz, sampleRate) : 0;
  const body = amp.bodyHz ? onePoleCoeff(amp.bodyHz, sampleRate) : 0;
  // Two cascaded poles give the cabinet a believable 12 dB/oct skirt.
  let lp1L = 0;
  let lp1R = 0;
  let lp2L = 0;
  let lp2R = 0;
  let hpL = 0;
  let hpR = 0;
  for (let i = 0; i < out.left.length; i++) {
    const dryL = out.left[i];
    const dryR = out.right[i];
    let l = Math.tanh(dryL * drive) / norm;
    let r = Math.tanh(dryR * drive) / norm;
    if (cab) {
      lp1L += (l - lp1L) * cab;
      lp2L += (lp1L - lp2L) * cab;
      l = lp2L;
      lp1R += (r - lp1R) * cab;
      lp2R += (lp1R - lp2R) * cab;
      r = lp2R;
    }
    if (body) {
      hpL += (l - hpL) * body;
      l -= hpL;
      hpR += (r - hpR) * body;
      r -= hpR;
    }
    out.left[i] = dryL * (1 - mix) + l * mix;
    out.right[i] = dryR * (1 - mix) + r * mix;
  }
}

/**
 * Group regions that cover the identical key+velocity rectangle: a library
 * with round robins stores them as duplicate zones (VSCO and Sonatina both
 * do this for percussion). Returns a map from rectangle to alternatives.
 */
function groupRoundRobin(regions) {
  const buckets = new Map();
  for (const r of regions) {
    const k = `${r.keyLo}:${r.keyHi}:${r.velLo}:${r.velHi}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(r);
  }
  const rr = new Map();
  for (const [k, list] of buckets) {
    if (list.length > 1) rr.set(k, list);
  }
  return rr;
}

function pickRoundRobin(layers, rr, seed) {
  const out = [];
  const seen = new Set();
  for (const r of layers) {
    const k = `${r.keyLo}:${r.keyHi}:${r.velLo}:${r.velHi}`;
    const alts = rr.get(k);
    if (!alts) {
      out.push(r);
      continue;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    // Deterministic per note: the same score always renders the same way.
    out.push(alts[Math.abs(seed | 0) % alts.length]);
  }
  return out;
}

function renderRegion({
  region,
  pool,
  out,
  sampleRate,
  key,
  velocity,
  hold,
  preset,
  gain,
  panOffset,
  extraCents,
  seed,
  fixedPitch,
}) {
  const n = out.left.length;

  // ---- pitch -------------------------------------------------------------
  // How far this note is from the sample's own root, in cents, honouring the
  // font's scaleTuning (100 = normal, 0 = a fixed-pitch percussion hit).
  // A drum lookup already IS the sample's root note, so it contributes no
  // key-distance at all and only the explicit `extraCents` bends it.
  const scale = region.scaleTuning / 100;
  const keyCents = fixedPitch ? 0 : (key - region.rootKey) * 100 * scale;
  const cents = keyCents + region.tuneCents + (preset.tuneCents ?? 0) + extraCents;
  const pitchRatio = Math.pow(2, cents / 1200);
  // The sample may have been recorded at a different rate than we render at.
  const step = pitchRatio * (region.sampleRate / sampleRate);

  // ---- level -------------------------------------------------------------
  // SoundFont attenuation, the preset's own trim, and velocity. Velocity is
  // squared-ish (x^1.4) rather than linear: that curve is what makes a
  // crescendo read as a crescendo instead of a volume slider.
  const atten = Math.pow(10, -region.attenuationCb / 200);
  const velGain = Math.pow(Math.max(0.02, velocity), preset.velocityCurve ?? 1.4);
  const amp = gain * atten * velGain;

  // ---- brightness --------------------------------------------------------
  // A soft note on a real instrument is darker, not just quieter. Libraries
  // that ship velocity layers already do this; for the ones that do not we
  // add a gentle tilt. Never brighter than the sample itself.
  const openHz = Math.min(sampleRate * 0.45, 440 * Math.pow(2, (region.filterFcCents - 6900) / 1200));
  const tiltHz = preset.velocityTilt === false
    ? openHz
    : Math.min(openHz, 1200 + Math.pow(velocity, 1.6) * 14000);
  const tiltCoeff = onePoleCoeff(tiltHz, sampleRate);
  const useTilt = tiltHz < sampleRate * 0.42;

  // ---- envelope ----------------------------------------------------------
  const env = region.env;
  const attack = Math.max(preset.attackSec ?? 0, env.attack);
  const decay = env.decay;
  const sustain = env.sustain;
  // The font's own release is usually short; the preset may ask for a longer,
  // more orchestral tail (a hall release on strings, a piano damper).
  const relSec = Math.max(env.release, preset.releaseSec ?? 0, 0.02);
  const holdSamples = Math.max(1, Math.round(hold * sampleRate));
  const attackSamples = Math.max(1, Math.round(attack * sampleRate));
  const delaySamples = Math.round(env.delay * sampleRate);
  const envHoldSamples = Math.round(env.hold * sampleRate);
  const decaySamples = Math.max(1, Math.round(decay * sampleRate));
  const relSamples = Math.max(1, Math.round(relSec * sampleRate));

  // ---- pan ---------------------------------------------------------------
  const pan = Math.max(-1, Math.min(1, region.pan + (preset.pan ?? 0) + panOffset));
  const angle = ((pan + 1) * Math.PI) / 4;
  const gl = Math.cos(angle) * amp;
  const gr = Math.sin(angle) * amp;

  // ---- humanised start ---------------------------------------------------
  // A few milliseconds of deterministic jitter per note. Without it a section
  // of eight strings hits like one sampler trigger, which is the single most
  // machine-like artefact in a sampled mock-up.
  const jitterMs = preset.timingJitterMs ?? 0;
  const jitter = jitterMs > 0 ? (hash01(seed ^ 0x9e3779b9) - 0.5) * 2 * jitterMs * 0.001 : 0;
  const startOffset = Math.max(0, Math.round(jitter * sampleRate));

  const lo = region.start;
  const hi = region.end;
  const looping = region.loops && region.loopEnd > region.loopStart + 8;
  const loopStart = region.loopStart;
  const loopEnd = region.loopEnd;

  let pos = lo;
  let lp = 0;
  const invAttack = 1 / attackSamples;

  for (let i = startOffset; i < n; i++) {
    const t = i - startOffset;
    if (t < delaySamples) continue;
    const te = t - delaySamples;

    // Past the end of a non-looping sample there is nothing left to read.
    if (!looping && pos >= hi - 1) break;

    let s = sincRead(pool, pos, lo, hi, looping, loopStart, loopEnd) / 32768;
    pos += step;

    if (useTilt) {
      lp += (s - lp) * tiltCoeff;
      s = lp;
    }

    // Volume envelope: delay, attack, hold, decay to sustain, then release
    // from wherever the level had got to when the key came up.
    let e;
    if (te < attackSamples) {
      // Convex attack: a bow/breath swells rather than ramping linearly.
      const x = te * invAttack;
      e = x * x * (3 - 2 * x);
    } else {
      const afterAttack = te - attackSamples;
      if (afterAttack < envHoldSamples) e = 1;
      else {
        const d = afterAttack - envHoldSamples;
        e = d >= decaySamples ? sustain : 1 + (sustain - 1) * (d / decaySamples);
      }
    }
    if (t >= holdSamples) {
      const r = (t - holdSamples) / relSamples;
      if (r >= 1) break;
      // Exponential-ish release; squared reads as a natural decay.
      e *= (1 - r) * (1 - r);
    }

    const v = s * e;
    out.left[i] += v * gl;
    out.right[i] += v * gr;
  }
}

/** Deterministic 0..1 from an integer seed (xorshift finisher). */
function hash01(seed) {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

export { buildSincTable, sincRead, hash01 };
