// A phone card from an EXISTING side-by-side clip (MF-26 and the pilots: "show the two existing pilot clips, re-encode to the phone card format only"; motion-fluidity pass, lane L5; both games, tooling).
//
// The party rig pilots' clips (D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/clips/) are 1608 x 900, two panels side by side, each labelled in the picture ("A the painting set the game draws today", "B the new
// rig"), with a title band on top. A card for a decision must be BLIND: letters only, the key in KEY.json, the order seeded by the card's id. So this takes the clip as it is and makes the card from it: each panel
// is cropped below the title and the labels (`crop`: x of the left panel, the band's y and height), scaled to fit 720 x 405 (a figure that fills the panel is not 16:9: it is shown whole with side bars, not
// cut), stacked A over B in the blind order with a letter badge, and encoded as the other cards are (60 fps H.264, CRF 20 stepped up to fit 8 MB, 8 s at most). The 1080 px still shows twelve consecutive frames
// around ONE ANCHOR, each frame stamped with its offset from it in 60 Hz frames and ms. The anchor is the card's own (`anchorFrame` and `anchorLabel` in the batch: the instant the move happens, chosen by looking at
// the clip) or, with none, the instant the two panels differ most INSIDE THE MIDDLE 60 PERCENT of the clip and away from a whiteout (review M4: an unrestricted pick landed on frame 0, on the last frames, or in a
// flash, and a pick made only on the difference favours the frame that shows the flaw). The card says which it used. Nothing in the clip is re-rendered or re-recorded: no game, no browser.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { BUDGET, PANEL, blindOrder } from '../../critic/runner/lib/ab-pure.mjs';
import { FFMPEG, badge, encodeSequence, ffmpeg, sharp, stamp, writeStill } from './ab-compose.mjs';

const r1 = (x) => Math.round(x * 10) / 10;

/** Width, height, fps and duration of a video, read from `ffmpeg -i` (there is no ffprobe in the toolbox). */
export function probeVideo(file, bin = FFMPEG) {
  const t = spawnSync(bin, ['-hide_banner', '-i', file], { encoding: 'utf8', windowsHide: true }).stderr;
  const dim = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(t);
  const fps = /(\d+(?:\.\d+)?) fps/.exec(t);
  const dur = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(t);
  if (!dim || !dur) throw new Error(`cannot read ${file}: ${t.slice(-200)}`);
  return { width: Number(dim[1]), height: Number(dim[2]), fps: fps ? Number(fps[1]) : 60, seconds: Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) };
}

/**
 * Which frame the strip is anchored on (pure). `override` (a frame of the source) wins and is clamped into the clip; otherwise the largest panel difference among the frames in the middle `middle` share of
 * the clip (default 60 percent) that are not washed out (mean luma under `washed`, 185) AND whose whole 12-frame strip (two frames before to nine after) is not washed out either (review round 2, m7: rikku-hurt's
 * anchor was clean and the nine frames after it were a flash, 5 of the 12 cells whiteouts); if no strip is clean, the best single frame that is; if none, the clip's middle frame. Returns { at, kind }.
 * @param {number[]} curve mean panel difference per frame   @param {number[]} bright the brighter panel's mean luma per frame
 */
export function pickAnchor({ curve, bright = [], total, override = null, middle = 0.6, washed = 185 }) {
  const n = Math.max(1, total ?? curve.length);
  if (Number.isFinite(override)) return { at: Math.max(0, Math.min(n - 1, Math.round(override))), kind: 'chosen' };
  const lo = Math.floor((n * (1 - middle)) / 2), hi = Math.ceil(n - (n * (1 - middle)) / 2) - 1;
  const pool = [];
  for (let i = lo; i <= Math.min(hi, curve.length - 1); i++) if ((bright[i] ?? 0) < washed) pool.push(i);
  if (!pool.length) return { at: Math.floor(n / 2), kind: 'middle' };
  const cleanStrip = (i) => { for (let k = Math.max(0, i - 2); k <= Math.min(n - 1, i + 9); k++) if ((bright[k] ?? 0) >= washed) return false; return true; };
  const strips = pool.filter(cleanStrip);
  const from = strips.length ? strips : pool;
  let at = from[0];
  for (const i of from) if (curve[i] > curve[at]) at = i;
  return { at, kind: 'largest-difference-in-the-middle', ...(strips.length ? {} : { stripWashed: true }) };
}

