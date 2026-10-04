import { MathUtils, Vector3 } from 'three';
import type { Field } from './clearance.ts';
import { cameraAt, figBox, UP, type Box, type Fig, type Pose } from './geometry.ts';
import { plateExcess, plateMiss, type Plate } from './plate.ts';

/**
 * The MAX mix (D-316, D-346; FFX-2 only): the DRESSPHERE SHOT's PUSH-IN FALLBACK (morning ask 11, PR-0314).
 *
 * The full shot is a cut to a close framing of the girl who changes, and it is only cut to when a framing passes the
 * rules (`shotScore`: her face under no panel, no head cut, no neighbour dwarfing her). Where none does (Trema's Paine at
 * 1280x720, 1600x900 and 2000x1012: Yuna or Rikku standing nearer and taller beside her), or on the upright phone (the
 * slice the HUD slides, `heldShots.ts`), there used to be no shot at all. The fallback is a small push-in instead: the
 * battle camera moves a short way along the line to the girl's chest, orientation unchanged, so the point it zooms on keeps
 * its place on screen (a face that was clear of the panels in the master stays clear), with a small aim shift where that
 * finds a cleaner frame. It holds like the full shot (at least 1.6 s, `HeldShots.MIN_HOLD`), is handed back the same way
 * (a menu opening, anyone else acting) and runs only when the full shot found nothing.
 *
 * Every frame the push passes through is checked, not only its end: the girl whole and clear of the HUD, every head in the
 * shot clear of the panels and the frame's top (`shotScore` strict), no neighbour dwarfing her beyond what the master
 * already shows, and no more of the painted plate's edge than the master shows (`plateExcess`, the gate CHAPTER FRAMING's
 * masters use). REDUCE MOTION: no move, one static cut to the END framing (the same pose the push arrives at). Pure apart
 * from the `three` maths; nothing here writes the camera.
 */

/** Seconds the camera takes to arrive (the shot itself holds at least 1.6 s: it arrives, then holds). */
export const PUSH_SECONDS = 0.9;

export interface PushPlan {
  from: Pose;
  to: Pose;
  seconds: number;
}

/** The dolly: the fraction of the way from the camera to her, the height on her it aims at, the aim shift (frame fractions, + = content moves right / down). */
export interface PushCandidate {
  s: number;
  anchor: number;
  pan: [number, number];
}

/** In order of preference: a small push first (about 1.4x), a gentler one, then a stronger one; no aim shift before an aim shift. */
export function pushCandidates(): PushCandidate[] {
  const out: PushCandidate[] = [];
  const pans: [number, number][] = [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.04], [0.1, 0], [-0.1, 0], [0.05, 0.04], [-0.05, 0.04]];
  for (const anchor of [0.55, 0.75]) for (const s of [0.3, 0.24, 0.18, 0.12, 0.36, 0.42]) for (const pan of pans) out.push({ s, anchor, pan });
  return out;
}

/** The pose a push arrives at. */
export function pushEnd(master: Pose, g: Fig, aspect: number, c: PushCandidate): Pose {
  const a = g.feet.clone().setY(g.feet.y + g.h * c.anchor);
  const pos = master.pos.clone().lerp(a, c.s);
  const look = master.look.clone().add(pos.clone().sub(master.pos));
  if (c.pan[0] !== 0 || c.pan[1] !== 0) {
    const fwd = new Vector3().subVectors(look, pos).normalize();
    const right = new Vector3().crossVectors(fwd, UP).normalize();
    const dist = pos.distanceTo(a);
    const tanV = Math.tan(MathUtils.degToRad(master.fov / 2));
    look.addScaledVector(right, -c.pan[0] * 2 * dist * tanV * aspect).addScaledVector(UP, c.pan[1] * 2 * dist * tanV);
  }
  return { pos, look, fov: master.fov };
}

