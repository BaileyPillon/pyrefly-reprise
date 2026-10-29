/**
 * The load diet (lane "load-diet", 2026-10-29; both games, shared loading plumbing; ChatGPT point 5, `docs/BUDGETS.md` B2a and B3a).
 *
 * Round 30b's G4 run (`critic/rounds/round-30/gaps2/g4/4c-reqlog-ch1.json`, the live site, a cold Chapter I at 1600 x 900) found that the first command
 * waited on EVERY pose of every figure: `PaintedActor.create` awaited the whole painting set, so a line that could not move the 60 or so MB of poses before
 * the pre-battle scene ended (Fast 4G: 76 s from the card, Slow 4G: never in 400 s) held the first menu for bytes nothing on screen draws for many seconds
 * (the victory, sleep, critical and follow poses, an Overdrive's keys). This file is the pure half of the cut, with no DOM, no `three` and no clock:
 *
 *   - **The need of a pose** ({@link poseNeed}): 0 the poses the first frames draw (`idle*`, `ready*`), 1 the everyday moves (attack, cast, hurt, item, defend,
 *     telegraph), 2 everything else (ko, a boss's own keys), 3 the rare ones (victory, sleep, critical, follow, Overdrive keys). The preload orders its
 *     downloads by it ({@link orderByNeed}), so what a fight draws first is first on the wire.
 *   - **The stream** ({@link splitPoses}, {@link raceCeiling}): a figure waits for its opening poses without a limit, as it always did, and for the rest
 *     for at most {@link STREAM_CEILING_MS}. A line that brings them inside the ceiling sees exactly release 67 (every pose loaded before the figure is
 *     built); a slower one gets the fight at once, the other poses install as they land, and a move whose own painting has not landed draws its fallback
 *     painting (`POSE_FALLBACKS`: cast then attack then idle) for that one move.
 *
 * `?loaddiet=off` on the address restores release 67 in every part (the preload's order, its image prefetch, the ceiling). Nothing is saved.
 */

let override: boolean | null | undefined;

/** Force the diet on or off (tests, captures); `null` goes back to the address. */
export function setLoadDiet(value: boolean | null | undefined): void {
  override = value;
}

/** True unless the address says `?loaddiet=off` (or a test forced it off). */
export function loadDiet(): boolean {
  if (override !== undefined && override !== null) return override;
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('loaddiet') !== 'off';
  } catch {
    return true;
  }
}

/**
 * How long a figure waits for the poses after its opening ones before it is built without them. It is the room a fast line needs to bring a chapter's
 * remaining poses (about 3 s of 50 Mbit/s moves 19 MB) and short enough that a slow one does not hold the first menu for them. The card and the opening
 * sweep (1.3 s and 6.1 to 6.6 s before the first command) give every late pose that much more time to land before anyone can ask for it.
 */
export const STREAM_CEILING_MS = 3000;

/** The ceiling in force: {@link STREAM_CEILING_MS}, or 0 (wait for every pose, as release 67) with the diet off. */
export function streamCeilingMs(): number {
  return loadDiet() ? STREAM_CEILING_MS : 0;
}

/** 0 the first frames, 1 the everyday moves, 2 the rest, 3 the rare ones. Lower is needed sooner. */
export type PoseNeed = 0 | 1 | 2 | 3;

const OPENING = /^(idle|ready)/;
const EVERYDAY = /^(attack|cast|hurt|item|defend|guard|telegraph)$/;
const RARE = /^(victory|sleep|critical|follow|overdrive|od-)/;

/** How soon a pose of this name is drawn in a fight (the names are the manifest's: `idle`, `idle-far`, `ready`, `attack`, `od-slice-and-dice`...). */
export function poseNeed(state: string): PoseNeed {
  if (OPENING.test(state)) return 0;
  if (EVERYDAY.test(state)) return 1;
  if (RARE.test(state)) return 3;
  return 2;
}

/** `items` ordered by need, lowest first; items of the same need keep the order they came in (a stable sort: the boss before the party stays). */
export function orderByNeed<T>(items: readonly T[], need: (item: T) => number): T[] {
  return items.map((item, i) => ({ item, i, n: need(item) })).sort((a, b) => a.n - b.n || a.i - b.i).map((x) => x.item);
}

/**
 * Split a figure's `{ pose: url }` map into the poses it waits for and the poses it may stream. A pose is early when its name is an opening one or when
 * another early pose points at the same file (a pose that falls back to the idle's painting arrives with it). Names keep their order.
 */
export function splitPoses(poses: Readonly<Record<string, string>>, names: readonly string[] = Object.keys(poses)): { early: string[]; late: string[] } {
  const earlyUrls = new Set(names.filter((n) => poseNeed(n) === 0).map((n) => poses[n]!));
  const early: string[] = [];
  const late: string[] = [];
  for (const n of names) (earlyUrls.has(poses[n]!) ? early : late).push(n);
  return { early, late };
}

/** `p`'s value, or `null` when `ms` passes first (the timer is cleared once `p` settles first). A rejection of `p` rejects. */
export async function raceCeiling<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([p, late]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
