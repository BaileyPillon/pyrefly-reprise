/**
 * **Assemble pass 2's videos and contact sheets** from a recording (`record.mjs --modes anim2 --variants today,B,P2`; the animation prototype; `docs/handoff/anim-proto.md`).
 *
 *   node tools/rig/lane/anim2-assemble.mjs --in <recording dir> --out <final dir> [--in-today <dir>] [--in-B <dir>] [--in-P2 <dir>] [--ffmpeg <path>] [--crop attack=x,y,w,h ...]
 *
 * Every video starts `--pre` frames (default 30) before the action starts (the frame the battle log first grows: the same instant in every variant, so the three line up) and ends `--post` frames
 * (default 45) after the last frame anything moved; the hurt-and-KO video runs whole.
 *
 * Writes, in `--out`: `pass2-attack.mp4`, `pass2-cast.mp4`, `pass2-item-ally.mp4`, `pass2-item-self.mp4`, `pass2-hurt-ko.mp4` (1280 x 720, 60 fps, the P2 variant of each action, labelled with the
 * action and a time since the first key press), `compare-<action>.mp4` (TODAY | PASS 1 B | PASS 2 side by side, started on the same frame; attack, cast, item (the ally one), item-self, hurt-ko) and
 * `contact-<action>.png` (a row a variant, ten frames across the part that moves, each row labelled with its own length). Reads only the recording; needs ffmpeg and `sharp`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') && a !== '--crop' ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const crops = Object.fromEntries(process.argv.slice(2).flatMap((a, i, all) => (a === '--crop' ? [all[i + 1].split('=')] : [])).map(([k, v]) => [k, v.split(',').map(Number)]));
const IN = path.resolve(args.in ?? args['in-P2'] ?? '.');
/** A variant may be read from its own recording folder (`--in-today <dir>`, `--in-B <dir>`, `--in-P2 <dir>`: each holds `anim2-<variant>/`); `--in` is the default. */
const inOf = (v) => (args[`in-${v}`] ? path.resolve(args[`in-${v}`]) : IN);
const OUT = path.resolve(args.out);
const FFMPEG = args.ffmpeg ?? 'ffmpeg';
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf';
fs.mkdirSync(OUT, { recursive: true });

const ACTIONS = ['attack', 'cast', 'item-ally', 'item-self', 'hurt-ko'].filter((a) => !args.actions || String(args.actions).split(',').includes(a));
const PARTS = new Set(String(args.parts ?? 'pass2,compare,contact').split(',')); // `--parts contact` redoes only the sheets, `--actions hurt-ko` only that action
const VARIANTS = ['today', 'B', 'P2'].filter((v) => fs.existsSync(path.join(inOf(v), `anim2-${v}`, 'segments.json')));
const NAME = { today: 'TODAY (the rig as it ships)', B: 'PASS 1  B SHOWPIECE', P2: 'PASS 2' };
const TITLE = { attack: 'ATTACK', cast: 'CAST', 'item-ally': 'ITEM ON AN ALLY', 'item-self': 'ITEM ON HERSELF', 'hurt-ko': 'HURT, THEN KO' };
const info = Object.fromEntries(VARIANTS.map((v) => [v, JSON.parse(fs.readFileSync(path.join(inOf(v), `anim2-${v}`, 'segments.json'), 'utf8'))]));
const dirOf = (v, a) => path.join(inOf(v), `anim2-${v}`, a);
const has = (v, a) => info[v]?.segments?.[a] && fs.existsSync(dirOf(v, a));

