// FF7 effects hi-fi options (2026-09-27): the switched-sides scene, placeholder figures and the
// light they receive. FF7 ONLY. Nothing here is game code.
// Sides (Bailey, 2026-09-27): the party on the LEFT facing screen-right, Guard Scorpion on the
// RIGHT facing screen-left. No painting of ours faces that way yet and a painting is NEVER
// mirrored, so every fighter here is a PLACEHOLDER maquette drawn facing its new way, marked as such.
// Facing right in three-quarter view shows a figure's RIGHT side to the camera: Barret's gun-arm
// (his right arm) is the NEAR arm; Cloud's single pauldron (his left shoulder) is on the FAR side.
import { A, canvas } from '../../ff7-options-2026-09-27/src/base.js';

export const W = 1600, H = 900, BAND = 636;

// ---------- placeholder maquettes (local units: px at 1600x900, origin at the feet) ----------
const MAT = {
  cloudBody: '#3d4a66', cloudSkin: '#b69a86', hair: '#b7a266', steel: '#9aa3ae', pauldron: '#7d8794',
  barretBody: '#5a5140', barretSkin: '#5b4234', gun: '#8e959d',
  hull: '#7c2a26', hullDark: '#4e1a18', leg: '#6f747c', lens: '#46d0ff',
};
const seg = (a, b, w, m) => ({ k: 's', a, b, w, m });
const circ = (c, r, m) => ({ k: 'c', c, r, m });
const poly = (p, m) => ({ k: 'p', p, m });
function blade(a, b, w, m) { // a broad sword blade from hilt a to tip b
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w;
  return poly([[a[0] + nx, a[1] + ny], [b[0] + nx * 0.9, b[1] + ny * 0.9], [b[0] - nx * 0.2 + dx / L * 8, b[1] - ny * 0.2 + dy / L * 8], [a[0] - nx * 0.4, a[1] - ny * 0.4]], m);
}
const HAIR = [[-6, -176], [-30, -194], [-6, -195], [-20, -220], [4, -202], [6, -230], [16, -203], [34, -212], [25, -192], [30, -180], [17, -172]];

export const POSES = {
  cloudReady: { far: [seg([6, -100], [24, -54], 17, 'cloudBody'), seg([24, -54], [38, -4], 15, 'cloudBody'), seg([36, -4], [54, -2], 12, 'cloudBody'),
      seg([16, -154], [30, -128], 12, 'cloudBody'), seg([30, -128], [42, -120], 11, 'cloudSkin'), circ([18, -160], 12, 'pauldron')],
    near: [poly([[-13, -162], [19, -162], [15, -100], [-9, -100]], 'cloudBody'), seg([-2, -100], [-18, -54], 18, 'cloudBody'), seg([-18, -54], [-30, -4], 16, 'cloudBody'), seg([-32, -4], [-14, -2], 13, 'cloudBody'),
      circ([10, -182], 14, 'cloudSkin'), poly(HAIR, 'hair'), blade([42, -120], [158, -40], 15, 'steel'), seg([30, -126], [46, -116], 7, 'steel'),
      seg([-6, -154], [8, -126], 13, 'cloudBody'), seg([8, -126], [38, -118], 12, 'cloudSkin')] },
  cloudBraver: { far: [seg([6, -100], [34, -72], 17, 'cloudBody'), seg([34, -72], [22, -30], 15, 'cloudBody'), seg([16, -154], [30, -176], 12, 'cloudBody'), seg([30, -176], [40, -192], 11, 'cloudSkin'), circ([18, -160], 12, 'pauldron')],
    near: [poly([[-13, -162], [19, -162], [15, -100], [-9, -100]], 'cloudBody'), seg([-2, -100], [24, -80], 18, 'cloudBody'), seg([24, -80], [2, -42], 16, 'cloudBody'),
      circ([10, -182], 14, 'cloudSkin'), poly(HAIR, 'hair'), blade([44, -192], [182, -86], 17, 'steel'),
      seg([-6, -154], [14, -182], 13, 'cloudBody'), seg([14, -182], [42, -194], 12, 'cloudSkin')] },
  barretAim: { far: [seg([8, -96], [24, -50], 24, 'barretBody'), seg([24, -50], [40, -4], 21, 'barretBody'), seg([38, -4], [58, -2], 16, 'barretBody'),
      seg([18, -160], [30, -126], 19, 'barretSkin'), seg([30, -126], [44, -106], 17, 'barretSkin'), circ([46, -104], 10, 'barretSkin')],
    near: [poly([[-24, -170], [28, -170], [21, -96], [-17, -96]], 'barretBody'), seg([-10, -96], [-24, -50], 25, 'barretBody'), seg([-24, -50], [-40, -4], 22, 'barretBody'), seg([-42, -4], [-20, -2], 17, 'barretBody'),
      circ([2, -188], 16, 'barretSkin'), seg([-18, -160], [8, -148], 21, 'barretSkin'),
      circ([20, -148], 17, 'gun'), seg([20, -148], [84, -151], 24, 'gun'), seg([84, -158], [116, -159], 6, 'gun'), seg([84, -151], [118, -151], 6, 'gun'), seg([84, -144], [116, -143], 6, 'gun')] },
};
function bossParts(tail) { // forward = -x (it faces screen-left toward the party)
  const up = tail === 'up';
  const P0 = [140, -150], C = up ? [262, -390] : [270, -250], P1 = up ? [26, -336] : [168, -262];
  const tailSegs = []; for (let i = 0; i <= 14; i++) { const t = i / 14, u = 1 - t; tailSegs.push(circ([u * u * P0[0] + 2 * u * t * C[0] + t * t * P1[0], u * u * P0[1] + 2 * u * t * C[1] + t * t * P1[1]], 17 - t * 5, i % 2 ? 'hull' : 'hullDark')); }
  const legs = (dx, m) => [[-80, -90, -122, -44, -112, 0], [10, -86, -2, -42, 18, 0], [92, -90, 134, -42, 146, 0]].flatMap(([a, b, c, d, e, f]) => [seg([a + dx, b], [c + dx, d], 12, m), seg([c + dx, d], [e + dx, f], 10, m)]);
  return {
    far: [...legs(22, 'hullDark'), ...(up ? [] : tailSegs)],
    near: [poly([[-152, -128], [-112, -180], [40, -192], [132, -162], [152, -110], [112, -80], [-100, -76], [-152, -98]], 'hull'),
      poly([[-176, -128], [-152, -152], [-118, -150], [-110, -88], [-166, -90]], 'hullDark'), circ([-156, -118], 11, 'lens'),
      seg([-150, -84], [-244, -82], 11, 'leg'), seg([-150, -68], [-240, -66], 11, 'leg'), ...legs(0, 'leg'), ...(up ? tailSegs : []),
      circ(P1, 19, 'leg'), circ([P1[0] - 12, P1[1] + 8], 8, 'lens')],
    emit: [P1[0] - 12, P1[1] + 8],
  };
}

