#!/usr/bin/env node
/**
 * Render the original music tracks (and the SFX demo montage) to 16-bit PCM
 * stereo WAV files so an agent — or a human — can listen to the work.
 *
 *   node tools/render-track.mjs all --out=docs/audio/
 *   node tools/render-track.mjs title --rate=44100
 *   node tools/render-track.mjs sfx-demo
 *
 * Node 22.18+/24 strips TypeScript types on import, so this .mjs loads the
 * audio modules directly. On older Node add --experimental-strip-types:
 *
 *   node --experimental-strip-types tools/render-track.mjs all
 *
 * Flags:
 *   --out=DIR      output directory (default docs/audio/)
 *   --rate=N       sample rate (default 44100, auto-halved to fit --max-mb)
 *   --max-mb=N     size ceiling per file before falling back to 22050 (default 15)
 *   --peak=N       master peak target, must stay under 0.95 (default 0.89)
 *   --seconds=N    montage length for sfx-demo (default 3)
 *   --quiet        only print the summary table
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const { renderTrack } = await import('../src/audio/render.ts');
const { TRACKS, getTrack, trackNames } = await import('../src/audio/tracks/index.ts');
const { renderMontage, MONTAGE } = await import('../src/audio/sfx/index.ts');

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags.set(key, value ?? 'true');
  } else {
    positional.push(arg);
  }
}

const target = positional[0] ?? 'all';
const outDir = resolve(ROOT, flags.get('out') ?? 'docs/audio/');
const requestedRate = Number.parseInt(flags.get('rate') ?? '44100', 10);
const maxMb = Number.parseFloat(flags.get('max-mb') ?? '15');
const peakTarget = Number.parseFloat(flags.get('peak') ?? '0.89');
const montageSeconds = Number.parseFloat(flags.get('seconds') ?? '3');
const quiet = flags.has('quiet');

if (peakTarget >= 0.95) {
  console.error(`--peak must stay under 0.95 (got ${peakTarget})`);
  process.exit(1);
}

/** 16-bit PCM stereo WAV, with a smpl chunk carrying the loop points. */
function encodeWav(left, right, sampleRate, loop) {
  const frames = Math.min(left.length, right.length);
  const dataBytes = frames * 4;
  const hasLoop = loop && loop.end > loop.start;
  const smplBytes = hasLoop ? 8 + 36 + 24 : 0;
  const buffer = Buffer.alloc(44 + dataBytes + smplBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes + smplBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    buffer.writeInt16LE(toPcm16(left[i]), offset);
    buffer.writeInt16LE(toPcm16(right[i]), offset + 2);
    offset += 4;
  }
  if (hasLoop) {
    buffer.write('smpl', offset);
    buffer.writeUInt32LE(36 + 24, offset + 4);
    const smpl = offset + 8;
    buffer.writeUInt32LE(0, smpl); // manufacturer
    buffer.writeUInt32LE(0, smpl + 4); // product
    buffer.writeUInt32LE(Math.round(1e9 / sampleRate), smpl + 8); // sample period (ns)
    buffer.writeUInt32LE(60, smpl + 12); // MIDI unity note
    buffer.writeUInt32LE(0, smpl + 16); // pitch fraction
    buffer.writeUInt32LE(0, smpl + 20); // SMPTE format
    buffer.writeUInt32LE(0, smpl + 24); // SMPTE offset
    buffer.writeUInt32LE(1, smpl + 28); // loop count
    buffer.writeUInt32LE(0, smpl + 32); // sampler data
    const lp = smpl + 36;
    buffer.writeUInt32LE(0, lp); // cue id
    buffer.writeUInt32LE(0, lp + 4); // type: forward
    buffer.writeUInt32LE(loop.start, lp + 8);
    buffer.writeUInt32LE(loop.end, lp + 12);
    buffer.writeUInt32LE(0, lp + 16); // fraction
    buffer.writeUInt32LE(0, lp + 20); // play count: infinite
  }
  return buffer;
}

function toPcm16(sample) {
  const clamped = Math.max(-1, Math.min(1, sample ?? 0));
  return Math.round(clamped * 32767);
}

