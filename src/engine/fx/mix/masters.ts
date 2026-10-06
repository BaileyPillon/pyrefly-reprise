import { MathUtils, Vector3 } from 'three';
import { cameraAt, centroid, gapPx, partyPx, unionBox, UP, type Box, type Fig, type Pose } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING: the authored master per chapter, chosen by the boss's class
 * (EC-1001-05), ported from option C's prototype (`candy-max-proto`, `fx/max/c/masters.ts`).
 *
 * The mix takes C's **colossus** masters only (JUDGE.md, the options page's "The mix I would take"):
 * Natus, Yojimbo, Braska's Final Aeon, Evrae and Bahamut get a low camera at about half the
 * party's height, aimed up at the boss's chest (at most 9 degrees), so the boss looms, and BOSS SCALE
 * brings it to 1.6 to 2.4 times the party on screen (Yojimbo to 1.15, a size he holds: `scaleTarget`, `scaleHeld`; and no boss is re-sized
 * once a plan has sized it: `scaleLock.ts`). Vegnagun keeps its approved D-228 rig (field of
 * view 40) and Sin its own deck camera (`keepsToday`). Yunalesca is not a colossus here (round 19, PR-0307): her
 * master pulled the camera past the Zanarkand Dome plate's edge at every aspect, so Chapter II keeps today's rig. Every
 * other fight keeps today's rig; all of them,
 * today's rig included, go through the menu clearance (`clearance.ts`).
 *
 * Every master stays within 12 degrees of today's azimuth and 0.7 to 1.45 times today's distance (the
 * backdrops are paintings made for today's view), keeps the party left of the enemies (D-167) and is
 * fitted so party and enemies fill the HUD-free area with a positive gap between them (VP-1001-02).
 *
 * Per game (rule 14; research/ffx-vs-ffx2-presentation.md, research/battle-camera-perspectives.md): FFX
 * keeps its lens; FFX-2 gets a view of its own (EC-1001-13), 4 degrees wider.
 */

export type MasterClass = 'colossus' | 'hero' | 'field';

const COLOSSUS = /^(seymour-natus|yojimbo|braskas-final-aeon|evrae|bahamut|ffx2-bahamut|vegnagun|sin-|overdrive-sin)/;
const HERO = /^(seymour-macalania|seymour-omnis|isaaru|trema|gippal)/;
/** Bosses whose master is today's own: D-228 Vegnagun and Sin's deck are authored colossus masters already. */
const KEEP = /^(vegnagun|sin-|overdrive-sin)/;

export function classify(enemies: readonly string[]): MasterClass {
  if (enemies.some((id) => COLOSSUS.test(id))) return 'colossus';
  if (enemies.some((id) => HERO.test(id))) return 'hero';
  return enemies.length >= 2 ? 'field' : 'hero';
}

export function keepsToday(enemies: readonly string[]): boolean {
  return enemies.some((id) => KEEP.test(id));
}

/** Multi-part machines keep their drawn scale: each part is anchored to the others. */
export const MULTIPART = /^(vegnagun|sin-|overdrive-sin|seymour-natus-ring|mortibody|seymour-flux-body)/;

/**
 * BOSS SCALE: the on-screen height each colossus should reach against the party's mean (VP-1001-13,
 * -43). Null keeps the drawn scale.
 *
 * Yojimbo (FFX Chapter IX only; r392-boss-scale, Bailey 2026-10-06: "About 1.15x the party", held until a real FFX screenshot settles his size): his
 * drawn height (2.55 against the party's 1.75, `scenes/cavern-stolen-fayth.ts`) is a presentation estimate and he stands 6.7 units further from the
 * camera, so he read 1.00 times the party's mean at rest and 1.33 when the step 0.25 landed, and the plan chose another step at each menu.
 */
export function scaleTarget(id: string): number | null {
  if (/^yojimbo/.test(id)) return 1.15;
  if (/^(seymour-natus|braskas-final-aeon)/.test(id)) return 2.2;
  if (/^evrae/.test(id)) return 2.4;
  if (/^(bahamut|ffx2-bahamut)/.test(id)) return 2.0;
  return null;
}

/**
 * A boss whose BOSS SCALE is a size to hold, not a colossus's loom: it takes its target in every plan, at full step, on today's rig as well as
 * under the master, from the first frame its figures stand still, and the HUD fit moves the camera for it, never the boss (`scaleLock.ts`). Yojimbo
 * only: his target is a proportion Bailey picked (1.15 times the party), so there is no step to give up to clear the HUD (a boss grown only 16 percent
 * crowds the panels little, and a step down would be the 0.96 to 1.33 swing back); the colossi keep their steps.
 */
export const scaleHeld = (id: string): boolean => /^yojimbo/.test(id);

export interface MasterIn {
  cls: MasterClass;
  game: 'ffx' | 'ffx2';
  base: Pose;
  figs: readonly Fig[];
  W: number;
  H: number;
  /** The HUD-free area the composition should fill (CSS px). */
  free: Box;
}

/**
 * The authored master: the class's height and pitch, the per-game lens, an azimuth within 12 degrees
 * of today's chosen for a positive gap, and a distance fitted to the HUD-free area.
 */
export function master(m: MasterIn): Pose {
  const { base, figs, W, H, free } = m;
  const party = figs.filter((f) => !f.enemy);
  const enemies = figs.filter((f) => f.enemy);
  if (!party.length || !enemies.length) return base;
  const P = centroid(party);
  const boss = enemies.reduce((a, b) => (b.h > a.h ? b : a));
  const E = centroid(enemies);
  const Hp = party.reduce((s, f) => s + f.h, 0) / party.length;
  const floor = Math.min(...party.map((f) => f.feet.y));
  const fov = MathUtils.clamp(base.fov + (m.game === 'ffx2' ? 4 : 0) + (m.cls === 'field' ? 3 : m.cls === 'hero' ? -2 : 0), 22, 52);
  const f0 = new Vector3().subVectors(base.look, base.pos).setY(0);
  const d0 = Math.max(2, f0.length());
  f0.normalize();
  const mid = new Vector3().lerpVectors(P, E, 0.5);
  let tilt = 9;
  const aim = (yaw: number, dist: number, lat = 0): Pose => {
    const fwd = f0.clone().applyAxisAngle(UP, yaw);
    let lookY: number;
    let camY: number;
    if (m.cls === 'colossus') {
      camY = floor + 0.5 * Hp;
      lookY = Math.min(floor + 0.42 * boss.h, camY + Math.tan(MathUtils.degToRad(tilt)) * dist);
    } else if (m.cls === 'hero') {
      camY = floor + 0.85 * Hp;
      lookY = floor + 0.58 * Math.max(Hp, Math.min(boss.h, 1.6 * Hp));
    } else {
      const pitch = MathUtils.degToRad(m.game === 'ffx2' ? 15 : 17);
      lookY = floor + 0.45 * Hp;
      camY = lookY + Math.tan(pitch) * dist;
    }
    const right = new Vector3().crossVectors(fwd, UP).normalize();
    const look = new Vector3(mid.x, lookY, mid.z).addScaledVector(right, lat);
    const pos = look.clone().addScaledVector(fwd, -dist).setY(camY);
    return { pos, look, fov };
  };
  const sideSign = Math.sign(new Vector3().crossVectors(f0, new Vector3().subVectors(E, P)).y) || 1;
  const yaws = m.cls === 'hero' ? [12, 9, 6, 3, 0, -3].map((d) => d * sideSign) : [0, 4, -4, 8, -8, 12, -12];
  const p0 = partyPx(figs, cameraAt(base, W / H), W, H);
  const want = p0 * (m.cls === 'hero' ? 1.12 : m.cls === 'colossus' ? 1.0 : 0.95);
  let best: { pose: Pose; score: number } | null = null;
  const tilts = m.cls === 'colossus' ? [9, 6, 3, 0] : [0];
  search: for (const tl of tilts) {
    tilt = tl;
    for (const yd of yaws) {
      let dist = d0;
      let lat = 0;
      let pose = aim(MathUtils.degToRad(yd), dist);
      const fw = free.r - free.l;
      const fcx = (free.l + free.r) / 2;
      // Fit: the party keeps (about) today's size on screen while the whole composition fits the
      // HUD-free width (up to 25 % over, under the panels' soft edges) and the frame's height; the aim
      // pans so the composition's centre sits on the free area's centre.
      for (let i = 0; i < 12; i++) {
        const c = cameraAt(pose, W / H);
        const u = unionBox(figs, c, W, H);
        const pu = unionBox(party, c, W, H);
        const over = Math.max((u.r - u.l) / (1.25 * fw), (u.b - u.t) / (0.93 * H));
        const cut = pu.b > H * 0.97 || pu.t < H * 0.03 || pu.r - pu.l > W * 0.9 ? 1.08 : 0;
        const k = Math.max(partyPx(figs, c, W, H) / want, over, cut);
        dist = MathUtils.clamp(dist * (1 + (k - 1) * 0.9), d0 * 0.7, d0 * 1.45);
        const wpp = (2 * dist * Math.tan(MathUtils.degToRad(fov / 2))) / H;
        let dpx = fcx - (u.l + u.r) / 2;
        dpx = Math.min(dpx, W * 0.96 - pu.r);
        dpx = Math.max(dpx, W * 0.04 - pu.l);
        lat -= dpx * wpp * 0.8;
        pose = aim(MathUtils.degToRad(yd), dist, lat);
      }
      const c = cameraAt(pose, W / H);
      const gap = gapPx(figs, c, W, H);
      // D-167: the party stays left of the enemies (its centre left of theirs), whatever the angle.
      const pu = unionBox(party, c, W, H);
      const eu = unionBox(enemies, c, W, H);
      const left = (pu.l + pu.r) / 2 < (eu.l + eu.r) / 2 && pu.l > W * 0.01 && pu.r < W * 0.99 && pu.t > H * 0.02 && pu.b < H * 0.98;
      const score = (left ? 0 : -1e6) + (gap >= 0.03 * W ? 1000 : gap) - Math.abs(yd) * 2;
      if (!best || score > best.score) best = { pose, score };
      if (left && gap >= 0.03 * W && m.cls !== 'hero') break search;
    }
    if (best && best.score > -1e5) break;
  }
  return best!.pose;
}

/**
 * The FFX Overdrive input's hero shot (EC-1001-07; the mix takes option B's): three-quarter, the camera
 * turned 28 degrees toward the actor's face, the actor about `frac` of the frame tall at chest height
 * (no tilt up), aimed so the figure sits where the input slab, the turn list and the party panel leave
 * the frame free (`at`: the free area's centre, as fractions of the frame).
 */
export function heroShot(master: Pose, actor: Fig, facing: number, aspect: number, frac = 0.5, at: [number, number] = [0.52, 0.62], turnDeg = 28): Pose {
  const centre = actor.feet.clone().setY(actor.feet.y + actor.h * 0.5);
  const toCam = new Vector3().subVectors(master.pos, centre).setY(0);
  if (toCam.lengthSq() < 1e-6) toCam.set(0, 0, 1);
  toCam.normalize().applyAxisAngle(UP, MathUtils.degToRad(turnDeg) * Math.sign(facing || 1));
  const tanV = Math.tan(MathUtils.degToRad(master.fov / 2));
  const tanH = tanV * aspect;
  const dist = actor.h / (2 * frac * tanV);
  const pos = centre.clone().addScaledVector(toCam, dist);
  pos.y = centre.y + actor.h * 0.06;
  const fwd = new Vector3().subVectors(centre, pos).normalize();
  const right = new Vector3().crossVectors(fwd, UP).normalize();
  // Aim off the figure so it lands at `at` on screen (x: + right of centre; y: + below centre).
  const look = centre.clone().addScaledVector(right, -(at[0] - 0.5) * 2 * dist * tanH).addScaledVector(UP, (at[1] - 0.5) * 2 * dist * tanV);
  return { pos, look, fov: master.fov };
}

/**
 * FFX-2's spherechange held close shot (research 6.1): the girl about `frac` of the frame tall, from the
 * master's own side (never a dolly through the party), aimed so her centre sits at `at` (fractions of
 * the frame; on the phone, inside the visible slice).
 */
export function closeShot(master: Pose, f: Fig, aspect: number, frac = 0.6, at: [number, number] = [0.5, 0.5], turnDeg = 0): Pose {
  const centre = f.feet.clone().setY(f.feet.y + f.h * 0.5);
  const toCam = new Vector3().subVectors(master.pos, centre).setY(0).normalize().applyAxisAngle(UP, MathUtils.degToRad(turnDeg));
  const tanV = Math.tan(MathUtils.degToRad(master.fov / 2));
  const tanH = tanV * aspect;
  const dist = f.h / (2 * frac * tanV);
  const pos = centre.clone().addScaledVector(toCam, dist);
  pos.y = centre.y + f.h * 0.04;
  const fwd = new Vector3().subVectors(centre, pos).normalize();
  const right = new Vector3().crossVectors(fwd, UP).normalize();
  const look = centre.clone().addScaledVector(right, -(at[0] - 0.5) * 2 * dist * tanH).addScaledVector(UP, (at[1] - 0.5) * 2 * dist * tanV);
  return { pos, look, fov: master.fov };
}