/**
 * The frame at which the two panels differ most (mean absolute difference of a 64 x 48 gray version of each), and the whole curve: where the painting set and the rig part company (a swap's double image,
 * a cut). Frame indexes are of the source at its own fps.
 */
export function panelDifference(file, { crop, panelW }, bin = FFMPEG) {
  const [W, H] = [64, 48];
  const g = (x) => `crop=${panelW}:${crop.h}:${x}:${crop.y},scale=${W}:${H},format=gray`;
  const r = spawnSync(bin, ['-loglevel', 'error', '-i', file, '-filter_complex', `[0:v]split=2[l][r];[l]${g(0)}[a];[r]${g(panelW)}[b];[a][b]hstack`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.status !== 0) throw new Error(`ffmpeg difference pass failed: ${String(r.stderr).slice(-300)}`);
  const buf = r.stdout, frame = 2 * W * H;
  const curve = [], bright = [];
  for (let f = 0; f + frame <= buf.length; f += frame) {
    let sum = 0, la = 0, lb = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = buf[f + y * 2 * W + x], b = buf[f + y * 2 * W + W + x]; sum += Math.abs(a - b); la += a; lb += b; }
    curve.push(sum / (W * H));
    bright.push(Math.max(la, lb) / (W * H));
  }
  // a flash (a whiteout, a hit effect over the whole picture) makes the panels differ by the timing of the flash, not by the figure: `pickAnchor` leaves the washed-out frames out
  const pick = pickAnchor({ curve, bright, total: curve.length });
  return { at: pick.at, kind: pick.kind, max: r1(curve[pick.at] ?? 0), curve: curve.map(r1), bright: bright.map(r1), washedOut: bright.filter((b) => b >= 185).length };
}

/**
 * Make a blind phone card from a side-by-side clip.
 * @param {{src: string, outDir: string, id: string, title: string, chapter: string, move: string, root: string, crop?: {y: number, h: number}, variants?: Array<{id: string, name: string}>, questions?: string[], bin?: string}} o
 *   `variants` are the left and the right panel's variants in that order (default: V0 the painting set, V1 the rig).
 */
