// Top-down camera sketches on a fixed 240x150 arena. Pure functions: shot -> SVG string.
// Party: three circles at lower left, the acting hero filled gold. Enemy: a diamond at upper right.
// The camera is a wedge whose tip is the lens; it opens 70 / 45 / 25 degrees for a wide / normal /
// long lens. Colours come from the page tokens through the classes in page.css and --g (game colour).

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const fx = (n) => String(Math.round(n * 10) / 10);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const wrap = (a) => {
  let x = a % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
};
const unit = (v) => {
  const l = Math.hypot(v[0], v[1]);
  return [v[0] / l, v[1] / l];
};

export const PARTY = [[55, 105], [78, 95], [45, 85]];
export const ACTIVE = 1;
export const ENEMY = [185, 48];
const HERO = PARTY[ACTIVE];
const CEN = [PARTY.reduce((s, p) => s + p[0], 0) / 3, PARTY.reduce((s, p) => s + p[1], 0) / 3];
const U = unit([ENEMY[0] - CEN[0], ENEMY[1] - CEN[1]]); // party -> enemy
const V = [-U[1], U[0]]; // the viewer's right when facing the enemy
const B = [-U[0], -U[1]]; // behind the party
const MID = [(CEN[0] + ENEMY[0]) / 2, (CEN[1] + ENEMY[1]) / 2];

const HALF = { wide: 35, normal: 22.5, long: 12.5 }; // half of the 70 / 45 / 25 degree opening
const MIN_REACH = 40; // a wedge runs to just past what the lens is looking at
const GRID = (() => {
  let d = '';
  for (let x = 20; x < 240; x += 20) d += `M${x} 0V150`;
  for (let y = 20; y < 150; y += 20) d += `M0 ${y}H240`;
  return d;
})();

// A point `d` away from `o`, at `th` degrees round from "behind the party" (0) towards the
// viewer's right (90 = side-on, 180 = in front, looking back at the party).
const polar = (o, d, th) => [
  o[0] + d * (Math.cos(th * D2R) * B[0] + Math.sin(th * D2R) * V[0]),
  o[1] + d * (Math.cos(th * D2R) * B[1] + Math.sin(th * D2R) * V[1]),
];
const ang = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]) * R2D;

// Close behind the acting hero, `th` degrees off the line to the enemy. The wedge is turned so the
// hero sits in the left half of the view and the enemy stays in it when the lens allows.
function behindActive(th, d, lens) {
  const cam = polar(HERO, d, th);
  const foe = ang(cam, ENEMY);
  const half = HALF[lens];
  const gap = wrap(foe - ang(cam, HERO));
  return { cam, aim: foe - clamp(gap - 0.5 * half, 0.1 * half, 0.85 * half), focus: ENEMY };
}
// Side-on: the lens sits out from the middle of the arena, turned to split the hero and the enemy.
// At this scale a 70 degree wedge cannot hold both ends, so they land on its edges.
const sideView = (th) => {
  const cam = polar(MID, 74, th);
  const toHero = ang(cam, HERO);
  return { cam, aim: toHero + wrap(ang(cam, ENEMY) - toHero) / 2, focus: ENEMY };
};
const frontOfParty = (th) => {
  const cam = polar(CEN, 58, th);
  return { cam, aim: ang(cam, CEN), focus: CEN };
};

// Orbit shots: what the camera swings round, the radius, and the sweep drawn as an arrow.
const ORBIT = {
  'co-skill-exec': { about: HERO, r: 44, arc: [30, 170], who: 'the caster' },
  'co-parry-counter': { about: ENEMY, r: 44, arc: [20, 100], who: 'the enemy' },
  'co-break': { about: ENEMY, r: 36, arc: [55, 125], who: 'the enemy' },
};

