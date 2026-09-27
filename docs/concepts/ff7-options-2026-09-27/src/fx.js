// FF7 options round, item A: three original treatments of the fight's action effects.
//   hard   (A1 "Hard light"):  flat polygon shapes, additive, crisp edges, no bloom.
//   soft   (A2 "Painted glow"): the house spell-FX option B method: soft particles and bloom.
//   hybrid (A3 "Hard core, painted light"): A1's shapes plus a glow pass and light cast on the scene.
// Coordinates are frame pixels (1600x900). Every shape is drawn here; nothing is traced.
import { P, rng, canvas } from './base.js';

// ---------- helpers ----------
function zig(x0, y0, x1, y1, n, amp, R) {
  const pts = [[x0, y0]]; const dx = x1 - x0, dy = y1 - y0; const len = Math.hypot(dx, dy); const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) { const t = i / n; const j = (R() - 0.5) * 2 * amp * Math.sin(Math.PI * t); pts.push([x0 + dx * t + nx * j, y0 + dy * t + ny * j]); }
  pts.push([x1, y1]); return pts;
}
function path(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); }
function smooth(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); }
function stroke(ctx, pts, w, c, join = 'miter', soft = false) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = join; ctx.lineCap = join === 'miter' ? 'butt' : 'round'; (soft ? smooth : path)(ctx, pts); ctx.stroke(); }
function star(ctx, x, y, r1, r2, n, rot, fill) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i * Math.PI) / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function tri(ctx, x, y, a, len, w, fill) { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.lineTo(x + Math.cos(a + 1.57) * w, y + Math.sin(a + 1.57) * w); ctx.lineTo(x + Math.cos(a - 1.57) * w, y + Math.sin(a - 1.57) * w); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function shards(ctx, x, y, n, r0, r1, fill, R, w = 5) { for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2; const r = r0 + R() * (r1 - r0); tri(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, a, 18 + R() * 26, w, fill); } }
function orb(ctx, x, y, r, stops) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function motes(ctx, x, y, sx, sy, n, color, R, size = 6) { for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * 2 * sx, py = y + (R() - 0.5) * 2 * sy; const r = size * (0.4 + R()); orb(ctx, px, py, r * 2.2, [[0, color], [1, 'rgba(0,0,0,0)']]); } }
function diamond(ctx, x, y, r, fill) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.35, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.35, y); ctx.closePath(); ctx.moveTo(x - r, y); ctx.lineTo(x, y - r * 0.35); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 0.35); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function crystal(ctx, x, y, len, wid, a, light, dark) { // a two-facet prism shard, point up along angle a
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const tip = [x + ux * len, y + uy * len], mid = [x + ux * len * 0.72, y + uy * len * 0.72];
  const l = [x + vx * wid, y + vy * wid], r = [x - vx * wid, y - vy * wid];
  const ml = [mid[0] + vx * wid, mid[1] + vy * wid], mr = [mid[0] - vx * wid, mid[1] - vy * wid];
  ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(...l); ctx.lineTo(...ml); ctx.lineTo(...tip); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(...r); ctx.lineTo(...mr); ctx.lineTo(...tip); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...ml); ctx.lineTo(...tip); ctx.lineTo(...mr); ctx.lineTo(...r); ctx.stroke();
}
function bez(p0, c, p1, t) { const u = 1 - t; return [u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, u * u * p0.y + 2 * u * t * c.y + t * t * p1.y]; }
function add(ctx, fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }

