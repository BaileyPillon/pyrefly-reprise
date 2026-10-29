/**
 * Foreground first: on the phone class the battle's entry gets the line to itself (lane "budgets-2", 2026-10-29; BOTH games, shared loading plumbing; ChatGPT point 5, `docs/BUDGETS.md` B2a;
 * `docs/handoff/budgets-2.md`).
 *
 * THE FINDING. Release 68's focused review timed the phone profile (390 x 844, 10 Mbit/s, CPU x4) on the live game and on the candidate (`critic/reviews/2a9340249-focused/budgets/first-command-phone10-*`): the
 * load wait before the boss card was 19.8 s in Chapter I and 42.4 s in Chapter IV, against 8 s, and release 67 read 20.1 and 39.2: the load diet (r68) moved nothing. The wire never rests: 87 MB after
 * the press at 1.25 MB/s is 70 s, and the first command came at 69.5 s. Everything is asked for at once and shares the line, so the few megabytes the entry needs (the rig's pieces, the opening
 * paintings of the figures it builds one after another) get a share of it and finish when the line has drained. What shares the line with them, and is not drawn until later: the lighting maps
 * (`FigureRelight.prefetchRelight`, 17.9 MB in Chapter I and 13.7 in Chapter IV, asked for as each figure is built), the figures' later poses (`PoseStream.loadStreamed`, six at a time per figure) and the
 * preload's own phase 4 when the pre-battle scene was too short to finish it (`battlePreload.ts`).
 *
 * THE CUT. On the phone class, from the moment the battle screen begins to enter until every figure is built (`PaintedStage.stage` has resolved: what is left of the entry, the HUD, the shader warm-up and the swirl, is the CPU's and leaves the line idle), those three wait: a figure is built with its opening
 * poses at once (no ceiling to sit out), and the later poses, the lighting maps (the poses a fight draws first first: `LoadDiet.poseNeed`) and the preload's remaining poses start when the hold opens. The same bytes
 * arrive, in the other order: the shader warm-up (1.5 to 3 s), the card (1.3 s) and the opening sweep (6.1 to 6.6 s) are the time they have before the first command. Nothing changes on any other device class, nothing is dropped, and a
 * hold that is never opened (a screen that fails to enter) opens itself after {@link HOLD_CEILING_MS}.
 *
 * What a player can see: on a slow line the figures are drawn without their lighting for the first seconds (the maps of the poses drawn first arrive within about 2 s of the card on a 10 Mbit/s line), and a move
 * whose painting has not landed draws its fallback (the load diet's cost, unchanged). `?phonediet=off` brings release 68's order back; `?phonediet=on` holds on any class (a desktop A/B).
 */
import { loadDiet } from './LoadDiet.ts';
import { deviceClass } from './ArtDevice.ts';
import { BackgroundQueue } from './BackgroundQueue.ts';

let override: boolean | null | undefined;

/** Force foreground-first on or off (tests, captures); `null` goes back to the address, then the device class. */
export function setForegroundFirst(value: boolean | null | undefined): void {
  override = value;
}

/** Is foreground-first in force: the load diet is on, and the device is the phone class (or the address says `?phonediet=on`); `?phonediet=off` takes it away. */
export function foregroundFirst(): boolean {
  if (override !== undefined && override !== null) return override;
  if (!loadDiet()) return false;
  try {
    const word = new URLSearchParams(globalThis.location?.search ?? '').get('phonediet');
    if (word === 'off') return false;
    if (word === 'on') return true;
  } catch {
    /* no address: the class decides */
  }
  return deviceClass() === 'phone';
}

/**
 * How many of the loads after the hold (the later poses of every figure, the lighting maps) are in flight at once on the phone class. Started all together they share the line equally and land together,
 * twenty seconds on; at eight the first of them land in the first five, in {@link queued}'s rank order.
 */
export const LATE_WIDTH = 8;
const lateQueue = new BackgroundQueue(LATE_WIDTH);

