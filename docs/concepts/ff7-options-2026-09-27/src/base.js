// FF7 options round (2026-09-27): shared drawing for the concept frames.
// Nothing here is game code. Every frame is composited over the builder's real
// frames of the hidden FF7 fight (branch ff7-integration, commit 3d68c9f3) and a
// clean plate made from our own backdrop painting (tools: cut.py, tall.py).
// No retail material: every effect, window and pose is drawn here from written
// descriptions (see the README for the sources).

export const A = {};
const S = '/s/'; // scratch assets (plates, cut-outs, frames), served by render.mjs

// Fitted screen rects of our paintings in the 1600x900 frame (fitpaint.py).
export const FIT = {
  cloud: { x: 1270, y: 382, w: 114, h: 216 },
  barret: { x: 1174, y: 323, w: 123, h: 207 },
  'boss-up': { x: 287, y: 297, w: 372, h: 259 },
  'boss-down': { x: 235, y: 320, w: 424, h: 236 },
};
// Key points in frame pixels.
export const P = {
  cloudC: { x: 1328, y: 482 }, cloudHead: { x: 1345, y: 412 }, cloudFeet: { x: 1327, y: 598 },
  barretC: { x: 1236, y: 420 }, barretHead: { x: 1250, y: 345 }, barretFeet: { x: 1236, y: 530 }, barretGun: { x: 1176, y: 389 },
  bossC: { x: 452, y: 432 }, bossTop: { x: 450, y: 360 }, bossEye: { x: 588, y: 447 },
  gunA: { x: 664, y: 478 }, gunB: { x: 664, y: 493 },
  tailDown: { x: 272, y: 348 }, tailUp: { x: 420, y: 330 },
  strike: { x: 840, y: 575 },
};

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
}
export async function load() {
  const list = {
    empty: 'base-empty.jpg', up: 'base-up.jpg', down: 'base-down.jpg', noboss: 'base-noboss.jpg', tall: 'plate-tall.jpg',
    cloud: 'fig-cloud.png', barret: 'fig-barret.png', 'boss-up': 'fig-boss-up.png', 'boss-down': 'fig-boss-down.png',
    headCloud: 'head-cloud.png', headBarret: 'head-barret.png', board: 'board-1600.jpg',
  };
  const frames = ['tail-laser', 'melee-strike', 'victory', 'defeat', 'door', 'opening', 'turn'];
  for (const f of frames) list['f1600-' + f] = `frames/game-1600x900-${f}.jpg`;
  for (const f of ['hint-3', 'turn', 'tail-laser']) list['f390-' + f] = `frames/game-390x844-${f}.jpg`;
  await Promise.all(Object.entries(list).map(async ([k, v]) => { A[k] = await loadImg(S + v); }));
  const ff = new FontFace('FF7', `url(${S}mplus.woff2)`);
  await ff.load(); document.fonts.add(ff);
}

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Seeded random, so every render is the same.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// One fighter from our painting, optionally moved, turned, flashed white or faded.
export function fig(ctx, key, o = {}) {
  const r = FIT[key]; const img = A[key];
  const w = r.w * (o.scale ?? 1), h = r.h * (o.scale ?? 1);
  const x = r.x + (o.dx ?? 0), y = r.y + (o.dy ?? 0) + (r.h - h);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  const px = x + w / 2, py = y + h; // pivot at the feet
  ctx.translate(px, py); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
  if (o.flash || o.tint) {
    const c = canvas(Math.ceil(w), Math.ceil(h)); const g = c.getContext('2d');
    g.drawImage(img, 0, 0, w, h); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = o.tint ?? `rgba(255,255,255,${o.flash})`; g.fillRect(0, 0, w, h);
    ctx.drawImage(c, -w / 2, -h);
  } else ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

// The battle scene: our plate, the boss (tail up / down / gone) and the party.
// who: { boss: {dx, flash, alpha, echo}, cloud: {...}|false, barret: {...}|false }
export function scene(ctx, o = {}) {
  ctx.drawImage(A.empty, 0, 0, 1600, 900);
  const bk = o.tail === 'up' ? 'boss-up' : o.tail === 'down' ? 'boss-down' : null;
  if (bk && o.boss !== false) {
    const b = o.boss ?? {};
    if (b.echo) fig(ctx, bk, { alpha: 0.28 });
    fig(ctx, bk, b);
  }
  if (o.barret !== false) fig(ctx, 'barret', o.barret ?? {});
  if (o.cloud !== false) fig(ctx, 'cloud', o.cloud ?? {});
  if (o.band === false) { ctx.drawImage(A.empty, 0, 636, 1600, 264, 0, 636, 1600, 264); }
}

// ---- FF7 window material (docs/plans/ff7-hud-faithful-a-spec.md 3.1, 5.3) ----
const TL = [0, 0, 176], TR = [0, 0, 128], BL = [0, 0, 80], BR = [0, 0, 32];
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function win(ctx, x, y, w, h, o = {}) {
  const u = o.u ?? 2; // px per bevel step (1600 frame: 2)
  const rad = u * 4;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.clip();
  const n = Math.max(8, Math.ceil(h / 3));
  for (let i = 0; i < n; i++) { // bilinear four-corner gradient, strip by strip
    const t = i / (n - 1); const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, `rgb(${lerp(TL, BL, t)})`); g.addColorStop(1, `rgb(${lerp(TR, BR, t)})`);
    ctx.fillStyle = g; ctx.fillRect(x, y + (h * i) / n, w, h / n + 1);
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = Math.min(1, (o.alpha ?? 1) + 0.15);
  const greys = ['#6C6C6C', '#939393', '#B7B7B7', '#9C9C9C', '#575757', '#272727'];
  greys.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = u; const d = u * i + u / 2; ctx.beginPath(); ctx.roundRect(x + d, y + d, w - 2 * d, h - 2 * d, Math.max(0, rad - d)); ctx.stroke(); });
  ctx.restore();
}
export function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight ?? 500} ${o.size ?? 46}px FF7, sans-serif`;
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic';
  const sh = Math.max(2, Math.round((o.size ?? 46) / 16));
  ctx.fillStyle = '#1a1a1a'; ctx.fillText(s, x + sh, y + sh);
  ctx.fillStyle = o.color ?? '#f4f4f4'; ctx.fillText(s, x, y);
  ctx.restore();
}
export function label(ctx, s, x, y, o = {}) { // tiny header caps (spec 3.2)
  ctx.save(); ctx.font = `700 ${o.size ?? 17}px FF7, sans-serif`; ctx.textAlign = o.align ?? 'left';
  ctx.lineWidth = 4; ctx.strokeStyle = '#181818'; ctx.strokeText(s, x, y); ctx.fillStyle = '#ACACAC'; ctx.fillText(s, x, y); ctx.restore();
}
// Top message window of the fight (the ability name or a line).
export function msg(ctx, s) { win(ctx, 86, 38, 1428, 80, { alpha: 0.88 }); txt(ctx, s, 800, 94, { align: 'center' }); }
// Damage / heal numerals.
export function num(ctx, s, x, y, color = '#ffffff', size = 70) {
  ctx.save(); ctx.font = `800 ${size}px FF7, sans-serif`; ctx.textAlign = 'center';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#141414'; ctx.strokeText(s, x, y);
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
// Finger cursor (our own simple glove shape, not the retail sprite).
export function finger(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-62, -14, 40, 28, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-30, -10, 34, 12, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-40, 0, 22, 12, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// Draw a crop of a 1600x900 source canvas into a panel canvas.
export function crop(dst, src, r) {
  const g = dst.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(src, r[0], r[1], r[2] - r[0], r[3] - r[1], 0, 0, dst.width, dst.height);
}
