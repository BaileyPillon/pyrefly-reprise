import { Vector3 } from 'three';
import type { PinClass } from './colossusPin.ts';
import type { FramingReport } from './framingReport.ts';
import { subjectId, UP, type Actor, type Pose } from './geometry.ts';
import { phoneBattle } from './hudPanels.ts';
import type { MenuCalm } from './menuCalm.ts';
import type { Shift, Side } from './staging.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's STAGING TABLE (round 19b, PR-0310): where a chapter's party and fiends stand, as data.
 * In three FFX chapters a member stood inside the boss's painted shape while she waited for a turn (the rest gap, `plate.ts`:
 * Auron's sword over Yunalesca's gown, the blade of Braska's Final Aeon over the party, Evrae's coil across Tidus). Bailey took
 * the options on 2026-10-03 (ask 4 of the Visual Options page): Chapter II option C (both sides move, the party left and the boss
 * right) and Chapter III option B (every fiend right and back, the formation whole). Chapter III's row was written and tested but switched
 * off (`CHAPTER_III_STAGED`): the formation that cleared it on every seed was a bigger move than the picture he had seen (the boss 3.0 right,
 * not 1.45) and still touched while the camera drifted. On 2026-10-04 he took the Chapter III options round's answer, **option 1, a calmer
 * camera while the menus are open** ("I'll go with all of your recommendations"): the boss 2.6 right and 0.95 back, the party and the Yu
 * Pagodas where the built row put them, and a camera whose drift shrinks to 15 percent and leans half a unit right while a command menu is open
 * (`menuCalm.ts`; the row carries it, `Row.calm`). That is one change, so it has one switch: `CHAPTER_III_STAGED`, now on, plays the row's
 * placement and its calm camera together, and off puts Chapter III back to the stage's own formation and the full drift. Chapter VIII (Evrae)
 * has no row: no position-only move clears the coil (D-353), and its own answer (D-360) is a repainted coil with a pinned slot. Natus (option N,
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
  /** A move of its own for the fiends whose combatant id (else painted id) matches (the first match wins); every other fiend takes `enemy`. */
  enemyBy?: readonly { id: RegExp; move: Move }[];
}

export interface Row extends Slots {
  /** The chapter, for the report. */
  chapter: string;
  /** A fiend of the fight whose painted id matches picks the row. */
  boss: RegExp;
  /** A calmer camera while a command menu is open in this fight (`menuCalm.ts`); absent: the drift is as it always was. */
  calm?: MenuCalm;
  /** The colossus master the chapter pins, per window shape (`colossusPin.ts`); none: the plan searches as before. */
  colossus?: readonly PinClass[];
}

/** Chapter III's two Yu Pagodas (they paint one art, `yu-pagoda`, and stand as `yu-pagoda-left` and `-right`: told apart by the combatant id). */
const CH3_PAGODAS: NonNullable<Slots['enemyBy']> = [
  { id: /^yu-pagoda-left/, move: { right: 0.7, toward: -2.4 } },
  { id: /^yu-pagoda-right/, move: { right: 2.0, toward: -2.4 } },
];

/**
 * Chapter III's switch: option 1 of the Chapter III options round, ON (Bailey, 2026-10-04). It was OFF through release 38 (r38-restage repair): the
 * formation that cleared the party on every seed needed the boss 3.0 right, a bigger move than the picture he had seen, and a Yuna-first menu still
 * brushed the boss while the camera drifted left; a change to the picture needs his look first (rule 9). He has looked and picked: the boss at 2.6
 * right and 0.95 back is clear on every frame of a full drift swing only because the camera is calmer while a menu is open, so the placement and the
 * calm camera are one change and this one switch plays both (`standFor` hands the row's `calm` to `Framing`, which arms `menuCalm`). Off, Chapter III
 * plays exactly as release 38 did: the stage's own formation, the formation relaxation, the plan's party step and the full drift at every menu.
 * The row below is written down and tested either way (`ALL_ROWS`); `docs/handoff/r39-looks.md` has how it relates to r38-restage and the numbers.
 */
