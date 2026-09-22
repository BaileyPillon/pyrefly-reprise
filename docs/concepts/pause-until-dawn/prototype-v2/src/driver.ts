/**
 * The seam `src/app/screens/pause/PortraitStage.ts` plugs into
 * (`PortraitDriver`: mount/setGaze/blink/setExpression/dispose), plus a
 * `snapshot()` for tests and the diagnostics overlay. Owns the canvas, the
 * render loop and the input listeners; all the actual motion math lives in
 * `state.ts` so it can be tested without a GPU.
 */
import { PortraitStateMachine, type ExpressionName, type Frame } from './state.ts';
import { loadRig, yawRangeForRig, type Rig } from './rig.ts';
import { Renderer, yawToNorm } from './renderer.ts';
import { InputController } from './input.ts';

export interface PortraitDriver {
  mount(plate: HTMLImageElement, plateId: string): void;
  setGaze(x: number, y: number): void;
  blink(): void;
  setExpression(name: string): void;
  dispose(): void;
}

export interface DriverSnapshot {
  standIn: boolean;
  reducedMotion: boolean;
  expression: ExpressionName;
  frame: Frame | null;
}

const EXPRESSION_CYCLE: ExpressionName[] = ['normal', 'determined', 'hurt'];

export interface LivingPortraitDriverOptions {
  /** Where `keys/`, `patches/` etc. live, e.g. './art/'. */
  assetBaseUrl: string;
  /** The art agent's rig file, tried before the stand-in (rig.ts). */
  rigUrl: string;
  /** Seeds for reproducible motion (tests only; the real page omits this). */
  seed?: { headSway?: number; blink?: number; expression?: number };
  /**
   * Multiplies every tick's `dt` before it reaches the state machine.
   * Debug-only: used by the browser verification pass to catch blink/mouth
   * events (whose natural intervals run several seconds) inside a short
   * capture window, without changing the shipped default (1 = real time).
   */
  debugTimeScale?: number;
}

export class LivingPortraitDriver implements PortraitDriver {
  private readonly opts: LivingPortraitDriverOptions;
  private readonly state: PortraitStateMachine;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: Renderer | null = null;
  private rig: Rig | null = null;
  private input: InputController | null = null;
  private rafId: number | null = null;
  private lastTs = 0;
  private lastFrame: Frame | null = null;
  private diagnosticsVisible = false;
  private hud: HTMLElement | null = null;
  private disposed = false;

  constructor(opts: LivingPortraitDriverOptions) {
    this.opts = opts;
    this.state = new PortraitStateMachine(opts.seed);
  }

  mount(plate: HTMLImageElement, plateId: string): void {
    const container = plate.parentElement ?? document.body;
    const canvas = document.createElement('canvas');
    canvas.width = plate.naturalWidth || 832;
    canvas.height = plate.naturalHeight || 1216;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('data-living-portrait', plateId);
    plate.style.visibility = 'hidden';
    container.appendChild(canvas);
    this.canvas = canvas;

    this.input = new InputController(canvas, {
      onExpressionCycle: () => this.cycleExpression(),
      onBlink: () => this.blink(),
      onReducedMotionToggle: () => this.state.setReducedMotion(!this.state.isReducedMotion()),
      onDiagnosticsToggle: () => this.toggleDiagnostics(),
    });

    void loadRig(this.opts.rigUrl, 'keys/frontal.png', plateId)
      .then(async (rig) => {
        if (this.disposed) return;
        this.rig = rig;
        const range = yawRangeForRig(rig);
        this.state.setYawRange(range.min, range.max);
        this.renderer = new Renderer(canvas, rig, this.opts.assetBaseUrl);
        await this.renderer.load();
        this.startLoop();
      })
      .catch((err: unknown) => {
        // Never let a missing/broken texture or a rig-loading failure take
        // the whole page down silently — the state machine (springs, blink,
        // expression) still has value with no renderer attached, and a loud
        // console error beats a portrait that quietly never animates.
        // eslint-disable-next-line no-console
        console.error('[living-portrait] failed to start:', err);
      });
  }

  private cycleExpression(): void {
    const current = this.state.getExpression();
    const next = EXPRESSION_CYCLE[(EXPRESSION_CYCLE.indexOf(current) + 1) % EXPRESSION_CYCLE.length]!;
    this.setExpression(next);
  }

