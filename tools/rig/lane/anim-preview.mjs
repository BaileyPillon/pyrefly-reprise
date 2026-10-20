/**
 * **Draw a rig's poses and clips as a colour contact sheet, no browser** (the animation prototype's authoring tool; both games; `docs/handoff/anim-proto.md`). The rig's own maths
 * (`rig-pose.mjs`, the gate's) skins every part; the part PNGs are painted with their texture colours, back to front, so a pose or a moment of a clip can be LOOKED at while it is authored.
 *
 *   node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out sheet.png --keys idle,ready,attack,follow,cast,item,hurt,ko,victory
 *   node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out sheet.png --subject lulu --style B --clip strike [--from ready] [--n 9] [--times 0,60,120]
 *   node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out sheet.png --subject lulu --specfile poses.json   (a list of {label, pose: PoseSpec} cells, pose authoring)
 *
 * `--clip` is a name of the library (`ready`, `windup`, `strike`, `follow`, `cast`, `item`, `hurt`, `ko`, `victory`, `recover:<key>`, and the style's `extra` clips; `--defs <file.mjs>` adds ClipDefs by name). Cells are the clip's own marks plus evenly spaced times unless
 * `--times` (ms) is given; each cell is labelled with its time and the mark it is on. `--scale` is raster px per painting px (default 0.26).
 * Only reads: the rig folder, the sources under `src/engine/rig/anim/` (Node strips their types), and writes the one PNG.
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { carrySkeleton, loadTextures, render, toGatePose } from './anim-draw.mjs';
import { libraryFor } from '../../../src/engine/rig/anim/AnimLibrary2.ts';
import { compileClip, compilePose, sampleClip, unwrapTargets } from '../../../src/engine/rig/anim/AnimClip.ts';
import { STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { clipRigOf } from './anim-rig.mjs';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { LULU_KNEE } from '../../../src/engine/rig/anim/LuluAnim3.ts';
import { Carry } from '../../../src/engine/rig/anim/AnimCarry.ts';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []));

async function main() {
  const { raw, dir } = readRigFile(args.rig);
  const { rt, problems } = normaliseRig(raw, { dir });
  if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
  await loadTextures(rt, dir);
  if (args.bend) rt.bendSpec = LULU_KNEE; // pass 3: the knee of a skirt with no legs (`--bend`: the pseudo-bone `@bend` carries it)
  const rig = clipRigOf(rt, Boolean(args.bend));
  const scale = Number(args.scale ?? 0.26);
  const frame = { W: Math.round(rt.image.w * 2.1 * scale), H: Math.round(rt.image.h * scale), sx: scale, sy: scale, ox: rt.image.w * 0.45 * scale, oy: 0 };
  const cells = [];
  if (args.spec || args.specfile) {
    // --spec '[{"label":"a","pose":{"base":"cast","add":{...}}}, ...]'
    const carry = args.subject === 'lulu' ? Carry.create(rt.bones, rig.boneIndex, LULU.attach, carrySkeleton(rt)) : null;
    for (const c of JSON.parse(args.specfile ? fs.readFileSync(String(args.specfile), 'utf8') : String(args.spec))) {
      const ch = compilePose(rig, c.pose);
      if (carry && c.carry !== false) { const o = carry.offsetsOf([rig.keys.get(c.pose.base)]); carry.place(ch, o, o, 0, 1); }
      cells.push({ label: c.label, ch });
    }
  } else if (args.keys) {
    for (const name of String(args.keys).split(',')) cells.push({ label: name, ch: rig.keys.get(name) });
  } else {
    const style = STYLES[String(args.style ?? 'A').toUpperCase()];
    const lib = libraryFor(style, args.subject === 'lulu' ? LULU_ACCENTS : {}, args.subject === 'lulu' ? LULU.p2 : undefined, undefined, args.subject === 'lulu' ? LULU.p3 : undefined);
    const defs = { ready: lib.ready, windup: lib.windup, strike: lib.strike, follow: lib.follow, cast: lib.cast, item: lib.item, hurt: lib.hurt, ko: lib.ko, victory: lib.victory, ...(lib.itemSelf ? { itemSelf: lib.itemSelf } : {}), ...(lib.extra ?? {}), ...(args.defs ? (await import(pathToFileURL(String(args.defs)).href)).default : {}) };
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
    const targets = unwrapTargets(c, from);
    for (const t of times) {
      sampleClip(c, t, from, out, undefined, targets, live);
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
    const buf = render(rt, toGatePose(cells[i].ch, rt.bones.length), frame);
    const png = await sharp(buf, { raw: { width: frame.W, height: frame.H, channels: 4 } }).png().toBuffer();
    const x = (i % per) * frame.W, y = Math.floor(i / per) * (frame.H + 24);
    comps.push({ input: png, left: x, top: y + 24 });
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${frame.W}" height="24"><text x="6" y="17" font-family="sans-serif" font-size="14" fill="#f0d68a">${cells[i].label}</text></svg>`), left: x, top: y });
  }
  await sharp({ create: { width: per * frame.W, height: rows * (frame.H + 24), channels: 4, background: bg } }).composite(comps).png().toFile(String(args.out));
  console.log('wrote', args.out, cells.length, 'cells');
}

main().catch((e) => { console.error(e); process.exit(1); });
