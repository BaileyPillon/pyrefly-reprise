/**
 * THE F1 HUD STEPS BACK IN ACTION (conference demo, lane "hud-f1"; Bailey 2026-10-23, decision 192, "Steps back in action"; both games).
 *
 * While an action plays the HUD gets out of its way: the command block (hero, cue, verbs) slides out along its own edge (FFX: left, FFX-2: right) and the prompt bar slides down, the party
 * cards go slim (face, name, HP, MP: the Overdrive bar and the /max numbers are hidden) and the boss ribbon and the turn strip stay. It comes back about 220 ms after the action's end and not
 * before the damage number has gone. REDUCE MOTION: the same states, faded instead of slid (`hudf1.css`).
 *
 * How it is driven: `HudPort.setActing` (the presenter's signal) and the event stream (`observe`), the same signals today's fades read (`ffx/actingFade.ts`, `ffx2/actionFade.ts`). One class on the
 * HUD root, `f1-acting`, carries every moved or slimmed piece (CSS transitions do the motion); this file only decides WHEN the class goes on and off.
 *
 * Why a ghost: FFX closes its command stack the moment a command is confirmed (`stackEl.hidden`, display none), so there is nothing left to slide at the action's start. The layer keeps the last
 * look of the block (a snapshot taken while the menu was open) and, at the close, puts a COPY of it where it stood; the copy slides out when the action starts (or fades if none does within
 * {@link GHOST_WAIT_MS}). The real block comes back with the class, by the same transition, when the next menu opens.
 *
 * FFX-2 (Active ATB, D-357 and D-441): nothing steps back while a command menu is open, and an open menu ends a step-back at once; the block is never slid away while the player is choosing.
 *
 * Game case: BOTH (FFX: left, three-slot strip stays; FFX-2: right, no strip). Pure presentation; no battle state is read or written.
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import type { ActingSignal } from '../../engine/HudPort.ts';
import { HUD_F1_TUNE } from './HudF1Switch.ts';
import type { HudF1Host } from './HudF1.ts';

/** The class on the HUD root while the HUD is stepped back. */
export const F1_ACTING = 'f1-acting';
/** How long a ghost waits for an action to start before it fades by itself, ms. */
export const GHOST_WAIT_MS = 700;
/** The snapshot of the open block is refreshed this often, ms. */
const SNAP_EVERY_MS = 200;

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class StepBack {
  private host: HudF1Host | null = null;
  /** The actors whose action is open now (an FFX-2 cast can overlap another girl's action; the signal and the event stream both name the same one). */
  private readonly open = new Set<string>();
  private openSince = 0;
  private out = false;
  /** When the step-back may end, ms on the page clock; 0: no return is pending. */
  private returnAt = 0;
  private returnDeadline = 0;
  private ghost: HTMLElement | null = null;
  private ghostSince = 0;
  private snap: HTMLElement | null = null;
  private snapAt = 0;
  private menuUp = false;

  constructor(private readonly layer: HTMLElement) {}

  attach(host: HudF1Host): void {
    this.host = host;
  }

  /** Everything back, no ghost, nothing pending (the HUD unmounted, the switch went off). */
  clear(): void {
    this.open.clear();
    this.returnAt = 0;
    this.setOut(false);
    this.dropGhost();
    this.snap = null;
  }

  /** `HudPort.setActing`. */
  signal(s: ActingSignal): void {
    if (s.phase === 'action-start') this.begin(s.actorId);
    else this.end(s.actorId);
  }

  /** `HudPort.onEvent`: the stream the HUD hears first (an FFX-2 action can start inside another's). */
  observe(event: BattleEvent): void {
    if (event.type === 'action-start') this.begin(event.actorId);
    else if (event.type === 'action-end') this.end(event.actorId);
    else if (event.type === 'victory' || event.type === 'defeat') {
      // The victory frame keeps the party plates and the turn-order column up (the camera lane places the victory around them): nothing stays out, nothing is slimmed.
      this.open.clear();
      this.returnAt = 0;
      this.setOut(false);
      this.dropGhost();
    }
  }

  /** The command menu opened or closed (the HUD saw the stack appear or disappear). */
  menuEdge(open: boolean): void {
    this.menuUp = open;
    if (open) {
      this.dropGhost();
      // FFX-2: an open menu ends a step-back at once (the player is choosing). FFX: the block returns by the same transition, once the return is due.
      if (this.host?.game === 'ffx2' && this.out) this.release();
      return;
    }
    if (this.out || !this.host) return;
    this.makeGhost();
  }

  /** Once per frame: the snapshot, the pending return, the ghost's patience. */
  update(_dt: number, menuOpen: boolean): void {
    const t = now();
    this.menuUp = menuOpen;
    if (menuOpen && !this.out && t - this.snapAt > SNAP_EVERY_MS) this.takeSnapshot(t);
    // An action whose end never came (an interrupted burst) is let go after 10 s, as `ffx2/actionFade.ts` does; a step-back with nothing open and no return pending gets one.
    if (this.open.size > 0 && t - this.openSince > 10_000) this.open.clear();
    if (this.out && this.open.size === 0 && !this.returnAt) this.armReturn(t);
    if (this.returnAt && t >= this.returnAt && this.open.size === 0) {
      const gone = !document.querySelector('.dnum');
      if (gone || t >= this.returnDeadline) this.release();
    }
    if (this.ghost && !this.out && t - this.ghostSince > GHOST_WAIT_MS) this.ghost.classList.add('f1-ghost--fade');
    if (this.ghost && t - this.ghostSince > GHOST_WAIT_MS + 400) this.dropGhost();
  }

  private begin(actor: string): void {
    const h = this.host;
    if (!h) return;
    if (this.open.size === 0) this.openSince = now();
    this.open.add(actor);
    // FFX-2: never while the player is choosing (D-357, D-441).
    if (h.game === 'ffx2' && this.menuUp) return;
    this.returnAt = 0;
    // FFX signals the action's start a frame or two before the stack closes (the menu is still up): the ghost is made now, from the live block, so it has a block to slide.
    if (!this.ghost && this.menuUp && !this.out) this.makeGhost();
    this.setOut(true);
    if (this.ghost) {
      void this.ghost.offsetWidth;
      this.ghost.classList.add('f1-ghost--out');
    }
  }

  private end(actor: string): void {
    this.open.delete(actor);
    if (this.open.size > 0) return;
    this.armReturn(now());
  }

  private armReturn(t: number): void {
    this.returnAt = t + HUD_F1_TUNE.backAfterEndMs;
    this.returnDeadline = t + HUD_F1_TUNE.backMaxWaitMs;
  }

  private release(): void {
    this.returnAt = 0;
    this.setOut(false);
  }

  private setOut(on: boolean): void {
    this.out = on;
    this.host?.root.classList.toggle(F1_ACTING, on);
  }

  /** A copy of the open block (hero, cue and rows), kept for the close. */
  private takeSnapshot(t: number): void {
    this.snapAt = t;
    const h = this.host;
    const stack = h?.cmdStack();
    if (!h || !stack) return;
    this.snap = this.copyOf(h, stack);
  }

  private copyOf(h: HudF1Host, stack: HTMLElement): HTMLElement {
    const box = document.createElement('div');
    box.className = 'f1-ghost';
    const area = document.createElement('div');
    area.className = h.game === 'ffx' ? 'ffx-cmd-area f1-ghost__area' : 'ffx2hud__command f1-ghost__area';
    const rows = stack.cloneNode(true) as HTMLElement;
    rows.hidden = false;
    rows.removeAttribute('hidden');
    area.appendChild(rows);
    box.appendChild(area);
    for (const sel of ['.f1-hero', '.f1-cue']) {
      const el = this.layer.querySelector<HTMLElement>(sel);
      if (el) box.appendChild(el.cloneNode(true));
    }
    return box;
  }

  private makeGhost(): void {
    const h = this.host;
    if (!h) return;
    const live = h.cmdStack();
    const box = live && live.querySelector('.ig-cmd') ? this.copyOf(h, live) : this.snap;
    if (!box) return;
    this.dropGhost();
    this.ghost = box.cloneNode(true) as HTMLElement;
    this.ghostSince = now();
    this.layer.appendChild(this.ghost);
  }

  private dropGhost(): void {
    this.ghost?.remove();
    this.ghost = null;
  }
}
