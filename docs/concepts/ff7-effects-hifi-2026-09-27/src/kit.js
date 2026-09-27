// FF7 effects hi-fi options: drawing helpers (shapes, particles, sparks, bloom, heat haze, shake).
// Every shape is drawn here from code; nothing is traced or taken from the game. FF7 ONLY.
import { canvas } from '../../ff7-options-2026-09-27/src/base.js';

export const TAU = Math.PI * 2;
export function zig(a, b, n, amp, R) {
  const pts = [a]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++) { const t = i / n, j = (R() - 0.5) * 2 * amp * Math.sin(Math.PI * t); pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
  pts.push(b); return pts;
}
export function line(g, pts, w, c, cap = 'round') { g.lineWidth = w; g.strokeStyle = c; g.lineJoin = cap === 'round' ? 'round' : 'miter'; g.lineCap = cap; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
export function star(g, x, y, r1, r2, n, rot, fill) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = fill; g.fill(); }
export function orb(g, x, y, r, stops) { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
export function glowDot(g, x, y, r, c, a = 1) { orb(g, x, y, r, [[0, `rgba(255,255,255,${a})`], [0.25, `rgba(${c},${a * 0.8})`], [1, `rgba(${c},0)`]]); }
export function tri(g, x, y, a, len, w, fill) { g.beginPath(); g.moveTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.lineTo(x + Math.cos(a + 1.57) * w, y + Math.sin(a + 1.57) * w); g.lineTo(x + Math.cos(a - 1.57) * w, y + Math.sin(a - 1.57) * w); g.closePath(); g.fillStyle = fill; g.fill(); }
export function shards(g, x, y, n, r0, r1, fill, R, w = 5) { for (let i = 0; i < n; i++) { const a = R() * TAU, r = r0 + R() * (r1 - r0); tri(g, x + Math.cos(a) * r, y + Math.sin(a) * r, a, 18 + R() * 26, w, fill); } }
export function add(g, fn) { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); }
// A tapered beam from a to b, half-width w at b.
export function beam(g, a, b, w, fill, w0 = 0.25) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  g.beginPath(); g.moveTo(a[0] + nx * w * w0, a[1] + ny * w * w0); g.lineTo(b[0] + nx * w, b[1] + ny * w); g.lineTo(b[0] - nx * w, b[1] - ny * w); g.lineTo(a[0] - nx * w * w0, a[1] - ny * w * w0); g.closePath(); g.fillStyle = fill; g.fill();
}
// Particles scattered along a segment (the house option B idea: many small additive sprites).
export function along(g, a, b, n, spread, c, R, size = 4, streak = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  for (let i = 0; i < n; i++) { const t = R(), s = (R() - 0.5) * 2 * spread * (0.3 + t), x = a[0] + dx * t - uy * s, y = a[1] + dy * t + ux * s, r = size * (0.4 + R() * 1.2);
    if (streak) line(g, [[x, y], [x - ux * streak * (0.5 + R()), y - uy * streak * (0.5 + R())]], r * 0.6, `rgba(${c},${0.5 + R() * 0.5})`);
    glowDot(g, x, y, r * 2.4, c, 0.5 + R() * 0.5); }
}
export function cloud(g, x, y, sx, sy, n, c, R, size = 5) { for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()); glowDot(g, x + Math.cos(a) * sx * d, y + Math.sin(a) * sy * d, size * (0.4 + R() * 1.4), c, 0.35 + R() * 0.6); } }
// Sparks: hot curved streaks thrown from p, falling under gravity.
export function sparks(g, p, n, R, o = {}) {
  const c = o.c ?? '255,210,140', dir = o.dir ?? -Math.PI / 2, spread = o.spread ?? Math.PI, len = o.len ?? 120, grav = o.grav ?? 0.9;
  for (let i = 0; i < n; i++) { const a = dir + (R() - 0.5) * spread, v = len * (0.35 + R()), x1 = p[0] + Math.cos(a) * v, y1 = p[1] + Math.sin(a) * v + grav * v * 0.35 * R();
    const mx = p[0] + Math.cos(a) * v * 0.6, my = p[1] + Math.sin(a) * v * 0.6;
    g.lineCap = 'round'; g.lineWidth = 1.2 + R() * 2.2; g.strokeStyle = `rgba(${c},${0.45 + R() * 0.5})`; g.beginPath(); g.moveTo(mx + (x1 - mx) * 0.35, my + (y1 - my) * 0.35); g.quadraticCurveTo(mx + (x1 - mx) * 0.7, my + (y1 - my) * 0.6, x1, y1); g.stroke();
    glowDot(g, x1, y1, 5 + R() * 5, c, 0.9); }
}
// Bloom: the layer blurred at several radii, added.
export function bloom(ctx, layer, levels) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [b, a] of levels) { ctx.filter = `blur(${b}px)`; ctx.globalAlpha = a; ctx.drawImage(layer, 0, 0); } ctx.restore(); }
// Heat haze: re-draw a region in thin horizontal strips, each shifted by a wave.
export function haze(ctx, x0, y0, x1, y1, amp, seed = 0) {
  const w = x1 - x0, h = y1 - y0; const t = canvas(w, h); t.getContext('2d').drawImage(ctx.canvas, x0, y0, w, h, 0, 0, w, h);
  for (let y = 0; y < h; y += 2) { const env = Math.sin((Math.PI * y) / h); const off = Math.sin(y * 0.19 + seed) * amp * env + Math.sin(y * 0.053 + seed * 2) * amp * 0.5 * env; ctx.drawImage(t, 0, y, w, 2, x0 + off, y0 + y, w, 2); }
}
// Camera shake for a still: a ghost of the previous frame and a small offset and roll.
export function shake(ctx, W, H, dx, dy, rot) {
  const t = canvas(W, H); t.getContext('2d').drawImage(ctx.canvas, 0, 0);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1.035, 1.035); ctx.rotate(rot); ctx.translate(-W / 2 + dx, -H / 2 + dy); ctx.drawImage(t, 0, 0); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(W / 2, H / 2); ctx.scale(1.035, 1.035); ctx.translate(-W / 2 - dx * 1.6, -H / 2 - dy * 1.6); ctx.drawImage(t, 0, 0); ctx.restore();
}
// Cel outline: draw a flat-coloured layer with a hard ink edge.
export function inked(ctx, layer, px = 3, ink = '#160f2a') {
  ctx.save(); ctx.filter = `drop-shadow(${px}px 0 0 ${ink}) drop-shadow(-${px}px 0 0 ${ink}) drop-shadow(0 ${px}px 0 ${ink}) drop-shadow(0 -${px}px 0 ${ink})`; ctx.drawImage(layer, 0, 0); ctx.restore();
}
// Radial speed lines around a point (cel look), kept off a clear circle.
export function speedLines(g, p, n, r0, r1, fill, R) { for (let i = 0; i < n; i++) { const a = R() * TAU, w = 2 + R() * 5, rr = r0 + R() * 40; g.beginPath(); g.moveTo(p[0] + Math.cos(a) * r1, p[1] + Math.sin(a) * r1); g.lineTo(p[0] + Math.cos(a + w / r1) * rr, p[1] + Math.sin(a + w / r1) * rr); g.lineTo(p[0] + Math.cos(a - w / r1) * rr, p[1] + Math.sin(a - w / r1) * rr); g.closePath(); g.fillStyle = fill; g.fill(); } }
// A flat, stepped burst for the cel look: outer colour, inner colour, white core.
export function burst(g, p, r, cols, R, n = 12) { cols.forEach((c, i) => { const k = 1 - i * 0.3; g.beginPath(); for (let j = 0; j < n * 2; j++) { const a = (j * Math.PI) / n + i * 0.2, rr = (j % 2 ? r * 0.45 : r * (0.8 + R() * 0.4)) * k; g.lineTo(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr); } g.closePath(); g.fillStyle = c; g.fill(); }); }
// Rectangle corner brackets (the lock-on).
export function brackets(g, b, L, w, c) { const [x0, y0, x1, y1] = b; g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y0 + L); g.lineTo(x0, y0); g.lineTo(x0 + L, y0); g.moveTo(x1 - L, y0); g.lineTo(x1, y0); g.lineTo(x1, y0 + L); g.moveTo(x1, y1 - L); g.lineTo(x1, y1); g.lineTo(x1 - L, y1); g.moveTo(x0 + L, y1); g.lineTo(x0, y1); g.lineTo(x0, y1 - L); g.stroke(); }
