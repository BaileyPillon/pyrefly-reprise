/**
 * Loading a figure's poses with the load diet (`LoadDiet.ts`; lane "load-diet", 2026-10-29; both games, shared loading plumbing; no DOM, no `three`).
 *
 * `PaintedActorPoses.loadPoses` used to start every pose at once and wait for all of them. Here the opening poses (idle*, ready*) go first and are waited for without a limit; then
 * the others are started in the order a fight draws them ({@link poseNeed}), a few at a time, so that on a line that cannot bring them all quickly the poses a fight draws first are
 * the ones that arrive first (all at once, every pose would arrive with the last). They are waited for at most the ceiling; the figure is built with what has landed and the rest
 * is handed back to be installed as it lands. A set that is complete inside the ceiling comes back whole and in the order it was asked for, which is release 67's result.
 */
import { orderByNeed, poseNeed, raceCeiling, splitPoses } from './LoadDiet.ts';

/** How many of the other poses are in flight at once: enough to keep a fast line full, few enough that the first-needed ones are not slowed by the last. */
export const LATE_WINDOW = 6;

/**
 * Start `tasks` in order, at most `width` in flight; `stop()` true skips the rest (their promises reject with `StreamStopped`). The returned promises are in task order.
 * Pure of time: a task starts when a slot frees, not on a clock.
 */
export function startWindowed<T>(tasks: ReadonlyArray<() => Promise<T>>, width: number, stop: () => boolean = () => false): Promise<T>[] {
  const out: Promise<T>[] = [];
  const resolvers: Array<{ ok: (v: T) => void; no: (e: unknown) => void }> = [];
  for (let i = 0; i < tasks.length; i++) out.push(new Promise<T>((ok, no) => resolvers.push({ ok, no })));
  let next = 0;
  let flying = 0;
  const pump = (): void => {
    while (flying < width && next < tasks.length) {
      const i = next++;
      if (stop()) {
        resolvers[i]!.no(new StreamStopped());
        continue;
      }
      flying++;
      let started: Promise<T>;
      try {
        started = tasks[i]!();
      } catch (e) {
        started = Promise.reject(e);
      }
      started.then(
        (v) => {
          flying--;
          resolvers[i]!.ok(v);
          pump();
        },
        (e) => {
          flying--;
          resolvers[i]!.no(e);
          pump();
        },
      );
    }
  };
  pump();
  return out;
}

/** What a task that was never started rejects with (the figure was disposed while its poses were still being asked for). */
export class StreamStopped extends Error {
  constructor() {
    super('pose stream stopped');
  }
}

export interface PoseLoad<T> {
  /** The pose names installed now, and what was loaded for each (same order). */
  names: string[];
  loaded: T[];
  /** The poses still on their way: install each when its promise settles. null: everything came inside the ceiling. */
  later: { names: string[]; each: Promise<T>[] } | null;
}

/**
 * Load `names` of the `poses` map (`{ pose: url }`) through `load`, which must answer one promise per URL. `ceilingMs` bounds the wait for the poses after the opening ones;
 * `stop()` true (the figure is gone) stops starting more.
 */
export async function loadStreamed<T>(poses: Readonly<Record<string, string>>, names: readonly string[], ceilingMs: number, load: (url: string) => Promise<T>, stop: () => boolean): Promise<PoseLoad<T>> {
  const { early, late } = splitPoses(poses, names);
  if (!late.length) return { names: [...names], loaded: await Promise.all(names.map((n) => load(poses[n]!))), later: null };
  const earlyLoaded = await Promise.all(early.map((n) => load(poses[n]!)));
  const order = orderByNeed(late, poseNeed);
  const started = startWindowed(order.map((n) => () => load(poses[n]!)), LATE_WINDOW, stop);
  const byName = new Map(order.map((n, i) => [n, started[i]!] as const));
  const each = late.map((n) => byName.get(n)!);
  for (const p of each) p.catch(() => undefined); // a pose that fails or is skipped is the caller's to handle; never an unhandled rejection
  const all = await raceCeiling(Promise.all(each), ceilingMs).catch(() => null);
  if (all) {
    const got = new Map<string, T>([...early.map((n, i) => [n, earlyLoaded[i]!] as const), ...late.map((n, i) => [n, all[i]!] as const)]);
    return { names: [...names], loaded: names.map((n) => got.get(n)!), later: null };
  }
  return { names: early, loaded: earlyLoaded, later: { names: late, each } };
}
