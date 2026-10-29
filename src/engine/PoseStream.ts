/**
 * Loading a figure's poses with the load diet (`LoadDiet.ts`; lane "load-diet", 2026-10-29; both games, shared loading plumbing; no DOM, no `three`).
 *
 * `PaintedActorPoses.loadPoses` used to start every pose at once and wait for all of them. Here the opening poses (idle*, ready*) go first and are waited for without a limit; then
 * the others are started in the order a fight draws them ({@link poseNeed}), a few at a time, so that on a line that cannot bring them all quickly the poses a fight draws first are
 * the ones that arrive first (all at once, every pose would arrive with the last). They are waited for at most the ceiling; the figure is built with what has landed and the rest
 * is handed back to be installed as it lands. A set that is complete inside the ceiling comes back whole and in the order it was asked for, which is release 67's result.
 */
import { orderByNeed, poseNeed, raceCeiling, splitPoses } from './LoadDiet.ts';
import { backgroundHeld, queued, whenBackgroundOpen } from './LoadHold.ts'; // lane "budgets-2": on the phone class the later poses start when the entry is done

/** How many of the other poses are in flight at once: enough to keep a fast line full, few enough that the first-needed ones are not slowed by the last. */
export const LATE_WINDOW = 6;

/**
 * Start `tasks` in order, at most `width` in flight; `stop(i)` true skips task `i` (its promise rejects with `StreamStopped`) and the others go on. The returned promises are in task order.
 * Pure of time: a task starts when a slot frees, not on a clock.
 */
export function startWindowed<T>(tasks: ReadonlyArray<() => Promise<T>>, width: number, stop: (index: number) => boolean = () => false): Promise<T>[] {
  const out: Promise<T>[] = [];
  const resolvers: Array<{ ok: (v: T) => void; no: (e: unknown) => void }> = [];
  for (let i = 0; i < tasks.length; i++) out.push(new Promise<T>((ok, no) => resolvers.push({ ok, no })));
  let next = 0;
  let flying = 0;
  const pump = (): void => {
    while (flying < width && next < tasks.length) {
      const i = next++;
      if (stop(i)) {
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

/** What a task that was never started rejects with (the figure was disposed, or its pose set replaced, while its poses were still being asked for). */
export class StreamStopped extends Error {
  constructor() {
    super('pose stream stopped');
  }
}

/**
 * Who a figure's pose names belong to (review of the load diet, M1). Every pose set a figure takes (`loadPoses`, `adoptPoses`, a hot-swap) is one claim; when it installs it stamps
 * the names of its map with its number. A pose that lands late is installed only while its own claim still holds that name: a figure whose set was replaced meanwhile (a spherechange,
 * a form change) drops what the old outfit's stream brings in, and the old stream starts no more loads for names the new set took. Release 67 could not meet this case (it waited for
 * the whole set before the figure existed); a name the new set does not carry stays the old outfit's, as it was.
 */
export class PoseClaims {
  private last = 0;
  private readonly by = new Map<string, number>();

  /** A new claim's number (taken when a load begins, stamped when it installs). */
  next(): number {
    return ++this.last;
  }

  /** The claim `id` has installed these names. */
  stamp(names: Iterable<string>, id: number): void {
    for (const n of names) this.by.set(n, id);
  }

  /** True while no newer claim has installed `name` (the claim `id` is still its owner). */
  holds(name: string, id: number): boolean {
    return this.by.get(name) === id;
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
 * `stop(name)` true (the figure is gone, or another pose set took that name) stops starting that pose's load. A set with no opening pose at all is not streamed: it is waited for whole (nothing to build the figure on).
 */
export async function loadStreamed<T>(poses: Readonly<Record<string, string>>, names: readonly string[], ceilingMs: number, load: (url: string) => Promise<T>, stop: (name: string) => boolean): Promise<PoseLoad<T>> {
  const { early, late } = splitPoses(poses, names);
  if (!late.length || !early.length) return { names: [...names], loaded: await Promise.all(names.map((n) => load(poses[n]!))), later: null };
  const earlyLoaded = await Promise.all(early.map((n) => load(poses[n]!)));
  const order = orderByNeed(late, poseNeed);
  // Foreground first (`LoadHold.ts`): while the line is held for the entry (the phone class) the later poses do not start, and the figure does not sit out the ceiling for poses it has not asked for yet:
  // it is built with its opening poses, and each later pose is asked for when the hold opens, through the phone's ranked queue (`LoadHold.queued`: in need order, eight at a time across every figure; `stop` is asked again when its turn comes: the figure may be gone).
  const held = backgroundHeld();
  const task = (n: string) => (held ? () => whenBackgroundOpen().then(() => queued(2 * poseNeed(n), async () => (stop(n) ? Promise.reject(new StreamStopped()) : load(poses[n]!)))) : () => load(poses[n]!));
  const started = startWindowed(order.map(task), LATE_WINDOW, (i) => stop(order[i]!));
  const byName = new Map(order.map((n, i) => [n, started[i]!] as const));
  const each = late.map((n) => byName.get(n)!);
  for (const p of each) p.catch(() => undefined); // a pose that fails or is skipped is the caller's to handle; never an unhandled rejection
  const all = held ? null : await raceCeiling(Promise.all(each), ceilingMs).catch(() => null);
  if (all) {
    const got = new Map<string, T>([...early.map((n, i) => [n, earlyLoaded[i]!] as const), ...late.map((n, i) => [n, all[i]!] as const)]);
    return { names: [...names], loaded: names.map((n) => got.get(n)!), later: null };
  }
  return { names: early, loaded: earlyLoaded, later: { names: late, each } };
}
