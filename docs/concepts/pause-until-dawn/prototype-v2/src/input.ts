/**
 * Arrows/WASD/mouse/gamepad -> a gaze target in [-1, 1] per axis, plus the
 * prototype's own hotkeys (E expression, B blink, R reduced motion,
 * F diagnostics). The gamepad's right stick drives gaze; L1/R1 are read but
 * deliberately ignored, per the brief ("gamepad right stick... L1 or R1
 * unaffected") — they exist on the pad but must not move the face.
 */
export interface InputCallbacks {
  onExpressionCycle?: () => void;
  onBlink?: () => void;
  onReducedMotionToggle?: () => void;
  onDiagnosticsToggle?: () => void;
}

const DEADZONE = 0.12;

export class InputController {
  private readonly target: HTMLElement;
  private readonly keys = new Set<string>();
  private mouse: { x: number; y: number } | null = null;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;
  private readonly onMouseMove: (e: MouseEvent) => void;
  private readonly onMouseLeave: () => void;
  private disposed = false;

  constructor(target: HTMLElement, callbacks: InputCallbacks = {}) {
    this.target = target;
    this.onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
        this.keys.add(code);
      }
      if (code === 'KeyE') callbacks.onExpressionCycle?.();
      if (code === 'KeyB') callbacks.onBlink?.();
      if (code === 'KeyR') callbacks.onReducedMotionToggle?.();
      if (code === 'KeyF') callbacks.onDiagnosticsToggle?.();
    };
    this.onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
    this.onMouseMove = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      this.mouse = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };
    this.onMouseLeave = () => {
      this.mouse = null;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('mousemove', this.onMouseMove);
    target.addEventListener('mouseleave', this.onMouseLeave);
  }

  private keyboardAxis(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    return { x, y };
  }

  private gamepadAxis(): { x: number; y: number } | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      // Standard mapping: right stick is axes[2]/axes[3]. Buttons (L1/R1 =
      // buttons[4]/[5]) are intentionally never read here.
      const rx = pad.axes[2] ?? 0;
      const ry = pad.axes[3] ?? 0;
      if (Math.abs(rx) > DEADZONE || Math.abs(ry) > DEADZONE) return { x: rx, y: ry };
    }
    return null;
  }

  /**
   * The active gaze target this frame, [-1, 1] per axis. A currently-held
   * key wins outright — otherwise a single past mouse position would pin
   * the gaze forever and a held arrow key could never override it, since
   * the mouse never "releases" the way a key does. Priority when no key is
   * held: gamepad (if deflected) > last mouse position > centred (which the
   * driver treats as "no override this frame", not as a command to return
   * to neutral — see `state.ts`).
   */
  sampleGazeTarget(): { x: number; y: number } {
    const kb = this.keyboardAxis();
    if (kb.x !== 0 || kb.y !== 0) return kb;
    const pad = this.gamepadAxis();
    if (pad) return pad;
    if (this.mouse) return this.mouse;
    return { x: 0, y: 0 };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('mousemove', this.onMouseMove);
    this.target.removeEventListener('mouseleave', this.onMouseLeave);
  }
}