function stats(left, right) {
  let peak = 0;
  let sum = 0;
  let finite = true;
  for (let i = 0; i < left.length; i++) {
    const l = left[i];
    const r = right[i];
    if (!Number.isFinite(l) || !Number.isFinite(r)) finite = false;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    sum += l * l + r * r;
  }
  return { peak, rms: Math.sqrt(sum / Math.max(1, left.length * 2)), finite };
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

function pickRate(track) {
  if (requestedRate <= 22050) return requestedRate;
  const seconds = (track.length * 60) / track.bpm + (track.tailSec ?? 3);
  const megabytes = (seconds * requestedRate * 4) / (1024 * 1024);
  if (megabytes <= maxMb) return requestedRate;
  if (!quiet) {
    console.log(
      `  ${track.name}: ${megabytes.toFixed(1)} MB at ${requestedRate} Hz exceeds ${maxMb} MB — rendering the preview at 22050 Hz`,
    );
  }
  return 22050;
}

async function renderOne(name) {
  const track = getTrack(name);
  const rate = pickRate(track);
  const rendered = renderTrack(track, rate, { targetPeak: peakTarget });
  const measured = stats(rendered.left, rendered.right);
  const wav = encodeWav(rendered.left, rendered.right, rate, {
    start: rendered.loopStartSample,
    end: rendered.loopEndSample,
  });
  const file = join(outDir, `${name}.wav`);
  await writeFile(file, wav);
  return {
    name,
    file,
    rate,
    seconds: rendered.durationSec,
    loop: `${fmtTime(rendered.loopStartSample / rate)} → ${fmtTime(rendered.loopEndSample / rate)}`,
    loopSeconds: rendered.loopDurationSec,
    peak: measured.peak,
    rms: measured.rms,
    finite: measured.finite,
    notes: rendered.noteCount,
    renderMs: rendered.renderMs,
    bytes: wav.length,
  };
}

async function renderMontageFile() {
  const rate = Math.min(requestedRate, 44100);
  const started = Date.now();
  const buf = renderMontage(rate, montageSeconds);
  const measured = stats(buf.left, buf.right);
  const scale = measured.peak > 0 ? peakTarget / measured.peak : 1;
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] *= scale;
    buf.right[i] *= scale;
  }
  const after = stats(buf.left, buf.right);
  const wav = encodeWav(buf.left, buf.right, rate, null);
  const file = join(outDir, 'sfx-demo.wav');
  await writeFile(file, wav);
  return {
    name: 'sfx-demo',
    file,
    rate,
    seconds: buf.left.length / rate,
    loop: `${MONTAGE.length} cues`,
    loopSeconds: 0,
    peak: after.peak,
    rms: after.rms,
    finite: after.finite,
    notes: MONTAGE.length,
    renderMs: Date.now() - started,
    bytes: wav.length,
  };
}

const names =
  target === 'all'
    ? [...trackNames(), 'sfx-demo']
    : target === 'sfx-demo'
      ? ['sfx-demo']
      : [target];

for (const name of names) {
  if (name !== 'sfx-demo' && !TRACKS[name]) {
    console.error(`Unknown track "${name}". Known: ${[...trackNames(), 'sfx-demo'].join(', ')}`);
    process.exit(1);
  }
}

await mkdir(outDir, { recursive: true });

const results = [];
for (const name of names) {
  if (!quiet) console.log(`rendering ${name}…`);
  results.push(name === 'sfx-demo' ? await renderMontageFile() : await renderOne(name));
}

let failed = false;
console.log('');
console.log('  track          rate    length    loop                 peak    rms    notes   size    render');
console.log('  ' + '-'.repeat(100));
for (const r of results) {
  const size = `${(r.bytes / (1024 * 1024)).toFixed(1)}MB`;
  console.log(
    `  ${r.name.padEnd(14)} ${String(r.rate).padEnd(7)} ${fmtTime(r.seconds).padEnd(9)} ${r.loop.padEnd(20)} ` +
      `${r.peak.toFixed(3).padEnd(7)} ${r.rms.toFixed(3).padEnd(6)} ${String(r.notes).padEnd(7)} ${size.padEnd(7)} ${r.renderMs}ms`,
  );
  if (!r.finite) {
    console.error(`  !! ${r.name} contains non-finite samples`);
    failed = true;
  }
  if (r.peak >= 0.95) {
    console.error(`  !! ${r.name} peaks at ${r.peak.toFixed(3)} — clipping risk`);
    failed = true;
  }
  if (r.bytes > maxMb * 1024 * 1024) {
    console.error(`  !! ${r.name} is ${(r.bytes / 1048576).toFixed(1)} MB, over the ${maxMb} MB budget`);
    failed = true;
  }
}
console.log('');
for (const r of results) console.log(`  wrote ${relative(ROOT, r.file).replaceAll('\\', '/')}`);

process.exit(failed ? 1 : 0);