/**
 * Start `task` through the phone's ranked queue (`BackgroundQueue`): lowest rank first, {@link LATE_WIDTH} at a time. Off the phone class it is just `task()`. The rank of a later pose is `2 * need`, of a
 * lighting map `2 * need + 1` (`LoadDiet.poseNeed`: 0 the opening poses, 1 the everyday moves, 2 the rest, 3 the rare ones), so a pose comes before its own map and the maps of the poses drawn first before
 * the poses drawn last.
 */
export function queued<T>(rank: number, task: () => Promise<T>): Promise<T> {
  return foregroundFirst() ? lateQueue.run(rank, task) : task();
}

/**
 * The longest a hold stays shut when nobody opens it (a screen that failed to enter and was never torn down): two minutes. It is a backstop and not a budget: a slow line's entry waits for its
 * opening poses for as long as they take (19 MB at Slow 4G's 0.2 MB/s is 95 s), and a hold that opened before they were in would put every later load back on the line they are waiting on.
 */
export const HOLD_CEILING_MS = 120_000;

let held = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let waiters: Array<() => void> = [];
const owners = new Map<object, () => void>();
let opened: Promise<void> = Promise.resolve();
const books = { holds: 0, opens: 0, ceilings: 0, deferredMaps: 0, deferredPoses: 0, heldMs: 0 };
let heldAt = 0;

/** A hold begins (the battle screen starts to enter). Does nothing off the phone class or with the word off. Returns whether the line is held. */
export function holdBackground(ceilingMs: number = HOLD_CEILING_MS): boolean {
  if (held) return true;
  if (!foregroundFirst()) return false;
  held = true;
  heldAt = Date.now();
  books.holds++;
  opened = new Promise<void>((resolve) => waiters.push(resolve));
  timer = setTimeout(() => {
    books.ceilings++;
    releaseBackground();
  }, ceilingMs);
  return true;
}

/** Every figure is built (or the screen is gone): everything that waited starts, in the order it asked. */
export function releaseBackground(): void {
  if (!held) return;
  held = false;
  books.opens++;
  books.heldMs += Date.now() - heldAt;
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
  const run = waiters;
  waiters = [];
  const later = [...owners.values()];
  owners.clear();
  for (const w of run) w();
  for (const f of later) f();
}

/** True while the line is held for the entry. */
export function backgroundHeld(): boolean {
  return held;
}

/** Resolves at once off the hold, else when it opens. Never rejects. */
export function whenBackgroundOpen(): Promise<void> {
  return held ? opened : Promise.resolve();
}

/**
 * Run `again` when the hold opens instead of now, once per `owner` however often it asks. True when it was deferred (the caller returns), false when nothing is held (the caller goes on).
 * `alive` is asked at the opening: a figure that was disposed meanwhile does nothing.
 */
export function deferWhileHeld(owner: object, again: () => void, alive: () => boolean = () => true, kind: 'maps' | 'poses' = 'maps'): boolean {
  if (!held) return false;
  if (!owners.has(owner)) {
    if (kind === 'maps') books.deferredMaps++;
    else books.deferredPoses++;
    owners.set(owner, () => {
      if (alive()) again();
    });
  }
  return true;
}

/** For the debug probe and the tests. */
export function holdBooks(): { held: boolean; holds: number; opens: number; ceilings: number; deferredMaps: number; deferredPoses: number; heldMs: number; queue: { inFlight: number; queued: number } } {
  return { held, ...books, queue: { inFlight: lateQueue.inFlight, queued: lateQueue.queued } };
}

/** Tests only: forget every hold and every count. */
export function resetHoldForTests(): void {
  held = false;
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
  for (const w of waiters) w(); // whoever still waits goes on (a test must not leave a preload parked for good)
  waiters = [];
  owners.clear();
  opened = Promise.resolve();
  lateQueue.reset();
  for (const k of Object.keys(books) as Array<keyof typeof books>) books[k] = 0;
  override = undefined;
}
