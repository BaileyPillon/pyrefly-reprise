/**
 * **Assemble the animation prototype's videos and contact sheets** from a recording (`record.mjs --modes anim --variants today,A,B,C`; the animation prototype; `docs/handoff/anim-proto.md`).
 *
 *   node tools/rig/lane/anim-assemble.mjs --in <recording dir> --out <final dir> [--ffmpeg <path>]
 *
 * Writes, in `--out`: `style-A.mp4`, `style-B.mp4`, `style-C.mp4` (idle, attack, cast, item, hurt, KO, victory in sequence, each labelled), `today.mp4` the same for the engine as it ships,
 * `compare-cast.mp4` and `compare-item.mp4` (today, A, B, C as a 2 x 2 grid, cropped on the figure and the target, started on the same frame), and `contact-<variant>.png` a contact sheet each.
 * Reads only the recording; needs ffmpeg and `sharp`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const IN = path.resolve(args.in);
const OUT = path.resolve(args.out);
const FFMPEG = args.ffmpeg ?? 'ffmpeg';
const FONT = "C\\:/Windows/Fonts/arialbd.ttf";
fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(OUT, '_tmp');
fs.mkdirSync(TMP, { recursive: true });

const ORDER = ['idle', 'attack', 'cast', 'item', 'hurt', 'ko', 'victory'];
const VARIANTS = ['today', 'A', 'B', 'C'].filter((v) => fs.existsSync(path.join(IN, `anim-${v}`, 'segments.json')));
const NAMES = { today: 'TODAY (rig as it ships)', A: 'A  FAITHFUL FFX', B: 'B  SHOWPIECE', C: 'C  PAINTERLY CALM' };
const LABEL = { idle: 'IDLE', attack: 'ATTACK', cast: 'CAST', item: 'ITEM', hurt: 'HURT', ko: 'KO', victory: 'VICTORY' };
const info = Object.fromEntries(VARIANTS.map((v) => [v, JSON.parse(fs.readFileSync(path.join(IN, `anim-${v}`, 'segments.json'), 'utf8'))]));

function ff(argv) {
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...argv], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg ${argv.slice(0, 6).join(' ')} ...: ${r.stderr}`);
}
const text = (s, x, y, size, extra = '') => `drawtext=fontfile='${FONT}':text='${s}':x=${x}:y=${y}:fontsize=${size}:fontcolor=white:box=1:boxcolor=0x0c0a12cc:boxborderw=10${extra}`;
const frames = (v, seg) => fs.readdirSync(path.join(IN, `anim-${v}`, seg)).filter((f) => f.endsWith('.jpg')).length;

/** A rect as {x0, y0, x1, y1} in canvas px, whatever the field names are. */
function box(r) {
  if (!r) return null;
  const x0 = r.left ?? r.x ?? r.minX, y0 = r.top ?? r.y ?? r.minY;
  const x1 = r.right ?? r.maxX ?? (x0 + (r.width ?? r.w)), y1 = r.bottom ?? r.maxY ?? (y0 + (r.height ?? r.h));
  return [x0, y0, x1, y1].every(Number.isFinite) ? { x0, y0, x1, y1 } : null;
}

/** The crop every video and sheet uses: the party's side of the field (Lulu, the ally a vial is thrown to, the foe's feet), 1000 x 562 at (420, 337) of the 1600 x 900 canvas. The game's camera pushes in and out a little during a cast; she stays inside it. */
const CROP = { x: 420, y: 337, w: 1000, h: 562 };
const CROP_SHEET = { x: 470, y: 440, w: 800, h: 450 }; // the contact sheets are tighter on Lulu
const cropOf = () => CROP;