function shapes(g, list, m) {
  for (const s of list) { if (s.m !== m) continue; g.fillStyle = g.strokeStyle = MAT[m];
    if (s.k === 's') { g.lineWidth = s.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...s.a); g.lineTo(...s.b); g.stroke(); }
    else if (s.k === 'c') { g.beginPath(); g.arc(s.c[0], s.c[1], s.r, 0, 7); g.fill(); }
    else { g.beginPath(); s.p.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q))); g.closePath(); g.fill(); } }
}
// One figure on its own 1600x900 canvas: far layer darker, ink outline, top-down shading.
export function figure(parts, at) {
  const out = canvas(W, H), o = out.getContext('2d');
  for (const [layer, dim] of [['far', 0.42], ['near', 0]]) {
    const c = canvas(W, H), g = c.getContext('2d');
    g.setTransform(at.s, 0, 0, at.s, at.x, at.y); if (at.rot) g.rotate(at.rot);
    const list = parts[layer]; for (const m of new Set(list.map((q) => q.m))) shapes(g, list, m);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, at.y - 230 * at.s, 0, at.y); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0.38)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); if (dim) { g.fillStyle = `rgba(8,8,14,${dim})`; g.fillRect(0, 0, W, H); }
    o.save(); o.filter = 'drop-shadow(2px 0 0 #0b0b10) drop-shadow(-2px 0 0 #0b0b10) drop-shadow(0 2px 0 #0b0b10) drop-shadow(0 -2px 0 #0b0b10)'; o.drawImage(c, 0, 0); o.restore();
  }
  return out;
}
const loc = (at, p) => { const c = Math.cos(at.rot ?? 0), s = Math.sin(at.rot ?? 0); return [at.x + at.s * (p[0] * c - p[1] * s), at.y + at.s * (p[0] * s + p[1] * c)]; };

