/**
 * A small SFZ reader, a layer / round-robin counter and a wrapper writer.
 *
 * sfizz does the actual playback (see sfizz.mjs); this file exists for the
 * jobs Node has to do itself:
 *
 *  1. COUNT. How many velocity layers and round robins a patch really has, per
 *     key. That count is the evidence that plan causes 1.2 (one dynamic layer)
 *     and 1.5 (no round robins) are fixed for a given instrument, or that they
 *     are not, which is just as worth writing down.
 *  2. REWRITE. A "wrapper" SFZ per patch, written to build/audio-sfz/, that
 *     keeps every sample, key range and velocity range of the original and adds
 *     what the performance model needs:
 *       - dynamic-layer CROSSFADE on CC1 for sustains (plan A3.3): the p and f
 *         recordings both sound and CC1 decides the mix, so a swell is a
 *         change of timbre and not only of level;
 *       - simulated LEGATO (plan A3.4): the original regions become
 *         `trigger=first`; a copy of each fires as `trigger=legato`, starts
 *         past the sample's attack (`offset`), fades in over a bow change and
 *         turns the previous note off (`off_by`) in the same time, so a slurred
 *         line is one connected sound rather than a row of attacks;
 *       - a headroom gain, because sfizz_render writes 16-bit PCM and a VSCO
 *         section at forte peaks near -27 dBFS as shipped.
 *  3. Nothing else. The original library files are never modified.
 *
 * Supported: <control> default_path, <global>/<master>/<group>/<region>
 * inheritance, `//` comments, multi-opcode lines, sample paths with spaces.
 * Not supported (VSCO 2 CE and our generated VCSL patches use none of them):
 * #define, #include, <curve>, <effect>.
 */

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const HEADERS = new Set(['control', 'global', 'master', 'group', 'region', 'curve', 'effect', 'midi']);

/** Split one line into tokens: `<header>` or `opcode=value` (value may contain spaces). */
function tokenize(line) {
  const out = [];
  const re = /<([a-z]+)>|([A-Za-z0-9_]+)=/g;
  const marks = [];
  let m;
  while ((m = re.exec(line)) !== null) marks.push({ at: m.index, end: re.lastIndex, header: m[1], key: m[2] });
  for (let i = 0; i < marks.length; i++) {
    const mk = marks[i];
    if (mk.header) {
      out.push({ header: mk.header });
      continue;
    }
    const next = marks[i + 1]?.at ?? line.length;
    out.push({ key: mk.key, value: line.slice(mk.end, next).trim() });
  }
  return out;
}

