/**
 * Status display O3 (Bailey's pick, 2026-09-29): **the one-line battle message** when a status
 * lands or wears off — "Kimahri became a Zombie.", "Yuna fell asleep." — with the status's icon,
 * about two seconds each (`docs/concepts/status-display-0929/README.md`, O3 "Message line"; the
 * mockup holds it on screen, in play it shows for about two seconds).
 *
 * Both games, each with its own icon shape (FFX round, FFX-2 square). The words are
 * `statusWords.ts`; none of this is in either original (the README says so), and no rule is
 * stated in it, only what happened.
 *
 * Where it sits: centred on the stage, at the mockup's height (FFX under the TARGET plate, FFX-2
 * under the target and actor plates), pushed down below any top-centre panel that is up
 * (telegraph, help bar, plates), never over it. On the phone, just above the party cards.
 */

import type { BattleEvent, BattleState, StatusId } from '../../battle/common/types.ts';
import { statusIconHtml } from './statusIcons.ts';
import type { StatusGame } from './statusLooks.ts';
import { escapeHtml, landsLine, leavesLine } from './statusWords.ts';

/** How long one line stays, ms (the README's "about two seconds"). Shorter while another waits. */
export const LINE_MS = 2000;
/**
 * U3 (PR-0286, PR-0285; both games): a line a newer, different event is waiting behind gives way after this
 * long, so the newer line shows within half a second of its own event instead of 1.6 to 2.5 s later
 * (the queue was serial, two seconds a line). Long enough to read "Yuna became a Zombie.".
 */
export const MIN_SHOW_MS = 450;
/**
 * Lines for the same status and direction arriving this close to the last one are one line. The
 * presenter plays a multi-target cast's events one target after another (about 0.4 s apart), so the old
 * 350 ms window split one Hastega into three lines.
 */
export const MERGE_MS = 900;

interface Line {
  status: StatusId;
  lands: boolean;
  names: string[];
  reason: string;
  at: number;
  /** The clock of the newest event folded into this line (the merge window runs from it). */
  lastAt: number;
}

/** "Tidus", "Tidus and Yuna", "Tidus, Yuna and Kimahri". Pure. */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** One line's text: the words for one name, pluralised for several. Pure. */
export function lineText(line: Pick<Line, 'status' | 'lands' | 'names' | 'reason'>): string | null {
  const one = line.lands ? landsLine('X', line.status) : leavesLine('X', line.status, line.reason);
  if (!one) return null;
  let tail = one.slice(2);
  if (line.names.length > 1) {
    tail = tail.replace(/^was /, 'were ').replace(/^is /, 'are ').replace(/^became a Zombie\./, 'became Zombies.');
  }
  return `${joinNames(line.names)} ${tail}`;
}

/** The message a status event makes, or null (a KO, an overwrite, a consumed charge, a hidden unit). */
export function lineFor(event: BattleEvent, state: BattleState | null): { status: StatusId; lands: boolean; name: string; reason: string } | null {
  if (event.type !== 'status-add' && event.type !== 'status-remove') return null;
  const c = state?.combatants[event.targetId];
  if (!c || c.removed || c.flags?.hidden) return null;
  const lands = event.type === 'status-add';
  const reason = event.type === 'status-remove' ? event.reason : '';
  const text = lands ? landsLine(c.name, event.status) : leavesLine(c.name, event.status, reason);
  return text ? { status: event.status, lands, name: c.name, reason } : null;
}

export class StatusMessageLine {
  readonly el: HTMLElement;
  /** The one line waiting behind the current one: a newer different event replaces it (never a backlog). */
  private pending: Line | null = null;
  private current: Line | null = null;
  private leftMs = 0;
  private shownMs = 0;
  private clockMs = 0;

  constructor(private readonly game: StatusGame) {
    this.el = document.createElement('div');
    this.el.className = `stmsg stmsg--${game}`;
    this.el.dataset['role'] = 'status-message';
    this.el.setAttribute('aria-live', 'polite');
    this.el.hidden = true;
  }

  onEvent(event: BattleEvent, state: BattleState | null): void {
    const got = lineFor(event, state);
    if (!got) return;
    // A status that lands and leaves inside one beat says nothing about the other half.
    const same = (l: Line | null): l is Line => !!l && l.status === got.status && l.lands === got.lands && this.clockMs - l.lastAt < MERGE_MS;
    const into = same(this.pending) ? this.pending : same(this.current) ? this.current : null;
    if (into) {
      if (!into.names.includes(got.name)) into.names.push(got.name);
      into.lastAt = this.clockMs;
      if (into === this.current) this.render();
      return;
    }
    // A newer line replaces any line still waiting (it is stale), and takes the screen as soon as the current one has been readable.
    this.pending = { status: got.status, lands: got.lands, names: [got.name], reason: got.reason, at: this.clockMs, lastAt: this.clockMs };
    if (!this.current) this.next();
    else this.leftMs = Math.min(this.leftMs, Math.max(0, MIN_SHOW_MS - this.shownMs));
  }

  /** The line up now (tests, the debug snapshot). */
  get text(): string {
    return this.current ? (lineText(this.current) ?? '') : '';
  }

  update(dt: number): void {
    this.clockMs += dt * 1000;
    if (!this.current) return;
    this.shownMs += dt * 1000;
    this.leftMs -= dt * 1000;
    if (this.leftMs <= 0) this.next();
  }

  /** Show a line now and hold it (captures of the mockup moment; never called in play). */
  hold(status: StatusId, names: string[], lands = true): void {
    this.pending = null;
    this.current = { status, lands, names, reason: 'cured', at: this.clockMs, lastAt: this.clockMs };
    this.shownMs = 0;
    this.leftMs = Number.POSITIVE_INFINITY;
    this.render();
  }

  clear(): void {
    this.pending = null;
    this.current = null;
    this.el.hidden = true;
  }

  private next(): void {
    this.current = this.pending;
    this.pending = null;
    this.shownMs = 0;
    this.leftMs = LINE_MS;
    this.render();
  }

  private render(): void {
    const line = this.current;
    const text = line ? lineText(line) : null;
    if (!line || !text) {
      this.el.hidden = true;
      return;
    }
    this.el.innerHTML = `${statusIconHtml(this.game, line.status)}<span class="stmsg__text">${escapeHtml(text)}</span>`;
    this.el.hidden = false;
  }
}

/** A rect in viewport px. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where the line's top edge goes (viewport px): `want`, pushed below every visible box that shares
 * its band (left..right), a few passes deep. Pure.
 */
export function lineTop(want: number, left: number, right: number, height: number, avoid: readonly Box[], gap = 4): number {
  let top = want;
  for (let pass = 0; pass < 4; pass++) {
    const hit = avoid.find((b) => b.right > b.left && b.bottom > b.top && left < b.right && right > b.left && top < b.bottom && top + height > b.top);
    if (!hit) break;
    top = hit.bottom + gap;
  }
  return top;
}