  private toggleDiagnostics(): void {
    this.diagnosticsVisible = !this.diagnosticsVisible;
    if (this.diagnosticsVisible && !this.hud && this.canvas?.parentElement) {
      const el = document.createElement('pre');
      el.setAttribute('data-living-portrait-hud', '');
      el.style.cssText =
        'position:absolute;left:8px;top:8px;margin:0;padding:6px 8px;font:11px/1.4 monospace;' +
        'color:#e9dcb8;background:rgba(10,8,6,0.72);border:1px solid rgba(233,220,184,0.35);' +
        'white-space:pre;pointer-events:none;z-index:5;';
      this.canvas.parentElement.appendChild(el);
      this.hud = el;
    }
    if (this.hud) this.hud.style.display = this.diagnosticsVisible ? 'block' : 'none';
  }

  private startLoop(): void {
    this.lastTs = performance.now();
    const tick = (ts: number) => {
      if (this.disposed) return;
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.tick(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private tick(dt: number): void {
    if (!this.rig) return;
    const input = this.input?.sampleGazeTarget();
    if (input && (Math.abs(input.x) > 0.001 || Math.abs(input.y) > 0.001)) this.state.setGazeTarget(input.x, input.y);
    const frame = this.state.update(dt * (this.opts.debugTimeScale ?? 1));
    this.lastFrame = frame;
    this.renderer?.render({
      yawDeg: frame.yawDeg,
      pitchNorm: yawToNorm(frame.pitchDeg),
      eyeState: frame.eyeState,
      eyeAperture: frame.eyeAperture,
      mouth: frame.mouth,
      mouthWeight: frame.mouthWeight,
      brow: frame.brow,
      browWeight: frame.browWeight,
      timeSeconds: frame.timeSeconds,
      reducedMotion: frame.reducedMotion,
    });
    if (this.diagnosticsVisible && this.hud) this.renderHud(frame);
  }

  private renderHud(frame: Frame): void {
    if (!this.hud) return;
    this.hud.textContent = [
      `yaw ${frame.yawDeg.toFixed(1)} deg (residual ${frame.springResidualDeg.toFixed(2)})`,
      `pitch ${frame.pitchDeg.toFixed(1)} deg`,
      `gaze ${frame.gaze.x.toFixed(2)}, ${frame.gaze.y.toFixed(2)}`,
      `eye ${frame.eyeState} aperture ${frame.eyeAperture.toFixed(2)}`,
      `mouth ${frame.mouth} weight ${frame.mouthWeight.toFixed(2)}`,
      `brow ${frame.brow} weight ${frame.browWeight.toFixed(2)}`,
      `expression ${this.state.getExpression()}${frame.reducedMotion ? ' (reduced motion)' : ''}`,
      `rig ${this.rig?.standIn ? 'stand-in' : 'authored'}`,
      `t ${frame.timeSeconds.toFixed(2)}s`,
      '-- events --',
      ...frame.blinkLog.slice(-6),
    ].join('\n');
  }

  setGaze(x: number, y: number): void {
    this.state.setGazeTarget(x, y);
  }

  blink(): void {
    this.state.forceBlink();
  }

  setExpression(name: string): void {
    const match = EXPRESSION_CYCLE.find((n) => n === name);
    this.state.setExpression(match ?? 'normal');
  }

  /** Not part of the `PortraitDriver` seam: lets the pause screen sync with
   *  `Settings.reduceMotion`/`prefers-reduced-motion` directly, instead of
   *  only through the `R` hotkey. */
  setReducedMotion(on: boolean): void {
    this.state.setReducedMotion(on);
  }

  /** Debug/verification aid, not part of the `PortraitDriver` seam. */
  forceHalfBlink(): void {
    this.state.forceHalfBlink();
  }

  /** Debug/verification aid, not part of the `PortraitDriver` seam. */
  forceMouthEvent(patch?: 'parted' | 'smile' | 'pressed'): void {
    this.state.forceMouthEvent(patch);
  }

  snapshot(): DriverSnapshot {
    return {
      standIn: this.rig?.standIn ?? true,
      reducedMotion: this.state.isReducedMotion(),
      expression: this.state.getExpression(),
      frame: this.lastFrame,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.input?.dispose();
    this.renderer?.dispose();
    this.hud?.remove();
    this.canvas?.remove();
  }
}