export const CHAPTER_III_STAGED = true;

// Chapter II, Yunalesca (option C): the party keeps just inside the command list (a little left), she moves right and back.
const CHAPTER_II: Row = { chapter: 'yunalesca', boss: /^yunalesca/, party: { right: -0.1, toward: 0.04 }, enemy: { right: 0.75, toward: -0.47 } };

/** Chapter III's calm menus (option 1): the drift keeps 15 percent of its size while a menu is open and the camera settles half a unit to its right. */
const CH3_CALM: MenuCalm = { drift: 0.15, lean: 0.5 };

// Chapter III, Braska's Final Aeon (option B's formation, option 1's boss): the boss and both pagodas move right and back, nobody toward the party; the
// party stands where the old plan's usual step put it (0.35 toward them, clear of the command list), the same on every run. A move for each fiend: the
// formation relaxation no longer re-spreads them to the camera of the moment (they are held, `staging.ts`), so the spread it used to settle on, which
// depended on the camera's first seconds, is written down. The boss goes right 2.6 and back 0.95 (the built row had it 3.0 right: the calm camera at the
// menus, `CH3_CALM`, is what lets Yuna's ready staff clear its blade 0.4 sooner); the left pagoda stands off the party's heads (back, and right up to the
// boss's box, so her raised staff in the hurt pose clears its base); the right one is drawn in and back so it stays off the turn rail. The pagodas keep the
// built row's places, so they stand a little nearer the boss than with the 3.0 row. The boss's 2.26 of extra distance (2.6 less the party's 0.35) is more than the fixed 1.4 lunge can
// close (Tidus's strike stopped 165 px short of the boss, painted); the strike is solved against the picture in every chapter now (`motion/StandReach.ts`, r391-reach), so the
// row carries no flag for it. Measured over a full drift swing, seeds 1 and 9, two sizes:
// `docs/handoff/r39-looks.md`; the 12-seed sweep of the 3.0 row it began from: `docs/handoff/r38-restage.md`, "Repair".
const CHAPTER_III: Row = { chapter: 'braskas-final-aeon', boss: /^braskas-final-aeon/, party: { right: 0.35, toward: 0 }, enemy: { right: 2.6, toward: -0.95 }, enemyBy: CH3_PAGODAS, calm: CH3_CALM };

// Chapter X, Seymour Natus (option N, PR-0331): nobody moves on the stage's own account (the scene pins both fiends and holds the party); the row holds the
// ONE colossus master and the Sensor card's place (`colossusPin.ts`, written down from the sweeps in `docs/handoff/r39-natus.md`): BOSS SCALE step 0.45 (the
// boss about 1.65 times as tall as today's rig draws him), the master drawn 65 % of the way back to today's rig and 2 % further off, the frame shifted right
// 3 % of its width (the party between the command list and the status rows), the fiends 0.75 world units apart from the party and Natus 0.4 further (Mortibody,
// in front of him, then stays off his ring), the card at the top, above him (grid 410, 4: clear of the advisor's band and of the turn rail). Proved from
// 1280x720 to 2560x1080 (1.78 to 2.37); the 16:10 window (1440x900) is not yet (Tidus reads a third under the command list there): it plays as today.
const NATUS_PIN: PinClass = { aspect: [1.7, 2.45], pin: { frac: 0.45, blend: 0.65, back: 1.02, lens: [0.03, 0], apart: 0.75, bossApart: 0.4, card: [410, 4] } };
const CHAPTER_X: Row = { chapter: 'seymour-natus', boss: /^seymour-natus/, party: { right: 0, toward: 0 }, enemy: { right: 0, toward: 0 }, colossus: [NATUS_PIN] };

/** Every row there is, switched on or not (the tests and the checks read this); `STAGE_TABLE` is the ones that play. */
export const ALL_ROWS: readonly Row[] = [CHAPTER_II, CHAPTER_III, CHAPTER_X];