/** The camera `age` seconds into the shot: eased in and out over `seconds`, then held; with REDUCE MOTION always the end framing. */
export function pushAt(plan: PushPlan, age: number, reduceMotion: boolean): Pose {
  const u = reduceMotion ? 1 : MathUtils.clamp(age / plan.seconds, 0, 1);
  const k = u * u * u * (u * (u * 6 - 15) + 10);
  return { pos: plan.from.pos.clone().lerp(plan.to.pos, k), look: plan.from.look.clone().lerp(plan.to.look, k), fov: plan.from.fov };
}

/** The full shot's own check (`heldShots.shotScore`), handed in so the two modules do not import each other. */
export type ShotRule = (subject: number, boxes: readonly Box[], f: Field, figs: readonly Fig[], strict: boolean, dwarf: number) => { ok: boolean; score: number; why?: string };

export interface PushSearch {
  master: Pose;
  subject: number;
  figs: readonly Fig[];
  field: Field;
  lens: [number, number];
  aspect: number;
  plate: Plate | null;
  rule: ShotRule;
}

/** A neighbour may stand this much taller than she does on screen before it dwarfs her (the full shot's own limit). */
export const DWARF = 1.25;

/** The first push, in order of preference, whose end and the frames between it and the master all pass; `plan` null when none does. `note` says what the last try read (checks only). */
export function searchPush(s: PushSearch): { plan: PushPlan | null; note: string } {
  const { master, subject, figs, field, lens, aspect, plate, rule } = s;
  const g = figs[subject]!;
  const boxesAt = (pose: Pose): Box[] => {
    const cam = cameraAt(pose, aspect);
    return figs.map((f) => {
      const b = figBox(f, cam, field.W, field.H);
      return { l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] };
    });
  };
  // What the master shows already: how much taller a neighbour stands than she does (a push never makes that worse than
  // the limit or than the master's own plus a hair), and how much of the plate's edge.
  const m0 = boxesAt(master);
  const h0 = m0[subject]!.b - m0[subject]!.t;
  let ratio0 = 0;
  m0.forEach((b, i) => {
    if (i !== subject && !figs[i]!.enemy) ratio0 = Math.max(ratio0, (b.b - b.t) / Math.max(1, h0));
  });
  const dwarf = Math.max(DWARF, ratio0 * 1.2);
  const today = plate ? plateMiss(plate, master, field.W, field.H, lens) : null;
  const centre = (f: Fig): Vector3 => f.feet.clone().setY(f.feet.y + f.h * 0.5);
  let note = 'push: no candidate';
  const dbg: string[] = [];
  for (const c of pushCandidates()) {
    const to = pushEnd(master, g, aspect, c);
    const plan: PushPlan = { from: master, to, seconds: PUSH_SECONDS };
    const tag = `push s${c.s} a${c.anchor} pan${c.pan.join(',')}`;
    // The camera must not end up on top of anyone (the near plane, a figure filling the frame).
    if (figs.some((f) => to.pos.distanceTo(centre(f)) < 1.5 * f.h)) {
      note = `${tag} too close to a figure`;
      continue;
    }
    let why = '';
    for (const u of [0.5, 0.75, 1]) {
      const pose = pushAt(plan, u * PUSH_SECONDS, false);
      const boxes = boxesAt(pose);
      const sc = rule(subject, boxes, field, figs, true, dwarf);
      const pl = plateExcess(plate, today, pose, field.W, field.H, lens);
      if (!sc.ok || pl > 0) {
        why = `fails at ${u}: ${sc.ok ? '' : sc.why + ' '}${pl > 0 ? 'plate ' + pl.toFixed(3) : ''}`;
        break;
      }
    }
    note = `${tag} ${why || 'ok'} (dwarf cap ${dwarf.toFixed(2)})`;
    if (why && dbg.length < 2) dbg.push(note);
    if (!why) return { plan, note: dbg.length ? `${note} (first tries: ${dbg.join('; ')})` : note };
  }
  return { plan: null, note: dbg.join('; ') || note };
}
