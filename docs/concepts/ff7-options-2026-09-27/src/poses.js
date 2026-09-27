// FF7 options round, items B and D: pose sketches (blocking silhouettes to paint later).
// Both face screen-left toward the boss (research/ff7-battle-staging.md 7). Cloud's
// pauldron is on his LEFT shoulder, the near side; Barret's gun-arm is his RIGHT arm, the
// far side, posed forward so it clears his body; never mirrored (staging 6.1 to 6.3).
// Local units: pixels at the 1600x900 frame, origin at the feet, forward = -x.

const C = {
  cloud: { head: 16, torso: 40, upper: 15, fore: 13, thigh: 19, shin: 16 },
  barret: { head: 18, torso: 62, upper: 23, fore: 21, thigh: 25, shin: 22 },
};
export const POSE = {
  cloudWind: { who: 'cloud', pelvis: [4, -104], chest: [10, -150], head: [4, -186], sN: [-4, -156], eN: [-10, -186], hN: [8, -204], sF: [18, -156], eF: [30, -182], hF: [12, -202], hipN: [-2, -104], kN: [-34, -60], fN: [-62, 0], hipF: [10, -104], kF: [30, -56], fF: [54, 0], sword: [[10, -203], [96, -330]] },
  cloudStrike: { who: 'cloud', pelvis: [0, -96], chest: [-24, -140], head: [-42, -172], sN: [-30, -146], eN: [-58, -128], hN: [-80, -112], sF: [-14, -150], eF: [-48, -136], hF: [-76, -116], hipN: [-6, -96], kN: [-54, -58], fN: [-84, 0], hipF: [6, -96], kF: [36, -52], fF: [72, 0], sword: [[-78, -114], [-222, -6]] },
  cloudFollow: { who: 'cloud', pelvis: [4, -84], chest: [-20, -126], head: [-34, -158], sN: [-24, -132], eN: [-44, -100], hN: [-62, -80], sF: [-10, -136], eF: [-36, -104], hF: [-58, -82], hipN: [-2, -84], kN: [-52, -54], fN: [-82, 0], hipF: [8, -84], kF: [40, -40], fF: [80, 0], sword: [[-60, -81], [52, -8]] },
  cloudFist: { who: 'cloud', pelvis: [2, -104], chest: [0, -152], head: [-4, -188], sN: [-10, -156], eN: [-30, -140], hN: [-26, -186], sF: [12, -156], eF: [22, -120], hF: [20, -88], hipN: [-4, -104], kN: [-14, -54], fN: [-26, 0], hipF: [8, -104], kF: [16, -54], fF: [26, 0], sword: [[20, -88], [30, 60]] },
  cloudSpin: { who: 'cloud', pelvis: [2, -104], chest: [0, -152], head: [-4, -188], sN: [-10, -156], eN: [-22, -130], hN: [-18, -104], sF: [12, -156], eF: [4, -196], hF: [-8, -228], hipN: [-4, -104], kN: [-14, -54], fN: [-26, 0], hipF: [8, -104], kF: [16, -54], fF: [26, 0], spin: [-8, -228] },
  cloudBack: { who: 'cloud', pelvis: [2, -104], chest: [2, -152], head: [-2, -188], sN: [-10, -156], eN: [-14, -124], hN: [-12, -96], sF: [14, -156], eF: [26, -178], hF: [20, -196], hipN: [-4, -104], kN: [-12, -54], fN: [-22, 0], hipF: [8, -104], kF: [14, -54], fF: [24, 0], swordBack: [[20, -196], [112, -52]] },
  barretAim: { who: 'barret', pelvis: [0, -96], chest: [2, -150], head: [-2, -190], sN: [-18, -160], eN: [-26, -128], hN: [-48, -148], sF: [20, -162], eF: [-14, -162], gun: [-104, -166], hipN: [-10, -96], kN: [-26, -50], fN: [-42, 0], hipF: [12, -96], kF: [28, -50], fF: [42, 0] },
  barretFire: { who: 'barret', pelvis: [4, -96], chest: [12, -148], head: [8, -188], sN: [-8, -158], eN: [-20, -126], hN: [-38, -142], sF: [28, -160], eF: [-2, -168], gun: [-84, -190], hipN: [-6, -96], kN: [-24, -50], fN: [-42, 0], hipF: [14, -96], kF: [30, -50], fF: [46, 0], muzzle: true },
  barretSquat: { who: 'barret', pelvis: [2, -62], chest: [-4, -116], head: [-10, -156], sN: [-20, -126], eN: [-34, -96], hN: [-30, -66], sF: [16, -128], eF: [18, -92], gun: [6, -20], hipN: [-8, -62], kN: [-44, -40], fN: [-40, 0], hipF: [12, -62], kF: [46, -40], fF: [44, 0] },
  barretPunch: { who: 'barret', pelvis: [0, -96], chest: [0, -150], head: [-4, -190], sN: [-16, -162], eN: [-26, -206], hN: [-20, -252], sF: [20, -160], eF: [28, -118], gun: [24, -40], hipN: [-10, -96], kN: [-22, -50], fN: [-36, 0], hipF: [12, -96], kF: [24, -50], fF: [38, 0], fist: true },
  cloudDown: { who: 'cloud', lying: true, pelvis: [30, -16], chest: [78, -20], head: [116, -22], sN: [70, -26], eN: [52, -8], hN: [30, -6], sF: [84, -26], eF: [98, -6], hF: [120, -4], hipN: [30, -14], kN: [-20, -18], fN: [-70, -8], hipF: [34, -14], kF: [-14, -26], fF: [-66, -30], sword: [[124, -4], [250, -2]] },
  barretDown: { who: 'barret', kneel: true, pelvis: [6, -50], chest: [-22, -100], head: [-44, -130], sN: [-34, -110], eN: [-52, -74], hN: [-60, -40], sF: [-8, -116], eF: [-24, -80], gun: [-80, -10], hipN: [0, -50], kN: [-36, -20], fN: [10, 0], hipF: [10, -50], kF: [40, -4], fF: [70, 0] },
};

