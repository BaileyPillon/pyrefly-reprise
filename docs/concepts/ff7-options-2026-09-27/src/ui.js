// FF7 options round, items C, E, F: results windows, Game Over, phone framing, the entry swirl.
import { A, FIT, win, txt, label, finger, scene, fig, canvas } from './base.js';
import { drawPose } from './poses.js';

// ---------- C: results in the FF7 blue window material ----------
function gauge(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#2D0908'; ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#4774E4'); g.addColorStop(1, '#CDC4DE');
  ctx.fillStyle = g; ctx.fillRect(x, y, w * t, h); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}
function portrait(ctx, key, x, y, s) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip(); ctx.fillStyle = '#0a0a30'; ctx.fillRect(x, y, s, s); ctx.drawImage(A[key], x, y, s, s); ctx.restore();
  ctx.strokeStyle = '#B7B7B7'; ctx.lineWidth = 3; ctx.strokeRect(x, y, s, s);
}
const MEMBERS = [
  { name: 'Cloud', head: 'headCloud', lv: 7, fill: 0.62, ap: '10 AP  ·  Lightning, Ice' },
  { name: 'Barret', head: 'headBarret', lv: 6, fill: 0.48, ap: '10 AP  ·  Restore' },
];
function memberRow(ctx, m, x, y, w, s = 1) {
  portrait(ctx, m.head, x, y, 170 * s);
  txt(ctx, m.name, x + 200 * s, y + 52 * s, { size: 46 * s });
  label(ctx, 'LV', x + 200 * s, y + 112 * s, { size: 22 * s }); txt(ctx, String(m.lv), x + 250 * s, y + 118 * s, { size: 46 * s });
  label(ctx, 'EXP', x + 430 * s, y + 40 * s, { size: 22 * s }); txt(ctx, '+100', x + w - 20 * s, y + 52 * s, { size: 42 * s, align: 'right' });
  label(ctx, 'NEXT LEVEL', x + 430 * s, y + 84 * s, { size: 20 * s }); gauge(ctx, x + 430 * s, y + 96 * s, w - 470 * s, 22 * s, m.fill);
  txt(ctx, m.ap, x + 430 * s, y + 160 * s, { size: 34 * s, color: '#e6e6e6' });
}
export function resultsStep1(ctx) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1600, 900);
  win(ctx, 40, 34, 740, 100); label(ctx, 'EXP', 80, 72); txt(ctx, '100', 740, 110, { align: 'right', size: 52 });
  win(ctx, 820, 34, 740, 100); label(ctx, 'AP', 860, 72); txt(ctx, '10', 1520, 110, { align: 'right', size: 52 });
  MEMBERS.forEach((m, i) => { win(ctx, 40, 170 + i * 300, 1520, 270); memberRow(ctx, m, 80, 220 + i * 300, 1440); });
  finger(ctx, 1540, 840, 1.1);
}
export function resultsStep2(ctx) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1600, 900);
  win(ctx, 40, 34, 740, 100); label(ctx, 'GIL', 80, 72); txt(ctx, '100', 740, 110, { align: 'right', size: 52 });
  win(ctx, 40, 170, 1520, 330); label(ctx, 'ITEMS', 80, 212);
  finger(ctx, 150, 272, 1.1); txt(ctx, 'Assault Gun', 170, 290, { size: 50 }); txt(ctx, '1', 1480, 290, { size: 50, align: 'right' });
  txt(ctx, '(Barret: Att 17, Long Range)', 170, 370, { size: 30, color: '#b9b9d9' });
  win(ctx, 40, 540, 1520, 110, { alpha: 0.9 }); txt(ctx, 'Received 100 gil and the Assault Gun.', 800, 612, { align: 'center', size: 40 });
}
export function resultsCompact(ctx) {
  scene(ctx, { tail: null, cloud: false, barret: false, band: false }); drawPose(ctx, 'barretPunch', 1226, 530, 1.0); drawPose(ctx, 'cloudBack', 1350, 598, 1.05); ctx.fillStyle = '#000'; ctx.fillRect(0, 636, 1600, 264);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 1600, 900);
  win(ctx, 180, 90, 1240, 720);
  label(ctx, 'EXP', 230, 150); txt(ctx, '100', 420, 158, { align: 'right', size: 46 });
  label(ctx, 'AP', 560, 150); txt(ctx, '10', 720, 158, { align: 'right', size: 46 });
  label(ctx, 'GIL', 860, 150); txt(ctx, '100', 1060, 158, { align: 'right', size: 46 });
  MEMBERS.forEach((m, i) => memberRow(ctx, m, 230, 200 + i * 200, 1140, 0.92));
  ctx.fillStyle = '#6C6C6C'; ctx.fillRect(230, 612, 1140, 3);
  label(ctx, 'ITEMS', 230, 668); txt(ctx, 'Assault Gun', 380, 676, { size: 46 }); txt(ctx, '1', 1360, 676, { size: 46, align: 'right' });
  finger(ctx, 1330, 760, 1.0); txt(ctx, 'OK', 1350, 776, { size: 40 });
}
// ---------- C: Game Over ----------
export function gameOverPan(ctx) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1600, 900);
  const lift = 150; // the camera pans up: the scene slides down
  ctx.drawImage(A.tall, 0, -286 + lift);
  fig(ctx, 'boss-down', { dy: lift });
  drawPose(ctx, 'barretDown', 1236, 530 + lift, 1.0); drawPose(ctx, 'cloudDown', 1250, 598 + lift, 1.0);
  const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 900);
}
export function gameOverWindow(ctx) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1600, 900);
  txt(ctx, 'GAME OVER', 800, 300, { align: 'center', size: 96, color: '#e8e8f4' });
  win(ctx, 540, 400, 520, 220); finger(ctx, 620, 475, 1.1); txt(ctx, 'RETRY', 640, 492, { size: 48 }); txt(ctx, 'CHAPTER SELECT', 640, 572, { size: 48 });
}
export function gameOverReel(ctx) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1600, 900);
  ctx.save(); ctx.translate(560, 420); ctx.rotate(-0.3); ctx.strokeStyle = '#8c8c96'; ctx.fillStyle = '#26262c'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(0, 0, 210, 0.5, 5.9); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; ctx.beginPath(); ctx.arc(Math.cos(a) * 118, Math.sin(a) * 118, 46, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#8c8c96'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(190, 70); ctx.lineTo(215, 110); ctx.lineTo(196, 140); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(700, 520); ctx.rotate(0.35); ctx.fillStyle = '#1c1c22'; ctx.strokeStyle = '#6c6c76'; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) { ctx.fillRect(i * 118, 0, 112, 90); ctx.strokeRect(i * 118, 0, 112, 90); ctx.fillStyle = '#44444c'; for (let k = 0; k < 4; k++) { ctx.fillRect(i * 118 + 10 + k * 26, 6, 12, 10); ctx.fillRect(i * 118 + 10 + k * 26, 74, 12, 10); } ctx.fillStyle = '#1c1c22'; }
  ctx.beginPath(); ctx.moveTo(590, 0); ctx.lineTo(610, 30); ctx.lineTo(592, 55); ctx.lineTo(612, 90); ctx.strokeStyle = '#000'; ctx.lineWidth = 16; ctx.stroke(); ctx.restore();
  win(ctx, 1090, 640, 440, 200); finger(ctx, 1160, 705, 1.0); txt(ctx, 'RETRY', 1180, 722, { size: 42 }); txt(ctx, 'CHAPTER SELECT', 1180, 792, { size: 42 });
}

