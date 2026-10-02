/**
 * CAMERA LAB: the shots themselves, solved from where the figures stand (`labGeometry.ts` has the
 * math and the rules: the 180-degree rule, the painted set, nobody in the way). Pure: no `three`,
 * no DOM.
 */

import type { ShotRequest } from './LabTypes.ts';
import type { ShotTuning } from './labChapters.ts';
import {
  DEG, REAR_WITHIN_DEG, add, arr, blocked, clampToBand, coverOf, floorDir, headingOf, lineFrame, lookFrom, ndcOf, onViewerSide,
  reflectAcross, scale, v3, yawFor, type LabFigure, type LabRig, type LabStageView, type V3,
} from './labGeometry.ts';

const fig = (view: LabStageView, id: string | null): LabFigure | null =>
  (id ? view.figures.find((f) => f.id === id) : undefined) ?? null;

/** The party's centre on the floor (standing members, or everyone when all are down). */
export function partyCentre(view: LabStageView): V3 {
  const party = view.figures.filter((f) => f.side !== 'enemy');
  const use = party.some((f) => f.standing) ? party.filter((f) => f.standing) : party;
  if (!use.length) return v3(0, 0, 0);
  const s = use.reduce((acc, f) => add(acc, f.pos), v3(0, 0, 0));
  return scale(s, 1 / use.length);
}

function bossOf(view: LabStageView): LabFigure | null {
  return fig(view, view.bossId) ?? view.figures.find((f) => f.side === 'enemy' && f.standing) ?? null;
}

/** Keep the rig inside the set and on the viewer's side of the party-to-boss line. */
function legal(rig: LabRig, view: LabStageView): LabRig {
  let out = clampToBand(rig, view.band);
  const boss = bossOf(view);
  if (boss) {
    const o = partyCentre(view);
    const cam = v3(...out.position);
    if (!onViewerSide(cam, o, boss.pos, view.viewer)) out = clampToBand({ ...out, position: arr(reflectAcross(cam, o, boss.pos)) }, view.band);
  }
  return out;
}

function rigOf(cam: V3, look: V3, fov: number): LabRig {
  return { position: arr(cam), lookAt: arr(look), fov };
}

/**
 * A shot over an actor's shoulder (hero, hero-close, caster-low, item-close). Candidates round
 * the preferred angle and distance; the one kept is inside the set, has nobody between the lens
 * and the actor, and shows the most of the boss (no party member standing in front of it).
 */
function shoulderShot(view: LabStageView, actor: LabFigure, toward: V3, towardFig: LabFigure | null, t: ShotTuning['hero']): LabRig {
  const { f, s } = lineFrame(actor.pos, toward, view.viewer);
  const base = actor.hasRear ? t.angle : t.frontAngle;
  const torso = v3(actor.pos.x, actor.pos.y + actor.height * 0.55, actor.pos.z);
  const except = new Set([actor.id]);
  const lookDist = (cam: V3): number => Math.max(4, Math.hypot(toward.x - cam.x, toward.z - cam.z) * 0.6);
  let best: { rig: LabRig; score: number } | null = null;
  // With a rear painting the lens stays behind the actor (inside REAR_WITHIN_DEG), so the back shows.
  const maxDeg = actor.hasRear ? REAR_WITHIN_DEG - 4 : 90;
  for (const dAngle of [0, 6, -8, 12, -16, 20, -24, 30, -32, -40]) {
    for (const k of [1, 1.15, 0.88, 1.3, 0.72, 0.6]) {
      const deg = base + dAngle;
      if (deg > maxDeg || deg < 4) continue;
      const dist = t.dist * k;
      const cam = add(add(actor.pos, scale(f, -dist * Math.cos(deg * DEG))), scale(s, dist * Math.sin(deg * DEG)));
      cam.y = t.camH;
      let yaw = yawFor(cam, torso, t.wantX, t.fov, view.aspect);
      let rig = rigOf(cam, lookFrom(cam, yaw, t.lookH, lookDist(cam)), t.fov);
      // The boss readable on the right: if it fell off the frame, trade some of the actor's margin.
      const tx = ndcOf(rig, v3(toward.x, toward.y + 1.6, toward.z), view.aspect).x;
      if (tx > 0.8) {
        yaw = yawFor(cam, torso, Math.max(-0.82, t.wantX - (tx - 0.74)), t.fov, view.aspect);
        rig = rigOf(cam, lookFrom(cam, yaw, t.lookH, lookDist(cam)), t.fov);
      }
      rig = legal(rig, view);
      const at = v3(...rig.position);
      const outOfSet = Math.abs(headingOf(floorDir(at, v3(...rig.lookAt)))) > view.band + 0.5;
      const hidden = blocked(at, actor.pos, view.figures, except) || nearLens(rig, view, except);
      const cover = towardFig ? coverOf(rig, towardFig, view.figures, except, view.aspect) : 0;
      const score = (outOfSet ? 50 : 0) + (hidden ? 100 : 0) + cover * 4 + Math.abs(dAngle) * 0.02 + Math.abs(k - 1) * 0.6;
      if (!best || score < best.score) best = { rig, score };
    }
  }
  return best ? best.rig : legal(rigOf(add(actor.pos, v3(0, t.camH, 3)), add(actor.pos, v3(0, t.lookH, -3)), t.fov), view);
}