/** The rows that play: Chapter II, Chapter X (Natus's colossus pin, r39-natus) and, behind `CHAPTER_III_STAGED`, Chapter III (r39-looks). */
export const STAGE_TABLE: readonly Row[] = ALL_ROWS.filter((r) => r !== CHAPTER_III || CHAPTER_III_STAGED);

let table: readonly Row[] = STAGE_TABLE;
/** Tests and checks only: the rows `standFor` reads (`STAGE_TABLE` by default). */
export const setStageTable = (t: readonly Row[]): void => {
  table = t;
};

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

/**
 * Checks only: `?stand=off` plays today's slots; `?stand=<party right>,<party toward>,<fiends right>,<fiends toward>` plays that move in every FFX
 * desktop fight; `&standf=<id>:<right>,<toward>;<id>:...` gives the fiends whose painted id contains `<id>` a move of their own (a sweep of a formation).
 */
export type StandOverride = 'off' | Slots | null;

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseStand(search: string): StandOverride {
  let v: string | null;
  let f: string | null;
  try {
    const q = new URLSearchParams(search);
    v = q.get('stand');
    f = q.get('standf');
  } catch {
    return null;
  }
  if (v === null) return null;
  if (v === 'off') return 'off';
  const n = v.split(',').map(Number);
  if (n.length !== 4 || !n.every(Number.isFinite)) return null;
  const out: Slots = { party: { right: n[0]!, toward: n[1]! }, enemy: { right: n[2]!, toward: n[3]! } };
  const by: { id: RegExp; move: Move }[] = [];
  for (const part of (f ?? '').split(';')) {
    const [id, mv] = part.split(':');
    const m = (mv ?? '').split(',').map(Number);
    if (id && m.length === 2 && m.every(Number.isFinite)) by.push({ id: new RegExp(escapeRe(id)), move: { right: m[0]!, toward: m[1]! } });
  }
  if (by.length) out.enemyBy = by;
  return out;
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
export function standFor(game: 'ffx' | 'ffx2', enemies: readonly string[], phone: boolean): { chapter: string; slots: Slots; boss: RegExp | null; calm: MenuCalm | null; colossus: readonly PinClass[] | undefined } | null {
  if (game !== 'ffx' || phone || override === 'off') return null;
  if (override) return { chapter: 'override', slots: override, boss: null, calm: null, colossus: undefined };
  const row = table.find((r) => enemies.some((id) => r.boss.test(id)));
  return row ? { chapter: row.chapter, slots: { party: row.party, enemy: row.enemy, ...(row.enemyBy ? { enemyBy: row.enemyBy } : {}) }, boss: row.boss, calm: row.calm ?? null, colossus: row.colossus } : null;
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
  return { party: at(slots.party), enemy: at(slots.enemy), enemyBy: (slots.enemyBy ?? []).map((e) => ({ id: e.id, shift: at(e.move) })), boss };
}

/**
 * What `framing.ts` reads when it plans: this fight's side move from today's resting rig (null: the stage's own slots) and the report
 * line for it.
 */
export function readStand(game: 'ffx' | 'ffx2', actors: readonly Actor[], rest: Pose, phone: boolean): { side: Side | null; report: FramingReport['stand']; colossus?: readonly PinClass[] } {
  const s = standFor(game, actors.filter((a) => a.facing < 0).map(subjectId), phone);
  if (!s) return { side: null, report: null };
  const side = sideShift(s.slots, rest, s.boss);
  const r3 = (x: number): number => Math.round(x * 1000) / 1000;
  const by = (side.enemyBy ?? []).map((e) => [e.id.source, r3(e.shift.dx), r3(e.shift.dz)] as [string, number, number]);
  return { side, report: { chapter: s.chapter, party: [r3(side.party.dx), r3(side.party.dz)], enemy: [r3(side.enemy.dx), r3(side.enemy.dz)], ...(by.length ? { by } : {}) }, ...(s.colossus ? { colossus: s.colossus } : {}) };
}
