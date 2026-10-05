import { measure, type Field } from './clearance.ts';
import { cameraAt, figBox, type Box, type Fig, type Pose } from './geometry.ts';
import { closeShot, heroShot } from './masters.ts';

/**
 * The MAX mix (D-316), the framing search of the two HELD SHOTS: the rules a candidate shot must pass (`shotScore`) and the search over
 * candidates (`searchShot`). Moved out of `heldShots.ts` in round 21 (PR-0314) so the search can be tested on plain geometry and the file
 * stays under 400 lines; `heldShots.ts` re-exports `shotScore`.
 *
 * Round 21 (FFX-2 dressphere shot): the coarse grid (5 sizes by 5 places by 4 heights by 5 turns) steps over narrow windows: a neighbour's
 * sliver at the frame's edge (16 % in view, where 3 % or 97 % passes), a panel's corner across a neighbour. Where no grid point passes,
 * `searchShot` walks from the best one in small steps (place, size, turn, height; steps halved when none improves) until a frame
 * passes or the steps are spent. The rules are the same ones; a frame that passes them is a frame the grid missed.
 */

/**
 * Score a candidate shot: the subject whole and clear of the HUD; every other PARTY member either whole
 * and clear, or wholly out of the shot (VP-1001-26; Yuna under the turn rail, Kimahri under the party
 * panel, Yuna cut at the phone's edge). Enemies may sit at the shot's edges: it is about the actor.
 */
export function shotScore(subject: number, boxes: readonly Box[], f: Field, figs: readonly Fig[] = [], strict = false, dwarf = 1.25): { ok: boolean; score: number; why?: string } {
  let score = 0;
  let why = '';
  let ok = true;
  const viewH = f.view.b - f.view.t;
  const subjectH = boxes[subject] ? boxes[subject]!.b - boxes[subject]!.t : 0;
  boxes.forEach((b0, i) => {
    if (i !== subject && figs[i]?.enemy) return;
    if (strict) {
      // The dressphere shot (round 19, PR-0309; FFX-2 only): a face is never under a panel (the enemy gauge rows ran across Yuna's
      // face), a head is never cut by the frame's top for anyone in the shot, and the girl who changes is not dwarfed (no neighbour stands over a quarter taller on screen than she does: a nearer one in the foreground).
      const head = { l: b0.l, r: b0.r, t: b0.t, b: b0.t + 0.28 * (b0.b - b0.t) };
      const inShot = i === subject || measure(b0, f, figs[i]?.mask).inView > 0.03;
      if (inShot && f.panels.length && measure(head, f).underHud > 1e-6 && measure(head, f).inView > 0.5) {
        ok = false;
        score -= 5;
        why ||= `head-under-panel:${figs[i]?.id}`;
      }
      if (inShot && b0.t < f.view.t + 0.01 * viewH) {
        ok = false;
        score -= 5;
        why ||= `head-cut:${figs[i]?.id}`;
      }
      if (i !== subject && inShot && b0.b - b0.t > dwarf * subjectH && measure(b0, f).inView > 0.5) {
        ok = false;
        score -= 5;
        why ||= `dwarf:${figs[i]?.id}`;
      }
    }
    // A margin: the painting turns toward the new camera once the shot is up, so its drawn box widens.
    const mx = (b0.r - b0.l) * (i === subject ? 0.1 : 0.05);
    const my = (b0.b - b0.t) * 0.04;
    const b = { l: b0.l - mx, r: b0.r + mx, t: b0.t - my, b: b0.b + my };
    const m = measure(b, f, figs[i]?.mask);
    if (i === subject) {
      const bad = Math.max(0, 0.98 - m.inView) + Math.max(0, m.underHud - 0.04);
      if (bad > 1e-6) { ok = false; why ||= `subject:${figs[i]?.id}`; }
      score -= bad * 10;
    } else {
      const whole = Math.max(0, 0.97 - m.inView) + Math.max(0, m.underHud - 0.08);
      const out = Math.max(0, m.inView - 0.03);
      const bad = Math.min(whole, out);
      if (bad > 0.02) { ok = false; why ||= `neighbour:${figs[i]?.id} in${m.inView.toFixed(2)} hud${m.underHud.toFixed(2)}`; }
      score -= bad * 4;
    }
  });
  return { ok, score, ...(why ? { why } : {}) };
}

export type ShotKind = 'od' | 'sc';

/** One framing: the size, the place on screen (fractions of the visible frame), the height and the turn (degrees). */
export interface Framing {
  frac: number;
  x: number;
  y: number;
  turn: number;
}

export interface Found {
  pose: Pose;
  score: number;
  ok: boolean;
  p: Framing;
  /** What the candidate looked like: the framing and each figure's share in view and under a panel (checks only). */
  note: string;
}

