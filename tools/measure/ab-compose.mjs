// The A/B clip factory's composer (T-04 of the motion-fluidity pass, lane L5; both games, tooling): captured frames and channels in, a phone card out. CPU only: sharp and ffmpeg, no browser, no lock.
//
//   composeCard({ spec, workDir, outDir, ffmpeg })
//
// `spec` is the card (tools/ab-clip.mjs documents it); `workDir/<variant id>-<hz>/` holds one capture: `rec.json` ({ meta, frames, events, t0, shots: { first, last } }, the channels of tools/measure/channels.mjs) and
// `frames/f<index>.jpg` (the viewport, one per frame of the window). For each capture rate the card gets, in `outDir`:
//   AB-<chapter>-<move>-<hz>.mp4          the variants stacked A over B (720 x 810), 60 fps (or the capture's rate if lower), H.264 CRF 20 stepped up until it is under 8 MB, 8 s at most
//   AB-<chapter>-<move>-<hz>-slow4x.mp4   the same at a quarter speed (every frame of the capture at hz / 4 fps), for captures faster than 60 Hz
//   AB-<chapter>-<move>-<hz>-card.jpg     1080 px wide still: the card's title, the question, the 12-frame strip (A rows over B rows, each frame stamped with its index and ms) and the numbers
//   AB-<chapter>-<move>-<hz>-trace.png    the speed trace (px per 60 Hz frame at the viewport's scale) of the focus actor, A against B, for curve items
//   KEY.json, numbers.json, README.txt    which letter is which variant (blind: seeded by the card id, never in the picture), the per-variant numbers, how to read the card
// Every variant is cropped to the SAME region (the union of the focus actors' tracked points over every variant's window, widened to 16:9, never under 960 x 540 at 2560 wide).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { BUDGET, CARD, PANEL, STILL_W, blindOrder, clipFps, clipName, cropRegion, nearestFrame, nextCrf, speedTrace, trackPoints, windowOf } from '../../critic/runner/lib/ab-pure.mjs';
import { joltTally, joltsOfRecording } from '../../critic/runner/lib/hz-pure.mjs';

export const FFMPEG = process.env.FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const pad = (n, w = 5) => String(n).padStart(w, '0');
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const r1 = (x) => Math.round(x * 10) / 10;

let sharpMod = null;
export async function sharp(root) {
  if (!sharpMod) sharpMod = createRequire(path.join(root, 'package.json'))('sharp');
  return sharpMod;
}

export const badge = (letter, w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="12" y="12" width="${Math.round(h * 0.15)}" height="${Math.round(h * 0.15)}" rx="12" fill="rgba(10,14,28,0.82)" stroke="#e8c76a" stroke-width="3"/><text x="${12 + Math.round(h * 0.075)}" y="${12 + Math.round(h * 0.115)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(h * 0.11)}" font-weight="800" fill="#f5deb0">${esc(letter)}</text></svg>`);
export const stamp = (text, w, h, hot) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="rgba(0,0,0,0.62)"/><text x="6" y="${Math.round(h * 0.76)}" font-family="Consolas, monospace" font-size="${Math.round(h * 0.62)}" font-weight="700" fill="${hot ? '#ffd24a' : '#ffffff'}">${esc(text)}</text></svg>`);

