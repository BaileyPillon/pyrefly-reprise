#!/usr/bin/env node
/**
 * Pre-render the music and sound effects with sampled instruments.
 *
 *   node tools/audio/render.mjs --only=boss-seymour,chapter-select
 *   node tools/audio/render.mjs --all
 *   node tools/audio/render.mjs --sfx
 *   node tools/audio/render.mjs --list
 *
 * The scores do not change. What changes is what plays them: instead of the
 * oscillators in src/audio/voices, every channel is resolved to a sampled
 * instrument (see src/audio/voices/presets), seated on a concert platform,
 * and mixed through a shared hall. The result is encoded to MP3 and listed in
 * public/audio/manifest.json; the game plays that when it exists and falls
 * back to the runtime synthesis when it does not.
 *
 * Flags:
 *   --only=a,b     render just these cues
 *   --all          render every cue (default when nothing else is given)
 *   --sfx          also render the sound-effect sprite
 *   --music-only   skip the sfx sprite even with --all
 *   --list         print the instrument map and exit
 *   --rate=N       render sample rate (default 44100)
 *   --out=DIR      output root (default public/audio)
 *   --wav          also keep the intermediate WAV, for close listening
 *   --audition     write auditions to docs/audio/audition/ as well
 *   --no-encode    render and measure but do not run ffmpeg
 *   --quiet        summary table only
 */

import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const FFMPEG =
  process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';

const { renderTrack } = await import('../../src/audio/render.ts');
const { getTrack, trackNames } = await import('../../src/audio/tracks/index.ts');
const { renderSfxWith, sfxNames, getSfxDesign } = await import('../../src/audio/sfx/index.ts');
const { CATEGORY_RULES } = await import('../../src/audio/sfx/design.ts');
const { pitchToFreq, effectiveJitterMs, performanceKey } = await import('../../src/audio/score.ts');
const { tempoCurveOf, tempoWarnings } = await import('../../src/audio/tempo.ts');
const { mergeIntoManifest, musicEntry, readManifest } = await import('./manifest-io.mjs');
const { Hall } = await import('../../src/audio/dsp/hall.ts');
const presets = await import('../../src/audio/voices/presets/index.ts');
const { voiceForPreset, availableLibs, missingLibs, LIBRARIES, libPath } = await import('./libs.mjs');
const { masterToTarget, limit } = await import('./master.mjs');
const { measureAll, measureMomentaryLufs, measureTruePeak, findCueBounds } = await import('./measure.mjs');

// ------------------------------------------------------------------- flags

const args = process.argv.slice(2);
const flags = new Map();
for (const arg of args) {
  if (!arg.startsWith('--')) continue;
  const [key, value] = arg.slice(2).split('=');
  flags.set(key, value ?? 'true');
}
const quiet = flags.has('quiet');
const sampleRate = Number.parseInt(flags.get('rate') ?? '44100', 10);
const outRoot = resolve(ROOT, flags.get('out') ?? 'public/audio');
const keepWav = flags.has('wav');
const audition = flags.has('audition');
const encode = !flags.has('no-encode');

/** Seconds of the loop body repeated after loopEnd, so a decoder offset lands
 *  on identical material instead of on the intro. */
const LOOP_TAIL_SEC = 3;

function log(...a) {
  if (!quiet) console.log(...a);
}

// ----------------------------------------------------------- instrument map

/**
 * Resolve every instrument a score names to a sampled voice.
 *
 * A name with no preset is a hard error rather than a silent fallback: a cue
 * that quietly kept one oscillator channel would be the one thing Bailey hears.
 */
function buildVoiceResolver() {
  const cache = new Map();
  return (name, perform) => {
    const variant = performanceKey(perform);
    const key = `${name}${variant}`;
    const hit = cache.get(key);
    if (hit) return hit;
    if (!presets.hasPreset(name)) {
      throw new Error(
        `Score names instrument "${name}", which has no sampled preset. ` +
          'Add one to src/audio/voices/presets/ (see docs/audio/PIPELINE.md).',
      );
    }
    const preset = presets.getPreset(name);
    // A channel's `perform` block overrides the preset's own humanisation for
    // this channel only — Vegnagun's machine and the Yunalesca canon need
    // <= 3 ms out of voices the rest of the score wants at 14-18.
    const presetJitter = preset.timingJitterMs ?? 0;
    const wanted = effectiveJitterMs(presetJitter, perform);
    const tuned = wanted === presetJitter ? preset : { ...preset, timingJitterMs: wanted };
    const voice = voiceForPreset(tuned, variant);
    cache.set(key, voice);
    return voice;
  };
}

