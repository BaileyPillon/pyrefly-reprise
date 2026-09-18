/**
 * A focused SoundFont 2 reader.
 *
 * Enough of the spec to drive a sampler: the RIFF chunk tree, the three
 * hydra levels (preset -> instrument -> sample) and the generators that
 * decide pitch, loop points, envelope and level. Modulators are ignored —
 * nothing in our libraries relies on them for a plain sustained note.
 *
 * Node-only: it reads files from D:/Tools/audio-libs, which never ship.
 * Nothing in src/audio imports this.
 *
 * Reference: "SoundFont Technical Specification 2.04", sections 7 and 8.
 */

import { readFileSync } from 'node:fs';

// --------------------------------------------------------------- generators

/** The generator operators we act on. Everything else is parsed and ignored. */
export const GEN = {
  startAddrsOffset: 0,
  endAddrsOffset: 1,
  startloopAddrsOffset: 2,
  endloopAddrsOffset: 3,
  startAddrsCoarseOffset: 4,
  initialFilterFc: 8,
  initialFilterQ: 9,
  chorusEffectsSend: 15,
  reverbEffectsSend: 16,
  pan: 17,
  delayVolEnv: 33,
  attackVolEnv: 34,
  holdVolEnv: 35,
  decayVolEnv: 36,
  sustainVolEnv: 37,
  releaseVolEnv: 38,
  keynumToVolEnvDecay: 40,
  instrument: 41,
  keyRange: 43,
  velRange: 44,
  startloopAddrsCoarseOffset: 45,
  initialAttenuation: 48,
  endloopAddrsCoarseOffset: 50,
  coarseTune: 51,
  fineTune: 52,
  sampleID: 53,
  sampleModes: 54,
  scaleTuning: 56,
  exclusiveClass: 57,
  overridingRootKey: 58,
};

/**
 * Defaults from spec table 8.1.3, for the generators we read. Anything absent
 * here is treated as 0.
 *
 * Timecents of -12000 is one millisecond, which is the spec's "instant".
 */
const GEN_DEFAULTS = {
  [GEN.initialFilterFc]: 13500, // cents -> ~19.9 kHz, i.e. open
  [GEN.initialFilterQ]: 0,
  [GEN.pan]: 0,
  [GEN.delayVolEnv]: -12000,
  [GEN.attackVolEnv]: -12000,
  [GEN.holdVolEnv]: -12000,
  [GEN.decayVolEnv]: -12000,
  [GEN.sustainVolEnv]: 0,
  [GEN.releaseVolEnv]: -12000,
  [GEN.initialAttenuation]: 0,
  [GEN.coarseTune]: 0,
  [GEN.fineTune]: 0,
  [GEN.sampleModes]: 0,
  [GEN.scaleTuning]: 100,
  [GEN.overridingRootKey]: -1,
  [GEN.keynumToVolEnvDecay]: 0,
};

/** Generators that are ranges, not values — a preset zone intersects, never adds. */
const RANGE_GENS = new Set([GEN.keyRange, GEN.velRange]);

/**
 * Generators a preset zone may NOT offset: the spec forbids preset-level use
 * of the address/sample ones, and the terminal generators are structural.
 */
const PRESET_ONLY_IGNORED = new Set([
  GEN.startAddrsOffset,
  GEN.endAddrsOffset,
  GEN.startloopAddrsOffset,
  GEN.endloopAddrsOffset,
  GEN.startAddrsCoarseOffset,
  GEN.endAddrsCoarseOffset,
  GEN.startloopAddrsCoarseOffset,
  GEN.endloopAddrsCoarseOffset,
  GEN.sampleModes,
  GEN.exclusiveClass,
  GEN.overridingRootKey,
]);

// ---------------------------------------------------------------- RIFF tree

