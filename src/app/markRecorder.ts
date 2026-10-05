import {
  MARK_KEY_CODE,
  MARK_MAX_INPUTS,
  encodeMark,
  fightEventCount,
  logHash,
  markLine,
  sequenceHash,
  writeMark,
  type MarkInput,
  type MarkRecord,
  type PointerKind,
} from './markMoment.ts';

/**
 * N1, "mark this moment": the part that listens (`markMoment.ts` has the record, the code and the storage). Both games; shows nothing on screen.
 *
 * While a battle screen is up it keeps every key, click, wheel turn and pad button edge with the time (ms since the screen began) and the engine's event count
 * (`seq`) it came at. The mark key (`Backquote`) is not one of them. Pressing it builds the record, keeps it in `localStorage`, copies its code to the
 * clipboard inside the key handler and writes one console line; it never touches the DOM.
 */

declare const __PYREFLY_BUILD_SHA__: string | undefined;

/** The build: the short commit the bundle was made at (`unknown` where it had none) and the bundle file this code came from. */
export function buildInfo(): { sha: string; bundle: string } {
  const sha = typeof __PYREFLY_BUILD_SHA__ !== 'undefined' && __PYREFLY_BUILD_SHA__ ? __PYREFLY_BUILD_SHA__ : 'unknown';
  let bundle = 'unknown';
  try {
    bundle = new URL(import.meta.url).pathname.split('/').pop() || 'unknown';
  } catch {
    /* no module URL (a test runner): leave it */
  }
  return { sha, bundle };
}

/** What the recorder reads of the battle. */
export interface MarkSource {
  chapter: string;
  game: string;
  /** The first opening runs hurried (the player skipped the pre-scene). */
  hurried: boolean;
  /** `performance.now()` when the battle screen began: the time every input and the mark are measured from. */
  startedAt: number;
  seed(): number | null;
  /** The engine's event log so far. */
  log(): readonly unknown[];
  party(): string[];
  phase(): string;
  /** A command menu is waiting for the player (the presenter is awaiting a decision). */
  menu(): boolean;
  settings(): Record<string, unknown>;
  defaults(): Record<string, unknown>;
  seenCoach(): string[];
}

/** What the recorder needs of the page, so a test can stand in for it. */
export interface MarkEnv {
  win: Window;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  /** Copy text to the clipboard (a promise that rejects when refused); null where there is no clipboard. */
  copy: ((text: string) => Promise<void>) | null;
  info(line: string): void;
  now(): number;
}

function liveEnv(): MarkEnv {
  let storage: Storage | null = null;
  try {
    storage = globalThis.localStorage ?? null;
  } catch {
    storage = null; // a blocked profile throws on access
  }
  const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
  return {
    win: window,
    storage,
    copy: clip && typeof clip.writeText === 'function' ? (t) => clip.writeText(t) : null,
    info: (line) => console.info(line),
    now: () => performance.now(),
  };
}

const POINTER: Record<string, PointerKind> = { mouse: 0, touch: 1, pen: 2 };

export class MarkRecorder {
  readonly inputs: MarkInput[] = [];
  truncated = false;
  private lastPointer: PointerKind = 0;
  private raf = 0;
  private pads = new Map<number, boolean[]>();
  private running = false;
  /** The profile as the battle began (settings that differ from the defaults, coaching seen): what the replay's fresh profile starts with. */
  private begun: { settings: Record<string, unknown>; seen: string[] } | null = null;

