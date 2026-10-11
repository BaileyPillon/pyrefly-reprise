/**
 * **Which of the game's motions an actor plays for what the presenter is doing** (the hidden Fayth chapter's `ffx` skin; FFX only; `docs/plans/fayth-3d.md`, phase 5a). The converter lane read the motion
 * banks and wrote `clipmap.json` beside the models (Bailey's own converted files; local only): per actor, a row for each of our pose names, each a short **sequence** of clips (wind-up, hold, release,
 * ...), each clip named and flagged as playing once or looping, with the strike's contact frame where one was read. This file holds the pure half: reading that table, and mapping the presenter's
 * pose and the engine's action onto a row. It knows no clip name and no retail number: the table is read at run time from the local folder, and the tests use made-up names.
 *
 * ## From a pose to a row
 *
 * The presenter names a figure's state by painting (`idle`, `ready`, `attack`, `cast`, `item`, `hurt`, `ko`, `victory`, `defend`, ...). {@link keyForPose} turns the pose the actor shows and the life state
 * it is in (`PaintedActor.pose`, `PaintedActor.lifeState`: both public) into a row key:
 *
 * - `idle`, `idle-near`, `idle-far`, `sleep` and any unknown name play the idle loop. **`ready` plays the idle loop too**: the game has no separate ready motion (the converter's note), and the presenter
 *   raises `ready` both while a command menu is open and for an attack's wind-up (the wind-up is {@link KEEP} while an action's own row is playing, see below).
 * - `follow` (the attack's follow-through painting) is {@link KEEP}: whatever is playing carries on.
 * - `attack`, `cast`, `item`, `hurt`, `ko`, `victory`, `critical`, `breath-charge` are rows of their own; the life state `guard` is the `defend` row (the defend painting falls back to `ready`, so the
 *   pose alone cannot say it), `down` is `ko` and `victory` is `victory`.
 * - A row an actor has no clips for plays as idle (Evrae has no `defend`).
 *
 * ## From an action to a row
 *
 * The presenter's pose for an enemy's move says `attack` or `cast` whatever the move is (Evrae has one painting for all of them), so the animator also listens to the action's opening (the shot
 * director's beat, which carries the ability id): {@link actionKeyFor} names the row an ability plays. Evrae's moves are rows of their own (`poison-breath`, `stone-gaze`, ...); a party member's
 * `attack`, `cast` and `item` are the painted pose names the beat carries as `kind`. {@link RANGE_KEYS} are the airship's two flights.
 *
 * Pure: no `three`, no DOM. Game case: FFX only (the table is FFX's).
 */

import { isManifestPath } from './localAssets.ts';

/** The key of a row of the table: `idle`, `attack`, `poison-breath`, ... */
export type RowKey = string;

/** The answer of {@link keyForPose} for a pose that changes nothing: whatever is playing carries on. */
export const KEEP = 'keep';

/** One clip of a row's sequence. */
export interface ClipStep {
  readonly clip: string;
  /** True for a hold: the clip loops until the sequence is released. */
  readonly loop: boolean;
  /** The clip's length in frames (the motions are 30 a second). */
  readonly frames: number;
}

/** A row: the clips to play in order, and where in them the strike lands. */
export interface ClipRow {
  readonly steps: readonly ClipStep[];
  /** The frame, counted from the start of the whole sequence, at which the strike or the effect lands; null when none was read. */
  readonly contact: number | null;
}

/** One actor's clips: the file that holds them (relative to the manifest) and its rows. */
export interface ActorClips {
  readonly file: string;
  readonly rows: Readonly<Record<RowKey, ClipRow>>;
}

