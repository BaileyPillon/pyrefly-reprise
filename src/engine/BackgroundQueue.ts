/**
 * A ranked, width-limited start queue for the loads a phone does after its battle entry (lane "budgets-2", 2026-10-29; both games, shared loading plumbing; no DOM, no `three`, no clock but a timer).
 *
 * When the phone's hold opens (`LoadHold.ts`) up to thirty later poses (six a figure, five figures) and forty lighting maps ask for the same 10 Mbit/s at once. Started together they share the line
 * equally and every one of them lands with the last: the first attack of the fight would draw its fallback painting for twenty seconds. Here they start in rank order, at most `width` at a time, so the
 * poses and maps a fight draws first land first. A task is a function that starts the load and returns its promise; its slot is held until that promise settles, or until `slotMs` has passed
 * (a request that hangs must not stop the rest: its slot is given up and the task goes on by itself).
 */
export class BackgroundQueue {
  private active = 0;
  private seq = 0;
  private epoch = 0; // a slot freed after a reset belongs to the queue it was taken in
  private readonly waiting: Array<{ rank: number; seq: number; start: () => void }> = [];

  constructor(
    private width: number,
    private readonly slotMs = 15_000,
  ) {}

  /** Run `task` when a slot is free; lower ranks first, equal ranks in the order they asked. Resolves or rejects with the task. */
  run<T>(rank: number, task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = (): void => {
        this.active++;
        let freed = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const born = this.epoch;
        const free = (): void => {
          if (freed) return;
          freed = true;
          if (timer !== undefined) clearTimeout(timer);
          if (born === this.epoch) this.active--;
          this.pump();
        };
        timer = setTimeout(free, this.slotMs);
        let running: Promise<T>;
        try {
          running = task();
        } catch (e) {
          free();
          reject(e);
          return;
        }
        running.then(
          (v) => {
            free();
            resolve(v);
          },
          (e) => {
            free();
            reject(e);
          },
        );
      };
      this.waiting.push({ rank, seq: this.seq++, start });
      // Not at once: every task asked for in this turn (the loop that asks for forty maps, the continuations of twelve poses) is in the line before the first is picked, so rank decides among all of them.
      queueMicrotask(() => this.pump());
    });
  }

  private pump(): void {
    while (this.active < this.width && this.waiting.length) {
      let best = 0;
      for (let i = 1; i < this.waiting.length; i++) {
        const a = this.waiting[i]!;
        const b = this.waiting[best]!;
        if (a.rank < b.rank || (a.rank === b.rank && a.seq < b.seq)) best = i;
      }
      this.waiting.splice(best, 1)[0]!.start();
    }
  }

  /** Tasks started and not yet finished (the tests and the probe). */
  get inFlight(): number {
    return this.active;
  }

  /** Tasks asked for and not yet started. */
  get queued(): number {
    return this.waiting.length;
  }

  /** Tests only: forget every task, started or waiting (their callers are left pending). */
  reset(): void {
    this.waiting.length = 0;
    this.active = 0;
    this.epoch++;
  }

  /** Tests only: a different width from now on. */
  setWidth(width: number): void {
    this.width = width;
    this.pump();
  }
}