const NOTE_NAMES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** SFZ note: a number or a name like c4 / f#3 / eb2 (c4 = 60). */
export function sfzKey(v) {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  const m = String(v).trim().toLowerCase().match(/^([a-g])([#b]?)(-?\d+)$/);
  if (!m) throw new Error(`Unreadable SFZ key "${v}"`);
  return NOTE_NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
}

/** Parse SFZ text into flat regions with every inherited opcode applied. */
export function parseSfzText(text, dir, label = '(sfz)') {
  const scope = { control: {}, global: {}, master: {}, group: {} };
  const regions = [];
  let current = null;
  let currentName = null;
  const flush = () => {
    if (currentName === 'region' && current) {
      regions.push({ ...scope.global, ...scope.master, ...scope.group, ...current });
    }
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\/\/.*$/, '');
    if (!line.trim()) continue;
    for (const tok of tokenize(line)) {
      if (tok.header) {
        flush();
        if (!HEADERS.has(tok.header)) throw new Error(`${label}: unknown header <${tok.header}>`);
        currentName = tok.header;
        if (tok.header === 'global') {
          scope.global = {};
          scope.master = {};
          scope.group = {};
          current = scope.global;
        } else if (tok.header === 'master') {
          scope.master = {};
          scope.group = {};
          current = scope.master;
        } else if (tok.header === 'group') {
          scope.group = {};
          current = scope.group;
        } else if (tok.header === 'control') current = scope.control;
        else current = {};
        continue;
      }
      if (current) current[tok.key] = tok.value;
    }
  }
  flush();
  const defaultPath = (scope.control.default_path ?? '').replace(/\\/g, '/');
  const base = isAbsolute(defaultPath) ? defaultPath : join(dir, defaultPath);
  for (const r of regions) {
    const sample = String(r.sample ?? '').replace(/\\/g, '/');
    r.samplePath = (isAbsolute(sample) ? sample : join(base, sample)).replace(/\\/g, '/');
    r._lokey = sfzKey(r.lokey ?? r.key ?? 0);
    r._hikey = sfzKey(r.hikey ?? r.key ?? 127);
    r._lovel = Number(r.lovel ?? 0);
    r._hivel = Number(r.hivel ?? 127);
  }
  return { dir, control: scope.control, regions };
}

export function parseSfz(path) {
  const full = resolve(path);
  return { path: full, ...parseSfzText(readFileSync(full, 'utf8'), dirname(full), full) };
}

/** Regions of the default keyswitch only (an -KS patch holds every articulation). */
export function defaultArticulation(sfz) {
  const withSw = sfz.regions.filter((r) => r.sw_last !== undefined);
  if (withSw.length === 0) return sfz.regions;
  const def = withSw.find((r) => r.sw_default !== undefined)?.sw_default ?? withSw[0].sw_last;
  const key = sfzKey(def);
  return sfz.regions.filter((r) => r.sw_last === undefined || sfzKey(r.sw_last) === key);
}

/**
 * Velocity layers and round robins per key, over the keys the patch covers.
 * A round robin is a `seq_length` > 1 or a `lorand/hirand` split in one zone.
 */
export function countLayers(regions) {
  const perKey = [];
  for (let key = 0; key < 128; key++) {
    const hit = regions.filter((r) => r.sample && r._lokey <= key && key <= r._hikey);
    if (hit.length === 0) continue;
    const vel = new Set(hit.map((r) => `${r._lovel}-${r._hivel}`));
    let rr = 1;
    for (const v of vel) {
      const zone = hit.filter((r) => `${r._lovel}-${r._hivel}` === v);
      const seq = Math.max(...zone.map((r) => Number(r.seq_length ?? 1)));
      const rand = new Set(zone.filter((r) => r.lorand !== undefined).map((r) => `${r.lorand}`)).size;
      rr = Math.max(rr, seq, rand);
    }
    perKey.push({ key, layers: vel.size, rr });
  }
  if (perKey.length === 0) return { keys: 0, layersMin: 0, layersMax: 0, layersMedian: 0, rrMax: 0, samples: 0 };
  const layers = perKey.map((k) => k.layers).sort((a, b) => a - b);
  return {
    keys: perKey.length,
    layersMin: layers[0],
    layersMax: layers[layers.length - 1],
    layersMedian: layers[Math.floor(layers.length / 2)],
    rrMax: Math.max(...perKey.map((k) => k.rr)),
    samples: new Set(regions.map((r) => r.samplePath)).size,
  };
}

/** Sample rate of a WAV (for `offset`, which counts the sample's own frames). */
const rateCache = new Map();
export function wavRate(path) {
  if (rateCache.has(path)) return rateCache.get(path);
  let rate = 48000;
  try {
    const buf = readFileSync(path).subarray(0, 256);
    const fmt = buf.indexOf('fmt ');
    if (fmt >= 0) rate = buf.readUInt32LE(fmt + 12);
  } catch {
    /* keep the default */
  }
  rateCache.set(path, rate);
  return rate;
}

const SKIP = new Set([
  'sample', 'samplePath', '_lokey', '_hikey', '_lovel', '_hivel', 'sw_default', 'sw_lokey',
  'sw_hikey', 'sw_last', 'sw_label', 'default_path', 'group_label',
]);

function regionText(r, extra) {
  const lines = ['<region>', `sample=${r.samplePath}`];
  const merged = { ...r, ...extra };
  for (const [k, v] of Object.entries(merged)) {
    if (SKIP.has(k) || v === undefined) continue;
    lines.push(`${k}=${v}`);
  }
  return lines.join('\n');
}

/**
 * Write the wrapper SFZ text.
 *
 * opts.gainDb      headroom gain added to every region's `volume`
 * opts.xfadeCc1    crossfade velocity layers on CC1 instead of switching on velocity
 * opts.legato      { offsetSec, fadeSec }: add trigger=legato copies
 * opts.ampVeltrack velocity -> amplitude tracking in percent (default: the patch's own)
 * opts.release     override ampeg_release (seconds)
 * opts.keys        [lo, hi] keep only regions that overlap this key range
 * opts.extend      semitones the outermost regions are stretched (default 5)
 * opts.tuneCents   detune every region (a second desk of the same patch)
 *
 * Legato defaults were measured, not guessed (10 ms RMS windows across a
 * slurred A4-B4 on ViolinEnsSusVib): offset 0.09 s with an 80 ms fade-in
 * dipped 10 dB at the join; offset 0.2 s, a 30 ms fade-in and a 120 ms
 * fade-out of the old note dip about 2 dB, which is a bow change.
 */
export function wrapperText(sfz, opts = {}) {
  let regions = defaultArticulation(sfz);
  if (opts.keys) regions = regions.filter((r) => r._hikey >= opts.keys[0] && r._lokey <= opts.keys[1]);
  const gain = opts.gainDb ?? 0;
  // Stretch the outermost samples a few semitones past the recorded range, so
  // a score note just outside a section's sampled compass still sounds
  // (VSCO violins stop at D6; battle-ffx climbs to E6).
  const ext = opts.extend ?? 5;
  const minKey = Math.min(...regions.map((r) => r._lokey));
  const maxKey = Math.max(...regions.map((r) => r._hikey));
  const layerEdges = [...new Set(regions.map((r) => r._hivel))].sort((a, b) => a - b);
  const out = [
    `// generated by tools/audio/modern/sfz.mjs from ${String(sfz.path ?? '').replace(/\\/g, '/')}`,
    '<control>',
    'set_cc1=80',
    'set_cc11=127',
    '<global>',
  ];
  for (const r of regions) {
    const base = { volume: Number(r.volume ?? 0) + gain };
    if (r._lokey === minKey) base.lokey = Math.max(0, minKey - ext);
    if (r._hikey === maxKey) base.hikey = Math.min(127, maxKey + ext);
    if (opts.tuneCents) base.tune = Number(r.tune ?? 0) + opts.tuneCents;
    if (opts.ampVeltrack !== undefined) base.amp_veltrack = opts.ampVeltrack;
    if (opts.release !== undefined) base.ampeg_release = opts.release;
    if (opts.xfadeCc1 && layerEdges.length > 1) {
      // Layer i owns the CC1 band its velocity range had; neighbours overlap
      // by +/-18 so two recordings sound together through the change.
      const lo = r._lovel;
      const hi = r._hivel;
      base.lovel = 0;
      base.hivel = 127;
      if (lo > 0) {
        base.xfin_locc1 = Math.max(0, lo - 18);
        base.xfin_hicc1 = Math.min(127, lo + 18);
      }
      if (hi < 127) {
        base.xfout_locc1 = Math.max(0, hi - 18);
        base.xfout_hicc1 = Math.min(127, hi + 18);
      }
      base.xf_cccurve = 'power';
    }
    if (opts.legato) {
      const fade = opts.legato.fadeSec ?? 0.12;
      const offset = Math.round((opts.legato.offsetSec ?? 0.2) * wavRate(r.samplePath));
      out.push(regionText(r, { ...base, trigger: 'first', group: 1, off_by: 2, off_mode: 'time', off_time: fade }));
      out.push(
        regionText(r, {
          ...base,
          trigger: 'legato',
          group: 2,
          off_by: 2,
          off_mode: 'time',
          off_time: fade,
          offset,
          ampeg_attack: opts.legato.attackSec ?? 0.03,
        }),
      );
    } else {
      out.push(regionText(r, base));
    }
  }
  return out.join('\n') + '\n';
}