/** Run ffmpeg; throws with its stderr's tail on a non-zero exit. */
export function ffmpeg(args, bin = FFMPEG, cwd = undefined) {
  const r = spawnSync(bin, ['-y', '-loglevel', 'error', ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024, cwd });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.slice(0, 6).join(' ')} ... failed: ${String(r.stderr).slice(-1500)}`);
}

/** Encode a numbered image sequence (`dir/%05d.jpg`) to H.264 yuv420p; steps the CRF up until the file fits the budget; returns { file, bytes, crf, seconds }. */
export function encodeSequence({ dir, fps, out, bin = FFMPEG, budget = BUDGET, maxFrames }) {
  let crf = budget.crf;
  for (;;) {
    ffmpeg(['-framerate', String(fps), '-i', path.join(dir, '%05d.jpg'), ...(maxFrames ? ['-frames:v', String(maxFrames)] : []), '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(crf), '-preset', 'medium', '-movflags', '+faststart', out], bin); // JPEG frames are full range: convert to the limited range phones expect
    const bytes = fs.statSync(out).size;
    const next = nextCrf(crf, bytes, budget);
    if (next === null) return { file: out, bytes, crf, over: bytes > budget.maxBytes };
    crf = next;
  }
}

function loadCapture(workDir, variant, hz) {
  const dir = path.join(workDir, `${variant.id}-${hz}`);
  const rec = JSON.parse(fs.readFileSync(path.join(dir, 'rec.json'), 'utf8'));
  return { variant, dir, rec, frames: rec.frames, events: rec.events ?? [], t0: rec.t0 ?? rec.meta?.t0 ?? 0 };
}

/** The frame (index) of the alignment instant in one capture: the moment's start by default, or the nth log event of a type. */
function anchorFrame(cap, align) {
  if (align?.kind === 'event') {
    const ev = cap.events.filter((e) => e.type === align.type && (!align.actor || e.actorId === align.actor || e.targetId === align.actor))[(align.ordinal ?? 1) - 1];
    if (ev) return ev.f;
  }
  const i = cap.frames.findIndex((f) => f.vt >= cap.t0);
  return i < 0 ? 0 : i;
}

/** One panel: the frame's crop at `size`, the letter badge and the stamp (the frame's offset from the anchor and its ms; sized for a clip panel or a strip cell). */
async function panel(S, cap, idx, crop, letter, hz, anchor, size = PANEL) {
  const file = path.join(cap.dir, 'frames', `f${pad(idx)}.jpg`);
  if (!fs.existsSync(file)) return null;
  const f = cap.frames[idx];
  const rel = f ? r1(f.vt - cap.frames[anchor].vt) : 0;
  const big = size.w >= 400;
  const sw = Math.min(size.w - 4, big ? 190 : 150), sh = big ? 22 : 18;
  return S(file).extract({ left: crop.x, top: crop.y, width: crop.w, height: crop.h }).resize(size.w, size.h).composite([
    { input: badge(letter, size.w, size.h), top: 0, left: 0 },
    { input: stamp(`${rel >= 0 ? '+' : ''}${Math.round((rel * 60) / 1000)}f  ${rel >= 0 ? '+' : ''}${rel} ms`, sw, sh, false), top: size.h - sh, left: size.w - sw }, // the offset in 60 Hz frames, whatever the capture rate, and in ms
  ]).jpeg({ quality: 88 }).toBuffer();
}

/**
 * The 1080 px wide still: a title band with the question, then each variant's frames as two rows of six cells (12 consecutive 60 Hz frames), then a footer. `rows` is [{ letter, cells: Buffer[] }] (cells already
 * at `cellW` x `cellH`, letter and stamp on them). Returns { width, height }.
 */
export async function writeStill({ S, file, title, subtitle, rows, cellW, cellH, foot = '12 consecutive 60 Hz frames per row pair; each frame stamped with its offset from the anchor in 60 Hz frames and in milliseconds. Letters only: the key is not in the picture.' }) {
  const cardH = 70 + rows.length * 2 * (cellH + 4) + 20 + 70;
  const comps = [];
  rows.forEach((r, ri) => r.cells.forEach((c, k) => comps.push({ input: c, left: (k % 6) * cellW, top: 70 + (ri * 2 + Math.floor(k / 6)) * (cellH + 4) })));
  const band = (h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${STILL_W}" height="${h}"><rect width="${STILL_W}" height="${h}" fill="#101624"/>${body}</svg>`);
  const fit = (text, size) => Math.max(10, Math.min(size, Math.floor((STILL_W - 32) / (Math.max(1, text.length) * 0.56)))); // a long title shrinks to the card's width instead of running off it
  const head = band(70, `<text x="16" y="30" font-family="Arial, sans-serif" font-size="${fit(title, 22)}" font-weight="700" fill="#f5deb0">${esc(title)}</text><text x="16" y="56" font-family="Arial, sans-serif" font-size="${fit(subtitle, 16)}" fill="#cfd6e6">${esc(subtitle)}</text>`);
  const tail = band(70, `<text x="16" y="28" font-family="Arial, sans-serif" font-size="${fit(foot, 15)}" fill="#cfd6e6">${esc(foot)}</text>`);
  await S({ create: { width: STILL_W, height: cardH, channels: 3, background: '#0b0f1a' } }).composite([{ input: head, left: 0, top: 0 }, ...comps, { input: tail, left: 0, top: cardH - 70 }]).jpeg({ quality: 88 }).toFile(file);
  return { width: STILL_W, height: cardH };
}