// ---------- the nine moments: hard (A1) and soft (A2) ----------
const HIT = { bolt: { x: 455, y: 405 }, ice: { x: 450, y: 450 } };
export const FX = {
  bolt: {
    light: { ...HIT.bolt, c: '255,240,150' },
    hard(ctx) { const R = rng(11); add(ctx, () => { for (let k = 0; k < 3; k++) { const pts = zig(HIT.bolt.x + (k - 1) * 40, -20, HIT.bolt.x + (k - 1) * 8, HIT.bolt.y, 10, 46, R); stroke(ctx, pts, 30, 'rgba(255,214,40,0.55)'); stroke(ctx, pts, 13, 'rgba(255,250,150,0.95)'); stroke(ctx, pts, 5, '#ffffff'); }
      star(ctx, HIT.bolt.x, HIT.bolt.y, 150, 34, 9, 0.2, 'rgba(255,240,120,0.85)'); star(ctx, HIT.bolt.x, HIT.bolt.y, 80, 20, 9, 0.5, '#ffffff'); shards(ctx, HIT.bolt.x, HIT.bolt.y, 18, 90, 210, 'rgba(255,245,160,0.95)', R); });
      ctx.fillStyle = 'rgba(255,250,215,0.10)'; ctx.fillRect(0, 0, 1600, 636); },
    soft(ctx) { const R = rng(12); add(ctx, () => { orb(ctx, HIT.bolt.x, HIT.bolt.y, 300, [[0, 'rgba(255,245,190,0.75)'], [0.4, 'rgba(255,215,90,0.28)'], [1, 'rgba(0,0,0,0)']]);
      ctx.shadowColor = 'rgba(255,225,120,1)'; ctx.shadowBlur = 40; for (let k = 0; k < 2; k++) { const pts = zig(HIT.bolt.x + (k ? 30 : -25), -20, HIT.bolt.x, HIT.bolt.y, 9, 34, R); stroke(ctx, pts, 16, 'rgba(255,230,140,0.6)', 'round', true); stroke(ctx, pts, 6, '#fffbe8', 'round', true); }
      ctx.shadowBlur = 0; motes(ctx, HIT.bolt.x, HIT.bolt.y, 190, 120, 60, 'rgba(255,240,170,0.8)', R, 5); }); },
  },
  ice: {
    light: { ...HIT.ice, c: '150,230,255' },
    hard(ctx) { const R = rng(21); const base = 556; const xs = [270, 320, 370, 420, 470, 520, 570, 620, 660];
      xs.forEach((x, i) => { const a = -Math.PI / 2 + (x < 460 ? 0.28 : -0.28) * (0.4 + R()); crystal(ctx, x, base + 4, 110 + R() * 110, 16 + R() * 10, a, 'rgba(200,245,255,0.92)', 'rgba(60,150,215,0.9)'); });
      crystal(ctx, 452, 470, 150, 24, -Math.PI / 2, 'rgba(225,250,255,0.9)', 'rgba(80,170,230,0.88)');
      add(ctx, () => { for (let i = 0; i < 14; i++) diamond(ctx, 250 + R() * 440, 330 + R() * 220, 10 + R() * 12, 'rgba(255,255,255,0.95)'); }); },
    soft(ctx) { const R = rng(22); add(ctx, () => { for (let i = 0; i < 26; i++) orb(ctx, 250 + R() * 420, 360 + R() * 210, 70 + R() * 70, [[0, 'rgba(170,225,255,0.22)'], [1, 'rgba(0,0,0,0)']]); });
      const c = canvas(1600, 900); const g = c.getContext('2d'); [300, 380, 460, 540, 620].forEach((x, i) => crystal(g, x, 560, 90 + R() * 80, 18, -Math.PI / 2 + (i - 2) * 0.12, 'rgba(215,245,255,0.7)', 'rgba(110,180,230,0.6)'));
      ctx.save(); ctx.filter = 'blur(3px)'; ctx.drawImage(c, 0, 0); ctx.restore(); add(ctx, () => motes(ctx, 452, 420, 230, 140, 70, 'rgba(230,248,255,0.8)', R, 4)); },
  },
  cure: {
    light: { x: 1328, y: 480, c: '120,255,160' },
    hard(ctx) { const R = rng(31); const x = 1328; add(ctx, () => { const g = ctx.createLinearGradient(0, 360, 0, 610); g.addColorStop(0, 'rgba(120,255,170,0)'); g.addColorStop(1, 'rgba(120,255,170,0.35)'); ctx.fillStyle = g; ctx.fillRect(x - 70, 330, 140, 280);
      [[598, 92, 22], [520, 78, 18], [440, 64, 15], [370, 48, 11]].forEach(([y, rx, ry]) => { ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(150,255,185,0.95)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); });
      for (let i = 0; i < 12; i++) diamond(ctx, x - 80 + R() * 160, 340 + R() * 250, 9 + R() * 12, 'rgba(225,255,235,0.95)'); }); },
    soft(ctx) { const R = rng(32); const x = 1328; add(ctx, () => { orb(ctx, x, 480, 220, [[0, 'rgba(150,255,190,0.5)'], [1, 'rgba(0,0,0,0)']]); const g = ctx.createLinearGradient(x - 80, 0, x + 80, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(160,255,200,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 80, 250, 160, 360);
      motes(ctx, x, 440, 90, 170, 80, 'rgba(190,255,210,0.85)', R, 5); }); },
  },
  braver: {
    light: { x: 440, y: 420, c: '220,235,255' },
    hard(ctx) { const R = rng(41); add(ctx, () => { ctx.beginPath(); ctx.moveTo(620, 130); ctx.quadraticCurveTo(560, 420, 300, 560); ctx.quadraticCurveTo(500, 380, 600, 150); ctx.closePath(); ctx.fillStyle = 'rgba(190,220,255,0.75)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(612, 150); ctx.quadraticCurveTo(545, 410, 320, 548); ctx.quadraticCurveTo(515, 395, 604, 160); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      star(ctx, 440, 430, 130, 28, 8, 0.1, 'rgba(230,240,255,0.9)'); shards(ctx, 440, 430, 16, 70, 200, 'rgba(255,255,255,0.95)', R);
      for (let i = 0; i < 8; i++) tri(ctx, 560 + R() * 160, 60 + R() * 200, 2.1, 90 + R() * 80, 3, 'rgba(255,255,255,0.7)'); }); },
    soft(ctx) { const R = rng(42); add(ctx, () => { ctx.save(); ctx.filter = 'blur(6px)'; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(200,225,255,${0.12 + i * 0.1})`; ctx.lineWidth = 60 - i * 9; ctx.beginPath(); ctx.moveTo(610, 150); ctx.quadraticCurveTo(540, 410, 310, 555); ctx.stroke(); } ctx.restore();
      orb(ctx, 440, 430, 230, [[0, 'rgba(235,245,255,0.7)'], [1, 'rgba(0,0,0,0)']]); motes(ctx, 440, 430, 180, 110, 50, 'rgba(230,240,255,0.8)', R, 5); }); },
  },
  bigshot: {
    light: { x: 800, y: 410, c: '255,170,60' },
    hard(ctx) { const R = rng(51); const ball = { x: 790, y: 408 }; add(ctx, () => { ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,170,40,0.9)'; ctx.beginPath(); ctx.ellipse(P.barretGun.x - 8, P.barretGun.y, 26, 44, 0, 0, 7); ctx.stroke();
      for (let i = 1; i <= 6; i++) { const t = i / 7; const x = ball.x + (P.barretGun.x - ball.x) * t, y = ball.y + (P.barretGun.y - ball.y) * t; star(ctx, x, y, 44 * (1 - t) + 8, 30 * (1 - t) + 6, 6, i, `rgba(255,${150 + i * 12},40,${0.75 - t * 0.5})`); }
      const n = 12; for (let i = 0; i < n; i++) { const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(a0) * 62, ball.y + Math.sin(a0) * 62); ctx.lineTo(ball.x + Math.cos(a1) * 62, ball.y + Math.sin(a1) * 62); ctx.closePath(); ctx.fillStyle = i % 2 ? 'rgba(255,190,50,0.95)' : 'rgba(255,120,30,0.95)'; ctx.fill(); }
      star(ctx, ball.x, ball.y, 40, 26, 6, 0.3, '#fff6c8'); shards(ctx, ball.x, ball.y, 10, 70, 120, 'rgba(255,200,80,0.9)', R); }); },
    soft(ctx) { const R = rng(52); const ball = { x: 790, y: 408 }; add(ctx, () => { orb(ctx, P.barretGun.x - 10, P.barretGun.y, 90, [[0, 'rgba(255,200,120,0.7)'], [1, 'rgba(0,0,0,0)']]);
      for (let i = 1; i <= 10; i++) { const t = i / 11; orb(ctx, ball.x + (P.barretGun.x - ball.x) * t, ball.y + (P.barretGun.y - ball.y) * t, 70 * (1 - t) + 14, [[0, `rgba(255,170,70,${0.45 * (1 - t)})`], [1, 'rgba(0,0,0,0)']]); }
      orb(ctx, ball.x, ball.y, 150, [[0, '#fffbe0'], [0.25, 'rgba(255,210,90,0.95)'], [0.5, 'rgba(255,120,30,0.5)'], [1, 'rgba(0,0,0,0)']]); motes(ctx, 900, 400, 160, 60, 40, 'rgba(255,180,90,0.7)', R, 4); }); },
  },
  scope: {
    light: { x: 1328, y: 480, c: '255,60,60' },
    hard(ctx) { const R = rng(61); const t = P.cloudC; const b = [1256, 372, 1400, 606]; add(ctx, () => { ctx.setLineDash([18, 10]); stroke(ctx, [[P.bossEye.x, P.bossEye.y], [t.x, t.y]], 3, 'rgba(255,70,70,0.95)'); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,60,60,0.95)'; for (let i = 1; i < 8; i++) { const x = P.bossEye.x + (t.x - P.bossEye.x) * i / 8, y = P.bossEye.y + (t.y - P.bossEye.y) * i / 8; ctx.fillRect(x - 4, y - 4, 8, 8); } });
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 7; const L = 30; const [x0, y0, x1, y1] = b; ctx.beginPath(); ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0); ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L); ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1); ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(t.x - 60, t.y); ctx.lineTo(t.x - 16, t.y); ctx.moveTo(t.x + 16, t.y); ctx.lineTo(t.x + 60, t.y); ctx.moveTo(t.x, t.y - 60); ctx.lineTo(t.x, t.y - 16); ctx.moveTo(t.x, t.y + 16); ctx.lineTo(t.x, t.y + 60); ctx.stroke();
      add(ctx, () => { diamond(ctx, t.x, t.y, 14, '#ff5050'); star(ctx, P.bossEye.x, P.bossEye.y, 34, 10, 4, 0.78, 'rgba(255,90,90,0.95)'); }); },
    soft(ctx) { const R = rng(62); const t = P.cloudC; add(ctx, () => { ctx.shadowColor = 'rgba(255,40,40,1)'; ctx.shadowBlur = 25; stroke(ctx, [[P.bossEye.x, P.bossEye.y], [t.x, t.y]], 4, 'rgba(255,90,90,0.7)', 'round'); ctx.shadowBlur = 0;
      orb(ctx, P.bossEye.x, P.bossEye.y, 60, [[0, 'rgba(255,120,120,0.9)'], [1, 'rgba(0,0,0,0)']]); orb(ctx, t.x, t.y, 70, [[0, 'rgba(255,90,90,0.8)'], [1, 'rgba(0,0,0,0)']]);
      [60, 95, 130].forEach((r, i) => { ctx.lineWidth = 5 - i; ctx.strokeStyle = `rgba(255,80,80,${0.5 - i * 0.12})`; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, 7); ctx.stroke(); }); }); },
  },
  rifle: {
    light: { x: 700, y: 485, c: '255,210,120' },
    hard(ctx) { const R = rng(71); const t = { x: 1232, y: 425 }; add(ctx, () => { [P.gunA, P.gunB].forEach((g, i) => { star(ctx, g.x + 16, g.y, 46, 12, 5, i * 0.3, 'rgba(255,220,90,0.95)'); star(ctx, g.x + 12, g.y, 22, 7, 5, 0.6, '#fff'); });
      for (let i = 0; i < 4; i++) { const sy = (R() - 0.5) * 50; const a = [P.gunA.x + 80 + i * 90, P.gunA.y + (t.y - P.gunA.y) * (0.1 + i * 0.2) + sy * 0.2]; const b = [a[0] + 120, a[1] + (t.y - P.gunA.y) * 0.2]; stroke(ctx, [a, b], 5, 'rgba(255,240,170,0.95)'); }
      star(ctx, t.x - 20, t.y, 40, 10, 6, 0.2, 'rgba(255,230,140,0.95)'); shards(ctx, t.x - 20, t.y, 8, 20, 60, 'rgba(255,240,180,0.95)', R, 3); }); },
    soft(ctx) { const R = rng(72); const t = { x: 1232, y: 425 }; add(ctx, () => { [P.gunA, P.gunB].forEach((g) => orb(ctx, g.x + 14, g.y, 70, [[0, 'rgba(255,240,190,0.95)'], [0.4, 'rgba(255,190,80,0.4)'], [1, 'rgba(0,0,0,0)']]));
      ctx.shadowColor = 'rgba(255,200,100,1)'; ctx.shadowBlur = 18; for (let i = 0; i < 3; i++) { const a = [P.gunA.x + 120 + i * 150, P.gunA.y + (t.y - P.gunA.y) * (0.15 + i * 0.28)]; stroke(ctx, [a, [a[0] + 110, a[1] + (t.y - P.gunA.y) * 0.2]], 4, 'rgba(255,230,170,0.8)', 'round'); } ctx.shadowBlur = 0;
      orb(ctx, t.x - 20, t.y, 80, [[0, 'rgba(255,230,160,0.8)'], [1, 'rgba(0,0,0,0)']]); motes(ctx, t.x - 20, t.y, 50, 40, 20, 'rgba(255,220,150,0.8)', R, 3); }); },
  },
  stail: {
    light: { x: 1310, y: 470, c: '120,220,255' },
    hard(ctx) { const R = rng(81); const p0 = P.tailDown, c = { x: 820, y: -60 }, p1 = { x: 1318, y: 468 }; add(ctx, () => { star(ctx, p0.x, p0.y, 48, 12, 6, 0, 'rgba(120,230,255,0.95)');
      for (let i = 2; i <= 22; i++) { const t = i / 22; const [x, y] = bez(p0, c, p1, t); diamond(ctx, x, y, 6 + t * 16, `rgba(${150 + t * 105},240,255,${0.35 + t * 0.6})`); }
      star(ctx, p1.x, p1.y, 90, 22, 8, 0.4, 'rgba(160,240,255,0.9)'); star(ctx, p1.x, p1.y, 44, 12, 8, 0.1, '#fff'); shards(ctx, p1.x, p1.y, 12, 50, 130, 'rgba(210,250,255,0.95)', R); }); },
    soft(ctx) { const R = rng(82); const p0 = P.tailDown, c = { x: 820, y: -60 }, p1 = { x: 1318, y: 468 }; add(ctx, () => { orb(ctx, p0.x, p0.y, 70, [[0, 'rgba(160,240,255,0.9)'], [1, 'rgba(0,0,0,0)']]);
      for (let i = 2; i <= 40; i++) { const t = i / 40; const [x, y] = bez(p0, c, p1, t); orb(ctx, x, y, 10 + t * 28, [[0, `rgba(170,235,255,${0.1 + t * 0.35})`], [1, 'rgba(0,0,0,0)']]); }
      orb(ctx, p1.x, p1.y, 150, [[0, 'rgba(230,250,255,0.9)'], [0.3, 'rgba(130,220,255,0.45)'], [1, 'rgba(0,0,0,0)']]); motes(ctx, p1.x, p1.y, 90, 70, 30, 'rgba(200,245,255,0.8)', R, 4); }); },
  },
  laser: {
    light: { x: 1280, y: 450, c: '120,200,255' },
    hard(ctx) { const R = rng(91); const s = P.tailUp; const a = { x: 1236, y: 408 }, b = { x: 1330, y: 470 }; add(ctx, () => {
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(a.x, a.y - 30); ctx.lineTo(b.x + 30, b.y + 40); ctx.closePath(); ctx.fillStyle = 'rgba(90,170,255,0.16)'; ctx.fill();
      const beam = (e, w, c) => { const dx = e.x - s.x, dy = e.y - s.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; ctx.beginPath(); ctx.moveTo(s.x + nx * w * 0.25, s.y + ny * w * 0.25); ctx.lineTo(e.x + nx * w, e.y + ny * w); ctx.lineTo(e.x - nx * w, e.y - ny * w); ctx.lineTo(s.x - nx * w * 0.25, s.y - ny * w * 0.25); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
      beam(a, 18, 'rgba(90,160,255,0.35)'); beam(b, 34, 'rgba(60,140,255,0.6)'); beam(b, 18, 'rgba(120,235,255,0.95)'); beam(b, 6, '#ffffff');
      star(ctx, s.x, s.y, 70, 16, 8, 0, 'rgba(150,235,255,0.95)'); [a, b].forEach((p, i) => { star(ctx, p.x, p.y, 80 - i * 5, 18, 8, i, 'rgba(160,230,255,0.9)'); star(ctx, p.x, p.y, 36, 10, 8, 0.3, '#fff'); shards(ctx, p.x, p.y, 9, 40, 110, 'rgba(210,245,255,0.95)', R); }); });
      ctx.fillStyle = 'rgba(120,190,255,0.08)'; ctx.fillRect(0, 0, 1600, 636); },
    soft(ctx) { const R = rng(92); const s = P.tailUp; const a = { x: 1236, y: 408 }, b = { x: 1330, y: 470 }; add(ctx, () => { ctx.save(); ctx.filter = 'blur(10px)'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(a.x, a.y - 40); ctx.lineTo(b.x + 30, b.y + 50); ctx.closePath(); ctx.fillStyle = 'rgba(100,170,255,0.25)'; ctx.fill(); ctx.restore();
      ctx.shadowColor = 'rgba(100,190,255,1)'; ctx.shadowBlur = 45; stroke(ctx, [[s.x, s.y], [b.x, b.y]], 26, 'rgba(110,200,255,0.55)', 'round'); stroke(ctx, [[s.x, s.y], [b.x, b.y]], 9, '#f2fbff', 'round'); ctx.shadowBlur = 0;
      [a, b].forEach((p) => orb(ctx, p.x, p.y, 130, [[0, 'rgba(230,248,255,0.9)'], [0.35, 'rgba(120,200,255,0.4)'], [1, 'rgba(0,0,0,0)']])); orb(ctx, s.x, s.y, 90, [[0, 'rgba(200,240,255,0.9)'], [1, 'rgba(0,0,0,0)']]); motes(ctx, 1280, 440, 110, 90, 40, 'rgba(200,235,255,0.8)', R, 4); }); },
  },
};

// Draw one effect in a treatment over an already-drawn scene.
export function drawFx(ctx, id, t) {
  const f = FX[id];
  if (t === 'hard') return f.hard(ctx);
  if (t === 'soft') return f.soft(ctx);
  const c = canvas(1600, 900); f.hard(c.getContext('2d')); // hybrid
  const L = f.light;
  add(ctx, () => { orb(ctx, L.x, L.y, 560, [[0, `rgba(${L.c},0.30)`], [1, 'rgba(0,0,0,0)']]); ctx.save(); ctx.translate(L.x, 600); ctx.scale(1, 0.18); orb(ctx, 0, 0, 520, [[0, `rgba(${L.c},0.35)`], [1, 'rgba(0,0,0,0)']]); ctx.restore(); });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(16px)'; ctx.globalAlpha = 0.9; ctx.drawImage(c, 0, 0); ctx.restore();
  ctx.drawImage(c, 0, 0);
}
