// FF7 effects hi-fi options (2026-09-27): four moments in three treatments. FF7 ONLY.
//   plus      (1 "A3 plus"):   FF7's hard polygon shapes + glow pass + bloom + light cast on fighters and floor.
//   spectacle (2 "Spectacle"): layered particles (house spell-FX option B idea), sparks, heat haze, shake,
//                              heavy bloom and a one-frame flash; `reduced` gives the calm version.
//   cel       (3 "Cel light"): flat stepped colour with an ink edge, speed lines, hard-edged cel light,
//                              to sit with painted, anime-lit fighters.
import { rng, canvas, msg, num } from '../../ff7-options-2026-09-27/src/base.js';
import { W, H, BAND, cast, lightFigure, shadow, pool, plate, band, placeholderTag, figure, POSES } from './scene.js';
import * as k from './kit.js';

const CY = '110,205,255', GOLD = '255,232,120', PALE = '215,232,255', RED = '255,60,60';
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export const MOMENTS = {
  laser: {
    name: 'Tail Laser', cap: '<b>Tail Laser</b> · one beam swept across both (tail up), key frame on Cloud',
    state: { tail: 'up' }, nums: (K) => [['75', K.barretC[0] + 74, K.barretC[1] - 104], ['73', K.cloudC[0] - 6, K.cloudC[1] - 96]],
    lights: (K) => [{ x: K.cloudC[0] + 70, y: K.cloudC[1] - 30, c: CY, r: 760, i: 1.15 }, { x: K.emit[0], y: K.emit[1], c: CY, r: 420, i: 0.8 }],
    pools: (K) => [[K.cloudFeet[0] + 30, K.cloudFeet[1] - 6, 360, CY, 0.55], [K.barretFeet[0], K.barretFeet[1], 240, CY, 0.3]],
    draw(g, K, t, R, red) {
      const e = K.emit, bC = [K.barretC[0] + 30, K.barretC[1] - 14], cC = [K.cloudC[0] + 26, K.cloudC[1] - 8], s0 = [K.barretFeet[0] + 70, K.barretFeet[1] - 6], s1 = [K.cloudFeet[0] - 70, K.cloudFeet[1] + 14];
      if (t === 'cel') {
        k.line(g, [s0, s1], 12, '#ff9a3c', 'butt'); k.line(g, [s0, s1], 4, '#fff1c8', 'butt');
        k.beam(g, e, cC, 30, '#2f63ff'); k.beam(g, e, cC, 19, '#72e4ff'); k.beam(g, e, cC, 7, '#ffffff');
        k.speedLines(g, cC, 22, 70, 250, 'rgba(235,250,255,0.9)', R);
        k.burst(g, cC, 60, ['#2f63ff', '#72e4ff', '#ffffff'], R); k.burst(g, bC, 40, ['#2f63ff', '#9eeeff'], R, 9); k.burst(g, e, 44, ['#2f63ff', '#9eeeff', '#fff'], R, 8);
        return; }
      k.add(g, () => {
        g.beginPath(); g.moveTo(...e); g.lineTo(bC[0], bC[1] - 40); g.lineTo(cC[0] - 10, cC[1] + 44); g.closePath(); g.fillStyle = 'rgba(90,170,255,0.16)'; g.fill();
        if (t === 'plus') { k.line(g, [s0, s1], 8, 'rgba(140,220,255,0.8)', 'butt'); k.line(g, [s0, s1], 3, '#fff', 'butt'); }
        k.beam(g, e, bC, 12, 'rgba(90,160,255,0.35)'); k.beam(g, e, cC, 34, 'rgba(60,140,255,0.6)'); k.beam(g, e, cC, 18, 'rgba(120,235,255,0.95)'); k.beam(g, e, cC, 6, '#ffffff');
        k.star(g, e[0], e[1], 64, 14, 8, 0, 'rgba(150,235,255,0.95)');
        [[cC, 1], [bC, 0.6]].forEach(([p, s]) => { k.star(g, p[0], p[1], 60 * s, 14 * s, 8, s, 'rgba(160,230,255,0.9)'); k.star(g, p[0], p[1], 26 * s, 8, 8, 0.3, '#fff'); k.shards(g, p[0], p[1], 8, 50 * s, 130 * s, 'rgba(210,245,255,0.95)', R); });
        if (t !== 'spectacle') return;
        const d = red ? 0.4 : 1;
        // molten scorch where the beam dragged across the floor, with embers
        k.line(g, [s0, s1], 16, 'rgba(255,110,40,0.55)'); k.line(g, [s0, s1], 6, 'rgba(255,220,150,0.95)');
        k.along(g, s0, s1, 90 * d, 14, '255,150,70', R, 3.5);
        k.along(g, e, cC, 200 * d, 22, CY, R, 2.6, 22); k.along(g, e, cC, 80 * d, 8, '235,250,255', R, 2.2, 40);
        for (let i = 0; i < 4; i++) { g.lineWidth = 2; g.strokeStyle = `rgba(${CY},${0.7 - i * 0.14})`; g.beginPath(); g.ellipse(e[0], e[1], 30 + i * 22, 12 + i * 9, -0.6, 0, k.TAU); g.stroke(); }
        k.sparks(g, cC, 40 * d, R, { c: '200,240,255', dir: -2.4, spread: 2.6, len: 170 }); k.sparks(g, bC, 26 * d, R, { c: '200,240,255', dir: -2.4, spread: 2.4, len: 110 });
        k.cloud(g, cC[0] + 40, cC[1], 130, 90, 45 * d, '200,240,255', R, 3);
        k.line(g, [[cC[0] - 420, cC[1]], [cC[0] + 480, cC[1]]], 3, 'rgba(140,210,255,0.8)'); k.line(g, [[cC[0] - 180, cC[1]], [cC[0] + 200, cC[1]]], 6, 'rgba(230,248,255,0.8)');
      });
    },
    hazeBox: (K) => [K.cloudFeet[0] - 150, K.barretFeet[1] - 120, K.barretFeet[0] + 180, K.cloudFeet[1] + 20],
  },
  bolt: {
    name: 'Bolt', cap: '<b>Bolt</b> · Cloud on Guard Scorpion (tail down)',
    state: { tail: 'down' }, nums: (K) => [['93', K.bossTop[0] - 40, K.bossTop[1] - 30]],
    lights: (K) => [{ x: K.bossTop[0], y: K.bossTop[1] + 10, c: GOLD, r: 900, i: 1.2 }],
    pools: (K) => [[K.bossTop[0], 556, 480, GOLD, 0.7]],
    draw(g, K, t, R, red) {
      const p = K.bossTop;
      if (t === 'cel') {
        for (let j = 0; j < 3; j++) { const pts = k.zig([p[0] + (j - 1) * 60, -20], [p[0] + (j - 1) * 10, p[1]], 7, 26, R); k.line(g, pts, 24, '#ffb81c', 'miter'); k.line(g, pts, 12, '#fff27a', 'miter'); k.line(g, pts, 4, '#ffffff', 'miter'); }
        k.speedLines(g, p, 26, 90, 320, 'rgba(255,250,210,0.9)', R); k.burst(g, p, 100, ['#ff9c1c', '#ffe94a', '#ffffff'], R, 11);
        return; }
      k.add(g, () => {
        const n = t === 'spectacle' ? 4 : 3;
        for (let j = 0; j < n; j++) { const pts = k.zig([p[0] + (j - 1.5) * 44, -20], [p[0] + (j - 1.5) * 8, p[1]], 11, 46, R);
          k.line(g, pts, 30, 'rgba(255,214,40,0.5)', 'miter'); k.line(g, pts, 12, 'rgba(255,250,150,0.95)', 'miter'); k.line(g, pts, 4, '#ffffff', 'miter');
          if (t === 'spectacle') for (let b = 2; b < pts.length - 2; b += 3) { const q = pts[b]; const br = k.zig(q, [q[0] + (R() - 0.5) * 220, q[1] + 60 + R() * 120], 6, 22, R); k.line(g, br, 5, 'rgba(255,240,160,0.7)', 'miter'); k.line(g, br, 1.6, '#fff', 'miter'); } }
        k.star(g, p[0], p[1], 110, 26, 9, 0.2, 'rgba(255,240,120,0.85)'); k.star(g, p[0], p[1], 56, 16, 9, 0.5, '#ffffff'); k.shards(g, p[0], p[1], 18, 90, 210, 'rgba(255,245,160,0.95)', R);
        if (t !== 'spectacle') return;
        const d = red ? 0.4 : 1;
        k.orb(g, p[0], 40, 520, [[0, 'rgba(255,240,170,0.35)'], [1, 'rgba(0,0,0,0)']]);
        for (let i = 0; i < 9; i++) { const a = [K.bossC[0] - 170 + R() * 330, K.bossC[1] - 40 + R() * 70]; const pts = k.zig(a, [a[0] + (R() - 0.5) * 160, a[1] + (R() - 0.5) * 60], 7, 14, R); k.line(g, pts, 4, 'rgba(255,240,140,0.8)', 'miter'); k.line(g, pts, 1.4, '#fff', 'miter'); }
        k.sparks(g, p, 60 * d, R, { c: '255,236,150', dir: -Math.PI / 2, spread: 3.4, len: 220, grav: 1.6 });
        k.cloud(g, p[0], p[1] + 30, 260, 150, 80 * d, '255,236,160', R, 3.5);
        for (let i = 0; i < 3; i++) { g.lineWidth = 5 - i; g.strokeStyle = `rgba(${GOLD},${0.7 - i * 0.2})`; g.beginPath(); g.ellipse(p[0], 556, 170 + i * 80, 30 + i * 15, 0, 0, k.TAU); g.stroke(); }
      });
    },
    hazeBox: (K) => [K.bossC[0] - 260, K.bossTop[1] - 120, K.bossC[0] + 240, 560],
  },
  braver: {
    name: 'Braver', cap: '<b>Braver</b> · Cloud’s Limit: the leap, then the downward slash, at the hit',
    state: { tail: 'down', cloudPose: 'cloudBraver', cloudAt: { x: 900, y: 390, s: 1.05, rot: 0.28 } }, nums: (K) => [['121', K.bossC[0] + 10, K.bossTop[1] - 34]],
    cloudOver: true, ghosts: [{ x: 700, y: 330, s: 1.05, rot: 0.05 }, { x: 800, y: 330, s: 1.05, rot: 0.16 }],
    lights: (K) => [{ x: K.bossC[0] - 70, y: K.bossC[1], c: PALE, r: 820, i: 1.2 }],
    pools: (K) => [[K.bossC[0] - 60, 560, 460, PALE, 0.6]],
    draw(g, K, t, R, red) {
      const h = K.bossC, hit = [h[0] - 60, h[1] + 10], a0 = [K.swordHilt[0] - 40, K.swordHilt[1] - 150], c0 = [h[0] + 40, a0[1] + 20], a1 = [h[0] - 60, 580];
      const cres = (w, fill) => { g.beginPath(); g.moveTo(...a0); g.quadraticCurveTo(c0[0] + w, c0[1], a1[0], a1[1]); g.quadraticCurveTo(c0[0] - w * 1.6, c0[1] + w, a0[0] + 6, a0[1] + 8); g.closePath(); g.fillStyle = fill; g.fill(); };
      if (t === 'cel') {
        cres(46, '#5a7dff'); cres(30, '#bcd4ff'); cres(12, '#ffffff');
        k.speedLines(g, hit, 28, 110, 360, 'rgba(235,242,255,0.9)', R); k.burst(g, hit, 110, ['#4a6dff', '#bcd4ff', '#ffffff'], R, 13);
        return; }
      k.add(g, () => {
        if (t === 'spectacle') for (let i = 3; i >= 1; i--) { g.save(); g.translate(-i * 26, -i * 30); g.globalAlpha = 0.28 / i; cres(40, `rgba(${PALE},1)`); g.restore(); }
        cres(40, 'rgba(190,220,255,0.75)'); cres(16, '#ffffff');
        k.star(g, hit[0], hit[1], 96, 22, 8, 0.1, 'rgba(230,240,255,0.9)'); k.shards(g, hit[0], hit[1], 16, 70, 220, 'rgba(255,255,255,0.95)', R);
        g.lineWidth = t === 'spectacle' ? 7 : 4; g.strokeStyle = `rgba(${PALE},0.85)`; g.beginPath(); g.ellipse(hit[0], 560, 260, 38, 0, 0, k.TAU); g.stroke();
        if (t !== 'spectacle') return;
        const d = red ? 0.4 : 1;
        k.along(g, a0, mid(a0, a1), 120 * d, 60, PALE, R, 3, 30); k.along(g, mid(a0, a1), a1, 120 * d, 60, PALE, R, 3, 30);
        k.sparks(g, hit, 110 * d, R, { c: '255,236,190', dir: -Math.PI / 2 - 0.3, spread: 3.6, len: 260, grav: 1.4 });
        k.cloud(g, hit[0], hit[1], 220, 130, 70 * d, '230,240,255', R, 3.5);
        g.lineWidth = 3; g.strokeStyle = `rgba(${PALE},0.5)`; g.beginPath(); g.ellipse(hit[0], 560, 400, 60, 0, 0, k.TAU); g.stroke();
        k.line(g, [[hit[0] - 560, hit[1]], [hit[0] + 520, hit[1]]], 3, 'rgba(200,220,255,0.8)');
      });
      if (t === 'spectacle') { g.fillStyle = 'rgba(40,30,30,0.9)'; for (let i = 0; i < 16 * (red ? 0.4 : 1); i++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.6, r = 80 + R() * 200; k.tri(g, hit[0] + Math.cos(a) * r, 540 + Math.sin(a) * r * 0.6, R() * 6, 8 + R() * 10, 5 + R() * 5, 'rgba(38,30,30,0.95)'); } }
    },
    hazeBox: (K) => [K.bossC[0] - 320, K.bossC[1] - 120, K.bossC[0] + 160, 570],
  },
  scope: {
    name: 'Locked On Target', cap: '<b>Search Scope</b> · the lock-on to Cloud (no damage; no flash, no shake)',
    state: { tail: 'down' }, nums: () => [],
    lights: (K) => [{ x: K.cloudC[0] + 40, y: K.cloudC[1], c: RED, r: 520, i: 1.0 }, { x: K.eye[0], y: K.eye[1], c: RED, r: 260, i: 0.8 }],
    pools: (K) => [[K.cloudFeet[0] + 10, K.cloudFeet[1] - 4, 260, RED, 0.45]],
    draw(g, K, t, R) {
      const e = K.eye, c = K.cloudC, b = [c[0] - 84, K.cloudHead[1] - 60, c[0] + 104, K.cloudFeet[1] + 8];
      if (t === 'cel') {
        k.line(g, [e, c], 8, '#ff3040', 'butt'); k.line(g, [e, c], 3, '#ffe0e0', 'butt');
        k.brackets(g, b, 34, 9, '#ff3040'); k.burst(g, e, 34, ['#ff3040', '#ffd0d0'], R, 6);
        g.lineWidth = 6; g.strokeStyle = '#ff3040'; g.beginPath(); g.arc(c[0], c[1], 58, 0.3, 1.3); g.arc(c[0], c[1], 58, 1.9, 2.9); g.stroke(); g.beginPath(); g.arc(c[0], c[1], 58, 3.5, 4.5); g.stroke(); g.beginPath(); g.arc(c[0], c[1], 58, 5.1, 6.1); g.stroke();
        return; }
      k.add(g, () => {
        g.setLineDash([18, 10]); k.line(g, [e, c], 3, 'rgba(255,80,80,0.95)', 'butt'); g.setLineDash([]);
        k.star(g, e[0], e[1], 34, 9, 4, 0.78, 'rgba(255,90,90,0.95)');
        const L = t === 'spectacle' ? 7 : 6; k.brackets(g, b, 32, L, 'rgba(255,70,70,1)');
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,90,90,0.95)'; g.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(c[0] + dx * 16, c[1] + dy * 16); g.lineTo(c[0] + dx * 64, c[1] + dy * 64); } g.stroke();
        if (t !== 'spectacle') return;
        g.beginPath(); g.moveTo(...e); g.lineTo(b[0] + 10, b[1] + 20); g.lineTo(b[0] + 10, b[3] - 10); g.closePath(); g.fillStyle = 'rgba(255,50,50,0.13)'; g.fill();
        k.along(g, e, c, 140, 8, '255,110,110', R, 2.4, 18);
        [[70, 0.2, 5], [104, 1.4, 3], [138, 2.6, 2]].forEach(([r, o, w]) => { g.lineWidth = w; g.strokeStyle = 'rgba(255,80,80,0.8)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(c[0], c[1], r, o + i * 1.57, o + i * 1.57 + 0.95); g.stroke(); } });
        for (let y = b[1] + 6; y < b[3]; y += 9) { g.fillStyle = `rgba(255,90,90,${0.1 + 0.12 * Math.abs(Math.sin(y * 0.05))})`; g.fillRect(b[0] + 8, y, b[2] - b[0] - 16, 2); }
        k.line(g, [[e[0] - 220, e[1]], [e[0] + 200, e[1]]], 2.5, 'rgba(255,120,120,0.8)');
        k.cloud(g, c[0], c[1], 110, 140, 60, '255,120,120', R, 2.5);
      });
    },
  },
};

const DIM = { plus: 0.16, spectacle: 0.32, cel: 0.22 };
// One frame: plate, light pools, shadows, fighters lit by the effect, the effect with its finish, HUD.
export function frame(id, t, o = {}) {
  const m = MOMENTS[id], red = !!o.reduced, R = rng(id.length * 97 + t.length);
  const c = canvas(W, H), ctx = c.getContext('2d');
  const { F, K } = cast(m.state); const Ls = m.lights(K), cel = t === 'cel';
  plate(ctx, DIM[t], cel ? '10,0,40' : '0,0,20');
  if (t === 'spectacle') { const v = ctx.createRadialGradient(800, 330, 200, 800, 330, 900); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,0.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, BAND); }
  for (const p of m.pools(K)) pool(ctx, p[0], p[1], p[2], p[3], t === 'spectacle' ? p[4] * 1.3 : p[4], cel);
  for (const f of [F.boss, F.barret, F.cloud]) if (!(m.state.cloudAt && f === F.cloud)) shadow(ctx, f, Ls[0], { cel });
  for (const f of [F.boss, F.barret]) ctx.drawImage(f.cv, 0, 0);
  if (m.ghosts && t !== 'plus') m.ghosts.forEach((at, i) => { const gcv = figure(POSES.cloudBraver, at); const tt = canvas(W, H), tg = tt.getContext('2d'); tg.drawImage(gcv, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = cel ? '#6f8dff' : `rgba(${PALE},1)`; tg.fillRect(0, 0, W, H); ctx.save(); ctx.globalAlpha = 0.16 + i * 0.12; ctx.globalCompositeOperation = cel ? 'source-over' : 'lighter'; ctx.drawImage(tt, 0, 0); ctx.restore(); });
  ctx.drawImage(F.cloud.cv, 0, 0);
  for (const f of [F.boss, F.barret, F.cloud]) for (const L of Ls) lightFigure(ctx, f, L, { cel });
  const fx = canvas(W, H), g = fx.getContext('2d'); m.draw(g, K, t, R, red);
  if (cel) { k.inked(ctx, fx, 3); }
  else {
    bloom(ctx, fx, t, red);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fx, 0, 0); ctx.restore();
  }
  if (m.cloudOver) { ctx.drawImage(F.cloud.cv, 0, 0); for (const L of Ls) lightFigure(ctx, F.cloud, L, { cel }); }
  if (t === 'spectacle' && !red && m.hazeBox) { const [x0, y0, x1, y1] = m.hazeBox(K); k.haze(ctx, Math.max(0, x0), Math.max(0, y0), Math.min(W, x1), Math.min(BAND, y1), 5, id.length); }
  if (t === 'spectacle' && !red && id !== 'scope') k.shake(ctx, W, H, id === 'braver' ? 12 : 8, id === 'braver' ? -9 : -5, id === 'braver' ? 0.006 : 0.004);
  if (o.flash) { ctx.save(); ctx.fillStyle = 'rgba(255,252,240,0.8)'; ctx.fillRect(0, 0, W, BAND); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fx, 0, 0); ctx.restore(); }
  band(ctx);
  for (const [s, x, y] of m.nums(K)) num(ctx, s, x, y);
  msg(ctx, m.name); placeholderTag(ctx);
  return c;
}
function bloom(ctx, fx, t, red) {
  if (t === 'plus') k.bloom(ctx, fx, [[6, 0.6], [18, 0.6], [44, 0.35]]);
  else k.bloom(ctx, fx, red ? [[8, 0.7], [24, 0.7], [60, 0.5]] : [[6, 0.6], [20, 0.6], [56, 0.5], [120, 0.3]]);
}
