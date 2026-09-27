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
 * A line of battle **dialogue** (a `story` message: Guard Scorpion's three
 * warnings) belongs to the action that says it [research/ff7-guard-scorpion.md
 * §5.1: shown within the Raise Tail turn], so an action name never cuts it
 * short, and {@link dialogueShown} lets playback wait until every queued line
 * has had its full time before the next action starts (FF7 only).
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
  private readonly queue: Array<{ line: string; story: boolean }> = [];
  private current: string | null = null;
  private currentStory = false;
  private waiters: Array<() => void> = [];
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
   * Dialogue (`story` lines) is never cut or split: the name comes after its last line.
   */
  say(line: string, now = false, story = false): void {
    const t = line.trim();
    if (!t) return;
    if (this.current === null || (now && !this.currentStory)) this.start(t, story);
    else if (now) this.queue.splice(this.lastStory() + 1, 0, { line: t, story }); // dialogue keeps its time; the name follows the block
    else this.queue.push({ line: t, story });
  }

  /** True while a line of dialogue is on screen or queued. */
  get dialogueBusy(): boolean {
    return this.currentStory || this.queue.some((q) => q.story);
  }

  /** Resolves once every queued line of dialogue has been shown for its full time (at once when none is). */
  dialogueShown(): Promise<void> {
    if (!this.dialogueBusy) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
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
    this.currentStory = false;
    this.help = null;
    this.dirty = true;
    this.render();
    this.release();
  }

  update(dt: number): void {
    if (this.current === null) return;
    this.left -= dt;
    if (this.left > 0) return;
    const next = this.queue.shift();
    if (next !== undefined) this.start(next.line, next.story);
    else {
      this.current = null;
      this.currentStory = false;
      this.dirty = true;
      this.render();
    }
    this.release();
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

  /** Index of the last queued line of dialogue, or -1. */
  private lastStory(): number {
    for (let i = this.queue.length - 1; i >= 0; i--) if (this.queue[i]!.story) return i;
    return -1;
  }

  private release(): void {
    if (this.dialogueBusy || this.waiters.length === 0) return;
    const waiting = this.waiters;
    this.waiters = [];
    for (const resolve of waiting) resolve();
  }

  private start(line: string, story = false): void {
    this.current = line;
    this.currentStory = story;
    this.left = messageSeconds(line);
    this.dirty = true;
    this.render();
  }
}
