/**
 * **Today, A, B and C side by side from the simulations** (`anim-sim.mjs`; the no-browser fallback of `anim-assemble.mjs`): for each action, the four simulation videos of one run, cropped on the figure
 * and its target, started on the segment's first frame and put in a 2 x 2 grid (today top left, A top right, B bottom left, C bottom right).
 *
 *   node tools/rig/lane/anim-sim-compare.mjs --in <sim dir holding today/ A/ B/ C/> --out <dir> [--segments attack,cast,item]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const IN = path.resolve(args.in);
const OUT = path.resolve(args.out);
const V = ['today', 'A', 'B', 'C'].filter((v) => fs.existsSync(path.join(IN, v, `sim-${v}.json`)));
fs.mkdirSync(OUT, { recursive: true });
const NAMES = { today: 'TODAY (rig as it ships)', A: 'A  FAITHFUL FFX', B: 'B  SHOWPIECE', C: 'C  PAINTERLY CALM' };
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf';
const info = Object.fromEntries(V.map((v) => [v, JSON.parse(fs.readFileSync(path.join(IN, v, `sim-${v}.json`), 'utf8'))]));
for (const seg of String(args.segments ?? 'attack,cast,item').split(',')) {
  if (V.some((v) => !info[v].segments[seg])) continue;
  const n = Math.max(...V.map((v) => info[v].segments[seg].frames));
  const inputs = V.flatMap((v) => ['-i', path.join(IN, v, `sim-${v}.mp4`)]);
  const cells = V.map((v, i) => { const s = info[v].segments[seg]; return `[${i}:v]trim=start_frame=${s.first}:end_frame=${s.first + s.frames},setpts=PTS-STARTPTS,crop=1100:676:0:44,scale=800:-2,drawtext=fontfile='${FONT}':text='${NAMES[v]}':x=14:y=12:fontsize=26:fontcolor=white:box=1:boxcolor=0x0c0a12cc:boxborderw=8[v${i}]`; });
  const h = Math.round((676 * 800) / 1100 / 2) * 2;
  const layout = ['0_0', `800_0`, `0_${h}`, `800_${h}`].slice(0, V.length).join('|');
  const filter = `${cells.join(';')};${V.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${V.length}:layout=${layout}:shortest=0[o]`;
  const out = path.join(OUT, `sim-compare-${seg}.mp4`);
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[o]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '60', '-frames:v', String(n), out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  console.log('wrote', out);
}
