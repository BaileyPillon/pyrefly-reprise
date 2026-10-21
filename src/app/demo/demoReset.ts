/**
 * THE RESET KEY (release 61, the conference demo; Bailey, 2026-10-21, decision 169c: "a reset key returns there"; both games, shared plumbing, demo mode only).
 *
 * Hold **Home** (keyboard) or **Select and Start together** (gamepad) for 1.5 seconds, from any screen, and the game returns to the title for the next visitor. A small ring fills while it is held, so a
 * brush of the key does nothing and a visitor never meets it by accident: letting go at any moment before the ring closes cancels it.
 *
 * What a reset is: the visitor's run state is cleared (the save's chapter records, flags and unlocks, the demo's seed rotation, the board's memory of the last fight; **the settings stay, and with them the
 * title-art pick**), the music is faded, the screen goes to black, and the page reloads on the same address. A reload and not a soft jump to the title, on purpose: it is the one way that stops the fight, every
 * timer, the audio graph, a half-loaded battle, an open pause menu or a story scene all at once and leaves nothing behind, and a booth tab runs all day (a hundred visitors), so a reset that also hands back every
 * texture and shader program is worth the two seconds. `?demo=1` is kept in the tab's `sessionStorage` (`demoMode.ts`), so the reload comes back in demo mode, on the title.
 *
 * Why not F5: the browser's own reload also keeps the visitor's run state, can be hit by accident, and cannot show a ring. Why Home: nothing in the game binds it (`app/Input.ts`).
 *
 * The pieces are separate so each can be proved alone (`tests/unit/demo-reset.test.ts`): {@link ResetHold} is the pure hold timer, {@link clearVisitorState} the state wipe, {@link performDemoReset} the sequence,
 * {@link installDemoReset} the wiring (keyboard, pad poll, ring).
 */

import './demo.css';
import { audio } from '../../audio/index.ts';
import type { App } from '../App.ts';
import { forgetBoardChapter } from '../screens/frontend/boardFocus.ts';
import type { SaveStore } from '../SaveData.ts';
import { demoModeOn } from '../demoMode.ts';

/** How long the reset input is held before it fires. */
export const RESET_HOLD_MS = 1500;
/** The keyboard input (`KeyboardEvent.code`). */
export const RESET_KEY = 'Home';
/** Standard-gamepad button indexes of Select (Back) and Start. */
export const PAD_SELECT = 8;
export const PAD_START = 9;
/** The ring shows only after the input has been held this long, so a tap shows nothing at all. */
export const RING_AFTER_MS = 150;
/** The biggest step a tick may add, so a stalled frame (a hidden tab, a long load) cannot turn a brush into a hold. */
const MAX_STEP_MS = 100;

/** The pure hold timer. */
export class ResetHold {
  private heldMs = 0;
  private spent = false;

  constructor(readonly holdMs = RESET_HOLD_MS) {}

  /** Advance by `dtMs` with the input `held` or not. `fired` is true on exactly one call per hold: the one that reaches the end. Letting go re-arms it. */
  step(dtMs: number, held: boolean): { progress: number; fired: boolean } {
    if (!held) {
      this.heldMs = 0;
      this.spent = false;
      return { progress: 0, fired: false };
    }
    this.heldMs += Math.min(MAX_STEP_MS, Math.max(0, dtMs));
    if (this.spent) return { progress: 1, fired: false };
    if (this.heldMs >= this.holdMs) {
      this.spent = true;
      return { progress: 1, fired: true };
    }
    return { progress: this.heldMs / this.holdMs, fired: false };
  }

  /** How long the input has been held, ms. */
  get held(): number {
    return this.heldMs;
  }
}

/** True when a standard gamepad in `pads` holds Select and Start together. */
export function padResetHeld(pads: ArrayLike<{ connected?: boolean; buttons: ArrayLike<{ pressed: boolean }> } | null> | null | undefined): boolean {
  if (!pads) return false;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad || pad.connected === false) continue;
    if (pad.buttons[PAD_SELECT]?.pressed === true && pad.buttons[PAD_START]?.pressed === true) return true;
  }
  return false;
}