/**
 * Compose one rate of a card: every variant stacked in a blind order, with its crop, stamps, strip, trace and numbers.
 * @returns {Promise<object>} what was written
 */
async function composeRate({ spec, workDir, outDir, ffmpegBin, S, hz }) {
  const caps = spec.variants.map((v) => loadCapture(workDir, v, hz));
  const { order, key } = blindOrder(spec.variants, spec.seed ?? spec.id);
  const byId = Object.fromEntries(caps.map((c) => [c.variant.id, c]));
  const lead = spec.leadMs ?? 500, settle = spec.settleMs ?? 1000, maxMs = Math.min(spec.maxMs ?? BUDGET.maxSeconds * 1000, BUDGET.maxSeconds * 1000);
  const wins = Object.fromEntries(caps.map((c) => [c.variant.id, windowOf(c.frames, c.events, { t0: c.t0, leadMs: lead, settleMs: settle, maxMs })]));
  const anchors = Object.fromEntries(caps.map((c) => [c.variant.id, anchorFrame(c, spec.align)]));
  const viewport = spec.viewport ?? { w: caps[0].rec.meta?.viewport?.width ?? 2560, h: caps[0].rec.meta?.viewport?.height ?? 1440 };
  const focus = spec.focus ?? Object.keys(caps[0].frames[0]?.actors ?? {});
  const pts = caps.flatMap((c) => trackPoints(c.frames, focus, wins[c.variant.id].i0, wins[c.variant.id].i1));
  const crop = spec.crop ?? cropRegion(pts, viewport);
  // output frames, by TIME: from the earliest lead to the latest tail around the anchor, one per 1/fps s of the capture's virtual clock (a 120 or 144 Hz capture plays at true speed)
  const fps = clipFps(hz);
  const aligned = order.map((o) => ({ ...o, cap: byId[o.id], anchor: anchors[o.id] }));
  const vtAt = (a, i) => a.cap.frames[i].vt - a.cap.frames[a.anchor].vt;
  const beforeMs = Math.min(...aligned.map((a) => -vtAt(a, wins[a.id].i0)));
  const afterMs = Math.min(Math.max(...aligned.map((a) => vtAt(a, wins[a.id].i1))), BUDGET.maxSeconds * 1000 - beforeMs);
  const frames = Math.floor(((beforeMs + afterMs) * fps) / 1000) + 1;
  const before = Math.round((beforeMs * hz) / 1000), after = Math.round((afterMs * hz) / 1000);
  const pick = (a, relMs) => Math.max(wins[a.id].i0, Math.min(wins[a.id].i1, nearestFrame(a.cap.frames, a.cap.frames[a.anchor].vt + relMs))); // a shorter variant holds its last frame
  const outName = (slow, ext, suffix = '') => clipName({ chapter: spec.chapter, move: spec.move, hz, slow, ext }).replace(`.${ext}`, `${suffix}.${ext}`);
  const written = { hz, crop, frames, window: { before, after }, files: [] };

  const seq = path.join(workDir, `seq-${hz}`);
  fs.rmSync(seq, { recursive: true, force: true });
  fs.mkdirSync(seq, { recursive: true });
  for (let k = 0; k < frames; k++) {
    const relMs = -beforeMs + (k * 1000) / fps;
    const parts = [];
    for (const a of aligned) {
      const p = await panel(S, a.cap, pick(a, relMs), crop, a.letter, hz, a.anchor);
      parts.push(p ?? await S({ create: { width: PANEL.w, height: PANEL.h, channels: 3, background: '#202028' } }).jpeg().toBuffer());
    }
    const composites = parts.map((p, i) => ({ input: p, top: i * PANEL.h, left: 0 }));
    await S({ create: { width: CARD.w, height: PANEL.h * Math.max(2, parts.length), channels: 3, background: '#000' } }).composite(composites).jpeg({ quality: 90 }).toFile(path.join(seq, `${pad(k + 1)}.jpg`));
  }
  const real = encodeSequence({ dir: seq, fps, out: path.join(outDir, outName(false, 'mp4')), bin: ffmpegBin });
  written.files.push({ kind: 'clip', ...real, fps, seconds: r1(frames / fps) });
  if (hz > 60) {
    // the quarter-speed copy shows EVERY captured frame: build its own sequence at stride 1
    const slowSeq = path.join(workDir, `seq-${hz}-slow`);
    fs.rmSync(slowSeq, { recursive: true, force: true });
    fs.mkdirSync(slowSeq, { recursive: true });
    const slowFrames = Math.min(before + after + 1, Math.floor(24 * (hz / 4))); // the quarter-speed copy is bounded by the 8 MB budget and 24 s, not by the 8 s of the real-time clip
    for (let k = 0; k < slowFrames; k++) {
      const rel = -before + k;
      const parts = [];
      for (const a of aligned) parts.push(await panel(S, a.cap, Math.max(wins[a.id].i0, Math.min(wins[a.id].i1, a.anchor + rel)), crop, a.letter, hz, a.anchor) ?? await S({ create: { width: PANEL.w, height: PANEL.h, channels: 3, background: '#202028' } }).jpeg().toBuffer());
      await S({ create: { width: CARD.w, height: PANEL.h * Math.max(2, parts.length), channels: 3, background: '#000' } }).composite(parts.map((p, i) => ({ input: p, top: i * PANEL.h, left: 0 }))).jpeg({ quality: 90 }).toFile(path.join(slowSeq, `${pad(k + 1)}.jpg`));
    }
    const slow = encodeSequence({ dir: slowSeq, fps: clipFps(hz, true), out: path.join(outDir, outName(true, 'mp4')), bin: ffmpegBin });
    written.files.push({ kind: 'slow4x', ...slow, fps: clipFps(hz, true), seconds: r1(slowFrames / clipFps(hz, true)) });
    fs.rmSync(slowSeq, { recursive: true, force: true });
  }
  fs.rmSync(seq, { recursive: true, force: true });

  // the 12-frame strip: consecutive captured frames around the strip anchor, each variant its own pair of rows, stamped
  const strip = spec.strip ?? {};
  const n = strip.frames ?? 12, cellW = Math.floor(STILL_W / 6), cellH = Math.round((cellW * 9) / 16);
  const stripAnchor = (a) => {
    if (strip.event) { const ev = a.cap.events.filter((e) => e.type === strip.event)[(strip.ordinal ?? 1) - 1]; if (ev) return ev.f; }
    return a.anchor;
  };
  const rows = [];
  for (const a of aligned) {
    const t0v = a.cap.frames[stripAnchor(a)].vt + (strip.offset ?? -2) * (1000 / 60);
    const cells = [];
    for (let k = 0; k < n; k++) {
      const idx = Math.max(wins[a.id].i0, Math.min(wins[a.id].i1, nearestFrame(a.cap.frames, t0v + (k * 1000) / 60))); // consecutive 60 Hz frames, by time
      const p = await panel(S, a.cap, idx, crop, a.letter, hz, stripAnchor(a), { w: cellW, h: cellH });
      cells.push(p ?? await S({ create: { width: cellW, height: cellH, channels: 3, background: '#202028' } }).jpeg().toBuffer());
    }
    rows.push({ letter: a.letter, cells });
  }
  const still = path.join(outDir, outName(false, 'jpg', '-card'));
  const sheet = await writeStill({ S, file: still, title: `${spec.title ?? spec.id}  ·  ${spec.chapter}  ·  ${hz} Hz capture`, subtitle: (spec.questions ?? []).join('   |   '), rows, cellW, cellH });
  written.files.push({ kind: 'card', file: still, bytes: fs.statSync(still).size, width: sheet.width, height: sheet.height });

  // the speed trace and the numbers
  const numbers = {};
  const traces = [];
  for (const a of aligned) {
    const w = wins[a.id];
    const jolts = joltsOfRecording(a.cap.frames.slice(w.i0, w.i1 + 1));
    const tr = speedTrace(a.cap.frames, focus[0], w.i0, w.i1, { scale: 2560 / 1600 });
    traces.push({ letter: a.letter, tr });
    numbers[a.letter] = { variant: a.id, windowMs: r1(w.lengthMs), truncated: w.truncated, anchorFrame: a.anchor, frames: w.i1 - w.i0 + 1, joltsInWindow: joltTally(jolts, w.lengthMs / 1000).total, peakSpeedPxPer60: r1(tr.reduce((m, p) => Math.max(m, p.v), 0)) };
  }
  if (spec.trace !== false && traces.some((t) => t.tr.length)) {
    const W = STILL_W, H = 360, L = 56, B = 30, T = 20;
    const tmax = Math.max(...traces.flatMap((t) => t.tr.map((p) => p.t)), 1), vmax = Math.max(...traces.flatMap((t) => t.tr.map((p) => p.v)), 1);
    const X = (t) => L + (t / tmax) * (W - L - 16), Y = (v) => H - B - (v / vmax) * (H - B - T);
    const colors = ['#e8c76a', '#6ec1ff', '#ff8a8a', '#9be28b'];
    const lines = traces.map((t, i) => `<polyline fill="none" stroke="${colors[i % colors.length]}" stroke-width="2.5" points="${t.tr.map((p) => `${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}"/><text x="${W - 60}" y="${T + 18 * (i + 1)}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${colors[i % colors.length]}">${esc(t.letter)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0b0f1a"/><line x1="${L}" y1="${H - B}" x2="${W - 16}" y2="${H - B}" stroke="#556"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#556"/><text x="6" y="${H - B + 4}" font-family="Arial, sans-serif" font-size="12" fill="#9aa3b8">0</text><text x="6" y="${T + 8}" font-family="Arial, sans-serif" font-size="12" fill="#9aa3b8">${r1(vmax)}</text><text x="${W - 70}" y="${H - 10}" font-family="Arial, sans-serif" font-size="12" fill="#9aa3b8">${Math.round(tmax)} ms</text>${lines}<text x="${L}" y="14" font-family="Arial, sans-serif" font-size="13" fill="#cfd6e6">speed of ${esc(focus[0] ?? '')}, px per 60 Hz frame at 2560 wide (peak ${r1(vmax)}) over ${r1(tmax)} ms</text></svg>`;
    const file = path.join(outDir, outName(false, 'png', '-trace'));
    await S(Buffer.from(svg)).png().toFile(file);
    written.files.push({ kind: 'trace', file, bytes: fs.statSync(file).size });
  }
  written.key = key;
  written.numbers = numbers;
  return written;
}

/**
 * Compose every rate of a card.
 * @param {{spec: object, workDir: string, outDir: string, root: string, ffmpeg?: string}} o
 */
export async function composeCard({ spec, workDir, outDir, root, ffmpeg: bin = FFMPEG }) {
  const S = await sharp(root);
  fs.mkdirSync(outDir, { recursive: true });
  const rates = spec.rates ?? [60];
  const results = [];
  for (const hz of rates) results.push(await composeRate({ spec, workDir, outDir, ffmpegBin: bin, S, hz }));
  const { key } = blindOrder(spec.variants, spec.seed ?? spec.id);
  fs.writeFileSync(path.join(outDir, 'KEY.json'), JSON.stringify({ card: spec.id, seed: spec.seed ?? spec.id, key, note: 'blind: the panels carry only a letter; this file is the only place the key is written' }, null, 1));
  fs.writeFileSync(path.join(outDir, 'numbers.json'), JSON.stringify(Object.fromEntries(results.map((r) => [r.hz, { crop: r.crop, frames: r.frames, window: r.window, numbers: r.numbers, files: r.files.map((f) => ({ kind: f.kind, file: path.basename(f.file), bytes: f.bytes, seconds: f.seconds, crf: f.crf })) }])), null, 1));
  fs.writeFileSync(path.join(outDir, 'README.txt'), `${spec.title ?? spec.id}\n\n${(spec.questions ?? []).join('\n')}\n\nLetters only in the pictures; KEY.json says which variant is which. The real-time clips play at 60 fps (a phone cannot show more); the slow4x copies show every captured frame at a quarter of the capture rate. ${spec.note ?? ''}\n`);
  return results;
}
