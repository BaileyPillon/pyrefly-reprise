import type { PoseMeta } from '../../PaintedArt.ts';

/**
 * The twirl keys' pure parts (D-322; FFX-2 only: only FFX-2 has a spherechange), moved out of `twirl.ts` in round 21 (PR-0314) so the slot
 * can start the twirl before the new outfit has loaded and stay under 400 lines. Everything here is pure on its input.
 */

/** The five parts of a painted change, in playing order (D-322). */
export const TWIRL_PARTS = ['twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end'] as const;

/** Each part's share of the beat: the art run's proposed step clock (12 steps of 1/12 s: 2, 2, 3, 2, 3). */
export const TWIRL_WEIGHT: Readonly<Record<string, number>> = { 'twirl-start': 2, 'twirl-going': 2, 'twirl-mid': 3, 'twirl-forming': 2, 'twirl-end': 3 };

/** The twirl keys a figure ships, in playing order (from the art manifest's states). Pure on its input. */
export function twirlKeysOf(states: readonly string[]): string[] {
  const order = ['start', 'going', 'mid', 'forming', 'end'];
  const rank = (s: string): number => {
    const m = /-(start|going|mid|forming|end)$/.exec(s);
    return m ? order.indexOf(m[1]!) : order.length;
  };
  return states.filter((s) => /^twirl-[a-z0-9-]+$/i.test(s)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'en', { numeric: true }));
}

/** The girl a figure belongs to (`yuna-gunner` -> `yuna`). */
export const girlOf = (figure: string): string => figure.split('-')[0] ?? '';

/** One key of a change: the figure whose folder holds the painting (the dressphere it is painted in), and its state. */
export interface TwirlKey {
  figure: string;
  key: string;
}

/**
 * The keys a change from `from` to `to` plays, in order: the old dressphere's `twirl-start` and
 * `twirl-going`, the girl's `twirl-mid` (under the new figure, the old one, or any figure of hers: `others`
 * is every subject id the manifest knows), the new dressphere's `twirl-forming` and `twirl-end`. Only what
 * `statesOf` lists; empty means today's flourish. Pure on its input.
 */
export function twirlPlan(from: string, to: string, statesOf: (id: string) => readonly string[] | null, others: readonly string[] = []): TwirlKey[] {
  const has = (fig: string, key: string): boolean => !!fig && (statesOf(fig) ?? []).includes(key);
  const plan: TwirlKey[] = [];
  for (const key of ['twirl-start', 'twirl-going']) if (has(from, key)) plan.push({ figure: from, key });
  const girl = girlOf(to || from);
  const mine = others.filter((id) => girl && id.startsWith(`${girl}-`)).sort();
  const mid = [to, from, ...mine].find((fig) => has(fig, 'twirl-mid'));
  if (mid) plan.push({ figure: mid, key: 'twirl-mid' });
  for (const key of ['twirl-forming', 'twirl-end']) if (has(to, key)) plan.push({ figure: to, key });
  return plan;
}

/**
 * What a key's own sidecar `scale` is multiplied by when it is shown on a figure standing in the idle
 * `stage` although it was painted against the idle `own` (`computePoseScale` sizes every pose by the idle
 * on stage): the two idles' pixels per world unit. 1 when either is unknown. Pure.
 */
export function keyRescale(own: Pick<PoseMeta, 'baselineY' | 'scale'> | null, stage: Pick<PoseMeta, 'baselineY' | 'scale'> | null): number {
  if (!own || !stage || !(own.baselineY > 0) || !(stage.baselineY > 0)) return 1;
  return (stage.baselineY / own.baselineY) * ((own.scale ?? 1) / (stage.scale ?? 1));
}

/**
 * How far one frame moves the twirl's clock (ms): the frame's own time, but never more than two frames at
 * 60 Hz. The change's first frames upload the new outfit's paintings and the keys; one such long frame let
 * the first key show for a single frame in the 2026-10-02 in-battle check (Chapter IV, 15 to 74 ms instead
 * of 107), so a slow frame slows the twirl instead of skipping a key.
 */
export function twirlStepMs(dtSeconds: number): number {
  return Math.min(Math.max(0, dtSeconds) * 1000, 1000 / 30);
}

/**
 * When each key shows (ms from the change), inside today's 0.8 s beat; the new outfit at the returned
 * `end`. Equal steps, or each key's share of `weights` (one per key) when given.
 */
export function twirlTimes(n: number, beatMs = 800, weights?: readonly number[]): { at: number[]; end: number } {
  const span = beatMs * 0.8;
  const w = weights && weights.length === n ? weights.map((x) => (x > 0 ? x : 1)) : Array.from({ length: n }, () => 1);
  const total = w.reduce((s, x) => s + x, 0);
  let acc = 0;
  const at = w.map((x) => {
    const t = Math.round((span * acc) / (total || 1));
    acc += x;
    return t;
  });
  return { at, end: Math.round(span) };
}

/** The FFX-2 Change submenu (`ui/ffx2/CommandMenu.ts`) says which dressphere ids it offers (`{ girl, to }`). */
export const GRID_EVENT = 'pyrefly:garment-grid';

/** A change whose keys are not ready this soon plays today's flourish: keys after the new outfit read as a pop. */
export const LATE_MS = 300;

/**
 * What shows at `t` ms of a play of keys at `at` (round 21, PR-0314): the key's index, and whether the play is over. The play does not end
 * before the new outfit is ready (`ready`): past `end` it holds on the last key (the flourish in the new dressphere) until it is, because the
 * twirl now starts at the change's first frame, not after the outfit's paintings have loaded.
 */
export function playAt(at: readonly number[], end: number, t: number, ready: boolean): { i: number; over: boolean } {
  if (t >= end) return { i: at.length - 1, over: ready };
  let i = 0;
  while (i + 1 < at.length && t >= at[i + 1]!) i++;
  return { i, over: false };
}

/** The longest a finished twirl holds its last key for a new outfit that has not loaded (ms): then it lets go and the outfit lands when it can. */
export const HOLD_MAX_MS = 4000;