/** Seat each channel by its instrument's preset, overriding the composer's pan. */
function buildSpatialiser() {
  return (channel) => {
    if (!presets.hasPreset(channel.instrument)) return undefined;
    const preset = presets.getPreset(channel.instrument);
    const seat = presets.seatOf(preset.seat);
    // Keep a little of the composer's own panning: they may have split two
    // channels of the same instrument deliberately (two guitar tracks, two
    // harp lines). The seat decides the section's place; the score nudges.
    const composed = channel.pan ?? 0;
    return {
      pan: Math.max(-1, Math.min(1, seat.pan * 0.78 + composed * 0.35)),
      reverb: presets.sendOf(seat),
    };
  };
}

function listInstruments() {
  const used = new Set();
  for (const name of trackNames()) {
    for (const ch of getTrack(name).channels) used.add(ch.instrument);
  }
  const rows = [];
  for (const group of Object.keys(presets.PRESET_GROUPS)) {
    for (const [name, preset] of Object.entries(presets.PRESET_GROUPS[group])) {
      rows.push({ group, name, seat: preset.seat, used: used.has(name), about: preset.about });
    }
  }
  rows.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  console.log('\nSampled instruments an arranger can name in a score channel:\n');
  let group = '';
  for (const r of rows) {
    if (r.group !== group) {
      group = r.group;
      console.log(`  ${group}  (src/audio/voices/presets/${group}.ts)`);
    }
    console.log(
      `    ${r.used ? '*' : ' '} ${r.name.padEnd(16)} ${r.seat.padEnd(14)} ${r.about}`,
    );
  }
  console.log('\n  * = already used by a score.\n');
  const caveats = presets.presetCaveats();
  if (caveats.length > 0) {
    console.log('Honest caveats:\n');
    for (const c of caveats) console.log(`  ${c.name}: ${c.caveat}`);
    console.log('');
  }
  const missing = [...used].filter((n) => !presets.hasPreset(n));
  if (missing.length > 0) console.log(`UNMAPPED score instruments: ${missing.join(', ')}\n`);
  console.log(`Libraries found: ${availableLibs().join(', ') || '(none)'}`);
  for (const lib of missingLibs()) {
    console.log(`  MISSING ${lib} — expected under ${LIBRARIES[lib].dir}/; see docs/audio/CREDITS.md`);
  }
}

// ----------------------------------------------------------------- encoding

/** 32-bit float WAV — lossless handoff to ffmpeg, no quantisation of our own. */
function encodeWavF32(left, right, rate) {
  const frames = Math.min(left.length, right.length);
  const dataBytes = frames * 8;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20); // IEEE float
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 8, 28);
  buffer.writeUInt16LE(8, 32);
  buffer.writeUInt16LE(32, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  let at = 44;
  for (let i = 0; i < frames; i++) {
    buffer.writeFloatLE(left[i] ?? 0, at);
    buffer.writeFloatLE(right[i] ?? 0, at + 4);
    at += 8;
  }
  return buffer;
}

/**
 * MP3 VBR at roughly 128 kbps. MP3 rather than Ogg or AAC because it is the
 * one lossy format every browser decodes, iOS Safari included, and LAME
 * writes the gapless header that makes `loopStart`/`loopEnd` land accurately
 * after `decodeAudioData`.
 */
async function toMp3(wavPath, mp3Path, quality = '5') {
  await run(FFMPEG, [
    '-y',
    '-loglevel', 'error',
    '-i', wavPath,
    '-codec:a', 'libmp3lame',
    '-q:a', quality,
    '-ar', String(sampleRate),
    '-ac', '2',
    mp3Path,
  ]);
}

// ------------------------------------------------------------------- render

function hallFor() {
  // One room for everything. Per-instrument distance is already handled by the
  // seating sends, so the hall itself is constant — which is precisely what
  // makes the cues sound like one orchestra in one place.
  return (bus, rate) =>
    new Hall(rate, {
      rt60: 2.2,
      hfDamping: 2.8,
      preDelay: 0.019,
      width: 0.95,
      earlyLevel: 0.55,
      lowCutHz: 95,
    }).render(bus);
}

