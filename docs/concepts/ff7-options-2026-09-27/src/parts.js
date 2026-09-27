// FF7 options round (2026-09-27): the sheet parts. FF7 ONLY: nothing here applies to FFX or FFX-2.
import { A, load, canvas, scene, msg, num, fig, crop } from './base.js';
import { drawFx } from './fx.js';
import { drawPose, tag, smear } from './poses.js';
import * as U from './ui.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function frame(fn, w = 1600, h = 900) { const c = canvas(w, h); fn(c.getContext('2d')); return c; }
function panel(parent, src, r, cap, W = 502) {
  const [x0, y0, x1, y1] = r ?? [0, 0, src.width, src.height];
  const c = canvas(W, Math.round((W * (y1 - y0)) / (x1 - x0))); crop(c, src, [x0, y0, x1, y1]);
  const f = el('figure'); f.append(c); if (cap) f.append(el('figcaption', null, cap)); parent.append(f); return f;
}
function opt(parent, title, lines, rec) {
  const d = el('div', 'opt' + (rec ? ' rec' : '')); d.append(el('h3', null, title + (rec ? '<span class="tag">RECOMMENDED</span>' : '')));
  for (const l of lines) d.append(el('p', null, l)); parent.append(d); return d;
}
function head(root, t, s) { root.append(el('h1', null, t)); root.append(el('div', 'sub', s)); }
const GAME = 'FF7 only (rule 14): the hidden Guard Scorpion fight. Nothing here changes FFX or FFX-2.';