function readChunks(buf, start, end) {
  const chunks = [];
  let at = start;
  while (at + 8 <= end) {
    const id = buf.toString('latin1', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    const body = at + 8;
    const stop = Math.min(end, body + size);
    let listType = null;
    if ((id === 'LIST' || id === 'RIFF') && stop - body >= 4) {
      listType = buf.toString('latin1', body, body + 4);
    }
    chunks.push({ id, listType, start: body, end: stop });
    // Chunks are word-aligned: an odd size is followed by a pad byte.
    at = body + size + (size & 1);
  }
  return chunks;
}

function findChunk(chunks, id, listType = null) {
  return chunks.find((c) => c.id === id && (listType === null || c.listType === listType)) ?? null;
}

function zstr(buf, start, length) {
  let end = start;
  const limit = start + length;
  while (end < limit && buf[end] !== 0) end++;
  return buf.toString('latin1', start, end).trim();
}

// ------------------------------------------------------------- record lists

function readPhdr(buf, c) {
  const out = [];
  for (let at = c.start; at + 38 <= c.end; at += 38) {
    out.push({
      name: zstr(buf, at, 20),
      preset: buf.readUInt16LE(at + 20),
      bank: buf.readUInt16LE(at + 22),
      bagIndex: buf.readUInt16LE(at + 24),
    });
  }
  return out;
}

function readInst(buf, c) {
  const out = [];
  for (let at = c.start; at + 22 <= c.end; at += 22) {
    out.push({ name: zstr(buf, at, 20), bagIndex: buf.readUInt16LE(at + 20) });
  }
  return out;
}

function readBag(buf, c) {
  const out = [];
  for (let at = c.start; at + 4 <= c.end; at += 4) {
    out.push({ genIndex: buf.readUInt16LE(at), modIndex: buf.readUInt16LE(at + 2) });
  }
  return out;
}

function readGen(buf, c) {
  const out = [];
  for (let at = c.start; at + 4 <= c.end; at += 4) {
    const oper = buf.readUInt16LE(at);
    out.push({
      oper,
      // The amount is a union: signed for tuning, unsigned for indices, two
      // bytes for ranges. Keep all three readings and let the caller pick.
      s16: buf.readInt16LE(at + 2),
      u16: buf.readUInt16LE(at + 2),
      lo: buf[at + 2],
      hi: buf[at + 3],
    });
  }
  return out;
}

function readShdr(buf, c) {
  const out = [];
  for (let at = c.start; at + 46 <= c.end; at += 46) {
    out.push({
      name: zstr(buf, at, 20),
      start: buf.readUInt32LE(at + 20),
      end: buf.readUInt32LE(at + 24),
      startLoop: buf.readUInt32LE(at + 28),
      endLoop: buf.readUInt32LE(at + 32),
      sampleRate: buf.readUInt32LE(at + 36),
      originalPitch: buf[at + 40],
      pitchCorrection: buf.readInt8(at + 41),
      sampleLink: buf.readUInt16LE(at + 42),
      sampleType: buf.readUInt16LE(at + 44),
    });
  }
  return out;
}

// ------------------------------------------------------------------- zones

/**
 * Split one bag range into zones. A leading zone that lacks `terminal` is the
 * global zone: its generators are the defaults for every later zone in the bag.
 */
function buildZones(bags, gens, from, to, terminal) {
  const zones = [];
  let global = null;
  for (let b = from; b < to && b < bags.length; b++) {
    const gStart = bags[b].genIndex;
    const gEnd = b + 1 < bags.length ? bags[b + 1].genIndex : gens.length;
    const map = new Map();
    for (let g = gStart; g < gEnd && g < gens.length; g++) {
      map.set(gens[g].oper, gens[g]);
    }
    if (!map.has(terminal)) {
      // Only the FIRST zone may be global; a later terminal-less zone is junk.
      if (zones.length === 0 && global === null) global = map;
      continue;
    }
    zones.push({ gens: map, global });
  }
  return zones;
}

function genValue(zone, oper, fallback) {
  const own = zone.gens.get(oper);
  if (own !== undefined) return own;
  const glob = zone.global?.get(oper);
  if (glob !== undefined) return glob;
  return fallback;
}

function rangeOf(zone, oper) {
  const g = genValue(zone, oper, undefined);
  return g === undefined ? { lo: 0, hi: 127 } : { lo: g.lo, hi: g.hi };
}

function inRange(range, value) {
  return value >= range.lo && value <= range.hi;
}

// -------------------------------------------------------------- public API

/**
 * Parse an .sf2 file into `{ presets, sampleData, sampleRate }`.
 *
 * `sampleData` is the whole sample pool as Int16Array; a zone's `sample`
 * carries indices into it. We keep the pool shared rather than slicing per
 * zone so a 400 MB font costs one allocation.
 */
export function loadSoundFont(path) {
  const buf = readFileSync(path);
  if (buf.length < 12 || buf.toString('latin1', 0, 4) !== 'RIFF') {
    throw new Error(`${path}: not a RIFF file`);
  }
  if (buf.toString('latin1', 8, 12) !== 'sfbk') {
    throw new Error(`${path}: RIFF form is not "sfbk"`);
  }
  const top = readChunks(buf, 12, buf.length);
  const sdta = findChunk(top, 'LIST', 'sdta');
  const pdta = findChunk(top, 'LIST', 'pdta');
  if (!sdta || !pdta) throw new Error(`${path}: missing sdta or pdta list`);

  const sdtaChunks = readChunks(buf, sdta.start + 4, sdta.end);
  const smpl = findChunk(sdtaChunks, 'smpl');
  if (!smpl) throw new Error(`${path}: missing smpl chunk`);
  // Salamander's sample pool is 1.2 GB, so view it in place when the offset
  // happens to be 2-byte aligned (it almost always is) and only fall back to
  // a copy when it is not. Copying 630M frames costs both time and a second
  // 1.2 GB of RAM, which this machine does not reliably have.
  const frames = (smpl.end - smpl.start) >> 1;
  const absolute = buf.byteOffset + smpl.start;
  let sampleData;
  if (absolute % 2 === 0) {
    sampleData = new Int16Array(buf.buffer, absolute, frames);
  } else {
    sampleData = new Int16Array(frames);
    for (let i = 0; i < frames; i++) sampleData[i] = buf.readInt16LE(smpl.start + i * 2);
  }

  const p = readChunks(buf, pdta.start + 4, pdta.end);
  const need = (id) => {
    const c = findChunk(p, id);
    if (!c) throw new Error(`${path}: missing ${id} chunk`);
    return c;
  };
  const phdr = readPhdr(buf, need('phdr'));
  const pbag = readBag(buf, need('pbag'));
  const pgen = readGen(buf, need('pgen'));
  const inst = readInst(buf, need('inst'));
  const ibag = readBag(buf, need('ibag'));
  const igen = readGen(buf, need('igen'));
  const shdr = readShdr(buf, need('shdr'));

  const presets = [];
  // The last phdr record is the terminal "EOP" sentinel; same for inst/shdr.
  for (let i = 0; i < phdr.length - 1; i++) {
    const zones = buildZones(pbag, pgen, phdr[i].bagIndex, phdr[i + 1].bagIndex, GEN.instrument);
    presets.push({
      name: phdr[i].name,
      bank: phdr[i].bank,
      program: phdr[i].preset,
      zones,
    });
  }

  return {
    path,
    presets,
    sampleData,
    inst,
    ibag,
    igen,
    shdr,
  };
}

/** Find a preset by bank/program, or by a case-insensitive name fragment. */
export function findPreset(font, { bank, program, name } = {}) {
  if (bank !== undefined && program !== undefined) {
    const hit = font.presets.find((p) => p.bank === bank && p.program === program);
    if (hit) return hit;
  }
  if (name) {
    const needle = name.toLowerCase();
    const exact = font.presets.find((p) => p.name.toLowerCase() === needle);
    if (exact) return exact;
    const partial = font.presets.find((p) => p.name.toLowerCase().includes(needle));
    if (partial) return partial;
  }
  return null;
}

/**
 * Flatten one preset into a list of playable regions.
 *
 * Each region is a key/velocity rectangle pointing at one sample, with the
 * generators already merged: instrument values are absolute, preset values
 * are added on top, ranges are intersected. That is the whole SoundFont
 * layering model as far as a sampler is concerned.
 */
export function regionsOf(font, preset) {
  const regions = [];
  for (const pz of preset.zones) {
    const instIndex = genValue(pz, GEN.instrument, undefined)?.u16;
    if (instIndex === undefined || instIndex >= font.inst.length - 1) continue;
    const pKey = rangeOf(pz, GEN.keyRange);
    const pVel = rangeOf(pz, GEN.velRange);
    const izones = buildZones(
      font.ibag,
      font.igen,
      font.inst[instIndex].bagIndex,
      font.inst[instIndex + 1].bagIndex,
      GEN.sampleID,
    );
    for (const iz of izones) {
      const sampleIndex = genValue(iz, GEN.sampleID, undefined)?.u16;
      if (sampleIndex === undefined || sampleIndex >= font.shdr.length - 1) continue;
      const iKey = rangeOf(iz, GEN.keyRange);
      const iVel = rangeOf(iz, GEN.velRange);
      const keyLo = Math.max(pKey.lo, iKey.lo);
      const keyHi = Math.min(pKey.hi, iKey.hi);
      const velLo = Math.max(pVel.lo, iVel.lo);
      const velHi = Math.min(pVel.hi, iVel.hi);
      if (keyLo > keyHi || velLo > velHi) continue;

      const merged = {};
      for (const [oper, fallback] of Object.entries(GEN_DEFAULTS)) {
        const op = Number(oper);
        const ig = genValue(iz, op, undefined);
        let value = ig !== undefined ? ig.s16 : fallback;
        if (!RANGE_GENS.has(op) && !PRESET_ONLY_IGNORED.has(op)) {
          const pg = genValue(pz, op, undefined);
          if (pg !== undefined) value += pg.s16;
        }
        merged[op] = value;
      }
      // Address offsets are instrument-level only and never defaulted above.
      for (const op of [
        GEN.startAddrsOffset,
        GEN.endAddrsOffset,
        GEN.startloopAddrsOffset,
        GEN.endloopAddrsOffset,
        GEN.startAddrsCoarseOffset,
        GEN.endAddrsCoarseOffset,
        GEN.startloopAddrsCoarseOffset,
        GEN.endloopAddrsCoarseOffset,
      ]) {
        merged[op] = genValue(iz, op, undefined)?.s16 ?? 0;
      }

      const sh = font.shdr[sampleIndex];
      const start = sh.start + merged[GEN.startAddrsOffset] + merged[GEN.startAddrsCoarseOffset] * 32768;
      const end = sh.end + merged[GEN.endAddrsOffset] + merged[GEN.endAddrsCoarseOffset] * 32768;
      const loopStart =
        sh.startLoop + merged[GEN.startloopAddrsOffset] + merged[GEN.startloopAddrsCoarseOffset] * 32768;
      const loopEnd =
        sh.endLoop + merged[GEN.endloopAddrsOffset] + merged[GEN.endloopAddrsCoarseOffset] * 32768;
      if (end <= start) continue;

      const rootOverride = merged[GEN.overridingRootKey];
      regions.push({
        keyLo,
        keyHi,
        velLo,
        velHi,
        sampleName: sh.name,
        start,
        end,
        loopStart,
        loopEnd,
        loops: (merged[GEN.sampleModes] & 1) === 1,
        sampleRate: sh.sampleRate || 44100,
        rootKey: rootOverride >= 0 && rootOverride <= 127 ? rootOverride : sh.originalPitch,
        // Tuning: the sample's own correction plus the zone's coarse/fine.
        tuneCents: sh.pitchCorrection + merged[GEN.coarseTune] * 100 + merged[GEN.fineTune],
        scaleTuning: merged[GEN.scaleTuning],
        attenuationCb: merged[GEN.initialAttenuation],
        pan: merged[GEN.pan] / 500, // 0.1% units -> -1..1
        filterFcCents: merged[GEN.initialFilterFc],
        filterQCb: merged[GEN.initialFilterQ],
        env: {
          delay: timecentsToSec(merged[GEN.delayVolEnv]),
          attack: timecentsToSec(merged[GEN.attackVolEnv]),
          hold: timecentsToSec(merged[GEN.holdVolEnv]),
          decay: timecentsToSec(merged[GEN.decayVolEnv]),
          sustain: cbAttenToGain(merged[GEN.sustainVolEnv]),
          release: timecentsToSec(merged[GEN.releaseVolEnv]),
        },
      });
    }
  }
  return regions;
}

/** Timecents -> seconds. -12000 (and anything below) reads as instant. */
export function timecentsToSec(tc) {
  if (tc <= -12000) return 0;
  return Math.pow(2, tc / 1200);
}

/** Centibels of attenuation -> linear gain. 0 cB = unity, 960 cB = silence. */
export function cbAttenToGain(cb) {
  if (cb <= 0) return 1;
  if (cb >= 960) return 0;
  return Math.pow(10, -cb / 200);
}

/**
 * Pick the regions that sound for a given key and velocity.
 *
 * SoundFont zones are rectangles that may overlap (layers) — every match
 * sounds, which is how a font stacks e.g. a string body and a bow attack.
 * When nothing matches exactly (sparse fonts leave gaps) we fall back to the
 * nearest region by key distance so a score never goes silent.
 */
export function regionsFor(regions, key, velocity) {
  const hits = regions.filter(
    (r) => key >= r.keyLo && key <= r.keyHi && velocity >= r.velLo && velocity <= r.velHi,
  );
  if (hits.length > 0) return hits;
  const byKey = regions.filter((r) => key >= r.keyLo && key <= r.keyHi);
  if (byKey.length > 0) {
    // Velocity fell in a gap: take the layer whose window is closest.
    let best = byKey[0];
    let bestDist = Infinity;
    for (const r of byKey) {
      const d = velocity < r.velLo ? r.velLo - velocity : velocity - r.velHi;
      if (d < bestDist) {
        bestDist = d;
        best = r;
      }
    }
    return [best];
  }
  if (regions.length === 0) return [];
  let best = regions[0];
  let bestDist = Infinity;
  for (const r of regions) {
    const centre = (r.keyLo + r.keyHi) / 2;
    const d = Math.abs(centre - key);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return [best];
}

export { inRange };
