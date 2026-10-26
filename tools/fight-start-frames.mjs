#!/usr/bin/env node
/**
 * Compares the frames two fight-start runs took at the same MOMENTS (`fight-start-timeline.mjs --frames=<dir>`; post-conference lane "post-fight-start", both games; analysis only).
 *
 *   node tools/fight-start-frames.mjs --a=<dir before> --b=<dir after> [--out=<report.json>] [--sheet=<contact-sheet.png>] [--noise=<dir of another run of A>]
 *
 * For each file name both directories hold (`<route>-<chapter>-<cold|warm>-<moment>.png`) it prints the mean absolute difference (0 to 255, over R, G and B) and the share of pixels that differ by more
 * than 24 on any channel, at the frames' own size. A moment that is a still frame of the same field (the first menu) reads near 0; one in the middle of a move (the sweep) reads the width of the move
 * between two takes of the same moment, so `--noise` takes a second run of A (the same build, taken again) and the report puts A-against-A beside A-against-B: the change is real only where B is
 * further from A than A is from itself. `--sheet` writes one PNG with A over B for every moment, scaled to 480 px wide, for a person to look at.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const A = String(args.a);
const B = String(args.b);
const N = args.noise ? String(args.noise) : null;
const names = fs.readdirSync(A).filter((f) => f.endsWith('.png') && fs.existsSync(path.join(B, f))).sort();

async function raw(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Mean absolute difference and the share of pixels over 24 on any channel. */
async function diff(fa, fb) {
  const a = await raw(fa);
  const b = await raw(fb);
  if (a.w !== b.w || a.h !== b.h) return { mad: null, over24: null, note: `size ${a.w}x${a.h} against ${b.w}x${b.h}` };
  let sum = 0;
  let over = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    const d0 = Math.abs(a.data[i] - b.data[i]);
    const d1 = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const d2 = Math.abs(a.data[i + 2] - b.data[i + 2]);
    sum += d0 + d1 + d2;
    if (d0 > 24 || d1 > 24 || d2 > 24) over++;
  }
  const px = a.data.length / 3;
  return { mad: Math.round((sum / (px * 3)) * 100) / 100, over24: Math.round((over / px) * 10000) / 100 };
}

const rows = [];
for (const name of names) {
  const ab = await diff(path.join(A, name), path.join(B, name));
  const aa = N && fs.existsSync(path.join(N, name)) ? await diff(path.join(A, name), path.join(N, name)) : null;
  rows.push({ name, ab, aa });
  console.log(`${name.padEnd(48)} A~B mad ${String(ab.mad).padStart(6)}  over24 ${String(ab.over24).padStart(6)} %${aa ? `   A~A mad ${String(aa.mad).padStart(6)}  over24 ${String(aa.over24).padStart(6)} %` : ''}${ab.note ? `  (${ab.note})` : ''}`);
}
if (args.out) fs.writeFileSync(String(args.out), JSON.stringify({ a: A, b: B, noise: N, rows }, null, 1));
if (args.sheet && names.length) {
  const W = 480;
  const cells = [];
  for (const [i, name] of names.entries()) {
    const a = await sharp(path.join(A, name)).resize({ width: W }).png().toBuffer();
    const b = await sharp(path.join(B, name)).resize({ width: W }).png().toBuffer();
    const meta = await sharp(a).metadata();
    cells.push({ a, b, h: meta.height ?? 270, i });
  }
  const cols = 3;
  const rowsN = Math.ceil(cells.length / cols);
  const cellH = Math.max(...cells.map((c) => c.h));
  const comp = [];
  cells.forEach((c, k) => {
    const x = (k % cols) * (W + 8);
    const y = Math.floor(k / cols) * (cellH * 2 + 16);
    comp.push({ input: c.a, left: x, top: y }, { input: c.b, left: x, top: y + cellH + 4 });
  });
  await sharp({ create: { width: cols * (W + 8), height: rowsN * (cellH * 2 + 16), channels: 3, background: '#111' } }).composite(comp).png().toFile(String(args.sheet));
  console.log(`contact sheet: ${args.sheet} (A over B; ${names.join(', ')})`);
}
