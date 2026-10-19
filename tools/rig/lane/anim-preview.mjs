/**
 * **Draw a rig's poses and clips as a colour contact sheet, no browser** (the animation prototype's authoring tool; both games; `docs/handoff/anim-proto.md`). The rig's own maths
 * (`rig-pose.mjs`, the gate's) skins every part; the part PNGs are painted with their texture colours, back to front, so a pose or a moment of a clip can be LOOKED at while it is authored.
 *
 *   node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out sheet.png --keys idle,ready,attack,follow,cast,item,hurt,ko,victory
 *   node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out sheet.png --subject lulu --style B --clip strike [--from ready] [--n 9] [--times 0,60,120]
 *
 * `--clip` is a name of the library (`ready`, `windup`, `strike`, `follow`, `cast`, `item`, `hurt`, `ko`, `victory`, `recover:<key>`). Cells are the clip's own marks plus evenly spaced times unless
 * `--times` (ms) is given; each cell is labelled with its time and the mark it is on. `--scale` is raster px per painting px (default 0.26).
 * Only reads: the rig folder, the sources under `src/engine/rig/anim/` (Node strips their types), and writes the one PNG.
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { solve, skinPart, through } from '../rig-pose.mjs';
import { buildLibrary } from '../../../src/engine/rig/anim/AnimLibrary.ts';
import { compileClip, compilePose, sampleClip } from '../../../src/engine/rig/anim/AnimClip.ts';
import { STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { clipRigOf } from './anim-rig.mjs';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { Carry } from '../../../src/engine/rig/anim/AnimCarry.ts';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []));

const toGatePose = (ch) => ({ bones: Float64Array.from(ch), root: [0, 0, 0] });

/** The rig-pose maths as the carry's skeleton: world matrices from the skin matrices' linear part and the joints. */
function carrySkeleton(rt) {
  const m = new Float64Array(rt.bones.length * 6);
  let k = null;
  return {
    m,
    solve(pose) {
      const r = solve(rt, toGatePose(pose));
      k = r.k;
      for (let i = 0; i < rt.bones.length; i++) { m[i * 6] = k[i * 6]; m[i * 6 + 1] = k[i * 6 + 1]; m[i * 6 + 2] = k[i * 6 + 2]; m[i * 6 + 3] = k[i * 6 + 3]; m[i * 6 + 4] = r.joints[i * 2]; m[i * 6 + 5] = r.joints[i * 2 + 1]; }
    },
    landmark(name, out = { x: 0, y: 0 }) {
      const l = rt.landmarks[name];
      if (!l || !k) return null;
      const [x, y] = through(k, l.bone, l.x, l.y);
      out.x = x; out.y = y;
      return out;
    },
  };
}

async function loadTextures(rt, dir) {
  await Promise.all(rt.parts.map(async (p) => {
    const { data, info } = await sharp(join(dir, p.png)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    p.tex = { data, w: info.width, h: info.height };
  }));
}

function sample(tex, tx, ty, out) {
  const x = Math.min(tex.w - 1, Math.max(0, Math.round(tx - 0.5)));
  const y = Math.min(tex.h - 1, Math.max(0, Math.round(ty - 0.5)));
  const o = (y * tex.w + x) * 4;
  out[0] = tex.data[o]; out[1] = tex.data[o + 1]; out[2] = tex.data[o + 2]; out[3] = tex.data[o + 3] / 255;
}

/** One pose as an RGBA buffer (W x H, straight alpha over transparent). */
export function render(rt, pose, frame) {
  const { W, H, sx, sy, ox, oy } = frame;
  const acc = new Float32Array(W * H * 4); // premultiplied
  const { k } = solve(rt, pose);
  const px = [0, 0, 0, 0];
  for (const part of rt.parts) {
    if (part.hidden) continue;
    const n = part.verts.length / 2;
    const posed = new Float64Array(n * 2);
    skinPart(part, k, posed);
    const X = new Float64Array(n), Y = new Float64Array(n), U = new Float64Array(n), V = new Float64Array(n);
    for (let i = 0; i < n; i++) { X[i] = posed[i * 2] * sx + ox; Y[i] = posed[i * 2 + 1] * sy + oy; U[i] = part.tuv[i * 2] * part.tex.w; V[i] = part.tuv[i * 2 + 1] * part.tex.h; }
    const layer = new Float32Array(W * H * 4);
    for (let t = 0; t < part.tris.length; t += 3) {
      const a = part.tris[t], b = part.tris[t + 1], c = part.tris[t + 2];
      const den = (Y[b] - Y[c]) * (X[a] - X[c]) + (X[c] - X[b]) * (Y[a] - Y[c]);
      if (Math.abs(den) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(X[a], X[b], X[c]) - 0.5)), maxX = Math.min(W - 1, Math.ceil(Math.max(X[a], X[b], X[c]) + 0.5));
      const minY = Math.max(0, Math.floor(Math.min(Y[a], Y[b], Y[c]) - 0.5)), maxY = Math.min(H - 1, Math.ceil(Math.max(Y[a], Y[b], Y[c]) + 0.5));
      const inv = 1 / den;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const qx = x + 0.5, qy = y + 0.5;
        const l0 = ((Y[b] - Y[c]) * (qx - X[c]) + (X[c] - X[b]) * (qy - Y[c])) * inv;
        const l1 = ((Y[c] - Y[a]) * (qx - X[c]) + (X[a] - X[c]) * (qy - Y[c])) * inv;
        const l2 = 1 - l0 - l1;
        if (l0 < -0.02 || l1 < -0.02 || l2 < -0.02) continue;
        sample(part.tex, l0 * U[a] + l1 * U[b] + l2 * U[c], l0 * V[a] + l1 * V[b] + l2 * V[c], px);
        const o = (y * W + x) * 4;
        if (px[3] > layer[o + 3]) { layer[o] = px[0]; layer[o + 1] = px[1]; layer[o + 2] = px[2]; layer[o + 3] = px[3]; }
      }
    }
    for (let i = 0; i < W * H; i++) {
      const a = layer[i * 4 + 3];
      if (a <= 0) continue;
      const o = i * 4;
      const ia = 1 - a;
      acc[o] = layer[o] * a + acc[o] * ia; acc[o + 1] = layer[o + 1] * a + acc[o + 1] * ia; acc[o + 2] = layer[o + 2] * a + acc[o + 2] * ia; acc[o + 3] = a + acc[o + 3] * ia;
    }
  }
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = acc[i * 4 + 3];
    out[i * 4 + 3] = Math.round(a * 255);
    if (a > 0) for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round(acc[i * 4 + c] / a * 1)); // acc holds colour weighted by coverage; divide back
  }
  return out;
}