// The switched layout. Barret stands back-left, Cloud front-left, the boss right (feet points).
export const HOME = { cloud: { x: 272, y: 598, s: 1.05 }, barret: { x: 372, y: 530, s: 0.98 }, boss: { x: 1172, y: 556, s: 1.08 } };
export function cast(o = {}) {
  const cAt = o.cloudAt ?? HOME.cloud, bAt = HOME.barret, sAt = HOME.boss;
  const bp = bossParts(o.tail ?? 'down');
  const F = {
    boss: { cv: figure(bp, sAt), at: sAt, c: loc(sAt, [0, -130]) },
    barret: { cv: figure(POSES.barretAim, bAt), at: bAt, c: loc(bAt, [0, -130]) },
    cloud: { cv: figure(POSES[o.cloudPose ?? 'cloudReady'], cAt), at: cAt, c: loc(cAt, [8, -120]) },
  };
  const K = {
    emit: loc(sAt, bp.emit), eye: loc(sAt, [-156, -118]), gun: loc(sAt, [-244, -74]), bossTop: loc(sAt, [-10, -190]), bossC: loc(sAt, [-10, -130]),
    cloudC: F.cloud.c, cloudHead: loc(cAt, [10, -182]), cloudFeet: [cAt.x, cAt.y], barretC: F.barret.c, barretFeet: [bAt.x, bAt.y],
    swordTip: loc(cAt, [182, -86]), swordHilt: loc(cAt, [44, -192]), gunArm: loc(bAt, [118, -151]),
  };
  return { F, K };
}

// ---------- light ----------
// Colour a figure by a point light: a tint that falls off with distance, and a rim on the edge that faces it.
export function lightFigure(ctx, f, L, o = {}) {
  const [cx, cy] = f.c; const d = Math.hypot(L.x - cx, L.y - cy) || 1; const ux = (L.x - cx) / d, uy = (L.y - cy) / d;
  const fall = Math.max(0, Math.min(1, 1.25 - d / (L.r ?? 900))) * (L.i ?? 1);
  if (fall <= 0) return;
  const t = canvas(W, H), g = t.getContext('2d');
  g.drawImage(f.cv, 0, 0); g.globalCompositeOperation = 'source-in';
  if (o.cel) { g.fillStyle = `rgba(${L.c},${0.22 * fall})`; g.fillRect(0, 0, W, H); }
  else { const rg = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r ?? 900); rg.addColorStop(0, `rgba(${L.c},${0.3 * fall})`); rg.addColorStop(1, `rgba(${L.c},0)`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(t, 0, 0); ctx.restore();
  const k = o.cel ? 7 : 5; const r = canvas(W, H), h = r.getContext('2d');
  h.drawImage(f.cv, 0, 0); h.globalCompositeOperation = 'destination-out'; h.drawImage(f.cv, -k * ux, -k * uy);
  h.globalCompositeOperation = 'source-in'; h.fillStyle = o.cel ? `rgba(${L.c},${Math.min(1, 1.1 * fall)})` : `rgba(${L.c},${Math.min(1, 1.2 * fall)})`; h.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; if (!o.cel) { ctx.filter = 'blur(2px)'; ctx.drawImage(r, 0, 0); ctx.filter = 'none'; } ctx.drawImage(r, 0, 0); ctx.restore();
}
// A shadow on the floor, thrown away from the light.
export function shadow(ctx, f, L, o = {}) {
  const fy = f.at.y; const sg = Math.sign(f.at.x - L.x) || 1; const t = canvas(W, H), g = t.getContext('2d');
  g.setTransform(1, 0, -sg * 0.9, 0.2, sg * 0.9 * fy, 0.8 * fy); g.drawImage(f.cv, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = `rgba(0,0,8,${o.a ?? 0.45})`; g.fillRect(0, 0, W, H);
  ctx.save(); if (!o.cel) ctx.filter = 'blur(4px)'; ctx.drawImage(t, 0, 0); ctx.restore();
}
// A pool of light on the floor.
export function pool(ctx, x, y, r, c, a, cel) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, 0.2);
  if (cel) { for (const [k, al] of [[1, 0.5], [0.6, 0.9]]) { ctx.fillStyle = `rgba(${c},${a * al * 0.5})`; ctx.beginPath(); ctx.arc(0, 0, r * k, 0, 7); ctx.fill(); } }
  else { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); }
  ctx.restore();
}
// Plate + the FF7 band (our backdrop painting under the builder's real band), dimmed for the effect.
export function plate(ctx, dim, tint = '0,0,20') {
  ctx.drawImage(A.empty, 0, 0, W, H);
  if (dim) { ctx.fillStyle = `rgba(${tint},${dim})`; ctx.fillRect(0, 0, W, BAND); }
}
export function band(ctx) { ctx.drawImage(A.empty, 0, BAND, W, H - BAND, 0, BAND, W, H - BAND); }
export function placeholderTag(ctx) {
  ctx.save(); ctx.font = '600 19px "Segoe UI", sans-serif'; const s = 'PLACEHOLDER FIGURES · right-facing paintings owed · never mirrored';
  const w = ctx.measureText(s).width + 24; ctx.fillStyle = 'rgba(10,10,14,0.72)'; ctx.beginPath(); ctx.roundRect(1600 - w - 14, 596, w, 32, 6); ctx.fill();
  ctx.fillStyle = '#e8d9a8'; ctx.fillText(s, 1600 - w - 2, 618); ctx.restore();
}