const INK = '#17120d', NEAR = 'rgba(240,226,200,0.95)', FAR = 'rgba(170,154,132,0.95)', METAL = 'rgba(176,186,198,0.97)', DARKMETAL = 'rgba(92,98,108,0.98)';

function seg(ctx, a, b, w, fill, out) {
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  if (out) { ctx.strokeStyle = INK; ctx.lineWidth = w + 6; ctx.stroke(); } else { ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke(); }
}
function group(ctx, list) { for (const out of [true, false]) for (const [a, b, w, f] of list) seg(ctx, a, b, w, f, out); }
function blade(ctx, a, b, w0, w1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  ctx.beginPath(); ctx.moveTo(a[0] + nx * w0, a[1] + ny * w0); ctx.lineTo(b[0] + nx * w1, b[1] + ny * w1); ctx.lineTo(b[0] - nx * w1 * 0.2 + dx / L * 6, b[1] - ny * w1 * 0.2 + dy / L * 6); ctx.lineTo(a[0] - nx * w0 * 0.6, a[1] - ny * w0 * 0.6); ctx.closePath();
  ctx.fillStyle = METAL; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(a[0] - dx / L * 26, a[1] - dy / L * 26); ctx.lineTo(a[0], a[1]); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
}

// Draw a pose at (x, y) feet position, scale s.
export function drawPose(ctx, key, x, y, s = 1, o = {}) {
  const p = POSE[key]; const d = C[p.who];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = o.alpha ?? 1;
  const far = [[p.sF, p.eF, d.upper, FAR], [p.hipF, p.kF, d.thigh, FAR], [p.kF, p.fF, d.shin, FAR]];
  if (p.hF) far.push([p.eF, p.hF, d.fore, FAR]);
  if (p.swordBack) blade(ctx, p.swordBack[0], p.swordBack[1], 13, 11);
  group(ctx, far);
  if (p.gun) { // Barret's right forearm is the gun: a heavy barrel block, far side
    group(ctx, [[p.eF, p.gun, 28, DARKMETAL]]);
    ctx.strokeStyle = 'rgba(40,44,52,1)'; ctx.lineWidth = 3; const dx = p.gun[0] - p.eF[0], dy = p.gun[1] - p.eF[1], L = Math.hypot(dx, dy);
    for (const k of [-7, 0, 7]) { const nx = (-dy / L) * k, ny = (dx / L) * k; ctx.beginPath(); ctx.moveTo(p.eF[0] + dx * 0.45 + nx, p.eF[1] + dy * 0.45 + ny); ctx.lineTo(p.gun[0] + nx, p.gun[1] + ny); ctx.stroke(); }
  }
  group(ctx, [[p.chest, p.pelvis, d.torso, NEAR], [p.sN, p.sF, d.upper, NEAR]]);
  // head
  ctx.beginPath(); ctx.arc(p.head[0], p.head[1], d.head, 0, 7); ctx.fillStyle = NEAR; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  if (p.who === 'cloud') { // spikes sweep back (+x) and up
    ctx.fillStyle = 'rgba(240,210,120,0.97)'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    const sp = p.lying ? [[12, 2, 34, 20], [6, -8, 30, -18], [10, 10, 30, 32]] : [[-6, -14, -2, -44], [4, -14, 26, -38], [10, -6, 38, -14], [8, 4, 34, 14], [-12, -10, -30, -30]];
    for (const [ax, ay, tx, ty] of sp) { ctx.beginPath(); ctx.moveTo(p.head[0] + ax - 6, p.head[1] + ay); ctx.lineTo(p.head[0] + tx, p.head[1] + ty); ctx.lineTo(p.head[0] + ax + 6, p.head[1] + ay + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  } else if (!p.lying) { ctx.fillStyle = 'rgba(40,34,28,0.98)'; ctx.fillRect(p.head[0] - 13, p.head[1] - d.head - 16, 26, 18); }
  group(ctx, [[p.hipN, p.kN, d.thigh, NEAR], [p.kN, p.fN, d.shin, NEAR]]);
  if (p.sword) blade(ctx, p.sword[0], p.sword[1], 12, 10);
  group(ctx, [[p.sN, p.eN, d.upper, NEAR], [p.eN, p.hN, d.fore, NEAR]]);
  if (p.who === 'cloud') { ctx.beginPath(); ctx.ellipse(p.sN[0], p.sN[1] - 2, 14, 11, 0, 0, 7); ctx.fillStyle = METAL; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); }
  if (p.fist) { ctx.beginPath(); ctx.arc(p.hN[0], p.hN[1], 14, 0, 7); ctx.fillStyle = NEAR; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); }
  if (p.spin) { // the one-handed sword spin, drawn as a motion disc
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.spin[0], p.spin[1], 118 - i * 4, -0.4 + i * 1.9, 0.9 + i * 1.9); ctx.strokeStyle = `rgba(210,222,236,${0.75 - i * 0.2})`; ctx.lineWidth = 16 - i * 3; ctx.stroke(); }
    blade(ctx, p.spin, [p.spin[0] + 110, p.spin[1] - 48], 12, 10); ctx.restore();
  }
  if (p.muzzle) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(p.gun[0] - 16, p.gun[1] - 4, 0, p.gun[0] - 16, p.gun[1] - 4, 60); g.addColorStop(0, 'rgba(255,245,200,1)'); g.addColorStop(0.35, 'rgba(255,190,70,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.gun[0] - 16, p.gun[1] - 4, 60, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.restore();
  if (o.tag) tag(ctx, o.tag, x + (o.tagDx ?? -40) * s, y - 300 * s);
}
export function tag(ctx, s, x, y, size = 22) {
  ctx.save(); ctx.font = `600 ${size}px "Segoe UI", sans-serif`; const w = ctx.measureText(s).width + 18;
  ctx.fillStyle = 'rgba(20,16,12,0.85)'; ctx.fillRect(x - w / 2, y - size, w, size + 12); ctx.strokeStyle = 'rgba(240,226,200,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, y - size, w, size + 12);
  ctx.fillStyle = '#f0e2c8'; ctx.textAlign = 'center'; ctx.fillText(s, x, y + 1); ctx.restore();
}
// A smear arc for a sword swing (code-drawn, for B2 and B3).
export function smear(ctx, cx, cy, r, a0, a1, color = '255,255,255') {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx, cy, r - i * 7, a0 + (a1 - a0) * (i / 14), a1); ctx.strokeStyle = `rgba(${color},${0.1 + i * 0.1})`; ctx.lineWidth = 10; ctx.stroke(); }
  ctx.restore();
}
