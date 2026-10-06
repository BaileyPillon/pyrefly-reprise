import { textSizeKey } from './colossusPin.ts';
import { cameraAt, subjectId, type Actor, type Pose } from './geometry.ts';
import { MULTIPART, scaleHeld, scaleTarget } from './masters.ts';
import type { ScaleOpts, Staging } from './staging.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's BOSS SCALE LOCK (r392-boss-scale; both games' plumbing; Yojimbo's held size is FFX only).
 *
 * Before: every plan searched BOSS SCALE's steps afresh (`FRACS`, the first that clears the HUD wins) and the live check at a menu's opening asks for
 * another plan when a member is under a panel, so a boss was re-sized by whatever the leaning member and the panels of the moment let through:
 * Yojimbo 1.33 times the party at the first menu, 0.96 at Yuna's, 1.04 at Lulu's and 1.30 again at the next Kimahri's (the same fight; the 39.1
 * live build), FFX-2's Bahamut 563 px, 416 px, 581 px. The camera may move for a menu (it is the fit's job); the boss may not.
 *
 * Now ONE size per phase of a link. The first plan chooses as it always did (the first step that clears), and the factor it put on each sized boss
 * is kept, by painted id, as a lock. Every later plan in the same phase plays that factor as it stands, on the master and on today's rig alike, and the
 * HUD fit (blend, stand-back, lens shift, the party's step) moves the camera for it, never the boss. A phase ends when the sized bosses on the stage,
 * today's resting rig (a scene that re-registers it: Evrae's range) or the layout (the window, the phone) change: the next plan chooses again.
 * A HELD boss (`masters.ts` `scaleHeld`: Yojimbo) takes its full target in every plan and from the first frame its figures stand still, so the first
 * menu shows it at the size the last one does even when the first plan lands after that menu opens (`holdEarly`).
 *
 * Presentation only (rule 1): a figure's group scale (`Staging`), never the engine.
 */

/** BOSS SCALE's steps: the share of a boss's growth a plan takes (1 = the class target), tried from the largest. */
export const FRACS: readonly number[] = [1, 0.7, 0.45, 0.25, 0];

/** The size a phase of a link plays. */
export interface ScaleLock {
  /** What the lock is for: the sized bosses on the stage, today's resting rig and the layout. A change of any of them is a new phase. */
  key: string;
  /** The BOSS SCALE step the plan that set it chose (-1: today's rig at the drawn scale); null: no plan has chosen yet (only the held bosses are sized). */
  frac: number | null;
  /** Each sized boss's factor by painted id (1 = the drawn scale). */
  k: ReadonlyMap<string, number>;
}

const sized = (id: string): boolean => scaleTarget(id) !== null && !MULTIPART.test(id);

/** The painted ids of the fiends BOSS SCALE sizes (a multi-part machine keeps its drawn scale), sorted. */
export const sizedIds = (actors: readonly Actor[]): string[] => actors.filter((a) => a.facing < 0).map(subjectId).filter(sized).sort();

/**
 * The layout a phase is played in: `Framing.layoutKey` (game, phone, canvas size), TEXT SIZE (a card that grows leaves the table's place) and whether the
 * table pins the colossus master (`colossusPin.ts`): a size set under a pin is not the size an unpinned plan may keep (Natus at TEXT SIZE 115 plays today's search).
 */
export const phaseLayout = (layout: string, pinned: boolean): string => `${layout}|${textSizeKey()}${pinned ? '|pin' : ''}`;

/** The phase a lock belongs to, or null when no boss is sized. `layout` is {@link phaseLayout}. */
export function scaleKey(actors: readonly Actor[], base: Pose, layout: string): string | null {
  const ids = sizedIds(actors);
  if (!ids.length) return null;
  const r = (v: number): string => v.toFixed(2);
  return `${ids.join(',')}|${base.pos.toArray().map(r).join(',')}|${base.look.toArray().map(r).join(',')}|${r(base.fov)}|${layout}`;
}

/**
 * The steps a plan tries for the colossus master: a held boss takes its full target in one (nothing to step down: the fit moves the camera); a
 * phase with a lock plays the step it has (none when it chose today's rig); otherwise every step, the first that clears wins, as ever.
 */
export function stepsFor(lock: ScaleLock | null, actors: readonly Actor[]): number[] {
  const ids = sizedIds(actors);
  if (ids.length && ids.every(scaleHeld)) return [1];
  if (lock && lock.frac !== null) return lock.frac >= 0 ? [lock.frac] : [];
  return [...FRACS];
}

/**
 * The step the lock a plan sets records: the step the plan chose, except that today's rig winning a later plan (-1: the fit found nothing better for
 * this menu) leaves the phase's own step standing, so the colossus master is tried again at the size the phase plays.
 */
export const stepOf = (lock: ScaleLock | null, chosen: number): number => (lock && lock.frac !== null && chosen < 0 ? lock.frac : chosen);

/** Today's camera on the canvas (CSS px): how a held boss's size is read (`Staging.planScale`). */
export const viewOf = (base: Pose, r: { width: number; height: number }): NonNullable<ScaleOpts['view']> => {
  const W = r.width || 1;
  const H = r.height || 1;
  return { cam: cameraAt(base, W / H), W, H };
};

/** What a plan sizes the bosses with: nothing on the upright phone (it keeps today's rig and its own fit). */
export const sizingOf = (lock: ScaleLock | null, base: Pose, r: { width: number; height: number }, phone: boolean): ScaleOpts => (phone ? {} : { held: scaleHeld, locked: lock?.k ?? null, view: viewOf(base, r) });

/**
 * The lock a chosen plan sets: the factor it put on each sized boss (`only`: the held ones, for the lock `holdEarly` sets before any plan has chosen).
 * `frac` is the step it chose (-1: today's rig).
 */
export function lockOf(key: string, frac: number | null, plan: ReadonlyMap<Actor, { k: number }>, actors: readonly Actor[], only?: (id: string) => boolean): ScaleLock {
  const k = new Map<string, number>();
  for (const a of actors) {
    if (a.facing >= 0) continue;
    const id = subjectId(a);
    if (sized(id) && (!only || only(id))) k.set(id, plan.get(a)?.k ?? 1);
  }
  return { key, frac, k };
}

/**
 * Before the first plan is on screen: a held boss takes its size as soon as its figures stand still (`can`) and keeps it every frame, so a first menu
 * that opens before the plan lands (the plan waits for the menu to close) already shows it at the size the plan will keep. The size is read once, from
 * the figures at rest, and set as the lock the first plan then plays. Returns the lock (the one given when nothing is held or nothing can be read yet).
 */
export function holdEarly(staging: Staging, actors: readonly Actor[], base: Pose, r: { width: number; height: number }, layout: string, lock: ScaleLock | null, can: boolean): ScaleLock | null {
  const key = scaleKey(actors, base, layout);
  if (key === null) return lock;
  let held = lock;
  if (lock?.key !== key) {
    if (!can || !actors.some((a) => a.facing < 0 && scaleHeld(subjectId(a)))) return lock;
    staging.clearPlan();
    staging.planScale(actors, base.pos, scaleTarget, 0, { held: scaleHeld, view: viewOf(base, r) });
    held = lockOf(key, null, staging.plan, actors, scaleHeld);
  }
  staging.apply(actors, true);
  return held;
}
