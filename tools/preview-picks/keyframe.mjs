// node keyframe.mjs <runDir> <actorId> <pose> <afterMarker> <out.jpg> [delaySec=0.2]
// Pulls the frame of the preview recording where `actorId` first shows `pose` after the marker (poses.json times are the sampler's,
// which starts at the 'battle' marker; the video starts at the page's creation).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [dir, actor, pose, after, out, delay = '0.2'] = process.argv.slice(2);
const FF = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const markers = JSON.parse(fs.readFileSync(`${dir}/markers.json`, 'utf8'));
const poses = JSON.parse(fs.readFileSync(`${dir}/poses.json`, 'utf8'));
const vid = JSON.parse(fs.readFileSync(`${dir}/video.json`, 'utf8'));
const battle = markers.find((m) => m.n === 'battle').ms;
const afterMs = markers.find((m) => m.n === after)?.ms ?? Number(after);
const off = (vid.t0 - vid.ctxStart) / 1000;
const toVideo = (tSampler) => (battle + tSampler) / 1000 + off - 0.05; // sampler t0 sits just before the 'battle' mark
const hit = poses.find((p) => p.id === actor && p.pose === pose && battle + p.t >= afterMs - 1500);
if (!hit) throw new Error(`no ${actor}:${pose} after ${after}`);
const t = toVideo(hit.t) + Number(delay);
fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', t.toFixed(2), '-i', vid.raw, '-frames:v', '1', '-q:v', '3', out]);
console.log(out, 'video t', t.toFixed(2), 'sampler t', hit.t);