// 1. one labelled video per variant, the segments in sequence
for (const v of VARIANTS) {
  const parts = [];
  for (const seg of ORDER) {
    if (!info[v].segments[seg]) continue;
    const out = path.join(TMP, `${v}-${seg}.mp4`);
    const vf = [`crop=${CROP.w}:${CROP.h}:${CROP.x}:${CROP.y}`, 'scale=1280:720:flags=lanczos', text(NAMES[v], 24, 20, 34), text(LABEL[seg], 24, 'h-70', 34), text('frame %{eif\\:n\\:d\\:3}', 'w-230', 'h-70', 28)].join(',');
    ff(['-framerate', '60', '-i', path.join(IN, `anim-${v}`, seg, 'f%04d.jpg'), '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '60', out]);
    parts.push(out);
  }
  const list = path.join(TMP, `${v}.txt`);
  fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, v === 'today' ? 'today.mp4' : `style-${v}.mp4`)]);
  console.log('wrote', v === 'today' ? 'today.mp4' : `style-${v}.mp4`);
}

// 2. today / A / B / C side by side for the cast and the item
for (const seg of ['cast', 'item', 'attack']) {
  if (VARIANTS.length < 2 || VARIANTS.some((v) => !info[v].segments[seg])) continue;
  const c = cropOf(seg, true);
  const inputs = VARIANTS.flatMap((v) => ['-framerate', '60', '-i', path.join(IN, `anim-${v}`, seg, 'f%04d.jpg')]);
  const cells = VARIANTS.map((v, i) => `[${i}:v]crop=${c.w}:${c.h}:${c.x}:${c.y},scale=800:450,${text(NAMES[v], 14, 12, 26)}[v${i}]`);
  const layout = ['0_0', '800_0', '0_450', '800_450'].slice(0, VARIANTS.length).join('|');
  const filter = `${cells.join(';')};${VARIANTS.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${VARIANTS.length}:layout=${layout}:shortest=0[o]`;
  const name = `compare-${seg}.mp4`;
  ff([...inputs, '-filter_complex', filter, '-map', '[o]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '60', path.join(OUT, name)]);
  console.log('wrote', name, JSON.stringify(c));
}

// 3. a contact sheet a variant: a row a segment, eight frames across the part of it that moves
for (const v of VARIANTS) {
  const comps = [];
  const cw = 360, ch = 203, lab = 96;
  let row = 0;
  for (const seg of ORDER) {
    const s = info[v].segments[seg];
    if (!s) continue;
    const n = frames(v, seg);
    const c = CROP_SHEET;
    const last = seg === 'idle' ? n - 1 : Math.min(n - 1, Math.max(40, lastMove(s)));
    const picks = Array.from({ length: 8 }, (_, i) => Math.round((last * i) / 7));
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lab}" height="${ch}"><text x="6" y="22" font-family="sans-serif" font-size="16" fill="#f0d68a">${LABEL[seg]}</text></svg>`), left: 0, top: row * ch });
    for (let i = 0; i < picks.length; i++) {
      const buf = await sharp(path.join(IN, `anim-${v}`, seg, `f${String(picks[i]).padStart(4, '0')}.jpg`)).extract({ left: c.x, top: c.y, width: Math.min(c.w, 1600 - c.x), height: Math.min(c.h, 900 - c.y) }).resize(cw, ch, { fit: 'fill' }).toBuffer();
      comps.push({ input: buf, left: lab + i * cw, top: row * ch });
    }
    row++;
  }
  await sharp({ create: { width: lab + 8 * cw, height: row * ch, channels: 3, background: '#17141f' } }).composite(comps).png().toFile(path.join(OUT, `contact-${v}.png`));
  console.log('wrote', `contact-${v}.png`);
}

/** The last frame at which the actor's key or clip changed (plus a tail), so a sheet does not spend its frames on the held end of a segment. */
function lastMove(s) {
  let last = 0;
  for (let i = 1; i < s.samples.length; i++) if (s.samples[i].pose !== s.samples[i - 1].pose || s.samples[i].clip !== s.samples[i - 1].clip) last = i;
  return last + 70;
}

fs.rmSync(TMP, { recursive: true, force: true });
