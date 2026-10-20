/**
 * **Which of the game's clips is which pose** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only). The real models' motions are the game's own battle bank: each model's `<id>-anims.glb`
 * carries them named as the developers' `btlmot.ath` names them (`APPEAR_00`, `DMG1`, `ATTACK1_00` ...), and `clipmap.json` (written when the files were extracted: `D:/Tools/ffx-parity/assets/runtime/yrp/`) says for each
 * figure which clips make which pose and how they play (`idle` loops; `hurt` plays once; `attack`, `cast` and `item` are a start, a hold and a finish; `ko` a fall, a hold and a rise; `victory` a pose and a hold; `critical`
 * the low-HP kneel in, held and out). **This file keeps only the mapping logic**: the clip data (the frames, the durations, the motion) comes from the GLBs and the names from the map.
 *
 * A pose's {@link Plan} is its `enter` clips (played one after the other), its `hold` clip (looped until the pose is released; none for a pose that is held on the last frame of its entry, or that ends on its own) and its
 * `exit` clips. `./clipSequencer.ts` decides when each part plays; `./clips.ts` carries the choice out on a three.js mixer. Pure: names in, plans out, no `three`.
 *
 * - {@link plansFromClipMap} reads the map file (a figure's `poses`: `play` and `clips`). A `play` of `loop` holds its one clip; `once` plays its clips and ends; `parts` is a combo (the first half the entry, the rest the
 *   exit: Bahamut's four attack parts); otherwise one word per clip (`start`, `fall`, `pose`, `enter` open it; `hold`, `loop` hold it; `finish`, `rise`, `exit` close it), and a word list shorter than the clips that ends
 *   in `hold` holds the last clip and enters through the rest (Bahamut's four `DEAD` parts).
 * - {@link plansFromNames} is the same table built into the code, for the clip names a file has, when there is no map file to read (the names are the game's, so the two agree).
 * - {@link usable} drops every pose whose clips the file does not have.
 */

/** The poses the battle can ask for. `idle2` is the game's alternate fidget (an occasional one-shot over the idle). */
export type Pose = 'idle' | 'idle2' | 'critical' | 'hurt' | 'attack' | 'cast' | 'item' | 'victory' | 'ko';

export const POSES: readonly Pose[] = ['idle', 'idle2', 'critical', 'hurt', 'attack', 'cast', 'item', 'victory', 'ko'];

/** The parts of a pose, by clip name. */
export interface Plan {
  readonly enter: readonly string[];
  readonly hold: string | null;
  readonly exit: readonly string[];
}

export type PlanTable = Partial<Record<Pose, Plan>>;

const OPENS = new Set(['start', 'fall', 'pose', 'enter']);
const HOLDS = new Set(['hold', 'loop']);
const CLOSES = new Set(['finish', 'rise', 'exit']);

/** The plan for a `play` word list over `clips` (see the file's header), or null when the words and the clips do not make one. */
export function planFromPlay(play: string, clips: readonly string[]): Plan | null {
  if (clips.length === 0) return null;
  const words = play.split(',').map((w) => w.trim());
  if (words.length === 1) {
    if (words[0] === 'loop') return { enter: [], hold: clips[0]!, exit: [] };
    if (words[0] === 'once') return { enter: clips, hold: null, exit: [] };
    if (words[0] === 'parts') {
      const k = Math.ceil(clips.length / 2);
      return { enter: clips.slice(0, k), hold: null, exit: clips.slice(k) };
    }
    return null;
  }
  if (words.length === clips.length) {
    const enter: string[] = [];
    const exit: string[] = [];
    let hold: string | null = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i]!;
      if (OPENS.has(w)) enter.push(clips[i]!);
      else if (HOLDS.has(w)) hold = clips[i]!;
      else if (CLOSES.has(w)) exit.push(clips[i]!);
      else return null;
    }
    return { enter, hold, exit };
  }
  if (HOLDS.has(words[words.length - 1]!)) return { enter: clips.slice(0, -1), hold: clips[clips.length - 1]!, exit: [] };
  return null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The plans of figure `id` from the parsed `clipmap.json`, or null when the file has no such figure. A pose with a malformed entry is left out. */
export function plansFromClipMap(json: unknown, id: string): PlanTable | null {
  if (!isRecord(json) || !isRecord(json['characters'])) return null;
  const figure = json['characters'][id];
  if (!isRecord(figure) || !isRecord(figure['poses'])) return null;
  const out: { -readonly [K in Pose]?: Plan } = {};
  for (const pose of POSES) {
    const entry = figure['poses'][pose];
    if (!isRecord(entry) || typeof entry['play'] !== 'string' || !Array.isArray(entry['clips']) || !entry['clips'].every((c) => typeof c === 'string')) continue;
    const plan = planFromPlay(entry['play'], entry['clips'] as string[]);
    if (plan) out[pose] = plan;
  }
  return out;
}

const indexed = (stem: string, n: number): string[] => Array.from({ length: n }, (_, i) => `${stem}_0${i}`);

/** The game's names for the poses, for a file with no map: the table of `clipmap.json` as it stands for the four figures, chosen by which clips the file has. */
export function plansFromNames(names: readonly string[]): PlanTable {
  const has = (n: string): boolean => names.includes(n);
  const out: { -readonly [K in Pose]?: Plan } = {};
  const add = (pose: Pose, play: string, clips: readonly string[]): void => {
    if (!clips.every(has)) return;
    const plan = planFromPlay(play, clips);
    if (plan) out[pose] = plan;
  };
  add('idle', 'loop', ['APPEAR_00']);
  add('idle2', 'once', ['IDLE2']);
  add('critical', 'enter,loop,exit', indexed('WEAK1', 3));
  add('hurt', 'once', ['DMG1']);
  if (has('DEAD_03')) add('ko', 'fall,hold', indexed('DEAD', 4));
  else add('ko', 'fall,hold,rise', indexed('DEAD', 3));
  if (has('ATTACK1_03')) add('attack', 'parts', indexed('ATTACK1', 4));
  else add('attack', 'start,hold,finish', indexed('ATTACK1', 3));
  add('cast', 'start,hold,finish', indexed(has('MAGIC2_00') ? 'MAGIC2' : 'MAGIC1', 3));
  add('item', 'start,hold,finish', ['ITEM_00', 'ITEM_01', 'ITEM_02_1']);
  add('victory', 'pose,hold', indexed('WIN', 2));
  return out;
}

/** The poses of `table` whose clips are all in `names` (and nothing at all when the idle is missing: a model with no idle has no rig). */
export function usable(table: PlanTable, names: readonly string[]): PlanTable {
  const have = new Set(names);
  const out: { -readonly [K in Pose]?: Plan } = {};
  for (const pose of POSES) {
    const plan = table[pose];
    if (!plan) continue;
    const all = [...plan.enter, ...(plan.hold ? [plan.hold] : []), ...plan.exit];
    if (all.every((c) => have.has(c))) out[pose] = plan;
  }
  return out.idle?.hold ? out : {};
}

/** The plans for figure `id` from a parsed map file when it has the figure, else from the names the file's clips carry; either way only what the clips can play. */
export function plansFor(id: string, json: unknown, names: readonly string[]): PlanTable {
  return usable(plansFromClipMap(json, id) ?? plansFromNames(names), names);
}
