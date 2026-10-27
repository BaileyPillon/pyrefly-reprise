// A phone card from an EXISTING side-by-side clip (MF-26 and the pilots: "show the two existing pilot clips, re-encode to the phone card format only"; motion-fluidity pass, lane L5; both games, tooling).
//
// The party rig pilots' clips (D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/clips/) are 1608 x 900, two panels side by side, each labelled in the picture ("A the painting set the game draws today", "B the new
// rig"), with a title band on top. A card for a decision must be BLIND: letters only, the key in KEY.json, the order seeded by the card's id. So this takes the clip as it is and makes the card from it: each panel
// is cropped below the title and the labels (`crop`: x of the left panel, the band's y and height), scaled to fit 720 x 405 (a figure that fills the panel is not 16:9: it is shown whole with side bars, not
// cut), stacked A over B in the blind order with a letter badge, and encoded as the other cards are (60 fps H.264, CRF 20 stepped up to fit 8 MB, 8 s at most). The 1080 px still shows twelve consecutive frames
// around the instant the two panels differ most (the swap, the ghost, the cut), each stamped with its offset in 60 Hz frames and its ms. Nothing in the clip is re-rendered or re-recorded: no game, no browser.
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
  // a flash (a whiteout, a hit effect over the whole picture) makes the panels differ by the timing of the flash, not by the figure: the instant is chosen among the frames that are not washed out (mean luma under 185), all of them if none qualifies
  const ok = curve.map((_, i) => i).filter((i) => bright[i] < 185);
  const pool = ok.length >= 12 ? ok : curve.map((_, i) => i);
  let at = pool[0] ?? 0;
  for (const i of pool) if (curve[i] > curve[at]) at = i;
  return { at, max: r1(curve[at] ?? 0), curve: curve.map(r1), washedOut: curve.length - ok.length };
}

/**
 * Make a blind phone card from a side-by-side clip.
 * @param {{src: string, outDir: string, id: string, title: string, chapter: string, move: string, root: string, crop?: {y: number, h: number}, variants?: Array<{id: string, name: string}>, questions?: string[], bin?: string}} o
 *   `variants` are the left and the right panel's variants in that order (default: V0 the painting set, V1 the rig).
 */
export async function composeFromVideo({ src, outDir, id, title, chapter, move, root, crop = { y: 125, h: 740 }, variants = [{ id: 'V0', name: 'painting set (today)' }, { id: 'V1', name: 'rig' }], questions = ['Which reads as one figure?', 'Which would you keep?'], bin = FFMPEG }) {
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
  const first = Math.max(0, Math.min(Math.floor(info.seconds * info.fps) - 12, diff.at - 2));
  const cellW = Math.floor(1080 / 6), cellH = Math.round((cellW * crop.h) / panelW); // the cells keep the panel's own shape: the pilots' panels are nearly square
  const rows = [];
  for (const o of order) {
    const x = side(o) === 0 ? 0 : panelW;
    const cells = [];
    for (let k = 0; k < 12; k++) {
      const f = frameFile(first + k);
      const ms = r1(((k - (diff.at - first)) * 1000) / info.fps);
      const body = await S(f).extract({ left: x, top: crop.y, width: panelW, height: crop.h }).resize({ height: cellH, width: cellW, fit: 'contain', background: '#101624' }).jpeg({ quality: 85 }).toBuffer();
      cells.push(await S(body).composite([{ input: badge(o.letter, cellW, cellH), top: 0, left: 0 }, { input: stamp(`${ms >= 0 ? '+' : ''}${Math.round((ms * 60) / 1000)}f  ${ms >= 0 ? '+' : ''}${ms} ms`, 150, 18, k === diff.at - first), top: cellH - 18, left: cellW - 150 }]).jpeg({ quality: 85 }).toBuffer());
    }
    rows.push({ letter: o.letter, cells });
  }
  const still = path.join(outDir, name('-card', 'jpg'));
  const sheet = await writeStill({ S, file: still, title: `${title}  ·  ${chapter}  ·  existing clip, re-encoded`, subtitle: questions.join('   |   '), rows, cellW, cellH, foot: '12 consecutive 60 Hz frames around the largest difference between the two panels (the highlighted stamp). Letters only: the key is not in the picture.' });
  fs.writeFileSync(path.join(outDir, 'KEY.json'), JSON.stringify({ card: id, key, source: src, note: 'blind: the panels carry only a letter; this file is the only place the key is written' }, null, 1));
  fs.writeFileSync(path.join(outDir, 'numbers.json'), JSON.stringify({ source: src, sourceSeconds: r1(info.seconds), sourceFps: info.fps, sourceSize: [info.width, info.height], crop: { x: [0, panelW], y: crop.y, w: panelW, h: crop.h }, clip: { file: path.basename(out), bytes, crf, seconds: r1(Math.min(info.seconds, BUDGET.maxSeconds)) }, card: { file: path.basename(still), width: sheet.width, height: sheet.height }, largestDifference: { frame: diff.at, meanAbs: diff.max, ms: r1((diff.at * 1000) / info.fps) } }, null, 1));
  fs.writeFileSync(path.join(outDir, 'README.txt'), `${title}\n\n${questions.join('\n')}\n\nAn existing clip re-encoded to the phone card format (no new recording). Letters only in the picture; KEY.json says which panel is which.\n`);
  fs.rmSync(work, { recursive: true, force: true });
  return { out, bytes, crf, still, key, largestDifference: diff };
}
