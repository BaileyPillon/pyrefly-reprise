/**
 * **The animation prototype's actions as a video with no browser** (the authoring and fallback tool; both games' plumbing, Lulu, FFX; `docs/handoff/anim-proto.md`). The REAL animator
 * (`src/engine/rig/anim/RigAnimator.ts`: clips, the scheduled strike, hit-stop, the doll carry, the fixed-step springs and the Verlet braid, the idle layer, the smear window) is driven through
 * the calls the presenter makes (`request`, `begin`, `lead`, `lunge`, `beat`) on a virtual 60 Hz clock, and the rig is drawn with the gate's own skinning (`anim-draw.mjs`) over a flat stage. What it
 * is NOT: the game's scene, shading, camera, enemies or spell effects (a plain glow marks where the effect lands), and the vial is an SVG of the same design. So it shows the MOTION, honestly;
 * the recordings of the real game (`record.mjs --modes anim`) are the pictures.
 *
 *   node tools/rig/lane/anim-sim.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --style B --out <dir> [--pace 1.2] [--scale 0.27] [--segments idle,attack,cast,item,hurt,ko,victory]
 *
 * Writes `<dir>/frames/f000000.jpg ...` (1280 x 720) and `<dir>/sim-<style>.mp4` (ffmpeg on PATH), and `<dir>/sim-<style>.json` (the frame each segment and each event is on).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { clipRigOf } from './anim-rig.mjs';
import { carrySkeleton, loadTextures, render, toGatePose } from './anim-draw.mjs';
import { RigAnimator } from '../../../src/engine/rig/anim/RigAnimator.ts';
import { STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU } from '../../../src/engine/rig/anim/LuluAnim.ts';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const style = STYLES[String(args.style ?? 'A').toUpperCase()];
const PACE = Number(args.pace ?? 1.2); // the game's default FFX pace ("steady"): every wait and the animator's clock are scaled by it
const SCALE = Number(args.scale ?? 0.27);
const OUT = path.resolve(args.out);
const SEGMENTS = String(args.segments ?? 'idle,attack,cast,item,hurt,ko,victory').split(',');
const W = 1280, H = 720, FPS = 60, DT = 1 / FPS, ATTACK_APEX = 0.58, LUNGE_MS = 440, PX_PER_UNIT = 1280;
fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });

const { raw, dir } = readRigFile(args.rig);
const { rt, problems } = normaliseRig(raw, { dir });
if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
await loadTextures(rt, dir);
const rig = clipRigOf(rt);
const an = new RigAnimator({ boneIndex: rig.boneIndex, roots: rig.roots, keys: rig.keys, channels: rig.channels, bones: rt.bones, skeleton: carrySkeleton(rt) }, style, LULU, PX_PER_UNIT);
const sk = carrySkeleton(rt);
const cur = Float64Array.from(rig.keys.get('idle'));
const tvel = new Float64Array(rig.channels);
const work = new Float64Array(rig.channels);
const vel = new Float64Array(rig.channels);
let key = 'idle';
const frame = { W: Math.round(rt.image.w * 2.4 * SCALE), H: Math.round(rt.image.h * SCALE + 40), sx: SCALE, sy: SCALE, ox: rt.image.w * 0.9 * SCALE, oy: 30 };

// ------------------------------------------------------------------------------------------------------------------ the presenter's calls
const request = (k) => { if (k === key) return; an.request(k, key, cur, tvel); key = k; };
let lungeX = 0; // world units
let fwd = 0;
let glow = null; // { t0, x, y } the spell effect's stand-in
const vialState = { mode: 'hidden', t: 0, from: null, to: null };
const marks = [];
let bodyX = 0;

// ------------------------------------------------------------------------------------------------------------------ the stage
const TARGET = { x: 880, y: 250, w: 190, h: 400 }; // screen px, the foe's stand-in
const bg = await sharp({ create: { width: W, height: H, channels: 3, background: '#241f33' } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="85%" r="70%"><stop offset="0" stop-color="#3a3250"/><stop offset="1" stop-color="#17141f"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><ellipse cx="420" cy="${H - 70}" rx="230" ry="34" fill="none" stroke="#c28a1c" stroke-width="3" opacity="0.7"/><rect x="${TARGET.x}" y="${TARGET.y}" width="${TARGET.w}" height="${TARGET.h}" rx="24" fill="#3b2a3f" stroke="#6b4a70" stroke-width="3"/><text x="${TARGET.x + 36}" y="${TARGET.y + 215}" font-family="sans-serif" font-size="22" fill="#8a6a90">TARGET</text></svg>`) }]).png().toBuffer();

const vialSvg = (rot, scale) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="200" viewBox="0 0 128 256"><g transform="rotate(${rot} 64 128) translate(${64 - 64 * scale} ${128 - 128 * scale}) scale(${scale})"><path d="M52 70 L52 108 C22 124 14 160 22 196 C30 236 98 236 106 196 C114 160 106 124 76 108 L76 70 Z" fill="#3da8ff" stroke="#0c1030" stroke-width="6" stroke-linejoin="round"/><path d="M40 150 Q34 176 42 204" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="88" cy="150" r="5" fill="#fff"/><rect x="48" y="62" width="34" height="14" fill="#e6b54a" stroke="#0c1030" stroke-width="4"/><path d="M53 62 L50 24 Q64 14 78 24 L75 62 Z" fill="#c9965a" stroke="#0c1030" stroke-width="4"/></g></svg>`);

// ------------------------------------------------------------------------------------------------------------------ one frame
let frameNo = 0;
let segName = '';
let segT = 0;
const flags = []; // { text, until }
const info = { style: style.id, pace: PACE, fps: FPS, segments: {}, events: [] };

async function emit() {
  const f = { dt: DT, rate: 1 / PACE, forward: fwd, calm: key === 'ko' };
  work.set(cur);
  const drove = an.step(f, work, vel);
  if (drove) { cur.set(work); tvel.set(vel); }
  an.idle(work, f);
  sk.solve(work);
  an.secondaryStep(work, f, sk.m);
  sk.solve(work);
  for (const e of an.drain()) {
    info.events.push({ frame: frameNo, seg: segName, event: e });
    flags.push({ text: e.toUpperCase(), until: frameNo + 24 });
    if (e === 'reach') vialState.mode = 'held';
    if (e === 'release' && vialState.mode === 'held') { vialState.mode = 'flying'; vialState.t = 0; vialState.from = vialPoint(); vialState.to = { x: TARGET.x + 40, y: TARGET.y + 110 }; }
  }
  const px = (lungeX * PX_PER_UNIT) * SCALE;
  const buf = render(rt, toGatePose(work), frame);
  const fig = await sharp(buf, { raw: { width: frame.W, height: frame.H, channels: 4 } }).png().toBuffer();
  const comps = [{ input: fig, left: 40 + Math.round(px), top: H - frame.H - 20 }];
  // vial
  const p = vialPoint();
  if (vialState.mode === 'held' && p) comps.push({ input: await sharp(vialSvg(p.rot, 1)).png().toBuffer(), left: Math.round(p.x - 60), top: Math.round(p.y - 100) });
  if (vialState.mode === 'flying') {
    vialState.t += DT * 1000;
    const u = Math.min(1, vialState.t / (style.item.flight * PACE));
    const x = vialState.from.x + (vialState.to.x - vialState.from.x) * u, y = vialState.from.y + (vialState.to.y - vialState.from.y) * u - Math.sin(Math.PI * u) * 150;
    comps.push({ input: await sharp(vialSvg(u * 900, 0.9)).png().toBuffer(), left: Math.round(x - 60), top: Math.round(y - 100) });
    if (u >= 1) { vialState.mode = 'burst'; vialState.t = 0; }
  } else if (vialState.mode === 'burst') {
    vialState.t += DT * 1000;
    const u = Math.min(1, vialState.t / 380);
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="${20 + 150 * u}" fill="#9fe8ff" opacity="${0.8 * (1 - u)}"/></svg>`), left: TARGET.x + 40 - 200, top: TARGET.y + 110 - 200 });
    if (u >= 1) vialState.mode = 'hidden';
  }
  if (glow) {
    const u = (frameNo - glow.f0) / 36;
    if (u <= 1) comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><circle cx="250" cy="250" r="${30 + 200 * u}" fill="#bfe6ff" opacity="${0.75 * (1 - u)}"/></svg>`), left: TARGET.x + 95 - 250, top: TARGET.y + 150 - 250 });
  }
  const label = `STYLE ${style.id} ${style.label.toUpperCase()}  /  ${segName.toUpperCase()}  /  ${Math.round(segT * 1000 / FPS)} ms  (pace x${PACE})`;
  const fl = flags.filter((x) => x.until > frameNo).map((x, i) => `<text x="30" y="${96 + i * 30}" font-family="sans-serif" font-size="24" fill="#f0d68a">${x.text}</text>`).join('');
  comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="120"><rect width="${W}" height="44" fill="#0c0a12"/><text x="16" y="30" font-family="sans-serif" font-size="22" font-weight="bold" fill="#fff">${label}</text>${fl}</svg>`), left: 0, top: 0 });
  await sharp(bg).composite(comps).jpeg({ quality: 88 }).toFile(path.join(OUT, 'frames', `f${String(frameNo).padStart(6, '0')}.jpg`));
  frameNo++;
  segT++;
}

function vialPoint() {
  const l = sk.landmark(LULU.hand);
  const w = sk.landmark('wristPt');
  if (!l) return null;
  const k = SCALE;
  const x = 40 + (frame.ox + lungeX * PX_PER_UNIT * SCALE) + l.x * k, y = H - frame.H - 20 + frame.oy + l.y * k;
  const dx = w ? l.x - w.x : 0, dy = w ? l.y - w.y : 1;
  const n = Math.hypot(dx, dy) || 1;
  return { x: x + (dx / n) * 28, y: y + (dy / n) * 28, rot: (Math.atan2(dy, dx) - Math.PI / 2) * (180 / Math.PI) };
}

// ------------------------------------------------------------------------------------------------------------------ the scenarios (the presenter's calls on a timeline of real ms)
let queue = [];
/** Schedule `fn` at `ms` real milliseconds into the segment (a fn may schedule more). */
function at(ms, fn) {
  queue.push([ms, fn]);
  queue.sort((x, y) => x[0] - y[0]);
}
async function run(name, totalMs) {
  segName = name;
  segT = 0;
  const start = frameNo;
  const total = Math.round((totalMs / 1000) * FPS);
  let lastX = lungeX;
  for (let i = 0; i < total; i++) {
    const t = (i * 1000) / FPS;
    while (queue.length && queue[0][0] <= t) queue.shift()[1](t);
    await emit();
    const v = (lungeX - lastX) / DT;
    fwd += (v - fwd) * (1 - Math.exp(-DT / 0.06));
    lastX = lungeX;
  }
  queue = [];
  info.segments[name] = { first: start, frames: frameNo - start };
  console.log(name, frameNo - start, 'frames');
}