// ---------- E: upright phone (390x844) ----------
const HINT = '“Attack while it’s tail’s up!';
function phoneBottom(ctx) { ctx.drawImage(A['f390-hint-3'], 0, 636, 390, 208, 0, 636, 390, 208); }
function phoneMsg(ctx, y) { win(ctx, 8, y, 374, 46, { u: 1, alpha: 0.9 }); txt(ctx, HINT, 195, y + 32, { size: 21, align: 'center' }); }
function cmdGhost(ctx) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,220,120,0.85)'; ctx.lineWidth = 2; ctx.strokeRect(156, 535, 190, 181); ctx.restore(); }
// Our fighters drawn at a phone scale, feet at (x, y).
function phoneFig(ctx, key, cx, feetY, s) { const r = FIT[key]; const w = r.w * s, h = r.h * s; ctx.drawImage(A[key], cx - w / 2, feetY - h, w, h); }
export function phoneToday(ctx) { ctx.drawImage(A['f390-hint-3'], 0, 0, 390, 844); cmdGhost(ctx); }
export function phoneCloser(ctx) { // E1: the formation drawn in, the camera moved in
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 390, 844);
  const s = 0.65; const sx = 470, sy = -90; // frame rect shown: x 470..1070, y -90..633
  ctx.save(); ctx.beginPath(); ctx.rect(0, 58, 390, 472); ctx.clip();
  ctx.drawImage(A.tall, sx, sy + 286, 600, 723, 0, 58, 390, 470);
  phoneFig(ctx, 'boss-up', 124, 486, s); phoneFig(ctx, 'barret', 306, 470, s); phoneFig(ctx, 'cloud', 336, 510, s);
  ctx.restore(); phoneMsg(ctx, 10); phoneBottom(ctx); cmdGhost(ctx);
}
export function phoneWindowOnScene(ctx) { // E2: zoomed 1.3x, taller view, the message window on the field's top edge
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 390, 844);
  const s = 390 / 1230; const top = 150; const x0 = 185, y0 = -250; const h = (636 - y0) * s;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, 390, h); ctx.clip();
  ctx.drawImage(A.tall, x0, y0 + 286, 1230, 636 - y0, 0, top, 390, h);
  const X = (fx) => (fx - x0) * s, Y = (fy) => top + (fy - y0) * s;
  phoneFig(ctx, 'boss-up', X(FIT['boss-up'].x + FIT['boss-up'].w / 2), Y(556), s); phoneFig(ctx, 'barret', X(1236), Y(530), s); phoneFig(ctx, 'cloud', X(1327), Y(598), s);
  ctx.restore(); phoneMsg(ctx, top - 20); phoneBottom(ctx); cmdGhost(ctx);
}

// ---------- F: the entry swirl (a rotating, zooming distortion of the frozen screen) ----------
export function swirl(src, k, zoom, lift) {
  const W = 800, H = 450; const a = canvas(W, H); const ga = a.getContext('2d'); ga.drawImage(src, 0, 0, W, H);
  const s = ga.getImageData(0, 0, W, H).data; const out = ga.createImageData(W, H); const d = out.data;
  const cx = W / 2, cy = H / 2, Rm = Math.hypot(cx, cy);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy; const r = Math.hypot(dx, dy); const t = Math.max(0, 1 - r / Rm);
    const th = Math.atan2(dy, dx) + k * t * t; const rr = r / zoom;
    const sx = Math.round(cx + Math.cos(th) * rr), sy = Math.round(cy + Math.sin(th) * rr);
    const i = (y * W + x) * 4; if (sx < 0 || sy < 0 || sx >= W || sy >= H) { d[i + 3] = 255; continue; }
    const j = (sy * W + sx) * 4; for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, s[j + c] * (1 - lift) + 255 * lift * 0.9); d[i + 3] = 255;
  }
  ga.putImageData(out, 0, 0); return a;
}