export interface SearchIn {
  kind: ShotKind;
  master: Pose;
  /** The subject's figure and the way it faces (the Overdrive shot turns toward its face). */
  g: Fig;
  facing: number;
  aspect: number;
  figs: readonly Fig[];
  subject: number;
  field: Field;
  lens: [number, number];
  /** The visible slice's place in canvas fractions (the phone shows a slice of a wider field). */
  at: { x(u: number): number; y(v: number): number };
  /** Refine a failing coarse search by walking (the dressphere shot's full shot only). */
  refine?: boolean;
}

/** Candidates: the size (about half the frame for the hero, 60 % for the close shot), the place, the height and the turn. Tried in this order. */
export function grid(kind: ShotKind): { fracs: number[]; xs: number[]; ys: number[]; turns: number[] } {
  return kind === 'od'
    ? { fracs: [0.5, 0.45, 0.4, 0.55, 0.6, 0.66, 0.72], xs: [0.52, 0.45, 0.6, 0.38, 0.68, 0.3], ys: [0.62, 0.68, 0.72, 0.56], turns: [28, 16, 40, 52, 4, -12, -24] }
    : { fracs: [0.6, 0.52, 0.45, 0.68, 0.4], xs: [0.5, 0.42, 0.58, 0.35, 0.65], ys: [0.5, 0.45, 0.55, 0.6], turns: [0, 12, -12, 24, -24] };
}

/** The walk's limits (the close shot): sizes, places and heights stay in the frame, the turn stays in the range the grid uses. */
const LIMITS = { frac: [0.3, 0.8], x: [0.2, 0.8], y: [0.4, 0.7], turn: [-45, 45] } as const;
const START_STEP: Framing = { frac: 0.04, x: 0.04, y: 0.05, turn: 6 };
/** The most rounds of the walk (each is at most 8 evaluations). */
export const WALK_ROUNDS = 24;

/**
 * The first passing framing in the grid's order, else the best-scoring one; with `refine`, a failing grid is followed by a walk from its
 * best point. Null only when there is nothing to frame. Pure on its input (the `three` maths aside).
 */
export function searchShot(i: SearchIn): { best: Found | null; evaluated: number } {
  const { kind, master, g, facing, aspect, figs, subject, field, lens } = i;
  let best: Found | null = null;
  let evaluated = 0;
  const evalAt = (p: Framing): { ok: boolean; score: number } => {
    evaluated++;
    const pose = kind === 'od' ? heroShot(master, g, facing, aspect, p.frac, [i.at.x(p.x), i.at.y(p.y)], p.turn) : closeShot(master, g, aspect, p.frac, [i.at.x(p.x), i.at.y(p.y)], p.turn);
    const cam = cameraAt(pose, aspect);
    const boxes = figs.map((f) => {
      const b = figBox(f, cam, field.W, field.H);
      return { l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] };
    });
    const s = shotScore(subject, boxes, field, figs, kind === 'sc');
    if (!best || s.score > best.score || s.ok) {
      const share = boxes.map((b, k) => `${figs[k]!.id}:${measure(b, field, figs[k]!.mask).inView.toFixed(2)}/${measure(b, field, figs[k]!.mask).underHud.toFixed(2)}`).join(' ');
      best = { pose, score: s.score, ok: s.ok, p, note: `f${p.frac} x${p.x} y${p.y} t${p.turn} ${share}` };
    }
    return s;
  };
  const gr = grid(kind);
  search: for (const turn of gr.turns)
    for (const frac of gr.fracs)
      for (const x of gr.xs)
        for (const y of gr.ys) if (evalAt({ frac, x, y, turn }).ok) break search;
  const found = best as Found | null;
  if (i.refine && kind === 'sc' && found && !found.ok) walk(found, evalAt, () => (best as Found | null)?.ok === true);
  return { best, evaluated };
}

/** From `start`, step each of place, size, turn and height up and down, keeping what scores better; halve the steps when none does. */
function walk(start: Found, evalAt: (p: Framing) => { ok: boolean; score: number }, done: () => boolean): void {
  let cur = { ...start.p };
  let curScore = start.score;
  const step = { ...START_STEP };
  for (let round = 0; round < WALK_ROUNDS && !done(); round++) {
    let improved = false;
    for (const k of ['x', 'frac', 'turn', 'y'] as const) {
      for (const sign of [1, -1]) {
        const next: Framing = { ...cur, [k]: cur[k] + sign * step[k] };
        const [lo, hi] = LIMITS[k];
        if (next[k] < lo || next[k] > hi) continue;
        const s = evalAt(next);
        if (s.ok) return;
        if (s.score > curScore + 1e-6) {
          cur = next;
          curScore = s.score;
          improved = true;
        }
      }
    }
    if (!improved) {
      step.frac /= 2;
      step.x /= 2;
      step.y /= 2;
      step.turn /= 2;
      if (step.x < 0.004) return;
    }
  }
}
