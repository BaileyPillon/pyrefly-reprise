/**
 * FF7's top message window (FF7 only; `docs/plans/ff7-hud-faithful-a-spec.md`
 * §5.9): translucent, 89 % of the width, one centred white line, no speaker
 * name. Nothing else lives up there (no chip, banner or advice).
 *
 * It carries three things, in this order of precedence:
 * 1. **the help window** while SELECT (H) is on: the highlighted command's
 *    description, or the target's name [spec §3.5, S1; where it draws is our
 *    estimate: here];
 * 2. **battle messages**, one at a time, in order: an ability's name, "Locked
 *    On Target", the hint lines. Each holds for 1.2 s plus 40 ms a character
 *    [our estimate; FF7's Battle Message speed is a Config value];
 * 3. otherwise the window is closed (the A+ frames 2 and 3).
 *
 * Time runs only through {@link update}, so the window freezes with the game
 * loop when a capture stops it.
 */

import { text, windowHtml } from './ff7Draw.ts';
import type { Ff7Geometry } from './ff7Geometry.ts';
import { FF7_WINDOW_COLOUR, TEXT } from './ff7Tokens.ts';

/** Seconds a message holds [our estimate]. */
export function messageSeconds(line: string): number {
  return 1.2 + 0.04 * line.length;
}

export class Ff7HelpLine {
  private readonly queue: string[] = [];
  private current: string | null = null;
  private left = 0;
  private help: string | null = null;
  private dirty = true;

  constructor(private readonly layer: HTMLElement, private readonly geometry: () => Ff7Geometry) {}

  /** The line on screen now, or null when the window is closed. */
  get shown(): string | null {
    return this.help ?? this.current;
  }

  /**
   * Queue a battle message. With `now` (an action's name) it replaces the line on
   * screen at once (that line is dropped) and the queue resumes after it: the name belongs to the moment
   * the action happens, not to the end of a long queue of script lines [our estimate].
   */
  say(line: string, now = false): void {
    const t = line.trim();
    if (!t) return;
    if (this.current === null || now) this.start(t);
    else this.queue.push(t);
  }

  /** SELECT's help text, or null to close it. */
  setHelp(line: string | null): void {
    if (line === this.help) return;
    this.help = line;
    this.dirty = true;
    this.render();
  }

  /** Drop every queued message (the battle ended, the HUD unmounts). */
  clear(): void {
    this.queue.length = 0;
    this.current = null;
    this.help = null;
    this.dirty = true;
    this.render();
  }

  update(dt: number): void {
    if (this.current === null) return;
    this.left -= dt;
    if (this.left > 0) return;
    const next = this.queue.shift();
    if (next !== undefined) this.start(next);
    else {
      this.current = null;
      this.dirty = true;
      this.render();
    }
  }

  /** True while a message is on screen or queued. */
  get busy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  render(force = false): void {
    if (!this.dirty && !force) return;
    this.dirty = false;
    const line = this.shown;
    if (line === null) {
      this.layer.innerHTML = '';
      return;
    }
    const g = this.geometry();
    const r = g.msg;
    const phone = g.mode === 'phone';
    const style = phone ? `top:calc(env(safe-area-inset-top, 0px) + ${r.y}px)` : '';
    const draw = (cap: number): void => {
      this.layer.innerHTML = windowHtml(r, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, translucent: true, name: 'message', style }, (o) =>
        text(o, r.x + r.w / 2, r.y + r.h / 2 + cap / 2, cap, line, { shadow: g.shadow, color: TEXT.command, align: 'c', cls: 'ff7-msg' }));
    };
    draw(g.cap);
    // One line, as FF7 draws it: a line wider than the window (a phone) is set smaller to fit.
    const avail = r.w - 2 * g.frame - 4 * g.s;
    const width = this.inkWidth();
    if (width > avail) draw(g.cap * Math.max(0.55, avail / width));
  }

  /** The rendered line's ink width, px (0 where layout is not measured, e.g. jsdom). */
  private inkWidth(): number {
    const el = this.layer.querySelector('.ff7-msg');
    if (!el || typeof document.createRange !== 'function') return 0;
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect?.().width ?? 0;
  }

  private start(line: string): void {
    this.current = line;
    this.left = messageSeconds(line);
    this.dirty = true;
    this.render();
  }
}
