/**
 * R61 (PR-0481, the conference demo): do not touch the GPU synchronously while a battle's shaders are still building on it.
 *
 * `BattleScreen.enter` starts compiling the diorama's programs (`warmShaders`, `compileAsync`: the GPU process builds them in the background) and then builds the field. Measured on a cold
 * page (`docs/handoff/r61-booth.md`): any call that has to WAIT for the GPU (a readback: `getImageData` or `toBlob` on a canvas the GPU holds; a second WebGL context) stops the main thread
 * until that backlog is built, 0.7 to 2.2 s, and whichever such call comes first pays all of it. The same calls cost milliseconds once the programs are built. The page can do nothing about the
 * backlog, but it can see to it that no OPTIONAL synchronous GPU call is made while it stands: the swirl keeps moving while the compile runs in the background (`compileAsync` is awaited, not
 * waited for), and the first draw after it finds the compile done.
 *
 * `BattleScreen` holds from the start of `enter` and releases after the field's first draw. Optional work that would have to read back from the GPU (`breathRig`'s alpha reads, the Overdrive
 * splash's crop in `fx/mix/splash.ts`) asks {@link gpuSyncHeld} or waits on {@link afterGpuSettled}; nothing it prepares is needed before the first menu. A hold nobody releases (an early exit,
 * a failed warm) ends by itself after {@link HOLD_CEILING_MS}.
 *
 * Game case: both (shared presentation plumbing).
 */

/** The longest a hold stands without being released. */
export const HOLD_CEILING_MS = 8000;

let holding = false;
let heldSince = 0;
let waiters: Array<() => void> = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  const w = waiters;
  waiters = [];
  for (const fn of w) fn();
}

/** A battle starts building its field: hold optional synchronous GPU work. */
export function holdGpuSync(): void {
  holding = true;
  heldSince = performance.now();
}

/** The field's first draw is done: let the held work go. */
export function releaseGpuSync(): void {
  holding = false;
  flush();
}

/** True while a hold stands (and has not outlived its ceiling). */
export function gpuSyncHeld(): boolean {
  return holding && performance.now() - heldSince < HOLD_CEILING_MS;
}

/** Resolves at once when nothing is held, else when the hold is released or reaches its ceiling. Never rejects. */
export function afterGpuSettled(): Promise<void> {
  if (!gpuSyncHeld()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    waiters.push(resolve);
    timer ??= setTimeout(() => {
      holding = false;
      flush();
    }, Math.max(0, HOLD_CEILING_MS - (performance.now() - heldSince)));
  });
}

/** Forget everything (tests only). */
export function resetGpuSettle(): void {
  holding = false;
  flush();
}
