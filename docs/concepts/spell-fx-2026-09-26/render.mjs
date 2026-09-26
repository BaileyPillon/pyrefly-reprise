// B1 spell effects: render the mock clips (MP4 H.264) and stills over the
// real-engine plates. Serves the repo and the scratch folder on 127.0.0.1:6010
// (closed at the end), drives fx.html headless, pipes JPEG frames to ffmpeg.
//   node docs/concepts/spell-fx-2026-09-26/render.mjs clips|stills|reduce|all [filter]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, extname, resolve } from 'node:path';
import { DIR, SCRATCH } from './lib.mjs';

const ROOT = resolve(DIR, '../../..');
const FFMPEG = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const PORT = 6010;
const REDUCE_OPT = process.env.REDUCE_OPT ?? 'B';
const FPS = 30;
const PICK = { fire: 'fire-11', ice: 'ice-22', thunder: 'thunder-11', water: 'water-11', holy: 'holy-11', cure: 'cure-22', slash: 'slash-11', spiral: 'spiral-22', megaflare: 'megaflare-22' };
const CHAPTER = { ffx: 'seymour-flux', ffx2: 'ffx2-bahamut' };
const PARTY = { ffx: { x: 600, y: 760 }, ffx2: { x: 540, y: 700 } };
const SETS = {
  magic: [{ el: 'fire', dur: 1.9 }, { el: 'ice', dur: 1.9 }, { el: 'thunder', dur: 1.9 }, { el: 'water', dur: 1.9 }],
  light: [{ el: 'holy', dur: 2.0 }, { el: 'cure', dur: 1.6 }, { el: 'hit', dur: 1.2 }, { el: 'special', dur: 3.1 }],
};
// The frame each still is taken at (local seconds), per element and game.
const PEAK = { fire: 0.78, ice: 0.95, thunder: 0.5, water: 0.62, holy: { ffx: 0.52, ffx2: 0.72 }, cure: 0.8, hit: 0.34, special: { ffx: 1.5, ffx2: 1.6 } };
const PEAK_A = { fire: 0.62, ice: 0.66, thunder: 0.62, water: 0.66, holy: { ffx: 0.8, ffx2: 0.72 }, cure: 0.72, hit: 0.36, special: { ffx: 1.5, ffx2: 1.68 } };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/scratch/') ? join(SCRATCH, url.slice(9)) : join(ROOT, url);
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const mode = process.argv[2] ?? 'all';
const filter = process.argv[3] ?? '';
const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function page(game, opt, reduce, W, H, seq) {
  const p = await browser.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', (e) => console.error('pageerror', String(e)));
  await p.goto(`http://127.0.0.1:${PORT}/docs/concepts/spell-fx-2026-09-26/fx.html`);
  const rects = JSON.parse(readFileSync(SCRATCH + `rects-${CHAPTER[game]}.json`, 'utf8'));
  const paintings = Object.fromEntries(Object.entries(PICK).map(([k, v]) => [k, `/scratch/pilot/${v}.png`]));
  await p.evaluate((c) => window.init(c), { W, H, game, opt, reduce, seq, rects, party: PARTY[game], plate: `/scratch/plate-${CHAPTER[game]}.png`, paintings: opt === 'A' ? paintings : {} });
  return p;
}
const b64 = (s) => Buffer.from(s.slice(s.indexOf(',') + 1), 'base64');

// Frames are piped straight into ffmpeg (no frame files, nothing to clean up).
// 1280x720 H.264 High, CRF 23: phone-sized, a few MB per clip.
const CW = 1280, CH = 720, CRF = '23';
async function encode(frameAt, n, out) {
  const ff = spawn(FFMPEG, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-crf', CRF, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  for (let i = 0; i < n; i++) {
    const buf = await frameAt(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
}

async function clip(game, opt, set, reduce = false, seq = SETS[set], outDir = DIR) {
  const name = `clip-${game}-${opt}-${set}${reduce ? '-reduced' : ''}`;
  if (filter && !name.includes(filter)) return null;
  const p = await page(game, opt, reduce, CW, CH, seq);
  const dur = seq.reduce((a, s) => a + s.dur, 0), n = Math.round(dur * FPS);
  const out = outDir + name + '.mp4';
  await encode(async (t) => b64(await p.evaluate((tt) => { window.frame(tt); return window.snap(0.93); }, t)), n, out);
  await p.close();
  console.log(name, dur.toFixed(1) + 's', (statSync(out).size / 1e6).toFixed(2) + ' MB');
  return out;
}

async function stills() {
  mkdirSync(DIR + 'stills', { recursive: true });
  for (const game of ['ffx', 'ffx2']) for (const opt of ['A', 'B', 'C']) for (const reduce of [false, true]) {
    const els = reduce ? ['thunder', 'holy', 'special'] : ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'hit', 'special'];
    for (const el of els) {
      const name = `${game}-${opt}-${el}${reduce ? '-reduced' : ''}`;
      if (filter && !name.includes(filter)) continue;
      const dur = [...SETS.magic, ...SETS.light].find((s) => s.el === el).dur;
      const p = await page(game, opt, reduce, 960, 540, [{ el, dur }]);
      const pk = (opt === 'A' ? PEAK_A : PEAK)[el], t = typeof pk === 'number' ? pk : pk[game];
      writeFileSync(DIR + `stills/${name}.jpg`, b64(await p.evaluate((tt) => { window.frame(tt); return window.snap(0.86); }, t)));
      await p.close();
    }
    console.log('stills', game, opt, reduce ? 'reduced' : '');
  }
}

try {
  if (mode === 'clips' || mode === 'all') for (const game of ['ffx', 'ffx2']) for (const opt of ['A', 'B', 'C']) for (const set of ['magic', 'light']) await clip(game, opt, set);
  if (mode === 'reduce' || mode === 'all') {
    const tmp = SCRATCH + 'reduce-v2/';
    mkdirSync(tmp, { recursive: true });
    const seq = [{ el: 'thunder', dur: 1.9 }, { el: 'holy', dur: 2.0 }, { el: 'special', dur: 3.1 }];
    for (const game of ['ffx', 'ffx2']) {
      const off = await clip(game, REDUCE_OPT, 'flashes', false, seq, tmp);
      const on = await clip(game, REDUCE_OPT, 'flashes', true, seq, tmp);
      if (!off || !on) continue;
      const out = DIR + `clip-${game}-reduce-flashes-off-vs-on.mp4`;
      await new Promise((res, rej) => spawn(FFMPEG, ['-loglevel', 'error', '-y', '-i', off, '-i', on, '-filter_complex', '[0:v][1:v]vstack=inputs=2[v]', '-map', '[v]', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-crf', CRF, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', (c) => (c === 0 ? res() : rej(new Error('vstack ' + c)))));
      console.log(out, (statSync(out).size / 1e6).toFixed(2) + ' MB');
    }
  }
  if (mode === 'stills' || mode === 'all') await stills();
} finally {
  await browser.close();
  server.close();
}
