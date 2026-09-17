/**
 * The cutscene runner.
 *
 * Executes a `StoryScript` from `src/story/dsl.ts` step by step against a set
 * of injected **ports** — small callback interfaces the presenter implements
 * with real DOM/Three.js/audio, and a test implements with fakes. The runner
 * itself never touches the DOM: it is pure orchestration, so it can be driven
 * headlessly in `tests/unit/story-runner-*.test.ts`.
 *
 * Contract notes (`docs/CONTRACTS.md`, `src/story/dsl.ts`):
 * - `run()` resolves the moment it hits a `battleStart()` or `results()` step
 *   (a `pre`/`post` script), or when it falls off the end of the array with
 *   neither (a mid-battle trigger script) — see {@link CutsceneRunResult}.
 * - `beat()` (a `WaitStep`) allocates real time via `ports.wait(ms)` and never
 *   touches the dialogue port — the silence itself is the line.
 * - `skip()` fast-forwards: it unblocks whatever timed step is in flight and
 *   makes every later timed step resolve immediately too, while still
 *   forwarding instantaneous steps (`music`, `sfx`, `setFlag`, `setPose`) so
 *   scene state ends up correct after a skip.
 * - `setInstant(true)` is the **mid-battle `'skip'` mode**: the same
 *   fast-forward, but sticky across `reset()`. See {@link CutsceneRunner.setInstant}.
 * - `jump` is guarded at 1000 total jumps per `run()`, per the DSL's own
 *   "the runner aborts after 1 000 jumps" contract note.
 */

import type {
  BattleStartStep,
  ChoiceStep,
  FadeStep,
  HideActorStep,
  NarrateStep,
  SayStep,
  SetPoseStep,
  ShowActorStep,
  StagePosition,
  Step,
  StoryScript,
  StoryScriptRef,
} from '../dsl.ts';
import type { CameraRigId, MusicKey, SfxKey, VfxKey } from '../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

/** The dialogue box's side of the contract. Implemented by `DialogueBox`. */
export interface DialoguePort {
  /** Resolves when the player advances past the line (or its `auto` timer fires). */
  say(step: SayStep): Promise<void>;
  /** Tidus's retrospective narration. Same advance contract as `say`. */
  narrate(step: NarrateStep): Promise<void>;
  /** Resolves to the chosen option's `value`. */
  choice(step: ChoiceStep): Promise<string | number | boolean>;
}

/**
 * Everything the runner calls out to. The six named in the task brief
 * (`dialogue`, `camera`, `fx`, `music`, `wait`, `moveActor`) are required;
 * the rest are optional so a minimal fake only has to implement what a given
 * test cares about — {@link createNoopPorts} fills in the remainder.
 */
export interface CutscenePorts {
  dialogue: DialoguePort;
  camera(rig: CameraRigId, ms: number): void | Promise<void>;
  fx(key: VfxKey, at?: string): void | Promise<void>;
  music(track: MusicKey | null, fade?: number): void;
  wait(ms: number): void | Promise<void>;
  moveActor(actor: string, to: StagePosition, ms: number, easing?: string): void | Promise<void>;
  sfx?(key: SfxKey): void;
  flash?(color: string | undefined, ms: number): void | Promise<void>;
  shake?(px: number, ms: number): void | Promise<void>;
  fadeScreen?(to: FadeStep['to'], ms: number): void | Promise<void>;
  showActor?(step: ShowActorStep): void | Promise<void>;
  hideActor?(step: HideActorStep): void | Promise<void>;
  setPose?(step: SetPoseStep): void;
}

/** A `DialoguePort` that resolves every line immediately. Useful for fakes and skip-all defaults. */
export function createNoopDialoguePort(): DialoguePort {
  return {
    say: () => Promise.resolve(),
    narrate: () => Promise.resolve(),
    choice: (step) => Promise.resolve(step.options[0]?.value ?? ''),
  };
}

