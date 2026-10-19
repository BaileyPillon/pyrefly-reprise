/**
 * **Pass 2's actions as a video with no browser** (the authoring and fallback tool for `?anim=proto&style=P2`; Lulu, FFX; plumbing for both games; `docs/handoff/anim-proto.md`): the REAL animator
 * (`RigAnimator.ts`: the clips with their looping holds, the scheduled strike, hit-stop, the doll carry, the springs and the braid, the glow level) driven through the calls the presenter makes
 * (`request`, `begin`, `lead`, `lunge`, `beat`, `lead('end')`) on a virtual 60 Hz clock, the rig drawn with the gate's own skinning over a flat stage, the light (`AnimFx.ts`) as flat circles at the
 * same places. It is NOT the game's picture (no scene, no camera, no real spell effects); the recordings of the real game are. Used while a review holds the browser.
 *
 *   node tools/rig/lane/anim-sim2.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out <dir> [--pace 1.2] [--scale 0.3] [--segments attack,cast,item,itemSelf,hurt,ko] [--cast 1|2|3]
 *
 * Writes `<dir>/frames/*.jpg`, `<dir>/sim-P2.mp4` and `<dir>/sim-P2.json` (the frame each segment and each event is on), and `<dir>/contact-sim-P2.png`.
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
const style = args.cast ? { ...STYLES.P2, p2: { ...STYLES.P2.p2, castType: Number(args.cast) } } : STYLES.P2;
const P = style.p2;
const PACE = Number(args.pace ?? 1.2);
const SCALE = Number(args.scale ?? 0.3);
const OUT = path.resolve(args.out);
const SEGMENTS = String(args.segments ?? 'attack,cast,item,itemSelf,hurt,ko').split(',');
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
const frame = { W: Math.round(rt.image.w * 2.4 * SCALE), H: Math.round(rt.image.h * SCALE + 20), sx: SCALE, sy: SCALE, ox: rt.image.w * 0.8 * SCALE, oy: 10 };
const FIG_X = 60;
const TARGET = { x: 900, y: 200, w: 200, h: 430 };

const request = (k) => { if (k === key) return; an.request(k, key, cur, tvel); key = k; };
let lungeX = 0, fwd = 0, frameNo = 0, segName = '', segT = 0;
const flags = [];
const info = { style: 'P2', pace: PACE, fps: FPS, segments: {}, events: [] };
const fx = { orb: null, burst: null, flash: null, aura: null, flightMs: 0, trail: [] };

const bg = await sharp({ create: { width: W, height: H, channels: 3, background: '#241f33' } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="85%" r="70%"><stop offset="0" stop-color="#3a3250"/><stop offset="1" stop-color="#17141f"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><ellipse cx="${FIG_X + 330}" cy="${H - 18}" rx="260" ry="26" fill="none" stroke="#c28a1c" stroke-width="3" opacity="0.7"/><rect x="${TARGET.x}" y="${TARGET.y}" width="${TARGET.w}" height="${TARGET.h}" rx="24" fill="#3b2a3f" stroke="#6b4a70" stroke-width="3"/><text x="${TARGET.x + 40}" y="${TARGET.y + 215}" font-family="sans-serif" font-size="22" fill="#8a6a90">TARGET</text></svg>`) }]).png().toBuffer();

const handPx = (name = 'fist') => {
  const l = sk.landmark(name);
  if (!l) return null;
  return { x: FIG_X + frame.ox + lungeX * PX_PER_UNIT * SCALE + l.x * SCALE, y: H - frame.H - 10 + frame.oy + l.y * SCALE };
};
const circle = (x, y, r, fill, op) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(0.5, r).toFixed(1)}" fill="${fill}" opacity="${Math.max(0, Math.min(1, op)).toFixed(3)}"/>`;
const GLOW = { cast: ['#7cc4ff', '#f0f8ff'], item: ['#3fe27a', '#f2fff4'] };

async function emit() {
  const f = { dt: DT, rate: 1 / PACE, forward: fwd, calm: key === 'ko' };
  work.set(cur);
  const drove = an.step(f, work, vel);
  if (drove) { cur.set(work); tvel.set(vel); }
  an.idle(work, f);
  sk.solve(work);
  an.secondaryStep(work, f, sk.m);
  sk.solve(work);
  const kind = an.playing;
  const hand = handPx(kind === 'cast' ? 'doll' : 'fist');
  for (const e of an.drain()) {
    info.events.push({ frame: frameNo, seg: segName, event: e });
    flags.push({ text: e.toUpperCase(), until: frameNo + 24 });
    if (e === 'release' && hand) {
      if (kind === 'cast') fx.flash = { t: 0, x: hand.x, y: hand.y };
      else if (kind === 'item' && fx.orb) { fx.flightMs = P.orbFlight * PACE; fx.orb = { ...fx.orb, flying: true, t: 0, fx: fx.orb.x, fy: fx.orb.y }; }
      else if (kind === 'itemSelf') fx.aura = { t: 0, x: FIG_X + frame.ox + lungeX * PX_PER_UNIT * SCALE + 600 * SCALE, parts: Array.from({ length: 22 }, (_, i) => ({ dx: ((i * 53) % 97) - 48, y0: ((i * 37) % 11) * 38, v: 0.12 + ((i * 17) % 7) * 0.025, d: (i % 7) * 20 })) };
    }
  }
  const buf = render(rt, toGatePose(work), frame);
  const fig = await sharp(buf, { raw: { width: frame.W, height: frame.H, channels: 4 } }).png().toBuffer();
  const comps = [{ input: fig, left: FIG_X + Math.round(lungeX * PX_PER_UNIT * SCALE), top: H - frame.H - 10 }];
  let svg = '';
  const level = an.charge;
  const isItem = kind === 'item' || kind === 'itemSelf';
  if (hand && (kind === 'cast' || isItem) && level > 0.02 && !(fx.orb && fx.orb.flying)) {
    const self = an.usedOnSelf;
    const L = level * (self ? 0.45 : 1);
    const lift = isItem && !self ? (0.05 + 0.09 * Math.min(1, Math.max(0, (level - 0.1) / 0.9))) * 1280 * SCALE * 0.55 : 0;
    const [c1, c2] = GLOW[isItem ? 'item' : 'cast'];
    const x = hand.x, y = hand.y - lift;
    svg += circle(x, y, 14 + 70 * L, c1, 0.5 * Math.min(1.1, L * 1.3)) + circle(x, y, 5 + 16 * Math.min(1.3, L), c2, Math.min(1, L * 1.6));
    for (let i = 0; i < Math.round(Math.min(1, L) * 10); i++) { const a = frameNo * 0.03 * (1.7 + (i % 3) * 0.55) * (i % 2 ? 1 : -1) + i * 2.4; const r = (16 + 22 * ((i * 7) % 5) / 4) * (0.55 + 0.6 * Math.min(1.2, L)) * 1.6; svg += circle(x + Math.cos(a) * r, y + Math.sin(a * 1.3) * r * 0.9, 2.6, c2, 0.9); }
    if (isItem && !self) fx.orb = { x, y, flying: false };
  } else if (!(fx.orb && fx.orb.flying)) fx.orb = null;
  if (fx.orb?.flying) {
    fx.orb.t += DT * 1000;
    const k = Math.min(1, fx.orb.t / fx.flightMs);
    const tx = TARGET.x + TARGET.w / 2, ty = TARGET.y + TARGET.h * 0.4;
    const e = k * (2 - k) * 0.4 + k * 0.6;
    const x = fx.orb.fx + (tx - fx.orb.fx) * e, y = fx.orb.fy + (ty - fx.orb.fy) * e - Math.sin(Math.PI * k) * 160;
    fx.trail.unshift({ x, y }); fx.trail.length = Math.min(fx.trail.length, 9);
    fx.trail.forEach((p, i) => { svg += circle(p.x, p.y, 20 * (1 - (i + 1) / 10), '#3fe27a', 0.5 * (1 - (i + 1) / 10)); });
    svg += circle(x, y, 40, '#3fe27a', 0.8) + circle(x, y, 13, '#f2fff4', 1);
    if (k >= 1) { fx.burst = { t: 0, x: tx, y: ty }; fx.orb = null; fx.trail = []; flags.push({ text: 'HEAL LANDS', until: frameNo + 30 }); }
  }
  if (fx.burst) {
    fx.burst.t += DT * 1000;
    const k = Math.min(1, fx.burst.t / 620);
    svg += circle(fx.burst.x, fx.burst.y, 20 + 70 * k, '#f2fff4', 0.9 * (1 - k) * (1 - k)) + `<circle cx="${fx.burst.x}" cy="${fx.burst.y}" r="${10 + 90 * (1 - (1 - k) * (1 - k))}" fill="none" stroke="#3fe27a" stroke-width="3" opacity="${0.9 * (1 - k)}"/>`;
    for (let i = 0; i < 16; i++) { const a = i * 0.39; const d = k * (50 + (i % 4) * 22); svg += circle(fx.burst.x + Math.cos(a) * d, fx.burst.y + Math.sin(a) * d * 0.8 + 90 * k * k, 3.5 * (1 - 0.5 * k), '#b8ffcc', 1 - k); }
    if (k >= 1) fx.burst = null;
  }
  if (fx.flash) {
    fx.flash.t += DT * 1000;
    const k = Math.min(1, fx.flash.t / 360);
    svg += circle(fx.flash.x, fx.flash.y, 30 + 120 * k, '#f0f8ff', 0.95 * (1 - k) * (1 - k)) + `<circle cx="${fx.flash.x}" cy="${fx.flash.y}" r="${14 + 130 * (1 - (1 - k) * (1 - k))}" fill="none" stroke="#7cc4ff" stroke-width="3" opacity="${0.85 * (1 - k)}"/>`;
    if (k >= 1) fx.flash = null;
  }
  if (fx.aura) {
    fx.aura.t += DT * 1000;
    const k = fx.aura.t / 1500;
    if (k > 1.35) fx.aura = null;
    else {
      const lift = Math.sin(Math.PI * Math.min(1, k));
      svg += `<ellipse cx="${fx.aura.x}" cy="${H - 330}" rx="140" ry="310" fill="#3fe27a" opacity="${0.22 * lift}"/>`;
      for (const p of fx.aura.parts) { const f = (fx.aura.t - p.d * 4) / 1100; if (f > 0 && f < 1) svg += circle(fx.aura.x + p.dx * 1.6, H - 50 - p.y0 - f * 480 * p.v * 5, 3.5, '#b8ffcc', Math.sin(Math.PI * f)); }
    }
  }
  if (svg) comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`), left: 0, top: 0 });
  const label = `PASS 2 (P2)  /  ${segName.toUpperCase()}  /  ${Math.round(segT * 1000 / FPS)} ms  (pace x${PACE}; ${an.playing || 'idle'}; glow ${an.charge.toFixed(2)}${an.holding >= 0 ? `; hold ${Math.round(an.holding)} ms` : ''})`;
  const fl = flags.filter((x) => x.until > frameNo).map((x, i) => `<text x="30" y="${96 + i * 28}" font-family="sans-serif" font-size="22" fill="#f0d68a">${x.text}</text>`).join('');
  comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="150"><rect width="${W}" height="44" fill="#0c0a12"/><text x="16" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fff">${label}</text>${fl}</svg>`), left: 0, top: 0 });
  await sharp(bg).composite(comps).jpeg({ quality: 88 }).toFile(path.join(OUT, 'frames', `f${String(frameNo).padStart(6, '0')}.jpg`));
  frameNo++;
  segT++;
}

// ---------------------------------------------------------------------------------------------------- the scenarios: the presenter's calls on a timeline of real ms
let queue = [];
function at(ms, fn) { queue.push([ms, fn]); queue.sort((x, y) => x[0] - y[0]); }
async function run(name, totalMs) {
  segName = name; segT = 0;
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
/** `ms` of the presenter's wait at the pace: base ms times the pace, as `ctx.sleep` does. */
const wait = (base) => Math.max(0, base) * PACE;
function lungeAt(t0, hold) {
  const apex = LUNGE_MS * ATTACK_APEX * PACE, home = LUNGE_MS * (1 - ATTACK_APEX) * PACE;
  const ease = (u) => 1 - (1 - u) * (1 - u);
  for (let k = 0; k <= 60; k++) at(t0 + (apex * k) / 60, () => { lungeX = 0.9 * ease(k / 60); });
  for (let k = 0; k <= 40; k++) at(t0 + apex + hold + (home * k) / 40, () => { lungeX = 0.9 * (1 - ease(k / 40)); });
  return { apex, end: t0 + apex + hold + home };
}
/** The end of an action as `actionEnd` plays it: wait for the clip's end signal, then the idle. */
function finish(t, then = 0) {
  at(t, () => { const lock = an.lead('end'); at(t + then + wait(lock > 0 ? lock : 0) + 1, () => request('idle')); });
}