/** True when a standing figure other than `except` would fill the frame from right in front of the lens. */
function nearLens(rig: LabRig, view: LabStageView, except: ReadonlySet<string>): boolean {
  for (const f of view.figures) {
    if (except.has(f.id) || !f.standing) continue;
    const p = ndcOf(rig, v3(f.pos.x, f.pos.y + f.height * 0.5, f.pos.z), view.aspect);
    if (p.depth > 0 && p.depth < f.height * 1.25 && Math.abs(p.x) < 1.15) return true;
  }
  return false;
}

/** A close view of an enemy from the party's side (`angle` toward the viewer's side), sized by its height. */
function enemyShot(view: LabStageView, enemy: LabFigure, t: ShotTuning['target'], wantX = 0.05): LabRig {
  const party = partyCentre(view);
  const g = floorDir(enemy.pos, party);
  const { s } = lineFrame(party, enemy.pos, view.viewer);
  const dir = floorDir(v3(0, 0, 0), add(scale(g, Math.cos(t.angle * DEG)), scale(s, Math.sin(t.angle * DEG))));
  const dist = Math.max(3.2, enemy.height * t.distPerHeight);
  const cam = add(enemy.pos, scale(dir, dist));
  cam.y = t.camH;
  const aim = v3(enemy.pos.x, enemy.pos.y + enemy.height * t.lookPerHeight, enemy.pos.z);
  const yaw = yawFor(cam, aim, wantX, t.fov, view.aspect);
  return legal(rigOf(cam, lookFrom(cam, yaw, aim.y, dist), t.fov), view);
}

