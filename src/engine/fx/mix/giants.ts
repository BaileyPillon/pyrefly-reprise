import { Vector3, type Mesh, type Object3D, type PlaneGeometry } from 'three';
import { ffx2GiantHeight } from '../../../data/ffx2/fiend-stature.ts';
import { boxesOf, clearBoxes, downsOf, type Field, type Fit, type Limit, type PartyRule } from './clearance.ts';
import { cameraAt, subjectId, type Actor, type Fig, type Pose } from './geometry.ts';
import type { Decision } from './framingTypes.ts';
import type { MasterClass } from './masters.ts';
import { plateExcess, plateMiss, plateOf, restGap, shifted, type Plate } from './plate.ts';
import type { Staging } from './staging.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's GIANTS (r3942-stage, wave 2; **FFX-2 only**, desktop only). Bailey, 2026-10-08, "go with your recommendations": the giants of
 * Chapters IV, XIII and XI stand at their real size and the camera is solved to hold them (the giants options sheet, `docs/screenshots/r3942-stage/giants-options-sheet.jpg`;
 * `docs/handoff/r3942-stage.md`):
 *
 * - **Bahamut** (Chapter IV, option 3): his real height, 5.03 times the girls (`data/ffx2/fiend-stature.ts`, `research/ffx2-bahamut.md` §9), the whole figure in the frame under
 *   a colossus camera 1.8 times as far from the girls and 2.9 higher than today's.
 * - **Paragon and Oversoul** (Chapter XIII, option 3): his real height, 5.40 times the girls, the camera 1.9 times as far and 2.4 higher.
 * - **Anima** (Chapter XI, option 4): 0.7 of her real height (7.71 times the girls), the camera 1.7 times as far.
 *
 * The upright phone is not here: its giants stand at 0.7 of their real height from the scene (`data/ffx2/fiend-stature.ts` {@link ffx2GiantHeight}, the scenes' `figureHeights`) and
 * the phone's own slice fit stands the camera back (`ShotRules.fitPhone`, A-12); the phone keeps today's rig and the menu clearance on top, as every phone fight does.
 *
 * **The giant exception to the party-height floor.** CHAPTER FRAMING never lets a master make the party smaller than 90 percent of today's (`clearance.ts`, the judges' "Ch IV 170 -> 100
 * after a spherechange"). A whole real-size giant needs a camera that leaves the girls at about half of today's, so for **these three bosses on a desktop window**, and for nothing else,
 * the floor is {@link GIANT_FLOOR} of today's party height (the picks measure 55, 51 and 61 percent at 1600x900), a member may be covered by the boss up to {@link GIANT_COVER_MAX}
 * of her box (today's plus 2 percent: the giant stands four to six units behind the girls and its coil or its wing passes behind a head: Paine's reads 23 percent in
 * Bahamut's view, 33 in Anima's) and by a nearer girl up to {@link GIANT_OVERLAP_MAX} (seen from three times as far the three girls stand in a column: Paragon's view reads 0.35 against
 * today's 0.27); everything else holds: every figure in view and clear of the panels. Where the floor would still be broken, where a window has no view proved (below), or where the painting's edge would show
 * more than today's rig shows it, the giant is not played: the fight plays exactly as it did before wave 2 (BOSS SCALE for Bahamut, the drawn size for the others, today's rig).
 *
 * **A table, not a solve** (`colossusPin.ts`, the same lesson: the prototype that searched a camera at run time took about 2 s and decided at the edge of its limits): each view below is
 * the camera the options sheet pictured, solved offline for the figures where the staging puts them (the girls spread 1.15 about the leftmost and Bahamut stepped 0.56 right, as the
 * colossus plan has always left them; the other two stand on their scenes' slots) and proved against the real painting's plate at the window shapes it names. The plan measures the
 * pose it is given, by the rules above and the plate gate (`plate.ts`), and plays it or none. Presentation only (rule 1): a boss's group scale and the party's x, the camera's `idle`
 * rig; the close rigs (party, enemy, action) stay as the scene authored them, so a close shot of a giant is still a close shot. Game case: FFX-2 only (rule 14: FFX's Bahamut and
 * Anima are other models in other chapters and not on this list).
 */

/** A camera for one window shape: the pose the options sheet pictured, for windows whose width over height lies in `aspect` (inclusive). */
export interface GiantView {
  readonly aspect: readonly [number, number];
  readonly pos: readonly [number, number, number];
  readonly look: readonly [number, number, number];
  readonly fov: number;
}

/** One giant: who it is, how it is staged and the cameras that hold it. */
export interface GiantRow {
  /** The fiend's combatant id in the stature table (`FFX2_FIEND_STATURE`), which also keys the pick (`FFX2_GIANT_SHARE`). */
  readonly id: string;
  /** The painted id of the figure (`subjectId`). */
  readonly painted: RegExp;
  /** The chapter id the girls' mean is read from (`FFX2_GIRLS_MEAN`). */
  readonly chapter: string;
  /** The party's spread about its leftmost member (the colossus plan's 1.15 for FFX-2, or 1 for none) and the step the boss takes right, world x (0 for none). */
  readonly spread: number;
  readonly apart: number;
  readonly views: readonly GiantView[];
}

/**
 * The painted plate the plan measures a giant's frame against: the plate and, where the room has them, its wings (`scenes/plateWings.ts`, PR-0300 and D-343: the plate's outer strip
 * painted out 18 units each side at the same depth, there for a window wider than the plate's own width; Chapter IV and Chapter XV have them). A giant's camera stands three
 * times as far and shows more of the room to its sides than today's rig does, and the wings are what the painting there is; a room with none is measured on its plate alone.
 */
export function giantPlate(plate: Plate | null, root: Object3D | null | undefined): Plate | null {
  if (!plate) return null;
  let extra = 0;
  for (const side of ['left', 'right'] as const) {
    const wing = root?.getObjectByName?.(`backdrop-wing-${side}`) as Mesh | undefined;
    const w = (wing?.geometry as PlaneGeometry | undefined)?.parameters?.width;
    if (wing && wing.visible !== false && w) extra = Math.max(extra, w * wing.scale.x);
  }
  return extra > 0 ? { ...plate, hw: plate.hw + extra } : plate;
}

/**
 * The giant exception: the party may stand down to this share of today's height under a giant's camera (the picks measure 55, 51 and 61 percent at 1600x900; the rule
 * for every other fight stays 0.9). Reads as a floor on `PartyRule.floorPx`.
 */
export const GIANT_FLOOR = 0.45;

/** The giant exception's overlap limit: the most of a girl's box a nearer girl may cover (the rule for any other fight is today's plus 0.03, at least 0.12). */
export const GIANT_OVERLAP_MAX = 0.4;

/** The giant exception's other limit: the most of a girl's box the giant's painted pixels may cover (the picks measure 0.23 on Paine for Bahamut and 0.33 for Anima; the rule for any other boss is today's plus 0.02, at least 0.08). */
export const GIANT_COVER_MAX = 0.4;

/** Where the figures are measured against the panels: the girls at least this much in view, and under a panel no more than the `clearance.ts` limit allows a member. */
const IN_VIEW = 0.97;
const UNDER_PANEL = 0.06;

/**
 * The giants and their cameras. `aspect` is the window shapes each pose was proved at, width over height (the pose is in world units and the vertical field is the same at
 * every width, so a wider or narrower window shows more or less at the sides): the views were solved at 1600x900 and proved in a browser at 1024x768 (1.33), 1440x900 (1.6),
 * 1600x900, 1800x900 (2.0), 2000x1012 and 2560x1080 (2.37) against the real plate and its wings. Chapter IV's plate has wings and holds to 2.45; Chapter XIII's has none and its
 * plate shows its edge past 1.79 (1620x900: 1.3 percent of the frame, 1665x900: 4.7), so its view stops there and a wider window plays as before. Every plan proves its
 * view again against the plate it stands on (`decideGiant`), so a range here is where it was seen to hold, not what keeps a bad frame off the screen.
 */
export const GIANT_ROWS: readonly GiantRow[] = [
  {
    id: 'bahamut',
    painted: /^ffx2-bahamut/,
    chapter: 'ffx2-bahamut',
    spread: 1.15,
    apart: 0.56,
    views: [{ aspect: [1.2, 2.45], pos: [2.3, 4.8786, 16.0313], look: [2.0858, 4.0466, 6.0682], fov: 34 }],
  },
  {
    id: 'paragon',
    painted: /^paragon/,
    chapter: 'ffx2-trema',
    spread: 1,
    apart: 0,
    views: [{ aspect: [1.2, 1.79], pos: [-0.6158, 5.4387, 18.6296], look: [-0.2322, 4.5618, 8.6755], fov: 32 }],
  },
  {
    id: 'x2-anima',
    painted: /^x2-anima/,
    chapter: 'ffx2-fallen-aeons',
    spread: 1,
    apart: 0,
    views: [{ aspect: [1.2, 2.45], pos: [2.3057, 2.0739, 16.3794], look: [2.3547, 2.7256, 6.4008], fov: 32 }],
  },
];

/** The row of the giant standing on this stage, or null: FFX-2 only, and only a fight that has one of the three. */
export function giantRow(game: 'ffx' | 'ffx2', actors: readonly Actor[]): { row: GiantRow; boss: Actor } | null {
  if (game !== 'ffx2') return null;
  for (const a of actors) {
    if (a.facing >= 0) continue;
    const id = subjectId(a);
    const row = GIANT_ROWS.find((r) => r.painted.test(id));
    if (row) return { row, boss: a };
  }
  return null;
}

/** The camera this window shape has, or null (no pose proved for it: the fight plays as it did). */
export function giantView(row: GiantRow, aspect: number): GiantView | null {
  return row.views.find((v) => aspect >= v.aspect[0] && aspect <= v.aspect[1]) ?? null;
}

/** The party's mean world height as drawn: the unit a giant's real ratio is read in. */
export function partyWorldHeight(actors: readonly Actor[]): number {
  const party = actors.filter((a) => a.facing >= 0);
  return party.length ? party.reduce((s, a) => s + a.worldHeight * Math.abs(a.scale.y || 1), 0) / party.length : 0;
}

/** BOSS SCALE's group factor that stands the giant at its pick on a desktop (null: nothing to size). */
export function giantFactor(row: GiantRow, boss: Actor, partyHeight: number): number | null {
  const h = ffx2GiantHeight(row.id, row.chapter, partyHeight, false);
  return h !== null && boss.worldHeight > 0 ? h / boss.worldHeight : null;
}

/** The pose a view names. */
export const giantPose = (v: GiantView): Pose => ({ pos: new Vector3(...v.pos), look: new Vector3(...v.look), fov: v.fov });

/**
 * Stand the figures as the row plays them: the giant at its pick and, for Bahamut, the party spread and the boss stepped right as the colossus plan has always left them. Writes
 * `staging.plan` and applies it; the caller puts everything back (`restore`).
 */
export function stageGiant(staging: Staging, actors: readonly Actor[], row: GiantRow, boss: Actor, k: number): void {
  staging.clearPlan();
  if (row.spread !== 1) staging.planSpread(actors, row.spread);
  for (const a of actors) {
    const p = staging.plan.get(a) ?? { k: 1, dx: 0 };
    if (a === boss) {
      p.k = k;
      p.dx = row.apart;
    } else if (a.facing >= 0) p.dx -= row.apart * 0.3;
    staging.plan.set(a, p);
  }
  staging.apply(actors, true);
}

/** What `decideGiant` reads of the plan it is part of (`framing.ts`). */
export interface GiantIn {
  game: 'ffx' | 'ffx2';
  /** The fight's master class (`masters.ts`), for the report: the fog and the focus band read it. */
  cls: MasterClass;
  actors: readonly Actor[];
  /** Today's resting rig. */
  base: Pose;
  /** The canvas, CSS px. */
  W: number;
  H: number;
  field: Field;
  limits: readonly (Limit | null)[];
  rule: PartyRule;
  limitOf: Map<Actor, Limit | null>;
  staging: Staging;
  /** The visible figures as the plan reads them, now (after the staging is written). */
  figs: () => Fig[];
  /** The room, for its plate and its wings (`giantPlate`); null in a test with none. */
  scene: Object3D | null;
  /** The plan's log so far (checks only); this adds its own line. */
  log: string[];
  /** Puts the figures and the staging back as they were found (the caller's own). */
  restore: () => void;
  t0: number;
}

/** The rule the giant is held to: today's, with the floor the exception names. */
export const giantRule = (rule: PartyRule, todayPx: number): PartyRule => ({ ...rule, floorPx: GIANT_FLOOR * todayPx });

/**
 * The giant's plan, or null when this fight has none here: no giant on the stage, a window shape with no view, a boss that cannot be sized, or a pose that fails the rules above or
 * the plate gate (the plan then goes on to today's own candidates, as before). The decision it returns is what `Framing.commit` puts on screen.
 */
export function decideGiant(i: GiantIn, todayPx: number): Decision | null {
  const hit = giantRow(i.game, i.actors);
  if (!hit) return null;
  const view = giantView(hit.row, i.W / Math.max(1, i.H));
  const k = giantFactor(hit.row, hit.boss, partyWorldHeight(i.actors));
  if (!view || k === null) return null;
  stageGiant(i.staging, i.actors, hit.row, hit.boss, k);
  const figs = i.figs();
  const plate = giantPlate(plateOf(i.scene), i.scene);
  const plateToday = plate ? plateMiss(plate, i.base, i.field.W, i.field.H) : null;
  const pose = giantPose(view);
  const rule = giantRule(i.rule, todayPx);
  const cam = cameraAt(pose, i.W / i.H);
  const boxes = boxesOf(cam, figs, i.field);
  const lens: [number, number] = [0, 0];
  const clear = clearBoxes(boxes, figs, pose.pos, i.field, lens, i.limits, rule, downsOf(cam, figs, i.field));
  const gap = restGap(boxes, figs);
  const gate = plateExcess(plate, plateToday, pose, i.field.W, i.field.H, lens);
  const whole = clear.figs.every((r) => r.inView >= IN_VIEW && (r.enemy || r.underHud <= UNDER_PANEL));
  const ok = gate === 0 && whole && clear.floorOk && clear.overlap <= Math.max(rule.overlapMax, GIANT_OVERLAP_MAX) && clear.bossCover <= GIANT_COVER_MAX;
  i.log.push(`giant ${hit.row.id} k${k.toFixed(2)}:${ok ? 'ok' : 'x'} gate${gate.toFixed(3)} gap${Math.round(gap)} w${clear.worst.toFixed(2)} px${Math.round(clear.partyPx)}/${Math.round(rule.floorPx)} ov${clear.overlap.toFixed(2)} bc${clear.bossCover.toFixed(2)}`);
  if (!ok) return null;
  const fit: Fit = { pose, lens, clear, blend: 0, back: 1, score: 3e6, gate };
  const plan = new Map([...i.staging.plan].map(([a, p]) => [a, { ...p }] as const));
  const mb = shifted(boxes, lens);
  const bossPx = Math.round(Math.max(0, ...mb.filter((_, n) => figs[n]!.enemy).map((b) => b.b - b.t)));
  i.restore();
  return {
    keep: false,
    pose,
    lens,
    plan,
    side: null,
    pin: null,
    today: i.base,
    rule,
    limitOf: i.limitOf,
    giant: true,
    lock: null,
    report: {
      cls: i.cls,
      colossus: true,
      todayPx: Math.round(todayPx),
      floorPx: Math.round(rule.floorPx),
      scale: 1,
      fit: { ok, partyPx: Math.round(clear.partyPx), overlap: +clear.overlap.toFixed(2), bossCover: +clear.bossCover.toFixed(2), blend: fit.blend, back: fit.back, lens, figs: clear.figs, gate: +gate.toFixed(3), down: clear.down },
      plate: plate && plateToday ? { chosen: +plateMiss(plate, pose, i.field.W, i.field.H, lens).share.toFixed(3), today: +plateToday.share.toFixed(3), corners: plateMiss(plate, pose, i.field.W, i.field.H, lens).corners, todayCorners: plateToday.corners, restGap: Math.round(gap) } : null,
      stand: null,
      pin: null,
      giant: { id: hit.row.id, k: +k.toFixed(3), aspect: +(i.W / i.H).toFixed(3) },
      bossPx,
      planMs: Math.round(performance.now() - i.t0),
      tries: i.log,
    },
  };
}