export async function composeFromVideo({ src, outDir, id, title, chapter, move, root, crop = { y: 125, h: 740 }, variants = [{ id: 'V0', name: 'painting set (today)' }, { id: 'V1', name: 'rig' }], questions = ['Which reads as one figure?', 'Which would you keep?'], anchorFrame = null, anchorLabel = null, note = null, bin = FFMPEG }) {
  const S = await sharp(root);
  fs.mkdirSync(outDir, { recursive: true });
  const info = probeVideo(src, bin);
  const panelW = Math.floor(info.width / 2);
  const { order, key } = blindOrder(variants, id);
  const side = (v) => variants.findIndex((x) => x.id === v.id); // 0: the left panel, 1: the right
  const work = path.join(outDir, '.work');
  fs.rmSync(work, { recursive: true, force: true });
  const src60 = path.join(work, 'src'), seq = path.join(work, 'seq');
  fs.mkdirSync(src60, { recursive: true });
  fs.mkdirSync(seq, { recursive: true });
  // every frame of the source, as JPEG (an ffmpeg filter graph of crop, pad and overlay was refused by this ffmpeg on the pilots' frames, whose sample aspect ratio is 0/1; sharp does not care)
  const total = Math.min(Math.floor(info.seconds * info.fps), Math.floor(BUDGET.maxSeconds * info.fps));
  ffmpeg(['-i', path.resolve(src), '-frames:v', String(total), '-q:v', '2', '-fps_mode', 'passthrough', path.join(src60, '%05d.jpg')], bin);
  const frameFile = (n) => path.join(src60, `${String(n + 1).padStart(5, '0')}.jpg`);
  const panelOf = async (n, o, size) => S(frameFile(n)).extract({ left: side(o) === 0 ? 0 : panelW, top: crop.y, width: panelW, height: crop.h }).resize({ width: size.w, height: size.h, fit: 'contain', background: '#101624' }).composite([{ input: badge(o.letter, size.w, size.h), top: 0, left: 0 }]).jpeg({ quality: 90 }).toBuffer(); // a figure that fills the panel is not 16:9: shown whole, with side bars, never cut
  for (let n = 0; n < total; n++) {
    const parts = [await panelOf(n, order[0], PANEL), await panelOf(n, order[1], PANEL)];
    await S({ create: { width: PANEL.w, height: PANEL.h * 2, channels: 3, background: '#000' } }).composite(parts.map((p, i) => ({ input: p, top: i * PANEL.h, left: 0 }))).jpeg({ quality: 90 }).toFile(path.join(seq, `${String(n + 1).padStart(5, '0')}.jpg`));
  }
  const name = (suffix, ext) => `AB-${chapter}-${move}-60${suffix}.${ext}`;
  const out = path.join(outDir, name('', 'mp4'));
  const enc = encodeSequence({ dir: seq, fps: 60, out, bin });
  const { bytes, crf } = enc;
  // the strip: twelve consecutive frames around the largest difference between the panels
  const diff = panelDifference(src, { crop, panelW }, bin);
  const totalFrames = Math.floor(info.seconds * info.fps);
  const anchor = pickAnchor({ curve: diff.curve, bright: diff.bright, total: totalFrames, override: anchorFrame });
  const first = Math.max(0, Math.min(totalFrames - 12, anchor.at - 2));
  const cellW = Math.floor(1080 / 6), cellH = Math.round((cellW * crop.h) / panelW); // the cells keep the panel's own shape: the pilots' panels are nearly square
  const rows = [];
  for (const o of order) {
    const x = side(o) === 0 ? 0 : panelW;
    const cells = [];
    for (let k = 0; k < 12; k++) {
      const f = frameFile(first + k);
      const ms = r1(((k - (anchor.at - first)) * 1000) / info.fps);
      const body = await S(f).extract({ left: x, top: crop.y, width: panelW, height: crop.h }).resize({ height: cellH, width: cellW, fit: 'contain', background: '#101624' }).jpeg({ quality: 85 }).toBuffer();
      cells.push(await S(body).composite([{ input: badge(o.letter, cellW, cellH), top: 0, left: 0 }, { input: stamp(`${ms >= 0 ? '+' : ''}${Math.round((ms * 60) / 1000)}f  ${ms >= 0 ? '+' : ''}${ms} ms`, 150, 18, k === anchor.at - first), top: cellH - 18, left: cellW - 150 }]).jpeg({ quality: 85 }).toBuffer());
    }
    rows.push({ letter: o.letter, cells });
  }
  const still = path.join(outDir, name('-card', 'jpg'));
  const anchorText = anchor.kind === 'chosen' ? `12 consecutive 60 Hz frames, the highlighted stamp at ${anchorLabel ?? 'the moment of the move'} (frame ${anchor.at}).` : `12 consecutive 60 Hz frames around the largest difference between the panels in the middle of the clip (frame ${anchor.at}, highlighted): no moment was chosen for this card.`;
  const sheet = await writeStill({ S, file: still, title: `${title}  ·  ${chapter}  ·  existing clip, re-encoded`, subtitle: questions.join('   |   '), rows, cellW, cellH, foot: `${anchorText}${note ? ` ${note}` : ''} Letters only: the key is not in the picture.` });
  fs.writeFileSync(path.join(outDir, 'KEY.json'), JSON.stringify({ card: id, key, source: src, note: 'blind: the panels carry only a letter; this file is the only place the key is written' }, null, 1));
  fs.writeFileSync(path.join(outDir, 'numbers.json'), JSON.stringify({ source: src, sourceSeconds: r1(info.seconds), sourceFps: info.fps, sourceSize: [info.width, info.height], crop: { x: [0, panelW], y: crop.y, w: panelW, h: crop.h }, clip: { file: path.basename(out), bytes, crf, seconds: r1(Math.min(info.seconds, BUDGET.maxSeconds)) }, card: { file: path.basename(still), width: sheet.width, height: sheet.height }, anchor: { frame: anchor.at, kind: anchor.kind, label: anchorLabel, ms: r1((anchor.at * 1000) / info.fps) }, largestDifference: { frame: diff.at, kind: diff.kind, meanAbs: diff.max, ms: r1((diff.at * 1000) / info.fps) }, note }, null, 1));
  fs.writeFileSync(path.join(outDir, 'README.txt'), `${title}\n\n${questions.join('\n')}\n\nAn existing clip re-encoded to the phone card format (no new recording). Letters only in the picture; KEY.json says which panel is which.${note ? `\n\nNOTE: ${note}` : ''}\n`);
  fs.rmSync(work, { recursive: true, force: true });
  return { out, bytes, crf, still, key, anchor, largestDifference: diff };
}