function ff(argv) {
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...argv], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg ${argv.slice(0, 8).join(' ')} ...: ${r.stderr}`);
}
const text = (s, x, y, size) => `drawtext=fontfile='${FONT}':text='${s}':x=${x}:y=${y}:fontsize=${size}:fontcolor=white:box=1:boxcolor=0x0c0a12cc:boxborderw=10`;
const nFrames = (v, a) => fs.readdirSync(dirOf(v, a)).filter((f) => f.endsWith('.jpg')).length;
const PRE = Number(args.pre ?? 30);
const POST = Number(args.post ?? 45);
/** The frames of a variant's action that matter: `t0` the action's start (the battle log first grows), `from` and `count` the window to cut (`from` may be earlier than `t0` by PRE). */
function windowOf(v, a, pre = PRE) {
  const s = info[v].segments[a];
  const n = s.samples.length;
  if (a === 'hurt-ko') return { t0: 0, from: 0, count: n, last: n - 1 };
  const t0 = Math.max(0, s.samples.findIndex((x) => x.log > s.samples[0].log));
  let last = t0;
  for (let i = 1; i < n; i++) if ((s.samples[i].pose !== s.samples[i - 1].pose || s.samples[i].clip !== s.samples[i - 1].clip) && s.samples[i].pose !== 'critical' && !String(s.samples[i].clip).includes('critical')) last = i;
  const from = Math.max(0, t0 - pre);
  let end = Math.min(n - 1, last + POST);
  const crit = s.samples.findIndex((x, i) => i > t0 && (x.pose === 'critical' || String(x.clip).includes('critical'))); // the game's low-HP crouch can follow an action in the recording: not part of the action
  if (crit > 0) end = Math.min(end, crit - 1);
  return { t0, from, count: end - from + 1, last: end };
}
const input = (v, a, win = windowOf(v, a), count = win.count) => ['-framerate', '60', '-start_number', String(win.from), '-t', (count / 60 + 0.001).toFixed(3), '-i', path.join(dirOf(v, a), 'f%04d.jpg')];
const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '60'];
/** `ms` since the first key press: the recorder presses on frame 6. */
/** Milliseconds since the action started (0 before it): `pre` is how many frames of lead-in the video has. */
const clock = (x, y, size, pre) => text(`%{eif\\:max(0\\,(n-${pre})*1000/60)\\:d} ms`, x, y, size);

// 1. one labelled video an action: the P2 variant (or the first variant present)
const lead = VARIANTS.includes('P2') ? 'P2' : VARIANTS[VARIANTS.length - 1];
for (const a of ACTIONS) {
  if (!PARTS.has('pass2') || !has(lead, a)) continue;
  const win = windowOf(lead, a);
  const vf = [...(crops[a] ? [`crop=${crops[a].join(':')}`] : []), 'scale=1280:720:flags=lanczos', text(`${NAME[lead]}  /  ${TITLE[a]}`, 24, 20, 32), clock(24, 'h-64', 30, win.t0 - win.from)].join(',');
  ff([...input(lead, a), '-vf', vf, ...enc, path.join(OUT, `pass2-${a}.mp4`)]);
  console.log('wrote', `pass2-${a}.mp4`, win.count, 'frames; the action starts on frame', win.t0 - win.from);
}

// 2. today | B | P2 side by side, started on the first press
for (const a of ACTIONS) {
  if (!PARTS.has('compare') || VARIANTS.length < 2 || VARIANTS.some((v) => !has(v, a))) continue;
  const w = Number(args.panelw ?? 960);
  const h = Math.round((w * 9) / 16);
  const pre = Math.min(PRE, ...VARIANTS.map((v) => windowOf(v, a, PRE).t0)); // the same lead-in for every variant, so the action starts on the same frame in all three
  const wins = VARIANTS.map((v) => windowOf(v, a, pre));
  const count = Math.max(...wins.map((x) => x.count)); // the longest of the three
  const cells = VARIANTS.map((v, i) => `[${i}:v]${crops[a] ? `crop=${crops[a].join(':')},` : ''}scale=${w}:${h}:flags=lanczos,${text(NAME[v], 14, 12, 24)},${clock(14, h - 44, 24, wins[i].t0 - wins[i].from)}[v${i}]`);
  const layout = VARIANTS.map((_, i) => `${i * w}_0`).join('|');
  const filter = `${cells.join(';')};${VARIANTS.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${VARIANTS.length}:layout=${layout}:shortest=0[o]`;
  ff([...VARIANTS.flatMap((v, i) => input(v, a, wins[i], wins[i].count)), '-filter_complex', filter, '-map', '[o]', '-frames:v', String(count + 30), ...enc, path.join(OUT, `compare-${a === 'item-ally' ? 'item' : a}.mp4`)]);
  console.log('wrote', `compare-${a === 'item-ally' ? 'item' : a}.mp4`, wins.map((x) => x.count).join(' / '), 'frames');
}

// 3. a contact sheet an action: a row a variant, ten frames across the part that moves
const lastMove = (s) => {
  let last = 0;
  for (let i = 1; i < s.samples.length; i++) if (s.samples[i].pose !== s.samples[i - 1].pose || s.samples[i].clip !== s.samples[i - 1].clip || s.samples[i].charge !== s.samples[i - 1].charge) last = i;
  return Math.min(s.samples.length - 1, last + 24);
};
for (const a of ACTIONS) {
  const rows = VARIANTS.filter((v) => has(v, a));
  if (!PARTS.has('contact') || !rows.length) continue;
  const cw = 384, ch = 216, lab = 110, COLS = 5, N = 10; // ten frames a variant, two rows of five
  const comps = [];
  let r = 0;
  for (const v of rows) {
    const s = info[v].segments[a];
    const w = windowOf(v, a);
    const first = w.from, last = w.last;
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lab}" height="${ch}"><text x="6" y="22" font-family="sans-serif" font-size="15" font-weight="bold" fill="#f0d68a">${v === 'today' ? 'TODAY' : v === 'B' ? 'PASS 1 B' : 'PASS 2'}</text><text x="6" y="42" font-family="sans-serif" font-size="13" fill="#d8d0e0">${((last - w.t0) / 60).toFixed(1)} s</text></svg>`), left: 0, top: r * ch });
    // hurt-ko: four frames across the first blow and six across the KO (the pose changes name them: `hurt` first, `ko` first), not ten spread over eleven seconds
    const h0 = s.samples.findIndex((x) => x.pose === 'hurt');
    const k0 = s.samples.findIndex((x) => x.pose === 'ko');
    const picks = a === 'hurt-ko' && h0 >= 0 && k0 >= 0 ? [h0 + 3, h0 + 8, h0 + 20, h0 + 45, k0 + 2, k0 + 10, k0 + 22, k0 + 38, k0 + 62, k0 + 110].map((n) => Math.min(n, last)) : null;
    for (let i = 0; i < N; i++) {
      const n = picks ? picks[i] : Math.round(first + ((last - first) * i) / (N - 1));
      const f = path.join(dirOf(v, a), `f${String(n).padStart(4, '0')}.jpg`);
      let img = sharp(f);
      if (crops[a]) img = img.extract({ left: crops[a][0], top: crops[a][1], width: crops[a][2], height: crops[a][3] });
      const x = lab + (i % COLS) * cw, y = (r + Math.floor(i / COLS)) * ch;
      comps.push({ input: await img.resize(cw, ch, { fit: 'fill' }).toBuffer(), left: x, top: y });
      comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="20"><text x="3" y="15" font-family="sans-serif" font-size="13" fill="#fff" stroke="#000" stroke-width="0.7">${Math.round(((n - w.t0) * 1000) / 60)} ms</text></svg>`), left: x + 2, top: y + ch - 20 });
    }
    r += N / COLS;
  }
  await sharp({ create: { width: lab + COLS * cw, height: r * ch, channels: 3, background: '#17141f' } }).composite(comps).png().toFile(path.join(OUT, `contact-${a}.png`));
  console.log('wrote', `contact-${a}.png`);
}