// ----------------------------------------------------------------- the wipe

/** The tab-storage keys that carry one visitor's run (`demoMode.ts` and `screens/frontend/boardFocus.ts`). The key that says demo mode is on is NOT among them. */
const RUN_KEY_PREFIXES = ['pyrefly.demo.runs.', 'pyrefly.demo.won'];

/** Just the part of `Storage` the wipe uses. */
export interface KeyStore {
  readonly length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
}

/**
 * Clear what one visitor left behind and nothing else. The save keeps its settings (volume, text size, the title-art pick, the HUD switches: all of `Settings`) and loses its chapter records, flags, unlocks
 * and onboarding memory; the tab's seed rotation and board memory are forgotten, so the next visitor's first Seymour fight is seed 7 again (the cleanest, `demoMode.ts`) and the picker opens on its first card.
 */
export function clearVisitorState(save: Pick<SaveStore, 'snapshot' | 'reset' | 'setSettings'> | null, tab: KeyStore | null): void {
  if (save) {
    const settings = save.snapshot().settings;
    save.reset();
    save.setSettings(settings); // writes the kept settings onto a fresh save, through the store (applies them to the mixer and the comfort flags too)
  }
  if (tab) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < tab.length; i++) {
        const k = tab.key(i);
        if (k !== null && RUN_KEY_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
      }
      for (const k of doomed) tab.removeItem(k);
    } catch {
      /* a blocked store has nothing to clear */
    }
  }
  forgetBoardChapter();
}

// ----------------------------------------------------------------- the reset

export interface ResetDeps {
  save: Pick<SaveStore, 'snapshot' | 'reset' | 'setSettings'> | null;
  tab: KeyStore | null;
  /** Fade the music out (ms). */
  fadeAudio(ms: number): void;
  /** Fade the screen to black (resolves when it is). */
  fadeScreen(ms: number): Promise<void>;
  /** Stop the frame loop, so nothing draws or ticks over the black. */
  halt(): void;
  /** Reload the page. */
  reload(): void;
}

/** How long the fade to black takes before the page reloads. */
export const RESET_FADE_MS = 280;

/** The reset itself: clear the visitor's run, fade the sound and the picture, halt the game, reload. Resolves just before the reload. */
export async function performDemoReset(deps: ResetDeps): Promise<void> {
  clearVisitorState(deps.save, deps.tab);
  deps.fadeAudio(RESET_FADE_MS / 1000);
  await deps.fadeScreen(RESET_FADE_MS);
  deps.halt();
  deps.reload();
}

function tabStore(): KeyStore | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** The reset as the running game does it. */
export function resetRunningGame(app: App): Promise<void> {
  return performDemoReset({
    save: app.save,
    tab: tabStore(),
    fadeAudio: (s) => audio.stopMusic(s),
    fadeScreen: (ms) => app.fade('opaque', ms),
    halt: () => app.stop(),
    reload: () => window.location.reload(),
  });
}

// ------------------------------------------------------------------ the ring

const SVG_NS = 'http://www.w3.org/2000/svg';
const RING_R = 21;
const RING_LEN = 2 * Math.PI * RING_R;

/** The hold-progress ring: a small circle and a few words, fixed over everything, shown only while the input is held. */
export class ResetRing {
  readonly el: HTMLElement;
  private readonly arc: SVGCircleElement;

  constructor(parent: HTMLElement = document.body) {
    this.el = document.createElement('div');
    this.el.className = 'demo-reset';
    this.el.dataset['role'] = 'demo-reset';
    this.el.setAttribute('role', 'status');
    this.el.hidden = true;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    const track = document.createElementNS(SVG_NS, 'circle');
    track.setAttribute('class', 'demo-reset__track');
    this.arc = document.createElementNS(SVG_NS, 'circle');
    this.arc.setAttribute('class', 'demo-reset__arc');
    for (const c of [track, this.arc]) {
      c.setAttribute('cx', '24');
      c.setAttribute('cy', '24');
      c.setAttribute('r', String(RING_R));
    }
    this.arc.setAttribute('stroke-dasharray', RING_LEN.toFixed(2));
    this.arc.setAttribute('transform', 'rotate(-90 24 24)');
    svg.append(track, this.arc);
    const label = document.createElement('span');
    label.textContent = 'Hold to restart';
    this.el.append(svg, label);
    parent.appendChild(this.el);
    this.set(0);
  }