async function renderCue(name, resolver, spatialiser) {
  const started = Date.now();
  const track = getTrack(name);
  const rendered = renderTrack(track, sampleRate, {
    voiceFor: resolver,
    spatialise: spatialiser,
    reverbRender: hallFor(),
    master: (mix, rate) => {
      lastMaster = masterToTarget(mix, rate, { targetLufs: -16, ceilingDbtp: -1 });
    },
  });

  // Loop-tail scheme: intro + loop body + the first few seconds of the loop
  // body again. `renderTrack` has already folded the reverb tail back into
  // the loop region, so [loopStart, loopEnd) is seamless; repeating its head
  // after loopEnd means any constant decoder offset lands on the same music.
  const loopStart = rendered.loopStartSample;
  const loopEnd = rendered.loopEndSample;
  const tailLen = Math.min(Math.round(LOOP_TAIL_SEC * sampleRate), loopEnd - loopStart);
  const total = loopEnd + tailLen;
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  left.set(rendered.left.subarray(0, loopEnd));
  right.set(rendered.right.subarray(0, loopEnd));
  left.set(rendered.left.subarray(loopStart, loopStart + tailLen), loopEnd);
  right.set(rendered.right.subarray(loopStart, loopStart + tailLen), loopEnd);

  const measured = measureAll(left, right, sampleRate, loopStart, loopEnd);
  const curve = tempoCurveOf(track);
  return {
    name,
    left,
    right,
    loopStart,
    loopEnd,
    total,
    measured,
    master: lastMaster,
    noteCount: rendered.noteCount,
    tempo: curve.hasMap
      ? {
          marks: curve.marks,
          warnings: tempoWarnings(track),
          loopSec: curve.secondsAt(track.loop.end) - curve.secondsAt(track.loop.start),
        }
      : null,
    renderMs: Date.now() - started,
  };
}

let lastMaster = null;

async function writeCue(cue) {
  const musicDir = join(outRoot, 'music');
  await mkdir(musicDir, { recursive: true });
  const wavPath = join(musicDir, `${cue.name}.wav`);
  const mp3Path = join(musicDir, `${cue.name}.mp3`);
  await writeFile(wavPath, encodeWavF32(cue.left, cue.right, sampleRate));
  let bytes = 0;
  if (encode) {
    await toMp3(wavPath, mp3Path);
    bytes = (await readFile(mp3Path)).length;
    if (audition) {
      const audDir = resolve(ROOT, 'docs/audio/audition');
      await mkdir(audDir, { recursive: true });
      await writeFile(join(audDir, `${cue.name}.mp3`), await readFile(mp3Path));
    }
    if (!keepWav) await rm(wavPath, { force: true });
  }
  return { mp3Path, bytes };
}

// ---------------------------------------------------------------- sfx sprite

/**
 * The sampled note renderer for sound design.
 *
 * A design's `note` layers name instruments — celesta, tam-tam, choir-ooh,
 * cello-solo — and this is where they become recordings instead of
 * oscillators. It is the same resolution the music uses, so a sword hit and
 * the strings behind it come off the same platform.
 */
function buildSfxNoteRenderer() {
  const cache = new Map();
  return (rate, instrument, pitch, dur, velocity, seed) => {
    let voice = cache.get(instrument);
    if (!voice) {
      if (!presets.hasPreset(instrument)) {
        throw new Error(
          `An SFX design names instrument "${instrument}", which has no sampled preset. ` +
            'Add one to src/audio/voices/presets/ (see docs/audio/PIPELINE.md).',
        );
      }
      voice = voiceForPreset(presets.getPreset(instrument));
      cache.set(instrument, voice);
    }
    return voice({ sampleRate: rate, freq: pitchToFreq(pitch), dur, velocity, seed });
  };
}

/** Scale a buffer in place. */
function scale(buf, gain) {
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] *= gain;
    buf.right[i] *= gain;
  }
}

/**
 * Trim, level and peak-guard one effect.
 *
 * Levelling is per *category*, not per cue: a cursor tick belongs 8 dB under a
 * sword and 10 under a summon, and the categories in `src/audio/sfx/design.ts`
 * are where that judgement lives. Levelling each cue to one number instead
 * would flatten the whole bank into a wall, which is the loudest possible way
 * to sound cheap.
 */
