// The driver's three states on the same frozen frame: 1 today, 2 figures true (the switch on), 3 the whole frame true.
//   node mkstills3.mjs <outDir> <chapter> <lead,figs,for,the,caption> <fig,fig,...strips>
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import sharp from 'file:///D:/pyrefly-r39-color/node_modules/sharp/dist/index.mjs';
const [outDir, chapter, leadArg, figArg] = process.argv.slice(2);
const R = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs';
mkdirSync(outDir, { recursive: true });
const frame = (tag, v) => `${R}/${tag}/${chapter}/${v}/canvas.png`;
const res = (tag, v) => (existsSync(`${R}/${tag}/${chapter}/${v}/result.json`) ? JSON.parse(readFileSync(`${R}/${tag}/${chapter}/${v}/result.json`, 'utf8')) : null);
const STATES = [['t0', '1-today', 'TODAY'], ['tf', '2-figures-true', 'FIGURES TRUE  (the switch on)'], ['tw', '3-whole-frame-true', 'THE WHOLE FRAME TRUE  (sRGB encode at the end)']];
for (const [v, name] of STATES) await sharp(frame('ab3', v)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${outDir}/${chapter}-${name}.jpg`);
if (existsSync(frame('ab38', 't0'))) await sharp(frame('ab38', 't0')).jpeg({ quality: 88, mozjpeg: true }).toFile(`${outDir}/${chapter}-live38.jpg`);
// caption numbers: the mean over the lead figures
const lead = leadArg.split(',');
const caption = (v) => {
  const r = res('ab3', v); const f = lead.map((id) => r.figures.find((x) => x.id === id)).filter((x) => x && x.render);
  const m = (g) => f.reduce((s, x) => s + g(x), 0) / f.length;
  return `dE00 ${m((x) => x.de00.median).toFixed(1)}   chroma ${m((x) => x.render.chroma / x.source.chroma).toFixed(2)}x   halo ${m((x) => x.halo.excess).toFixed(0)}   (mean of ${lead.join(', ')})`;
};
const cellW = 1100; const cellH = Math.round(cellW * 1440 / 2560);
const comps = [];
for (let i = 0; i < STATES.length; i++) {
  const [v, , label] = STATES[i];
  const buf = await sharp(frame('ab3', v)).resize(cellW, cellH, { kernel: 'lanczos3' }).removeAlpha().toBuffer();
  const svg = Buffer.from(`<svg width="${cellW}" height="96" xmlns="http://www.w3.org/2000/svg"><text x="16" y="40" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">${i + 1}  ${label.replace(/&/g, '&amp;')}</text><text x="16" y="80" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="bold" fill="#ffe9a0" stroke="#000" stroke-width="5" paint-order="stroke">${caption(v)}</text></svg>`);
  comps.push({ input: buf, left: i * cellW, top: 0 }, { input: svg, left: i * cellW, top: 0 });
}
await sharp({ create: { width: STATES.length * cellW, height: cellH, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 88, mozjpeg: true }).toFile(`${outDir}/${chapter}-sheet.jpg`);
// per figure at 100 percent: live 38 | today | figures true | whole frame true | the painting
const CELLS = [['ab38', 't0'], ['ab3', 't0'], ['ab3', 'tf'], ['ab3', 'tw']];
for (const id of figArg.split(',')) {
  const base = res('ab3', 't0'); const f = base && base.figures.find((x) => x.id === id);
  if (!f || !f.box) { console.log('no figure', id); continue; }
  const W = f.box.w, H = f.box.h; const bufs = [];
  for (const [tag, v] of CELLS) {
    const r = res(tag, v); const g = r && r.figures.find((x) => x.id === id);
    if (!g || !g.box) { bufs.push(await sharp({ create: { width: W, height: H, channels: 3, background: '#111' } }).png().toBuffer()); continue; }
    const cw = Math.min(W, g.box.w), ch = Math.min(H, g.box.h);
    const crop = await sharp(frame(tag, v)).extract({ left: g.box.x, top: g.box.y, width: cw, height: ch }).removeAlpha().toBuffer();
    bufs.push(await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite([{ input: crop, left: 0, top: 0 }]).png().toBuffer());
  }
  bufs.push(await sharp(`${R}/ab3/${chapter}/t0/fig-${id}-${f.slot}.jpg`).extract({ left: W, top: 0, width: W, height: H }).toBuffer());
  await sharp({ create: { width: W * bufs.length, height: H, channels: 3, background: '#000' } }).composite(bufs.map((input, i) => ({ input, left: i * W, top: 0 }))).jpeg({ quality: 90, mozjpeg: true }).toFile(`${outDir}/${chapter}-${id}-strip.jpg`);
  console.log(`${chapter} ${id}: strip of ${bufs.length} cells ${W}x${H}: live 38 | today (r39-int) | figures true | whole frame true | the painting`);
}