/** Solve one shot. `T` is the style's tuning for this chapter. */
export function solveShot(req: ShotRequest, view: LabStageView, T: ShotTuning): LabRig {
  const boss = bossOf(view);
  const subject = fig(view, req.subject);
  const other = fig(view, req.target);
  const bossPos = boss?.pos ?? v3(0, 0, -6);
  switch (req.kind) {
    case 'hero':
    case 'hero-close':
    case 'caster-low':
    case 'item-close': {
      if (!subject) return view.idleRig;
      const t = req.kind === 'hero' ? T.hero : req.kind === 'hero-close' ? T.heroClose : req.kind === 'caster-low' ? T.casterLow : T.itemClose;
      const foe = subject.side === 'enemy' ? null : other && other.side === 'enemy' ? other : boss;
      const toward = subject.side === 'enemy' ? partyCentre(view) : (foe?.pos ?? bossPos);
      return shoulderShot(view, subject, toward, foe, t);
    }
    case 'party-shoulder':
      return view.partyShoulder ? legal(view.partyShoulder, view) : view.idleRig;
    case 'party-front':
      return view.idleRig;
    case 'target':
    case 'enemy-front': {
      const enemy = subject ?? boss;
      if (!enemy) return view.idleRig;
      return enemyShot(view, enemy, req.kind === 'target' ? T.target : T.enemyFront);
    }
    case 'impact-wide': {
      if (subject && subject.side === 'enemy') return enemyShot(view, subject, T.impactWide, 0.05);
      // On the party (a heal): high over their shoulders, toward the boss.
      const o = partyCentre(view);
      const { f, s } = lineFrame(o, bossPos, view.viewer);
      const cam = add(add(o, scale(f, -T.partyWide.back)), scale(s, T.partyWide.side));
      cam.y = T.partyWide.camH;
      return legal(rigOf(cam, v3(o.x + f.x * 1.2, T.partyWide.lookH, o.z + f.z * 1.2), T.partyWide.fov), view);
    }
    case 'lunge-side': {
      if (!subject) return view.idleRig;
      const target = other?.pos ?? bossPos;
      const mid = scale(add(subject.pos, target), 0.5);
      const { f, s } = lineFrame(subject.pos, target, view.viewer);
      const L = T.lungeSide;
      const cam = add(add(mid, scale(f, -L.dist * Math.cos(L.angle * DEG))), scale(s, L.dist * Math.sin(L.angle * DEG)));
      cam.y = L.camH;
      return legal(rigOf(cam, v3(mid.x, L.lookH, mid.z), L.fov), view);
    }
    case 'enemy-behind-party': {
      // Wide and low behind the party, the boss large and the heroes small in a row: well back, a lens
      // sized to the boss, the side offset that leaves the most of the boss clear of the heroes.
      const enemy = subject && subject.side === 'enemy' ? subject : boss;
      if (!enemy) return view.idleRig;
      const o = partyCentre(view);
      const { f, s } = lineFrame(o, enemy.pos, view.viewer);
      const B = T.enemyBehindParty;
      let best: { rig: LabRig; score: number } | null = null;
      for (const back of [B.back, B.back * 1.35, B.back * 0.75]) {
        for (const side of [B.side, B.side + 1.4, B.side - 1.2, B.side + 2.6, B.side - 2.2]) {
          const cam = add(add(o, scale(f, -back)), scale(s, side));
          cam.y = B.camH;
          const dBoss = Math.hypot(enemy.pos.x - cam.x, enemy.pos.z - cam.z);
          const fov = Math.max(22, Math.min(B.fov, (2 * Math.atan((enemy.height * 0.62) / dBoss)) / DEG));
          const aim = v3(enemy.pos.x, enemy.pos.y + enemy.height * B.lookPerHeight, enemy.pos.z);
          const yaw = yawFor(cam, aim, B.wantX, fov, view.aspect);
          const rig = legal(rigOf(cam, lookFrom(cam, yaw, aim.y * 0.8, dBoss), fov), view);
          const at = v3(...rig.position);
          const outOfSet = Math.abs(headingOf(floorDir(at, v3(...rig.lookAt)))) > view.band + 0.5;
          const score = (outOfSet ? 50 : 0) + coverOf(rig, enemy, view.figures, new Set(), view.aspect) * 4 + Math.abs(side - B.side) * 0.05 + Math.abs(back / B.back - 1) * 0.4;
          if (!best || score < best.score) best = { rig, score };
        }
      }
      return best ? best.rig : view.idleRig;
    }
    case 'colossus': {
      const enemy = subject && subject.side === 'enemy' ? subject : boss;
      if (!enemy) return view.idleRig;
      const party = partyCentre(view);
      const g = floorDir(enemy.pos, party);
      const { s } = lineFrame(party, enemy.pos, view.viewer);
      const C = T.colossus;
      const cam = add(add(enemy.pos, scale(g, enemy.height * C.towardPerHeight)), scale(s, enemy.height * C.sidePerHeight));
      cam.y = C.camH;
      const look = add(add(enemy.pos, scale(g, enemy.height * 0.15)), scale(s, -enemy.height * 0.28));
      look.y = enemy.pos.y + enemy.height * C.lookPerHeight;
      return legal(rigOf(cam, look, C.fov), view);
    }
    case 'victory': {
      const hero = subject ?? view.figures.find((f) => f.side !== 'enemy' && f.standing) ?? null;
      if (!hero) return view.idleRig;
      const toViewer = floorDir(hero.pos, view.viewer);
      const V = T.victory;
      const cam = add(hero.pos, scale(toViewer, V.dist));
      cam.y = V.camH;
      const look = add(hero.pos, scale(toViewer, -0.6));
      look.y = V.lookH;
      return legal(rigOf(cam, look, V.fov), view);
    }
  }
}