function finishSfxCue(name, buf) {
  const design = getSfxDesign(name);
  const rule = CATEGORY_RULES[design.category];

  const bounds = findCueBounds(buf.left, buf.right);
  const trimmed = {
    left: buf.left.subarray(bounds.start, bounds.end),
    right: buf.right.subarray(bounds.start, bounds.end),
  };

  const measured = measureMomentaryLufs(trimmed.left, trimmed.right, sampleRate);
  if (Number.isFinite(measured)) {
    // Clamped: a design that needs more than 12 dB of correction is a design
    // problem, and silently fixing it here would hide it.
    const db = Math.max(-12, Math.min(12, rule.lufs - measured));
    scale(trimmed, Math.pow(10, db / 20));
  }

  // Effects sit under the music: -1 dBTP is the codec ceiling, and the sprite
  // as a whole is quieter than that anyway.
  const peakDb = measureTruePeak(trimmed.left, trimmed.right);
  if (peakDb > -1) scale(trimmed, Math.pow(10, (-1 - peakDb) / 20));

  return {
    buf: trimmed,
    category: design.category,
    lufs: Number(measureMomentaryLufs(trimmed.left, trimmed.right, sampleRate).toFixed(2)),
    truePeakDb: Number(measureTruePeak(trimmed.left, trimmed.right).toFixed(2)),
  };
}

/**
 * The audition order: the twenty-five cues worth listening to first, grouped
 * the way a listener meets them — the interface, then a fight, then magic,
 * then the big moments, then the places.
 */
const SFX_TOUR = [
  'cursor-move', 'confirm', 'cancel', 'error', 'menu-open',
  'turn-ready', 'battle-start', 'slash-light', 'slash-heavy', 'hit-1',
  'guard', 'critical', 'ko-fall', 'ball-hit', 'gunshot',
  'cure', 'fire-3', 'ice-3', 'thunder', 'holy-2',
  'summon', 'overdrive-full', 'victory-fanfare', 'dissolve-pyreflies', 'fayth-hum',
];

/** One file with the tour in it, 0.7 s of hall between cues. */
async function writeTour(parts, audDir) {
  const byName = new Map(parts.map((p) => [p.name, p]));
  const gap = Math.round(0.7 * sampleRate);
  const chosen = SFX_TOUR.map((name) => byName.get(name)).filter(Boolean);
  const total = chosen.reduce((a, p) => a + p.buf.left.length + gap, gap);
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  let at = gap;
  for (const part of chosen) {
    left.set(part.buf.left, at);
    right.set(part.buf.right, at);
    at += part.buf.left.length + gap;
  }
  const wav = join(audDir, '_tour.wav');
  await writeFile(wav, encodeWavF32(left, right, sampleRate));
  await toMp3(wav, join(audDir, '_tour.mp3'), '4');
  await rm(wav, { force: true });
  log(`      audition tour: ${chosen.length} cues, ${fmtSec(total / sampleRate)}`);
}

/**
 * One sprite instead of ~150 tiny files: a hundred and fifty HTTP requests is
 * worse than one 2 MB download, and LAME's gapless header means a cue's
 * offset into the decoded buffer is accurate enough to play with
 * `start(when, offset, duration)`.
 */
async function renderSfxSprite() {
  const names = sfxNames();
  const note = buildSfxNoteRenderer();
  const gap = Math.round(0.05 * sampleRate);
  const parts = [];
  let total = Math.round(0.05 * sampleRate);
  for (const name of names) {
    const rendered = finishSfxCue(name, renderSfxWith(name, sampleRate, note));
    parts.push({ name, ...rendered });
    total += rendered.buf.left.length + gap;
  }
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  const entries = {};
  let at = Math.round(0.05 * sampleRate);
  for (const part of parts) {
    left.set(part.buf.left, at);
    right.set(part.buf.right, at);
    entries[part.name] = {
      offset: Number((at / sampleRate).toFixed(4)),
      duration: Number((part.buf.left.length / sampleRate).toFixed(4)),
      category: part.category,
      lufs: part.lufs,
      truePeakDb: part.truePeakDb,
    };
    at += part.buf.left.length + gap;
  }

  // No bus compression and no second normalisation: the cues are already
  // levelled against each other by category, and squeezing the sprite as one
  // programme would undo exactly that. All the master does is hold the ceiling.
  //
  // Held 0.4 dB under it, for the same reason `masterToTarget` does on the
  // music path: the ceiling has to survive the encoder, not the WAV. Limiting
  // to exactly -1 dB shipped a sprite that decoded at -0.80 dBTP, because MDCT
  // quantisation overshoots whatever it is handed.
  limit({ left, right }, sampleRate, Math.pow(10, -1.4 / 20));

  const sfxDir = join(outRoot, 'sfx');
  await mkdir(sfxDir, { recursive: true });
  const wavPath = join(sfxDir, 'sprite.wav');
  const mp3Path = join(sfxDir, 'sprite.mp3');
  await writeFile(wavPath, encodeWavF32(left, right, sampleRate));
  let bytes = 0;
  if (encode) {
    await toMp3(wavPath, mp3Path, '6');
    bytes = (await readFile(mp3Path)).length;
    if (!keepWav) await rm(wavPath, { force: true });
  }

  // Auditions: individual files, because nobody can judge a menu tick by
  // scrubbing to 41.7 s in a four-minute sprite — plus one guided tour, in the
  // order someone would actually want to hear the bank.
  if (audition && encode) {
    const audDir = resolve(ROOT, 'docs/audio/audition/sfx');
    await mkdir(audDir, { recursive: true });
    for (const part of parts) {
      const oneWav = join(audDir, `${part.name}.wav`);
      await writeFile(oneWav, encodeWavF32(part.buf.left, part.buf.right, sampleRate));
      await toMp3(oneWav, join(audDir, `${part.name}.mp3`), '4');
      await rm(oneWav, { force: true });
    }
    await writeTour(parts, audDir);
  }

  return { entries, bytes, count: names.length, seconds: total / sampleRate, parts };
}