const SC = {
  attack: () => {
    const t0 = 600;
    at(t0, () => { request('ready'); an.begin('attack', cur, tvel); }); // setPose('ready') then animBegin, the same instant (the presenter's order)
    const camera = 120; // the camera's push-in before the wind-up wait
    at(t0 + camera, () => {
      const w = wait(an.lead('attack'));
      at(t0 + camera + w, () => an.lunge(LUNGE_MS, ATTACK_APEX));
      const l = lungeAt(t0 + camera + w, 40);
      at(t0 + camera + w + l.apex, () => { request('attack'); an.beat('contact', 0, 1, false); flags.push({ text: 'BLOW LANDS', until: frameNo + 30 }); });
      finish(t0 + camera + w + l.apex + wait(240), 0);
    });
    return run('attack', 4600);
  },
  cast: () => {
    const t0 = 500;
    at(t0, () => { request('cast'); an.begin('cast', cur, tvel); });
    const afterHold = t0 + wait(420); // the cast's camera hold
    at(afterHold, () => {
      const lead = an.lead('cast');
      at(afterHold + wait(lead >= 0 ? lead : 380), () => { an.beat('contact', 0, 1, false); flags.push({ text: 'SPELL EFFECT', until: frameNo + 30 }); finish(frameNo * 1000 / FPS + wait(900) - 0, 0); });
    });
    return run('cast', 7600);
  },
  item: () => {
    const t0 = 500;
    at(t0, () => { request('item'); an.begin('item', cur, tvel, false); });
    at(t0 + 60, () => {
      const lead = an.lead('item');
      at(t0 + 60 + wait(lead >= 0 ? lead : 380), () => finish(frameNo * 1000 / FPS + wait(400), 0));
    });
    return run('item', 6400);
  },
  itemSelf: () => {
    const t0 = 500;
    at(t0, () => { request('item'); an.begin('item', cur, tvel, true); });
    at(t0 + 60, () => {
      const lead = an.lead('item');
      at(t0 + 60 + wait(lead >= 0 ? lead : 380), () => { flags.push({ text: 'HEAL LANDS', until: frameNo + 30 }); finish(frameNo * 1000 / FPS + wait(400), 0); });
    });
    return run('itemSelf', 6000);
  },
  hurt: () => { at(300, () => request('hurt')); at(660, () => request('idle')); return run('hurt', 3000); },
  ko: () => { at(400, () => request('ko')); return run('ko', 3800); },
};