// ---------- A: effects ----------
const MOMENTS = [
  { id: 'bolt', name: 'Bolt', cap: '<b>Bolt</b> · Cloud on the boss, tail down', tail: 'down', boss: { flash: 0.3 }, nums: [['93', 455, 330]], crop: [60, 0, 1060, 562] },
  { id: 'ice', name: 'Ice', cap: '<b>Ice</b> · Cloud on the boss', tail: 'down', boss: { tint: 'rgba(170,225,255,0.35)' }, nums: [['47', 452, 318]], crop: [60, 0, 1060, 562] },
  { id: 'cure', name: 'Cure', cap: '<b>Cure</b> · Barret on Cloud', tail: 'down', nums: [['241', 1328, 372, '#86ff9a']], crop: [600, 0, 1600, 562] },
  { id: 'braver', name: 'Braver', cap: '<b>Braver</b> · Cloud leaps, slashes down', tail: 'down', boss: { flash: 0.35 }, cloud: { dx: -767, dy: -300, rot: -0.45 }, nums: [['121', 420, 300]], crop: [60, 0, 1060, 562] },
  { id: 'bigshot', name: 'Big Shot', cap: '<b>Big Shot</b> · Barret releases the charged ball', tail: 'down', crop: [300, 20, 1600, 751] },
  { id: 'scope', name: 'Locked On Target', cap: '<b>Search Scope</b> · the lock-on to Cloud', tail: 'down', crop: [120, 60, 1520, 848] },
  { id: 'rifle', name: 'Rifle', cap: '<b>Rifle</b> · the boss on Barret', tail: 'down', barret: { flash: 0.3 }, nums: [['37', 1236, 318]], crop: [300, 140, 1500, 815] },
  { id: 'stail', name: 'Scorpion Tail', cap: '<b>Scorpion Tail</b> · a shot from the tail on Cloud', tail: 'down', cloud: { flash: 0.3 }, nums: [['66', 1330, 370]], crop: [0, 0, 1600, 900] },
  { id: 'laser', name: 'Tail Laser', cap: '<b>Tail Laser</b> · one beam swept across both', tail: 'up', cloud: { flash: 0.28 }, barret: { flash: 0.28 }, nums: [['75', 1200, 300], ['73', 1360, 392]], crop: [0, 0, 1600, 900] },
];
function moment(m, t) {
  return frame((ctx) => {
    scene(ctx, { tail: m.tail, boss: m.boss, cloud: m.cloud, barret: m.barret });
    drawFx(ctx, m.id, t);
    for (const [s, x, y, c] of m.nums ?? []) num(ctx, s, x, y, c ?? '#fff');
    msg(ctx, m.name);
  });
}
const ATEXT = {
  hard: ['A1 · Hard light', [
    '<span>Reads:</span> flat, sharp-edged polygon shapes added over the scene: jagged bolts, faceted ice prisms, flat rings, a crescent slash, a faceted ball, red bracket lock-on, a flat beam. No bloom.',
    '<span>Fidelity:</span> closest to FF7 as we read it: a 1997 PlayStation game draws its effects as real-time polygons with additive see-through blending. The sources say what each move does (Braver: "a jump upwards followed by a downward slash"; Big Shot: "charging up a large fireball and then releasing it"; Tail Laser from the raised tail at the whole party), not how Bolt, Ice or Cure look: those looks are our reading.',
    '<span>Cost:</span> code only; one FF7 effect registry of 9 effects (one build batch, about the size of spell-FX B). Light on a phone.']],
  soft: ['A2 · Painted glow', [
    '<span>Reads:</span> soft particles, halos and bloom: the method of the house spell-FX option B you liked, in FF7 colours.',
    '<span>Fidelity:</span> sits best in the paintings but reads as the house look, not as FF7: FF7 has no soft bloom. Least faithful of the three.',
    '<span>Cost:</span> cheapest if spell-FX B is built first (a skin on its registry); otherwise the same as A1. Heaviest particle count on a phone.']],
  hybrid: ['A3 · Hard core, painted light', [
    '<span>Reads:</span> A1’s polygon shapes, plus a glow pass and the effect’s colour cast on the floor and the fighters.',
    '<span>Fidelity:</span> FF7’s shapes, a modern finish; a middle road if A1 looks pasted onto the paintings.',
    '<span>Cost:</span> A1 plus a blur pass and one light per effect (about a fifth more work); a blur pass costs frame time on a phone.']],
};
async function partA(root, t) {
  const [title, lines] = ATEXT[t];
  head(root, `A · FF7 action effects · ${title}`, `${GAME} Nine moments at their key frame, over the real fight (our paintings, the FF7 band). Today every one of these is a stand-in lunge and the house impact flash.`);
  const g = el('div', 'grid'); root.append(g);
  for (const m of MOMENTS) panel(g, moment(m, t), m.crop, m.cap);
  const box = el('div'); g.append(box); opt(box, title, lines, t === 'hard');
}