// ----------------------------------------------------------------------- main

function fmtSec(s) {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
}

async function main() {
  if (flags.has('list')) {
    listInstruments();
    return;
  }

  const missing = missingLibs();
  if (missing.length > 0) {
    console.error(
      `Missing sample libraries: ${missing.join(', ')}.\n` +
        'They live outside the repo and are never committed — see docs/audio/CREDITS.md ' +
        'for what to download and from where.',
    );
    process.exit(1);
  }
  if (encode && !existsSync(FFMPEG)) {
    console.error(`ffmpeg not found at ${FFMPEG} (override with PYREFLY_FFMPEG).`);
    process.exit(1);
  }

  const only = flags.get('only');
  const wantSfx = flags.has('sfx') || (flags.has('all') && !flags.has('music-only'));
  // `--sfx` on its own means the effects and nothing else: re-rendering twenty
  // minutes of music to change a menu tick is how another agent's half-written
  // cue ends up in public/audio.
  const sfxOnly = flags.has('sfx') && !flags.has('all') && !only;
  const wantMusic = only
    ? only.split(',').map((s) => s.trim()).filter(Boolean)
    : sfxOnly
      ? []
      : trackNames();

  for (const name of wantMusic) {
    if (!trackNames().includes(name)) {
      console.error(`Unknown cue "${name}". Known: ${trackNames().join(', ')}`);
      process.exit(1);
    }
  }

  log(`Libraries: ${availableLibs().map((l) => `${l} (${LIBRARIES[l].licence})`).join(', ')}`);
  for (const lib of availableLibs()) log(`  ${lib}: ${libPath(lib)}`);
  log('');

  const resolver = buildVoiceResolver();
  const spatialiser = buildSpatialiser();
  let manifest = await readManifest(outRoot);

  const rows = [];
  let failures = 0;

  for (const name of wantMusic) {
    process.stdout.write(quiet ? '' : `  rendering ${name} ... `);
    const cue = await renderCue(name, resolver, spatialiser);
    const { bytes } = await writeCue(cue);
    const m = cue.measured;
    // Merged into whatever is on disk *now*, under a lock, one cue at a time.
    // Another agent may have finished three cues while this one rendered, and
    // holding a six-minute-old snapshot in memory is precisely how their
    // entries used to disappear. See tools/audio/manifest-io.mjs.
    manifest = await mergeIntoManifest(outRoot, {
      sampleRate,
      music: {
        [name]: musicEntry({
          name,
          loopStartSample: cue.loopStart,
          loopEndSample: cue.loopEnd,
          totalSamples: cue.total,
          sampleRate,
          bytes,
          lufs: m.lufs,
          truePeakDb: m.truePeakDb,
        }),
      },
    });
    const problems = [];
    if (Math.abs(m.lufs + 16) > 2) problems.push(`LUFS ${m.lufs.toFixed(1)}`);
    if (m.truePeakDb > -1) problems.push(`peak ${m.truePeakDb.toFixed(2)} dBTP`);
    if (!m.seam.ok) problems.push('seam');
    if (!m.balance.ok) problems.push('spectrum');
    if (problems.length > 0) failures++;
    rows.push({ name, cue, bytes, problems });
    log(
      `${(cue.renderMs / 1000).toFixed(1)}s  ${fmtSec(cue.total / sampleRate)}  ` +
        `${(bytes / 1e6).toFixed(2)} MB  ${m.lufs.toFixed(1)} LUFS  ` +
        `${m.truePeakDb.toFixed(2)} dBTP  ${problems.length ? `<< ${problems.join(', ')}` : 'ok'}`,
    );
    if (!m.balance.ok && !quiet) {
      for (const p of m.balance.problems) log(`      spectrum: ${p}`);
    }
    if (!m.seam.ok && !quiet) {
      log(`      seam: step ${m.seam.step.toFixed(5)} > allowed ${m.seam.allowed.toFixed(5)}`);
    }
    // A cue with a tempo map: say what the map does, because the loop length
    // is no longer "beats times 60 over bpm" and nobody can hear it from here.
    if (cue.tempo && !quiet) {
      log(
        `      tempo: ${cue.tempo.marks
          .map((mark) => `${mark.label ?? 'tempo'}@${mark.beat}→${mark.bpm.toFixed(0)}` +
            (mark.holdSec ? ` +${mark.holdSec}s` : ''))
          .join('  ')}`,
      );
      log(`      tempo: loop body ${cue.tempo.loopSec.toFixed(3)} s through the map`);
      for (const warning of cue.tempo.warnings) console.error(`  ${name}: tempo map — ${warning}`);
    }
  }

  if (wantSfx) {
    process.stdout.write(quiet ? '' : '  rendering sfx sprite ... ');
    const sprite = await renderSfxSprite();
    manifest = await mergeIntoManifest(outRoot, {
      sampleRate,
      sfx: {
        file: 'sfx/sprite.mp3',
        bytes: sprite.bytes,
        duration: Number(sprite.seconds.toFixed(4)),
        cues: sprite.entries,
      },
    });
    log(`${sprite.count} cues, ${fmtSec(sprite.seconds)}, ${(sprite.bytes / 1e6).toFixed(2)} MB`);

    // Per-category levels: the one number that says whether the bank is
    // balanced, and the one a listener notices when it is not.
    const byCategory = new Map();
    for (const part of sprite.parts) {
      if (!byCategory.has(part.category)) byCategory.set(part.category, []);
      byCategory.get(part.category).push(part);
    }
    for (const [category, cues] of [...byCategory].sort()) {
      const target = CATEGORY_RULES[category].lufs;
      const levels = cues.map((c) => c.lufs).filter(Number.isFinite);
      const mean = levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length);
      const worst = cues.reduce((a, b) => (Math.abs(b.lufs - target) > Math.abs(a.lufs - target) ? b : a));
      log(
        `      ${category.padEnd(9)} ${String(cues.length).padStart(3)} cues  ` +
          `mean ${mean.toFixed(1)} LUFS (target ${target})  worst ${worst.name} ${worst.lufs.toFixed(1)}`,
      );
      if (Math.abs(worst.lufs - target) > 3) {
        console.error(
          `SFX "${worst.name}" measures ${worst.lufs.toFixed(1)} LUFS against a ${target} target ` +
            'for its category — the design needs more or less in it, not a gain change.',
        );
        failures++;
      }
    }
    const hotPeak = sprite.parts.filter((p) => p.truePeakDb > -1);
    if (hotPeak.length > 0) {
      console.error(`SFX over -1 dBTP: ${hotPeak.map((p) => p.name).join(', ')}`);
      failures++;
    }
    if (sprite.bytes > 3.5e6) {
      console.error(`SFX sprite is ${(sprite.bytes / 1e6).toFixed(2)} MB, over the 3.5 MB budget.`);
      failures++;
    }
  }

  // Nothing to save here: every entry was merged under the lock as it was
  // rendered, so a crash half way through leaves the cues that did finish
  // listed and correct rather than losing the lot.
  const totalBytes =
    Object.values(manifest.music).reduce((a, m) => a + (m.bytes ?? 0), 0) +
    (manifest.sfx?.bytes ?? 0);
  log('');
  log(`manifest: ${Object.keys(manifest.music).length} cues${manifest.sfx ? ' + sfx sprite' : ''}`);
  log(`shipped audio total: ${(totalBytes / 1e6).toFixed(1)} MB`);
  if (totalBytes > 60e6) {
    console.error(`Shipped audio is ${(totalBytes / 1e6).toFixed(1)} MB, over the 60 MB budget.`);
    process.exit(1);
  }
  if (failures > 0) {
    console.error(`${failures} cue(s) failed a measurement check.`);
    process.exit(1);
  }
}

await main();