  /** Show `progress` (0 to 1); 0 hides the ring. */
  set(progress: number): void {
    const shown = progress > 0;
    if (this.el.hidden === shown) this.el.hidden = !shown;
    this.arc.setAttribute('stroke-dashoffset', (RING_LEN * (1 - Math.min(1, Math.max(0, progress)))).toFixed(2));
    this.el.dataset['progress'] = progress.toFixed(2);
  }

  dispose(): void {
    this.el.remove();
  }
}

// ------------------------------------------------------------------- wiring

export interface ResetSources {
  now(): number;
  keyHeld(): boolean;
  padHeld(): boolean;
}

/**
 * The reset controller: one `tick()` per frame reads the two inputs, advances the timer, drives the ring and calls `onFire` once. Browser-free, so a test drives it with a fake clock. The ring is shown only after
 * {@link RING_AFTER_MS}, so a brush of the key draws nothing.
 */
export class ResetController {
  private readonly hold: ResetHold;
  private last: number | null = null;
  private fired = false;

  constructor(private readonly sources: ResetSources, private readonly ring: Pick<ResetRing, 'set'>, private readonly onFire: () => void, holdMs = RESET_HOLD_MS) {
    this.hold = new ResetHold(holdMs);
  }

  /** True once it has fired (the page is on its way out). */
  get done(): boolean {
    return this.fired;
  }

  tick(): void {
    if (this.fired) return;
    const t = this.sources.now();
    const dt = this.last === null ? 0 : t - this.last;
    this.last = t;
    const r = this.hold.step(dt, this.sources.keyHeld() || this.sources.padHeld());
    this.ring.set(this.hold.held >= RING_AFTER_MS ? Math.max(0.02, r.progress) : 0);
    if (r.fired) {
      this.fired = true;
      this.onFire();
    }
  }
}

export interface InstalledReset {
  controller: ResetController;
  /** The ring, once a hold has shown it (made on the first one, so a page that never holds the key has no element for it). */
  ring(): ResetRing | null;
  dispose(): void;
}

/**
 * Wire the reset into the running game: the Home key (a capture listener on `window`, installed before the game's own, so a screen that claims the keyboard cannot hide it), the pad poll, the ring, one
 * `requestAnimationFrame` loop. It does nothing outside demo mode: the switch is read once a second, so turning demo mode on from the console arms it.
 */
export function installDemoReset(app: App): InstalledReset {
  let keyDown = false;
  let on = demoModeOn();
  let checkedAt = performance.now();
  const isOn = (): boolean => {
    const t = performance.now();
    if (t - checkedAt > 1000) [on, checkedAt] = [demoModeOn(), t];
    return on;
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== RESET_KEY || !demoModeOn()) return;
    e.preventDefault();
    keyDown = true;
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === RESET_KEY) keyDown = false;
  };
  const onBlur = (): void => {
    keyDown = false;
  };
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', onBlur);

  let ring: ResetRing | null = null;
  const ringView = { set: (p: number): void => (p > 0 ? (ring ??= new ResetRing()).set(p) : ring?.set(0)) };
  const controller = new ResetController(
    {
      now: () => performance.now(),
      keyHeld: () => keyDown && isOn(),
      padHeld: () => isOn() && padResetHeld(navigator.getGamepads?.() ?? null),
    },
    ringView,
    () => void resetRunningGame(app),
  );
  let raf = 0;
  const loop = (): void => {
    controller.tick();
    if (!controller.done) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return {
    controller,
    ring: () => ring,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      ring?.dispose();
    },
  };
}