// ---------- B: attack motion ----------
const CL = [300, 200, 1300, 680], BR = [200, 210, 1400, 786];
function bossHit(ctx, flash, dx) { fig(ctx, 'boss-down', { alpha: 0.18 }); fig(ctx, 'boss-down', { dx, flash }); }
function tracer(ctx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,235,170,0.9)'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(1030 - i * 150, 360 + i * 22); ctx.lineTo(950 - i * 150, 368 + i * 24); ctx.stroke(); } ctx.restore(); }
function motionFrames(v) {
  const cloud = frame((ctx) => {
    scene(ctx, { tail: 'down', boss: false, cloud: false });
    bossHit(ctx, 0.3, -16);
    if (v === 'B1') { drawPose(ctx, 'cloudWind', 872, 574, 1.05, { alpha: 0.28 }); drawPose(ctx, 'cloudStrike', 840, 574, 1.05, { tag: 'pose to paint', tagDx: -10 }); }
    if (v === 'B2') { smear(ctx, 800, 470, 150, -1.0, 1.9); drawPose(ctx, 'cloudStrike', 840, 574, 1.05, { tag: 'pose to paint', tagDx: -10 }); }
    if (v === 'B3') { smear(ctx, 780, 480, 150, -1.0, 1.9); fig(ctx, 'cloud', { dx: 840 - 1327, dy: -24, rot: -0.24 }); }
  });
  const barret = frame((ctx) => {
    scene(ctx, { tail: 'down', boss: false, barret: false });
    bossHit(ctx, 0.26, -10); tracer(ctx);
    if (v === 'B1') { drawPose(ctx, 'barretAim', 1236, 530, 1.0, { alpha: 0.28 }); drawPose(ctx, 'barretFire', 1236, 530, 1.0, { tag: 'pose to paint', tagDx: 10 }); }
    if (v === 'B2') drawPose(ctx, 'barretFire', 1236, 530, 1.0, { tag: 'pose to paint', tagDx: 10 });
    if (v === 'B3') { fig(ctx, 'barret', { dx: 8 }); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(1168, 389, 0, 1168, 389, 60); g.addColorStop(0, 'rgba(255,245,200,1)'); g.addColorStop(0.4, 'rgba(255,180,70,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(1100, 320, 140, 140); ctx.restore(); }
  });
  return [cloud, barret];
}
function keyStrip(keys, h = 300) {
  return frame((ctx) => {
    ctx.fillStyle = '#1b1b22'; ctx.fillRect(0, 0, 1600, h);
    keys.forEach(([k, lab], i) => { const x = 190 + i * (1220 / Math.max(1, keys.length - 1)); drawPose(ctx, k, x, h - 22, Math.min(0.95, (h - 70) / 270)); ctx.font = '600 30px "Segoe UI"'; ctx.fillStyle = '#e2b85a'; ctx.textAlign = 'center'; ctx.fillText(lab, x - 10, 40); });
  }, 1600, h);
}
async function partB(root) {
  head(root, 'B · FF7 attack motion', `${GAME} Cloud’s swing at the strike point and Barret’s gun-arm firing from his spot (Long Range), each with a white hit flash and a short knock-back on the boss. Poses are blocking sketches to paint later: Barret’s gun stays on his right arm, the far side, pointed forward.`);
  let g = el('div', 'grid'); root.append(g);
  panel(g, A['f1600-melee-strike'], CL, '<b>Today, Cloud:</b> the idle painting slides to the strike point');
  panel(g, A['f1600-turn'], BR, '<b>Today, Barret:</b> fires in place with no pose change');
  const text = {
    B1: ['B1 · Painted key poses', ['<span>Reads:</span> Cloud: wind-up, strike, follow-through (faint: the wind-up); Barret: aim, fire. The target flashes white and is knocked back a step.', '<span>Fidelity:</span> nearest to FF7, whose fighters are animated models with full-body swings. <span>Cost:</span> 5 new paintings (the OpenPose method) plus a pose-swap in the FF7 motion port.']],
    B2: ['B2 · One strike pose each, code smear', ['<span>Reads:</span> the idle painting swaps to one strike pose, with a drawn swing arc (Cloud) or muzzle flash (Barret).', '<span>Fidelity:</span> close, but the swing has no wind-up. <span>Cost:</span> 2 paintings plus code.']],
    B3: ['B3 · No new paintings', ['<span>Reads:</span> the idle painting tilts into the blow with a drawn arc; Barret’s kicks back with a flash.', '<span>Fidelity:</span> lowest: a sword that never moves. <span>Cost:</span> code only.']],
  };
  for (const v of ['B1', 'B2', 'B3']) {
    const [c, b] = motionFrames(v); g = el('div', 'grid'); root.append(g);
    panel(g, c, CL, `<b>${v}</b> · Cloud`); panel(g, b, BR, `<b>${v}</b> · Barret`);
    if (v === 'B1') { const s = el('div'); root.append(s); panel(s, keyStrip([['cloudWind', 'wind-up'], ['cloudStrike', 'strike'], ['cloudFollow', 'follow-through'], ['barretAim', 'aim'], ['barretFire', 'fire']], 250), null, null, 1024); }
    opt(root, text[v][0], text[v][1], v === 'B1');
  }
}

// ---------- C: results ----------
async function partC1(root) {
  head(root, 'C · FF7 results screen · C1 two windows', `${GAME} Blue four-corner windows on black, advanced by confirm. Portraits are crops of our own paintings.`);
  panel(root, frame(U.resultsStep1), null, '<b>C1, step 1:</b> EXP and AP, a row per member (portrait, LV, the next-level gauge filling, AP to each member’s materia). Confirm →', 1024);
  panel(root, frame(U.resultsStep2), null, '<b>C1, step 2:</b> Gil, then the Items window with the Assault Gun under the finger. Confirm → chapter select.', 1024);
  opt(root, 'C1 · Two windows, step by step', ['<span>Fidelity:</span> the sources say FF7’s results show the gained EXP beside each member’s menu portrait with a gauge that fills, the AP to materia, the gil, and a list of dropped items to take (FF Wiki, "Battle Results"). The exact arrangement is our estimate. The next-level fill is illustrative: levels gained are not computed yet.', '<span>Cost:</span> one new FF7 screen (this is its mockup); FF7 only. It also retires the house panel’s wrong ATTEMPTS / BEST rows for FF7 (check minor C-2).'], true);
}
async function partC2(root) {
  head(root, 'C · C2 compact, and Game Over', GAME);
  panel(root, frame(U.resultsCompact), null, '<b>C2:</b> one window over the dimmed field after the win poses: EXP, AP and Gil across the top, a row per member, the item, one confirm.', 1024);
  opt(root, 'C2 · One compact window', ['<span>Reads:</span> faster (one press), keeps the reactor in view. <span>Fidelity:</span> less like FF7, whose results are their own screen. <span>Cost:</span> the same as C1.']);
  const g = el('div', 'grid'); root.append(g);
  panel(g, frame(U.gameOverPan), null, '<b>G1, beat 1:</b> the camera pans up over the fallen party (KO poses to paint)');
  panel(g, frame(U.gameOverWindow), null, '<b>G1, beat 2:</b> black, GAME OVER, then RETRY / CHAPTER SELECT');
  panel(g, frame(U.gameOverReel), null, '<b>G3:</b> G1 with our own drawn broken reel');
  panel(g, A['f1600-defeat'], null, '<b>G2, today:</b> the house defeat panel');
  opt(root, 'G1 · Pan up, then GAME OVER', ['<span>Fidelity:</span> the source: "the camera pans up showing the dead characters, then cuts to a destroyed film reel" (FF Wiki, "Game Over (term)"); the retail reel image and "Continue?" music are not ours, so G1 keeps the pan and the black, silent. <span>Cost:</span> 2 KO paintings, one small screen.'], true);
  opt(root, 'G2 keep today’s panel · G3 add our own reel', ['G2 costs nothing but reads as the house. G3 is our drawing from the one-line description; it adds a nod, and the risk of looking like an imitation of the retail picture.']);
}

// ---------- D: victory ----------
async function partD(root) {
  head(root, 'D · The victory moment', `${GAME} The boss is gone; each member plays a win pose and the field holds before the results. FF7’s victory fanfare is retail, so it is silence or an original sting.`);
  const d1 = frame((ctx) => { scene(ctx, { tail: null, cloud: false, barret: false }); drawPose(ctx, 'barretPunch', 1226, 530, 1.0); drawPose(ctx, 'cloudSpin', 1350, 598, 1.05); tag(ctx, 'poses to paint', 1010, 300); });
  panel(root, d1, [640, 90, 1600, 630], '<b>D1:</b> Cloud mid sword-spin, Barret punching the air with his normal (left) hand', 1024);
  panel(root, keyStrip([['cloudFist', 'Cloud: fist ×2'], ['cloudSpin', 'sword spin'], ['cloudBack', 'onto his back'], ['barretSquat', 'Barret: squat'], ['barretPunch', 'air punch']], 330), null, null, 1024);
  opt(root, 'D1 · Win poses, a hold, silence', ['<span>Fidelity:</span> the poses as the source describes them: Cloud "pumps his fist twice, spins his sword in one hand, and then places it on his back"; Barret "squats, stands and punches the air with his normal hand", looping (FF Wiki, "Final Fantasy VII victory poses"). Silence matches your pick of silent music. A KO’d member stays down.', '<span>Cost:</span> 5 paintings (3 Cloud keys, 2 Barret) and a 2.5 s hold in the FF7 flow.'], true);
  const g = el('div', 'grid'); root.append(g);
  const d2 = frame((ctx) => { ctx.drawImage(d1, 0, 0); ctx.fillStyle = 'rgba(15,15,19,0.85)'; ctx.fillRect(700, 120, 520, 70); ctx.fillStyle = '#e2b85a'; ctx.font = '600 32px "Segoe UI"'; ctx.fillText('♪ original 2 s sting (ours)', 724, 167); });
  panel(g, d2, [640, 90, 1600, 630], '<b>D2:</b> D1 plus an original short sting');
  const d3 = frame((ctx) => { scene(ctx, { tail: null }); });
  panel(g, d3, [960, 250, 1500, 554], '<b>D3:</b> no new paintings: the camera pushes in on the idle party');
  opt(root, 'D2 · D1 with an original sting', ['Needs an audio sketch you judge by ear (agents cannot hear). Take it after D1 if the silence feels empty.']);
  opt(root, 'D3 · Camera push-in, idle poses', ['Code only; it reads as "the fight stopped", not as FF7’s win.']);
}

// ---------- E: phone ----------
async function partE(root) {
  head(root, 'E · Upright phone framing', `${GAME} 390x844, the hint lines with the tail up (today’s frame shows the next line). The dashed box is where the command window opens on a turn.`);
  const g = el('div', 'grid3'); root.append(g);
  panel(g, frame(U.phoneCloser, 390, 844), null, '<b>E1:</b> formation drawn in, camera moved in', 331);
  panel(g, frame(U.phoneWindowOnScene, 390, 844), null, '<b>E2:</b> zoom 1.3×, window on the scene', 331);
  panel(g, frame(U.phoneToday, 390, 844), null, '<b>E3, today:</b> the letterbox', 331);
  opt(root, 'E1 · Formation drawn in, camera moved in', ['<span>Reads:</span> fighters about 2.5× today’s height; the field fills the space between the message window and the band. <span>Fidelity:</span> FF7 has no upright layout; its default camera moves throughout a battle, so a tighter phone camera does not contradict it. <span>Cost:</span> an FF7 phone staging (positions and camera), proved by the real-input check.'], true);
  opt(root, 'E2 · Zoom and move the window onto the scene', ['<span>Reads:</span> fighters about 1.3× today; the message sits on the field’s edge, as it overlaps the scene in FF7. <span>Cost:</span> camera zoom and layout only.']);
  opt(root, 'E3 · Keep the letterbox', ['Nothing to build; Cloud stays about 50 px tall with dark bands above and below.']);
}

// ---------- F: entry ----------
async function partF(root) {
  head(root, 'F · The way in: FF7 swirl and opening camera', `${GAME} FF7 enters a fight by twisting the frozen field screen; ours enters from chapter select, so the board is what twists.`);
  let g = el('div', 'grid'); root.append(g);
  const b = frame((ctx) => ctx.drawImage(A.board, 0, 0, 1600, 900));
  panel(g, U.swirl(b, 2.4, 1.05, 0.05), null, '<b>F1, 0.4 s:</b> the board twists and zooms');
  panel(g, U.swirl(b, 7.0, 1.22, 0.3), null, '<b>F1, 1.0 s:</b> full twist, lightening, then a cut to black');
  panel(g, frame((ctx) => { ctx.drawImage(A.down, 120, 200, 720, 405, 0, 0, 1600, 900); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, 1600, 900); }), null, '<b>F1, 1.3 s:</b> the field fades up close on the boss');
  panel(g, frame((ctx) => { ctx.drawImage(A.down, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 636, 1600, 264); ctx.drawImage(A.down, 0, 636, 1600, 264, 0, 716, 1600, 264); }), null, '<b>F1, 3.0 s:</b> the camera settles; the band rises');
  opt(root, 'F1 · FF7 swirl plus a short opening camera', ['<span>Fidelity:</span> written sources (a beetle-psx issue and a Steam thread, cited by Lifestream Encore’s research, not re-checked by us) say FF7 grabs the field screen and applies a rotating, zooming distortion. The camera path is our estimate; the source says only that FF7’s default camera moves during battle.', '<span>Cost:</span> one post-process pass on a frozen frame (about 1 s) and a scripted 2 s camera move, FF7 only.'], true);
  g = el('div', 'grid'); root.append(g);
  panel(g, frame((ctx) => { ctx.drawImage(A.down, 0, 0); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, 1600, 900); }), null, '<b>F2:</b> the same swirl, then straight into the fixed view');
  panel(g, A['f1600-door'], null, '<b>F3, today:</b> the chapters’ own transition');
  opt(root, 'F2 swirl only · F3 keep today', ['F2 drops the camera move (cheaper, less motion). F3 is your earlier pick for the door, kept as an approved departure.']);
}