// Per-shot overrides, used where the generic rule puts the lens in the wrong place for the text.
//   { lens, look }  place the lens and its look-at point exactly (SVG units); reachTo = how far the wedge runs
//   { d }           keep the rule but change how far behind the hero the lens sits
//   { as }          read the shot as another camera type
export const OVERRIDES = {
  // Close cutaways on the enemy from the party's side, not a lens behind the hero.
  'co-target-select': { lens: polar(ENEMY, 38, 12), look: ENEMY, label: "camera close to the enemy, on the party's side" },
  'co-telegraph': { lens: polar(ENEMY, 24, 6), look: ENEMY, label: "camera very close to the enemy, on the party's side" },
  'p5-enemy-turn': { lens: polar(ENEMY, 34, 40), look: ENEMY, label: "camera close to the enemy, front three-quarter, from the party's side" },
  // Far behind the whole party, not close behind one hero.
  'co-enemy-turn': { lens: polar(CEN, 56, 20), look: ENEMY, label: 'camera far behind the party, wide' },
  'co-static-wide': { lens: polar(CEN, 60, 5), look: ENEMY, label: 'camera far behind the party, held still' },
  'co-gradient': { d: 46 },
  // A low side-on track of the lunge, close to and just behind the attacker, not the far side view.
  'p5-melee': { lens: polar(HERO, 36, 65), look: [110, 79], reachTo: ENEMY, label: 'camera low, close and just behind the attacker, side-on to the lunge' },
  // Tagged orbit, but the text is a whip-pan that lands behind Joker's shoulder.
  'p5-holdup': { as: 'behind-active' },
};

export function place(shot) {
  const dg = shot.diagram;
  const lens = HALF[shot.camera.lens] ? shot.camera.lens : 'normal';
  const ov = OVERRIDES[shot.id];
  const side = ov?.as ?? dg.cameraSide;
  const th = dg.cameraAngleDeg;
  if (side === 'cut-in') return { kind: 'cutin' };
  if (side === '2d-sequence') return { kind: 'seq' };
  if (side === 'free') return { kind: 'free' };
  let r;
  let arc = null;
  let label;
  if (ov?.lens) {
    r = { cam: ov.lens, aim: ang(ov.lens, ov.look), focus: ov.reachTo ?? ov.look };
    label = ov.label;
  } else if (side === 'behind-active') {
    r = behindActive(th, ov?.d ?? 32, lens);
    label = `camera behind the acting hero, ${th} degrees off the line to the enemy`;
  } else if (side === 'side') {
    r = sideView(th);
    label = `camera at the side of the arena, ${th} degrees round from behind the party`;
  } else if (side === 'front-of-party') {
    r = frontOfParty(th);
    label = 'camera in front of the party, looking back at it';
  } else if (side === 'orbit') {
    const o = ORBIT[shot.id] ?? { about: ENEMY, r: 46, arc: [th - 40, th + 40], who: 'the enemy' };
    const cam = polar(o.about, o.r, th);
    r = { cam, aim: ang(cam, o.about), focus: o.about };
    arc = { about: o.about, r: o.r, a0: o.arc[0], a1: o.arc[1] };
    label = `camera swinging round ${o.who}`;
  } else throw new Error(`diagram: unknown camera side "${side}" in ${shot.id}`);
  const dist = Math.hypot(r.focus[0] - r.cam[0], r.focus[1] - r.cam[1]);
  return { kind: 'wedge', ...r, lens, arc, label, overridden: Boolean(ov), reach: Math.min(240, Math.max(MIN_REACH, dist + 16)) };
}

// For the build-time check: which of the hero and enemy fall inside the wedge.
export function coverage(p) {
  if (p.kind !== 'wedge') return null;
  const inside = (pt) => Math.abs(wrap(ang(p.cam, pt) - p.aim)) <= HALF[p.lens] + 5 && Math.hypot(pt[0] - p.cam[0], pt[1] - p.cam[1]) <= p.reach;
  return { hero: inside(HERO), enemy: inside(ENEMY), party: PARTY.map(inside), gapToParty: Math.min(...PARTY.map((q) => Math.hypot(q[0] - p.cam[0], q[1] - p.cam[1]))) };
}

const pt = (p) => `${fx(p[0])} ${fx(p[1])}`;
const pill = (cx, cy, w, text) =>
  `<rect class="d-pill" x="${fx(cx - w / 2)}" y="${fx(cy - 8)}" width="${w}" height="16" rx="2"/><text class="d-label" x="${cx}" y="${fx(cy + 2.8)}">${text}</text>`;

function wedgeSvg(p, id) {
  const half = HALF[p.lens];
  const far = (a) => [p.cam[0] + p.reach * Math.cos(a * D2R), p.cam[1] + p.reach * Math.sin(a * D2R)];
  const c = far(p.aim);
  const [l, r] = [far(p.aim - half), far(p.aim + half)];
  return (
    `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fx(p.cam[0])}" y1="${fx(p.cam[1])}" x2="${fx(c[0])}" y2="${fx(c[1])}">` +
    `<stop class="d-stop" offset="0" stop-opacity=".5"/><stop class="d-stop" offset="1" stop-opacity=".06"/></linearGradient></defs>` +
    `<polygon fill="url(#${id})" stroke="none" points="${pt(p.cam)} ${pt(l)} ${pt(r)}"/>` +
    `<path class="d-ray" fill="none" d="M${pt(l)}L${pt(p.cam)}L${pt(r)}"/>`
  );
}

