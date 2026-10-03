import { Vector3 } from 'three';
import type { FramingReport } from './framingReport.ts';
import { subjectId, UP, type Actor, type Pose } from './geometry.ts';
import { phoneBattle } from './hudPanels.ts';
import type { Shift, Side } from './staging.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's STAGING TABLE (round 19b, PR-0310): where a chapter's party and fiends stand, as data.
 * In three FFX chapters a member stood inside the boss's painted shape while she waited for a turn (the rest gap, `plate.ts`:
 * Auron's sword over Yunalesca's gown, the blade of Braska's Final Aeon over the party, Evrae's coil across Tidus). Bailey took
 * the options on 2026-10-03 (ask 4 of the Visual Options page): Chapter II option C (both sides move, the party left and the boss
 * right) and Chapter III option B (every fiend right and back, the formation whole). Chapter VIII (Evrae) has no row: no
 * position-only move clears the coil (D-353), and its own answer (D-360) is a repainted coil with a pinned slot. Natus (option N,
 * the Sensor card steered off the boss) has none either: `docs/handoff/r38-restage.md` has the runs that kept it off.
 *
 * A table, not a solve: the prototype (`opt-restage`) planned the whole chapter 17 times at the battle start (about 2 s on the main
 * thread); a chapter's answer does not change, so it is written down here and applied with the first plan. A move is in world units
 * along the screen's own axes (`right`: + is screen-right, `toward`: + is toward the camera), read from today's resting rig, so it
 * means left / right / nearer / farther whatever the scene's yaw. One fixed move per chapter held at 1600x900, 2000x1012,
 * 2560x1440 and 2560x1080 (the prototype's solves differed by size; its plan could still step the party 0.35 or 0.7 toward the fiends
 * and the steps were chosen by near ties, so a chapter with a row is planned without them, `framing.ts`, and the row places the
 * party itself: as far left as the command list allows, the fiends taking the rest of the clearance).
 *
 * Presentation only (rule 1): `Staging` writes the figures' world x and z (a side's move, held for the fight, on top of the plan
 * CHAPTER FRAMING makes), the engine's state never changes, and the camera's fit, the colossus rules and the clearance checks all
 * measure the figures where the table put them. Game case: FFX only (rule 14: the sources hold no staging for FFX, our slots are
 * `[ours]`, FFX has fixed formations and no positional rule, so a move changes the picture, never a rule; FFX-2 has free battle
 * positions and is not touched). Desktop only: the upright phone keeps its own fit. It plays with CHAPTER FRAMING's switch
 * (EYE CANDY, BATTLE SPECTACLE); no setting of its own, nothing saved.
 */

/** A move on the floor along the screen's axes, in world units. */
export interface Move {
  right: number;
  toward: number;
}

/** What each side does. */
export interface Slots {
  party: Move;
  enemy: Move;
}

interface Row extends Slots {
  /** The chapter, for the report. */
  chapter: string;
  /** A fiend of the fight whose painted id matches picks the row. */
  boss: RegExp;
}

export const STAGE_TABLE: readonly Row[] = [
  // Chapter II, Yunalesca (option C): the party keeps just inside the command list (a little left), she moves right and back.
  { chapter: 'yunalesca', boss: /^yunalesca/, party: { right: -0.1, toward: 0.04 }, enemy: { right: 0.75, toward: -0.47 } },
  // Chapter III, Braska's Final Aeon (option B): the boss and both pagodas move right and back as one formation; the party stands
  // where the old plan's usual step put it (0.35 toward them, clear of the command list), now the same on every run.
  { chapter: 'braskas-final-aeon', boss: /^braskas-final-aeon/, party: { right: 0.35, toward: 0 }, enemy: { right: 1.45, toward: -0.95 } },
];

/** The phone battle layout's own query (`ui/common/phoneBattle.ts` PHONE_BATTLE_QUERY, kept here as `engine/ArtTier.ts` keeps it). */
const PHONE_QUERY = '(max-width: 599px) and (orientation: portrait)';

/**
 * The upright phone: the HUD's flag (set once its layout is mounted) or, before that, the window itself, so the table
 * never touches a phone's first frames.
 */
export function onPhone(): boolean {
  if (phoneBattle()) return true;
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;
  } catch {
    return false;
  }
}

/** Checks only: `?stand=off` plays today's slots; `?stand=<party right>,<party toward>,<fiends right>,<fiends toward>` plays that move in every FFX desktop fight. */
export type StandOverride = 'off' | Slots | null;

export function parseStand(search: string): StandOverride {
  let v: string | null;
  try {
    v = new URLSearchParams(search).get('stand');
  } catch {
    return null;
  }
  if (v === null) return null;
  if (v === 'off') return 'off';
  const n = v.split(',').map(Number);
  return n.length === 4 && n.every(Number.isFinite) ? { party: { right: n[0]!, toward: n[1]! }, enemy: { right: n[2]!, toward: n[3]! } } : null;
}

let override: StandOverride = parseStand(typeof location === 'undefined' ? '' : location.search);

export const standOverride = (): StandOverride => override;
export const setStandOverride = (o: StandOverride): void => {
  override = o;
};

/**
 * This fight's slots, or null (today's own): FFX, desktop, and a fiend the table names. `enemies` are the painted ids of the
 * fiends on the stage.
 */
export function standFor(game: 'ffx' | 'ffx2', enemies: readonly string[], phone: boolean): { chapter: string; slots: Slots; boss: RegExp | null } | null {
  if (game !== 'ffx' || phone || override === 'off') return null;
  if (override) return { chapter: 'override', slots: override, boss: null };
  const row = STAGE_TABLE.find((r) => enemies.some((id) => r.boss.test(id)));
  return row ? { chapter: row.chapter, slots: { party: row.party, enemy: row.enemy }, boss: row.boss } : null;
}

/** A side's move in the world: the screen's right and toward axes from today's resting rig, flat on the floor. */
export function sideShift(slots: Slots, rest: Pose, boss: RegExp | null = null): Side {
  const f = new Vector3().subVectors(rest.look, rest.pos).setY(0).normalize();
  const right = new Vector3().crossVectors(f, UP).normalize();
  const toward = f.clone().negate();
  const at = (m: Move): Shift => {
    const v = right.clone().multiplyScalar(m.right).addScaledVector(toward, m.toward);
    return { dx: v.x, dz: v.z };
  };
  return { party: at(slots.party), enemy: at(slots.enemy), boss };
}

/**
 * What `framing.ts` reads when it plans: this fight's side move from today's resting rig (null: the stage's own slots) and the report
 * line for it.
 */
export function readStand(game: 'ffx' | 'ffx2', actors: readonly Actor[], rest: Pose, phone: boolean): { side: Side | null; report: FramingReport['stand'] } {
  const s = standFor(game, actors.filter((a) => a.facing < 0).map(subjectId), phone);
  if (!s) return { side: null, report: null };
  const side = sideShift(s.slots, rest, s.boss);
  const r3 = (x: number): number => Math.round(x * 1000) / 1000;
  return { side, report: { chapter: s.chapter, party: [r3(side.party.dx), r3(side.party.dz)], enemy: [r3(side.enemy.dx), r3(side.enemy.dz)] } };
}