  constructor(
    private readonly src: MarkSource,
    private readonly env: MarkEnv = liveEnv(),
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.begun ??= this.profileNow();
    const w = this.env.win;
    w.addEventListener('keydown', this.onKeyDown, true);
    w.addEventListener('keyup', this.onKeyUp, true);
    w.addEventListener('pointerdown', this.onPointerDown, true);
    w.addEventListener('click', this.onClick, true);
    w.addEventListener('wheel', this.onWheel, { capture: true, passive: true });
    if (typeof w.requestAnimationFrame === 'function') this.raf = w.requestAnimationFrame(this.pollPads);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    const w = this.env.win;
    w.removeEventListener('keydown', this.onKeyDown, true);
    w.removeEventListener('keyup', this.onKeyUp, true);
    w.removeEventListener('pointerdown', this.onPointerDown, true);
    w.removeEventListener('click', this.onClick, true);
    w.removeEventListener('wheel', this.onWheel, { capture: true });
    if (this.raf) w.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** The settings that differ from the shipped defaults, and the coaching seen, as they are now. */
  private profileNow(): { settings: Record<string, unknown>; seen: string[] } {
    const settings = this.src.settings();
    const defaults = this.src.defaults();
    const diff: Record<string, unknown> = {};
    for (const k of Object.keys(settings)) if (JSON.stringify(settings[k]) !== JSON.stringify(defaults[k])) diff[k] = settings[k];
    return { settings: diff, seen: this.src.seenCoach() };
  }

  /** The moment, now: build the record, keep it, copy its code, write the console line. Nothing on screen. */
  mark(): MarkRecord {
    const w = this.env.win;
    const log = this.src.log();
    const build = buildInfo();
    const profile = this.begun ?? this.profileNow();
    const record: MarkRecord = {
      v: 1,
      chapter: this.src.chapter,
      game: this.src.game,
      seed: this.src.seed(),
      sha: build.sha,
      bundle: build.bundle,
      win: [w.innerWidth, w.innerHeight],
      dpr: w.devicePixelRatio || 1,
      hurried: this.src.hurried,
      party: this.src.party(),
      settings: profile.settings,
      seenCoach: profile.seen,
      at: { t: Math.round(this.env.now() - this.src.startedAt), s: log.length, h: logHash(log), hs: sequenceHash(log), n: fightEventCount(log), phase: this.src.phase(), wall: new Date().toISOString() },
      inputs: this.inputs.slice(),
    };
    if (this.truncated) record.truncated = true;
    const code = encodeMark(record);
    writeMark(this.env.storage, record);
    try {
      void this.env.copy?.(code).catch(() => undefined); // refused: skipped, silently
    } catch {
      /* a clipboard that throws instead of rejecting: the same */
    }
    this.env.info(markLine(record, code));
    return record;
  }

  // ------------------------------------------------------------------ inputs

  private push(i: { k: MarkInput['k'] } & Record<string, unknown>): void {
    if (this.inputs.length >= MARK_MAX_INPUTS) {
      this.truncated = true;
      return;
    }
    this.inputs.push({ ...i, t: Math.round(this.env.now() - this.src.startedAt), s: this.src.log().length, ...(this.src.menu() ? { m: 1 } : {}) } as unknown as MarkInput);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === MARK_KEY_CODE) {
      if (!e.repeat) this.mark();
      return;
    }
    if (e.code) this.push({ k: 'kd', c: e.code });
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (e.code && e.code !== MARK_KEY_CODE) this.push({ k: 'ku', c: e.code });
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.lastPointer = POINTER[e.pointerType] ?? 0;
  };

  /** Only a click a pointer made (`detail` above 0): the click a key press on a focused button makes comes with its key press already. */
  private readonly onClick = (e: MouseEvent): void => {
    if (e.detail > 0) this.push({ k: 'click', x: Math.round(e.clientX), y: Math.round(e.clientY), p: this.lastPointer });
  };

  private readonly onWheel = (e: WheelEvent): void => {
    this.push({ k: 'wheel', x: Math.round(e.clientX), y: Math.round(e.clientY), dx: Math.round(e.deltaX), dy: Math.round(e.deltaY) });
  };

  private readonly pollPads = (): void => {
    if (!this.running) return;
    const nav = this.env.win.navigator;
    const pads = typeof nav.getGamepads === 'function' ? nav.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const was = this.pads.get(pad.index) ?? [];
      const now = pad.buttons.map((b) => b.pressed);
      now.forEach((down, b) => {
        if (down !== (was[b] ?? false)) this.push({ k: 'pad', b, d: down ? 1 : 0 });
      });
      this.pads.set(pad.index, now);
    }
    this.raf = this.env.win.requestAnimationFrame(this.pollPads);
  };
}

/** Start recording for a battle screen. Stop it when the screen goes. */
export function startMarkRecorder(src: MarkSource, env?: MarkEnv): MarkRecorder {
  const r = new MarkRecorder(src, env);
  r.start();
  return r;
}