export interface ClipMap {
  /** The motions' frame rate. */
  readonly fps: number;
  /** By combatant id. */
  readonly actors: Readonly<Record<string, ActorClips>>;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** One step of a row's `sequence`, or null for one that is not a clip with a name and a length. */
function parseStep(raw: unknown): ClipStep | null {
  if (!isRecord(raw)) return null;
  const { clip, play, frames } = raw;
  if (typeof clip !== 'string' || clip === '' || !positive(frames)) return null;
  return { clip, loop: play === 'loop', frames };
}

/** A row of `poses`, or null for one that is not mapped (`status` other than `mapped`, no sequence, or a clip that is not a clip). */
function parseRow(raw: unknown): ClipRow | null {
  if (!isRecord(raw) || raw['status'] !== 'mapped' || !Array.isArray(raw['sequence'])) return null;
  const steps = raw['sequence'].map(parseStep);
  if (steps.length === 0 || steps.some((s) => s === null)) return null;
  const contact = isRecord(raw['contact']) && typeof raw['contact']['sequenceFrame'] === 'number' && raw['contact']['sequenceFrame'] >= 0 ? raw['contact']['sequenceFrame'] : null;
  return { steps: steps as ClipStep[], contact };
}

/**
 * The converter's `clipmap.json` (`{ fps, characters: { <id>: { glb, poses: { <row>: { status, sequence: [{ clip, play, frames }], contact } } } } }`) as the table the animator reads, or null when it is not of
 * that shape. An actor whose file is not a safe path under the folder, or that has no mapped `idle` row, is left out (a model with no idle has nothing to stand in); a row that is not mapped is left out of its
 * actor (it plays as idle). Anything else in the file is ignored.
 */
export function parseClipMap(raw: unknown): ClipMap | null {
  if (!isRecord(raw) || !isRecord(raw['characters'])) return null;
  const fps = positive(raw['fps']) ? raw['fps'] : 30;
  const actors: Record<string, ActorClips> = {};
  for (const [id, entry] of Object.entries(raw['characters'])) {
    if (!isRecord(entry) || !isManifestPath(entry['glb']) || !isRecord(entry['poses'])) continue;
    const rows: Record<RowKey, ClipRow> = {};
    for (const [key, row] of Object.entries(entry['poses'])) {
      const parsed = parseRow(row);
      if (parsed) rows[key] = parsed;
    }
    if (rows['idle']) actors[id] = { file: entry['glb'], rows };
  }
  return Object.keys(actors).length > 0 ? { fps, actors } : null;
}

/** Every distinct clip name an actor's rows use (what has to be taken out of its animation file). */
export function clipNamesOf(actor: ActorClips): string[] {
  const names = new Set<string>();
  for (const row of Object.values(actor.rows)) for (const step of row.steps) names.add(step.clip);
  return [...names];
}

// ---------------------------------------------------------------------------
// From the presenter's pose, and from an action
// ---------------------------------------------------------------------------

const POSE_KEYS: Readonly<Record<string, RowKey>> = {
  idle: 'idle',
  'idle-near': 'idle',
  'idle-far': 'idle',
  ready: 'idle',
  sleep: 'idle',
  attack: 'attack',
  cast: 'cast',
  item: 'item',
  hurt: 'hurt',
  ko: 'ko',
  victory: 'victory',
  critical: 'critical',
  defend: 'defend',
  guard: 'defend',
  'breath-charge': 'breath-charge',
};

/**
 * The row an actor shows, from the pose it displays (`PaintedActor.pose`: the painting that is up, after the presenter's fallbacks) and the life state it is in (`PaintedActor.lifeState`: from the pose
 * the presenter asked for). The life state wins for `guard`, `down` and `victory`, because the painting for them may be another one (a defend falls back to `ready`). `follow` is {@link KEEP}.
 */
export function keyForPose(pose: string, lifeState: string): RowKey {
  if (lifeState === 'guard') return 'defend';
  if (lifeState === 'down') return 'ko';
  if (lifeState === 'victory') return 'victory';
  if (pose === 'follow') return KEEP;
  return POSE_KEYS[pose] ?? 'idle';
}

/** Whether a key is one that takes over from an action in hand: the figure is hit, falls, or the fight is won. */
export const interrupts = (key: RowKey): boolean => key === 'hurt' || key === 'ko' || key === 'victory';

/** What an enemy's ability plays, by our ability id (`src/data/ffx/`). Evrae's moves are rows of their own; the whiffed breath is the same motion as the breath. */
const ABILITY_KEYS: Readonly<Record<string, RowKey>> = {
  'evrae-attack': 'attack',
  'evrae-poison-breath': 'poison-breath',
  'evrae-out-of-breath-range': 'poison-breath',
  'evrae-stone-gaze': 'stone-gaze',
  'evrae-photon-spray': 'photon-spray',
  'evrae-swooping-scythe': 'swooping-scythe',
  'evrae-inhale': 'breath-charge',
  'evrae-haste': 'cast',
};

/** The painted pose names an action's `kind` may be that a row exists for. */
const KIND_KEYS: ReadonlySet<string> = new Set(['attack', 'cast', 'item', 'defend']);

/**
 * The row an action opens with: the ability's own row when the table names one (Evrae's moves), else the action's kind (`attack`, `cast`, `item`, `defend`: the painted pose the presenter picked); null for
 * anything else (an Overdrive: the pose decides).
 */
export function actionKeyFor(abilityId: string | undefined, kind: string | undefined): RowKey | null {
  if (abilityId !== undefined && ABILITY_KEYS[abilityId] !== undefined) return ABILITY_KEYS[abilityId]!;
  return kind !== undefined && KIND_KEYS.has(kind) ? kind : null;
}

/** The two flights of the airship (Cid's order moves the ship): Evrae's motion for each way the range changes. */
export const RANGE_KEYS: Readonly<Record<'near' | 'far', RowKey>> = { far: 'pull-back', near: 'move-in' };