// ---------- 1: overview ----------
async function part1(root) {
  head(root, 'FF7 Guard Scorpion · options round · 2026-09-27', `${GAME} The purist review’s open majors: effects (5), results (7), phone framing (9), the way in (15), plus attack motion and the victory moment. Concept frames over the real fight; nothing is built until you pick.`);
  const t = el('table'); root.append(t);
  t.innerHTML = '<tr><th>Item</th><th>Options</th><th>Recommendation</th></tr>' + [
    ['A · Effects', 'A1 hard light · A2 painted glow · A3 hybrid', 'A1: the closest to FF7 as we read it'],
    ['B · Attack motion', 'B1 key poses · B2 one pose + smear · B3 no paintings', 'B1 with a white hit flash and knock-back'],
    ['C · Results', 'C1 two windows · C2 one window; Game Over G1 / G2 / G3', 'C1, and G1 (pan up, then GAME OVER, silent)'],
    ['D · Victory', 'D1 poses + silence · D2 + original sting · D3 push-in', 'D1; D2 later, once a sting passes your ear'],
    ['E · Phone', 'E1 camera in · E2 zoom + window on scene · E3 letterbox', 'E1'],
    ['F · Way in', 'F1 swirl + camera · F2 swirl · F3 today', 'F1'],
  ].map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
  root.append(el('h2', null, 'Today, for comparison'));
  const g = el('div', 'grid'); root.append(g);
  panel(g, A['f1600-tail-laser'], null, 'Tail Laser today: a lunge, the house flash, no beam');
  panel(g, A['f1600-melee-strike'], null, 'Attack today: the idle painting slides');
  panel(g, A['f1600-victory'], null, 'Results today: the house panel');
  panel(g, A['f1600-opening'], null, 'The way in today: the chapters’ transition');
  root.append(el('div', 'note', 'No retail FF7 image, model, effect, font or sound was used: every effect, window, pose sketch and swirl is drawn here from written descriptions; the fighters and the reactor are our own paintings. Sources and method: README.md.'));
}

export async function build(n, root) {
  await load();
  const P = { 1: part1, 2: (r) => partA(r, 'hard'), 3: (r) => partA(r, 'soft'), 4: (r) => partA(r, 'hybrid'), 5: partB, 6: partC1, 7: partC2, 8: partD, 9: partE, 10: partF };
  await P[n](root);
}
export { tag };