/** Every port as a no-op. `overrides` replaces individual ports for a focused test. */
export function createNoopPorts(overrides: Partial<CutscenePorts> = {}): CutscenePorts {
  return {
    dialogue: createNoopDialoguePort(),
    camera: () => {},
    fx: () => {},
    music: () => {},
    wait: () => {},
    moveActor: () => {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export type CutsceneRunResult =
  /** Hit a `battleStart()` step. Only legal in a `pre` script. */
  | { type: 'battleStart'; transition: BattleStartStep['transition'] }
  /** Hit a `results()` step. Only legal in a `post` script. */
  | { type: 'results'; silent: boolean }
  /** Ran off the end with neither — a mid-battle trigger script. */
  | { type: 'end' };

type StepOutcome = { type: 'jump'; to: string } | Extract<CutsceneRunResult, { type: 'battleStart' | 'results' }>;

const MAX_JUMPS = 1000;

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export class CutsceneRunner {
  private readonly flags = new Map<string, string | number | boolean>();
  private skippedFlag = false;
  private instantFlag = false;
  private skipWaiters: Array<() => void> = [];
  private jumpCount = 0;

  constructor(private readonly ports: CutscenePorts) {}

  get skipped(): boolean {
    return this.skippedFlag;
  }

  /** True while this runner is in the sticky fast-forward of {@link setInstant}. */
  get instant(): boolean {
    return this.instantFlag;
  }

  /**
   * Mid-battle `'skip'` mode: a {@link skip} that **survives {@link reset}**.
   *
   * `skip()` on its own is a one-shot latch on the script in flight, and every
   * mid-battle beat begins with a `reset()` — so a caller that skipped once
   * (`speed: 'skip'` reaching `setAutoAdvance(on, {instant})`) got exactly one
   * cheap beat and then paid full price for every beat after it. That is the
   * whole of why an e2e chapter run at `'skip'` still spent up to eight seconds
   * on each of Seymour's, Yu Yevon's and Bahamut's callouts.
   *
   * Under it every *timed* step still resolves at once while `music`, `sfx`,
   * flags and poses still fire, so the scene state a later beat reads is the
   * state it would have had if the beat had played.
   */
  setInstant(on: boolean): void {
    this.instantFlag = on;
    if (on) this.skip();
  }

  /** Chapter-flag read-back, for `MidBattleTrigger` scripts and tests. */
  getFlag(key: string): string | number | boolean | undefined {
    return this.flags.get(key);
  }

  /**
   * Clears flags, the skip latch and the jump counter. Call between scripts if
   * reusing one runner.
   *
   * {@link setInstant} is deliberately **not** cleared: it is a property of the
   * playback speed, not of the script, so the next script starts already
   * fast-forwarded.
   */
  reset(): void {
    this.flags.clear();
    this.skippedFlag = this.instantFlag;
    this.skipWaiters = [];
    this.jumpCount = 0;
  }

  /**
   * Fast-forward the rest of the currently-running script: unblocks whatever
   * timed step is in flight right now, and every timed step after it resolves
   * without delay. Instantaneous steps (`music`, `sfx`, flags, `setPose`) still
   * fire normally so state stays correct once the skip lands.
   */
  skip(): void {
    if (this.skippedFlag) return;
    this.skippedFlag = true;
    const waiters = this.skipWaiters.splice(0);
    for (const w of waiters) w();
  }

  /** Run a script (or a labelled sub-script id, for documentation only). Resolves per {@link CutsceneRunResult}. */
  async run(script: StoryScript, _ref?: StoryScriptRef): Promise<CutsceneRunResult> {
    const labels = indexLabels(script);
    let ip = 0;
    while (ip < script.length) {
      const step = script[ip];
      if (!step) {
        ip++;
        continue;
      }
      const outcome = await this.execute(step);
      if (!outcome) {
        ip++;
        continue;
      }
      if (outcome.type === 'jump') {
        this.jumpCount++;
        if (this.jumpCount > MAX_JUMPS) {
          throw new Error(
            `CutsceneRunner: aborted after ${MAX_JUMPS} jumps — likely an infinite loop at label "${outcome.to}".`,
          );
        }
        const target = labels.get(outcome.to);
        if (target === undefined) {
          throw new Error(`CutsceneRunner: jump to unknown label "${outcome.to}".`);
        }
        ip = target;
        continue;
      }
      return outcome;
    }
    return { type: 'end' };
  }

  /** Executes one step. Returns an outcome to bubble toward `run()`'s loop, or `undefined` to continue in place. */
  private async execute(step: Step): Promise<StepOutcome | undefined> {
    switch (step.type) {
      case 'say':
        await this.race(this.ports.dialogue.say(step));
        return undefined;

      case 'narrate':
        await this.race(this.ports.dialogue.narrate(step));
        return undefined;

      case 'choice': {
        const fallback = step.options[0]?.value ?? '';
        const value = await this.raceValue(this.ports.dialogue.choice(step), fallback);
        this.flags.set(step.resultKey, value);
        return undefined;
      }

      case 'move':
        await this.race(this.ports.moveActor(step.actor, step.to, step.ms, step.easing));
        return undefined;

      case 'camera':
        await this.race(this.ports.camera(step.rig, step.ms));
        return undefined;

      case 'fx':
        await this.race(this.ports.fx(step.key, step.at));
        return undefined;

      case 'flash':
        await this.race(this.ports.flash?.(step.color, step.ms));
        return undefined;

      case 'shake':
        await this.race(this.ports.shake?.(step.px, step.ms));
        return undefined;

      case 'fade':
        await this.race(this.ports.fadeScreen?.(step.to, step.ms));
        return undefined;

      case 'wait':
        await this.race(this.ports.wait(step.ms));
        return undefined;

      case 'music':
        this.ports.music(step.track, step.fade);
        return undefined;

      case 'sfx':
        this.ports.sfx?.(step.key);
        return undefined;

      case 'showActor':
        await this.race(this.ports.showActor?.(step));
        return undefined;

      case 'hideActor':
        await this.race(this.ports.hideActor?.(step));
        return undefined;

      case 'setPose':
        this.ports.setPose?.(step);
        return undefined;

      case 'parallel': {
        const outcomes = await Promise.all(step.steps.map((inner) => this.execute(inner)));
        return outcomes.find((o): o is StepOutcome => o !== undefined);
      }

      case 'label':
        return undefined;

      case 'jump':
        if (step.ifFlag !== undefined && !this.flags.get(step.ifFlag)) return undefined;
        return { type: 'jump', to: step.to };

      case 'setFlag':
        this.flags.set(step.key, step.value);
        return undefined;

      case 'ifFlag': {
        const actual = this.flags.get(step.key);
        const truthy = step.equals !== undefined ? actual === step.equals : Boolean(actual);
        const branch = truthy ? step.then : (step.else ?? []);
        for (const inner of branch) {
          const outcome = await this.execute(inner);
          if (outcome) return outcome;
        }
        return undefined;
      }

      case 'battleStart':
        return { type: 'battleStart', transition: step.transition };

      case 'results':
        return { type: 'results', silent: step.silent ?? false };

      /* istanbul ignore next -- exhaustiveness guard; every Step case is handled above */
      default: {
        const exhaustive: never = step;
        throw new Error(`CutsceneRunner: unhandled step: ${JSON.stringify(exhaustive)}`);
      }
    }
  }

  /**
   * Await a possibly-void, possibly-async port call, but resolve immediately
   * (without waiting for the real promise) once `skip()` has been — or is —
   * called. This is what makes a mid-flight skip unblock the current step.
   */
  private race(p: void | Promise<void>): Promise<void> {
    if (this.skippedFlag) return Promise.resolve();
    if (!p || typeof (p as Promise<void>).then !== 'function') return Promise.resolve();
    const real = p as Promise<void>;
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        resolve();
      };
      real.then(finish, finish);
      this.skipWaiters.push(finish);
    });
  }

  private raceValue<T>(p: Promise<T>, fallback: T): Promise<T> {
    if (this.skippedFlag) return Promise.resolve(fallback);
    return new Promise<T>((resolve) => {
      let done = false;
      const finish = (v: T): void => {
        if (done) return;
        done = true;
        resolve(v);
      };
      p.then(finish, () => finish(fallback));
      this.skipWaiters.push(() => finish(fallback));
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Top-level label -> index. Labels inside `parallel`/`ifFlag` are not indexed (the DSL nests them for a reason). */
function indexLabels(script: StoryScript): Map<string, number> {
  const labels = new Map<string, number>();
  script.forEach((step, i) => {
    if (step.type === 'label') labels.set(step.name, i);
  });
  return labels;
}
