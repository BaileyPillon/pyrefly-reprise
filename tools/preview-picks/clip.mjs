// node clip.mjs <runDir> <fromMarker> <toMarker> <out.webm> [preRollSec=1.0] [maxSec=9.5]
// Cuts a WebM (VP9, no audio, <= 3 MB) from the run's recording between two markers (marker ms are since the run's t0).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [dir, from, to, out, pre = '1.0', max = '9.5'] = process.argv.slice(2);
const FF = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const markers = JSON.parse(fs.readFileSync(`${dir}/markers.json`, 'utf8'));
const vid = JSON.parse(fs.readFileSync(`${dir}/video.json`, 'utf8'));
const off = (vid.t0 - (vid.ctxStart ?? vid.t0 - Number(process.env.OFFSET_MS ?? 6000))) / 1000;
const m = (n) => (/^\d+$/.test(n) ? { ms: Number(n) } : markers.find((x) => x.n === n));
const a = m(from), b = m(to);
if (!a || !b) throw new Error('marker missing: ' + from + ' ' + to + ' have ' + markers.map((x) => x.n).join(','));
const start = Math.max(0, a.ms / 1000 + off - Number(pre));
const dur = Math.min(Number(max), b.ms / 1000 - a.ms / 1000 + Number(pre) + 0.8);
fs.mkdirSync(out.replace(/[\/][^\/]+$/, ''), { recursive: true });
for (const crf of [33, 37, 41, 46]) {
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', start.toFixed(2), '-i', vid.raw, '-t', dur.toFixed(2), '-an', '-vf', 'scale=1600:900', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', out]);
  if (fs.statSync(out).size <= 3 * 1024 * 1024) break;
}
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', 'start', start.toFixed(1), 'dur', dur.toFixed(1));