async function main() {
  const { raw, dir } = readRigFile(args.rig);
  const { rt, problems } = normaliseRig(raw, { dir });
  if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
  await loadTextures(rt, dir);
  const rig = clipRigOf(rt);
  const scale = Number(args.scale ?? 0.26);
  const frame = { W: Math.round(rt.image.w * 2.1 * scale), H: Math.round(rt.image.h * scale), sx: scale, sy: scale, ox: rt.image.w * 0.45 * scale, oy: 0 };
  const cells = [];
  if (args.spec) {
    // --spec '[{"label":"a","pose":{"base":"cast","add":{...}}}, ...]'
    const carry = args.subject === 'lulu' ? Carry.create(rt.bones, rig.boneIndex, LULU.attach, carrySkeleton(rt)) : null;
    for (const c of JSON.parse(String(args.spec))) {
      const ch = compilePose(rig, c.pose);
      if (carry && c.carry !== false) { const o = carry.offsetsOf([rig.keys.get(c.pose.base)]); carry.place(ch, o, o, 0, 1); }
      cells.push({ label: c.label, ch });
    }
  } else if (args.keys) {
    for (const name of String(args.keys).split(',')) cells.push({ label: name, ch: rig.keys.get(name) });
  } else {
    const style = STYLES[String(args.style ?? 'A').toUpperCase()];
    const lib = buildLibrary(style, args.subject === 'lulu' ? LULU_ACCENTS : {});
    const defs = { ready: lib.ready, windup: lib.windup, strike: lib.strike, follow: lib.follow, cast: lib.cast, item: lib.item, hurt: lib.hurt, ko: lib.ko, victory: lib.victory };
    const name = String(args.clip);
    const def = name.startsWith('recover:') ? lib.recover(name.slice(8)) : defs[name];
    if (!def) throw new Error(`no clip ${name}`);
    const c = compileClip(rig, def);
    const from = rig.keys.get(String(args.from ?? 'idle'));
    const times = args.times ? String(args.times).split(',').map(Number) : [...new Set([0, ...Object.values(c.marks), ...Array.from({ length: Number(args.n ?? 8) }, (_, i) => Math.round((c.total * (i + 1)) / Number(args.n ?? 8)))])].sort((a, b) => a - b);
    const marksAt = Object.entries(c.marks);
    const out = new Float64Array(rig.channels);
    const carry = args.subject === 'lulu' ? Carry.create(rt.bones, rig.boneIndex, LULU.attach, carrySkeleton(rt)) : null;
    const offs = carry ? carry.offsetsOf(c.target) : null;
    const fromOff = new Float64Array(2);
    carry?.offsetOf(from, fromOff, 0);
    const live = { alive: 1, sec: 1, seg: 0, e: 1 };
    for (const t of times) {
      sampleClip(c, t, from, out, undefined, undefined, live);
      carry?.place(out, offs, fromOff, live.seg, live.e);
      const mk = marksAt.filter(([, v]) => Math.abs(v - t) < 0.5).map(([k]) => k).join('+');
      cells.push({ label: `${Math.round(t)} ms${mk ? ' ' + mk : ''}`, ch: Float64Array.from(out) });
    }
    console.log(JSON.stringify({ clip: c.name, style: style.id, total: c.total, marks: c.marks, times }));
  }
  const bg = { r: 38, g: 34, b: 50, alpha: 1 };
  const per = Number(args.cols ?? Math.min(cells.length, 9));
  const rows = Math.ceil(cells.length / per);
  const comps = [];
  for (let i = 0; i < cells.length; i++) {
    const buf = render(rt, toGatePose(cells[i].ch), frame);
    const png = await sharp(buf, { raw: { width: frame.W, height: frame.H, channels: 4 } }).png().toBuffer();
    const x = (i % per) * frame.W, y = Math.floor(i / per) * (frame.H + 24);
    comps.push({ input: png, left: x, top: y + 24 });
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${frame.W}" height="24"><text x="6" y="17" font-family="sans-serif" font-size="14" fill="#f0d68a">${cells[i].label}</text></svg>`), left: x, top: y });
  }
  await sharp({ create: { width: per * frame.W, height: rows * (frame.H + 24), channels: 4, background: bg } }).composite(comps).png().toFile(String(args.out));
  console.log('wrote', args.out, cells.length, 'cells');
}

main().catch((e) => { console.error(e); process.exit(1); });