/** The lunge's body: out to the apex, held, then home (world units), as `PaintedActor.lunge` moves the figure. */
function lungeAt(t0, contactHoldMs) {
  const apex = LUNGE_MS * ATTACK_APEX * PACE;
  const home = LUNGE_MS * (1 - ATTACK_APEX) * PACE;
  const ease = (u) => 1 - (1 - u) * (1 - u);
  for (let k = 0; k <= 60; k++) at(t0 + (apex * k) / 60, () => { lungeX = 0.9 * ease(k / 60); });
  for (let k = 0; k <= 40; k++) at(t0 + apex + contactHoldMs + (home * k) / 40, () => { lungeX = 0.9 * (1 - ease(k / 40)); });
  return { apex, end: t0 + apex + contactHoldMs + home };
}

const SC = {
  idle: () => run('idle', 5000),
  attack: () => {
    at(0, () => request('ready'));
    const t0 = 700; // the action starts: the wind-up begins, the presenter waits what is left of it, then the lunge
    at(t0, () => an.begin('attack', cur, tvel));
    const wait = (style.attack.anticipation + 120) * PACE; // the wind-up plus the camera's push (about 120 ms)
    const l = lungeAt(t0 + wait, 60);
    at(t0 + wait, () => an.lunge(LUNGE_MS, ATTACK_APEX));
    at(t0 + wait + l.apex, () => { request('attack'); an.beat('contact', 0, 1); flags.push({ text: 'BLOW LANDS', until: frameNo + 30 }); });
    at(t0 + wait + l.apex + 180 * PACE, () => request('follow'));
    at(l.end + 120, () => request('idle'));
    return run('attack', l.end + 120 + 1100);
  },
  cast: () => {
    const t0 = 600;
    at(0, () => request('ready'));
    at(t0, () => { request('cast'); an.begin('cast', cur, tvel); });
    const afterHold = t0 + 420 * PACE; // the cast's camera hold
    at(afterHold, () => {
      const lead = an.lead('cast');
      const w = (lead >= 0 ? lead : 380) * PACE;
      at(afterHold + w, () => { an.beat('contact', 0, 1); glow = { f0: frameNo }; flags.push({ text: 'SPELL EFFECT', until: frameNo + 30 }); });
      at(afterHold + w + 900, () => request('idle'));
    });
    return run('cast', afterHold + 420 * PACE + 2600);
  },
  item: () => {
    const t0 = 600;
    at(0, () => request('ready'));
    at(t0, () => { request('item'); an.begin('item', cur, tvel); });
    at(t0 + 60, () => {
      const lead = an.lead('item');
      const w = (lead >= 0 ? lead : 380) * PACE;
      at(t0 + 60 + w, () => flags.push({ text: 'HEAL LANDS', until: frameNo + 30 }));
      at(t0 + 60 + w + 700, () => request('idle'));
    });
    return run('item', t0 + 2900);
  },
  hurt: () => { at(300, () => request('hurt')); at(640, () => request('idle')); return run('hurt', 2200); },
  ko: () => { at(400, () => request('ko')); return run('ko', 3400); },
  victory: () => { at(400, () => request('victory')); at(3200, () => request('idle')); return run('victory', 4400); },
};

an.settle();
for (const s of SEGMENTS) {
  request('idle');
  lungeX = 0;
  await SC[s]();
  if (s === 'ko') { cur.set(rig.keys.get('idle')); key = 'idle'; an.cancel?.(); } // stand up for the next segment
}
fs.writeFileSync(path.join(OUT, `sim-${style.id}.json`), JSON.stringify(info, null, 1));
const mp4 = path.join(OUT, `sim-${style.id}.mp4`);
const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(OUT, 'frames', 'f%06d.jpg'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', mp4], { encoding: 'utf8' });
if (r.status !== 0) throw new Error(r.stderr);
console.log('wrote', mp4, frameNo, 'frames');