function arcSvg(a) {
  const p0 = polar(a.about, a.r, a.a0);
  const p1 = polar(a.about, a.r, a.a1);
  const s = Math.sign(a.a1 - a.a0);
  const t = a.a1 * D2R;
  const tan = unit([s * (-Math.sin(t) * B[0] + Math.cos(t) * V[0]), s * (-Math.sin(t) * B[1] + Math.cos(t) * V[1])]);
  const n = [-tan[1], tan[0]];
  const tip = [p1[0] + tan[0] * 5.5, p1[1] + tan[1] * 5.5];
  const w1 = [p1[0] - tan[0] * 1.5 + n[0] * 3.4, p1[1] - tan[1] * 1.5 + n[1] * 3.4];
  const w2 = [p1[0] - tan[0] * 1.5 - n[0] * 3.4, p1[1] - tan[1] * 1.5 - n[1] * 3.4];
  // Increasing angle runs counter-clockwise on screen, hence sweep flag 0.
  return `<path class="d-arc" fill="none" d="M${pt(p0)}A${a.r} ${a.r} 0 0 ${s > 0 ? 0 : 1} ${pt(p1)}"/><polygon class="d-arrow" points="${pt(tip)} ${pt(w1)} ${pt(w2)}"/>`;
}

const diamond = (c, h) => `${fx(c[0])} ${fx(c[1] - h)} ${fx(c[0] + h)} ${fx(c[1])} ${fx(c[0])} ${fx(c[1] + h)} ${fx(c[0] - h)} ${fx(c[1])}`;

export function diagramSvg(shot) {
  const p = place(shot);
  const dim = p.kind === 'cutin' || p.kind === 'seq';
  const arena =
    `<line class="d-axis" x1="${fx(CEN[0])}" y1="${fx(CEN[1])}" x2="${ENEMY[0]}" y2="${ENEMY[1]}"/>` +
    (p.kind === 'wedge' ? wedgeSvg(p, `w-${shot.id}`) : '') +
    (p.arc ? arcSvg(p.arc) : '') +
    (p.kind === 'free' ? `<circle class="d-free" cx="${fx(MID[0])}" cy="${fx(MID[1])}" r="66"/>` : '') +
    PARTY.map((q, i) => `<circle class="${i === ACTIVE ? 'd-active' : 'd-party'}" cx="${q[0]}" cy="${q[1]}" r="${i === ACTIVE ? 5.8 : 5.2}"/>`).join('') +
    `<polygon class="d-enemy" points="${diamond(ENEMY, 9)}"/>` +
    (p.kind === 'wedge' ? `<circle class="d-lens" cx="${fx(p.cam[0])}" cy="${fx(p.cam[1])}" r="3.8"/>` : '');
  let over = '';
  if (p.kind === 'cutin') over = `<rect class="d-strip" x="0" y="56" width="240" height="38"/>${pill(120, 75, 66, 'CUT-IN')}`;
  if (p.kind === 'free') over = pill(MID[0], MID[1], 80, 'NOT FOUND');
  if (p.kind === 'seq') {
    const panels = [[24, 84, 70, 10], [90, 150, 136, 76], [156, 216, 202, 142]];
    over =
      panels.map(([a, b, c, d]) => `<polygon class="d-panel" points="${a} 14 ${b} 14 ${c} 136 ${d} 136"/>`).join('') + pill(120, 128, 88, '2D SEQUENCE');
  }
  const aria =
    p.kind === 'cutin' ? 'Diagram: a full-width cut-in strip across the scene, no arena camera'
    : p.kind === 'seq' ? 'Diagram: three flat 2D panels, no arena camera'
    : p.kind === 'free' ? 'Diagram: no camera drawn, because the aiming view was not found'
    : `Diagram, top-down: ${p.label}, ${p.lens} lens`;
  return (
    `<svg class="dia" viewBox="0 0 240 150" width="240" height="150" role="img" aria-label="${aria}">` +
    `<rect class="d-bg" width="240" height="150"/><path class="d-grid" fill="none" d="${GRID}"/>` +
    `<g${dim ? ' class="d-dim"' : ''}>${arena}</g>${over}</svg>`
  );
}