an.settle();
for (const s of SEGMENTS) {
  request('idle');
  lungeX = 0;
  fx.orb = fx.burst = fx.flash = fx.aura = null;
  await SC[s]();
  if (s === 'ko') { cur.set(rig.keys.get('idle')); key = 'idle'; an.cancel?.(); }
}
fs.writeFileSync(path.join(OUT, 'sim-P2.json'), JSON.stringify(info, null, 1));
const mp4 = path.join(OUT, 'sim-P2.mp4');
const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(OUT, 'frames', 'f%06d.jpg'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', mp4], { encoding: 'utf8' });
if (r.status !== 0) throw new Error(r.stderr);
console.log('wrote', mp4, frameNo, 'frames');

{ // a contact sheet: a row a segment, ten frames across its length
  const cw = 300, ch = 169, lab = 90;
  const comps = [];
  let row = 0;
  for (const s of SEGMENTS) {
    const seg = info.segments[s];
    if (!seg) continue;
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lab}" height="${ch}"><text x="6" y="24" font-family="sans-serif" font-size="16" fill="#f0d68a">${s.toUpperCase()}</text></svg>`), left: 0, top: row * ch });
    for (let i = 0; i < 10; i++) {
      const n = seg.first + Math.round(((seg.frames - 1) * i) / 9);
      comps.push({ input: await sharp(path.join(OUT, 'frames', `f${String(n).padStart(6, '0')}.jpg`)).resize(cw, ch, { fit: 'fill' }).toBuffer(), left: lab + i * cw, top: row * ch });
    }
    row++;
  }
  await sharp({ create: { width: lab + 10 * cw, height: row * ch, channels: 3, background: '#17141f' } }).composite(comps).png().toFile(path.join(OUT, 'contact-sim-P2.png'));
  console.log('wrote contact-sim-P2.png');
}
