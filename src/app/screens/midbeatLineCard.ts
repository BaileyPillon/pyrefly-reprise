/**
 * The mid-battle line card's two rules, wired to the live battle: who may
 * speak (PR-0037) and where the card goes (PR-0211 option A).
 *
 * - **Fielded speakers only** (D-212, both games): each `say` passes through
 *   `story/fieldedSpeakers.ts#fieldedLine` against the party on the field, so
 *   a benched member never speaks and the authored fallback does.
 * - **The card goes where it covers nobody** (D-232, both games): at a beat's
 *   first line, the card takes the first of four slots clear of the party's
 *   and the speaker's on-screen boxes (`PaintedStage.screenRects`), or the
 *   bottom band when none is (`ui/common/lineCardPlacement.ts`). It never
 *   moves while a line is up: it is put away for the beat's own camera moves
 *   and placed again at the next line.
 *
 * Kept out of `BattleScreenCutscenes.ts` (the runner adapter) so that file
 * only calls three hooks.
 */

import type { DialoguePort } from '../../story/runner/CutsceneRunner.ts';
import type { SayStep, SpeakerId, Step, StoryScript } from '../../story/dsl.ts';
import { fieldedLine, partyCombatantFor, type StoryGame } from '../../story/fieldedSpeakers.ts';
export type { StoryGame } from '../../story/fieldedSpeakers.ts';
import type { ScreenRect } from '../../engine/ScreenRects.ts';
import type { BattleStage } from '../../engine/BattlePresenterPorts.ts';
import { coveredArea, grow, guardFor, pickLineCardPlace, torsoOf, type LineCardInput, type LineCardPick } from '../../ui/common/lineCardPlacement.ts';
import '../../ui/common/line-card.css';

/** The stage, plus the projected boxes a `PaintedStage` has (optional, so a test fake need not). */
export type LineCardStage = Pick<BattleStage, 'staged' | 'sideOf'> & {
  screenRects?(): ReadonlyMap<string, ScreenRect>;
};

export interface MidBeatLineCardOptions {
  /** The battle root: the dialogue box's frame. */
  root: HTMLElement;
  /** The dialogue box's own element (`.dbox`). */
  box: HTMLElement;
  stage: LineCardStage;
  /** Which game's party table applies. Read from the HUD when not given. */
  game?: StoryGame;
}

export interface MidBeatLineCard {
  /** A beat starts: forget the last place, note who this beat may put on the card. */
  beginBeat(script: StoryScript): void;
  /** The beat is over: the box goes back to its own layout. */
  endBeat(): void;
  /** The dialogue port, with fielded speakers and the card placed before its first line. */
  guard(port: DialoguePort): DialoguePort;
  /**
   * A beat's camera move starts: the line on the card has played out, so the
   * card goes away rather than let the move carry an actor under it, and the
   * next line is placed afresh.
   */
  cameraMoves(): void;
  /**
   * Per frame, on the scene clock: the settle window's re-picks (see
   * {@link SETTLE_MS}). `true` while the line is held back: the caller then
   * holds the box's own clock too, so the line keeps its whole time on screen.
   */
  update(dt: number): boolean;
  /** The line is held back while the camera settles (input waits too). */
  readonly holding: boolean;
  /** The last place picked, for the debug API and the tests. */
  readonly lastPick: LineCardPick | null;
}

/** Every speaker a beat can put on the card, stand-ins included. */
export function beatSpeakers(script: StoryScript): SpeakerId[] {
  const out = new Set<SpeakerId>();
  const walk = (steps: readonly Step[]): void => {
    for (const s of steps) {
      if (s.type === 'say') {
        out.add(s.who);
        for (const alt of s.fallback ?? []) out.add(alt.who);
      } else if (s.type === 'parallel') walk(s.steps);
      else if (s.type === 'ifFlag') walk([...s.then, ...(s.else ?? [])]);
    }
  };
  walk(script);
  return [...out];
}

/**
 * The staged combatants a speaker stands for: a party member through the
 * game's table, anyone staged under the speaker's own id or under its base
 * name (`seymour-macalania` is staged as a `seymour-*` id), and Jecht, who
 * speaks from inside Braska's Final Aeon (Chapter III).
 */
export function speakerCombatants(game: StoryGame, who: SpeakerId, staged: readonly string[]): string[] {
  const party = partyCombatantFor(game, who);
  if (party !== undefined) return staged.includes(party) ? [party] : [];
  if (who === 'jecht') return staged.filter((id) => id === 'braskas-final-aeon');
  const base = who.split('-')[0] ?? who;
  return staged.filter((id) => id === who || id.startsWith(`${who}-`) || id === base || id.startsWith(`${base}-`));
}

const CARD_CLASSES = ['dbox--card', 'dbox--band', 'dbox--settling'];

/**
 * The longest a line is held back while its place is re-picked every frame.
 *
 * A beat starts on the frame the triggering action resolves, often while the
 * camera is still easing back from that action's push or punch, so the boxes
 * measured at the first line are not the frame the player reads it on. Measured
 * in Chapter III at 1600x900: a pick taken then put the card over Braska's
 * Final Aeon once the camera settled (about 20,000 px²). The line waits,
 * hidden and with its typing and auto timer stopped (the 2026-09-27 check found
 * a timer that ran on behind a hidden card left "Hn." up for 0.4 s), until the
 * boxes have held still for {@link STILL_MS}, or this long at most.
 */
export const SETTLE_MS = 600;

/** How long the boxes must hold still before the card shows. */
export const STILL_MS = 120;

/** Per-frame movement (px) under which a box counts as still: the idle sway is well below. */
export const STILL_PX = 1.5;

/** The largest move of any box between two frames' measures (a box that came or went counts as moved). */
function largestShift(a: ReadonlyMap<string, ScreenRect>, b: ReadonlyMap<string, ScreenRect>): number {
  if (a.size !== b.size) return Infinity;
  let most = 0;
  for (const [id, r] of b) {
    const p = a.get(id);
    if (!p) return Infinity;
    most = Math.max(most, Math.abs(p.x - r.x), Math.abs(p.y - r.y), Math.abs(p.w - r.w), Math.abs(p.h - r.h));
  }
  return most;
}

export function createMidBeatLineCard(opts: MidBeatLineCardOptions): MidBeatLineCard {
  let speakers: SpeakerId[] = [];
  let placed = false;
  let settleLeftMs = 0;
  let stillMs = 0;
  let lastBoxes: ReadonlyMap<string, ScreenRect> | null = null;
  let lastPick: LineCardPick | null = null;

  const game = (): StoryGame => opts.game ?? (opts.root.querySelector('.ffx2hud') ? 'ffx2' : 'ffx');

  const fieldedParty = (): Set<string> =>
    new Set(opts.stage.staged().filter((id) => {
      const side = opts.stage.sideOf(id);
      return side === 'party';
    }));

  const clear = (): void => {
    opts.box.classList.remove(...CARD_CLASSES);
    for (const v of ['--lc-x', '--lc-win-top', '--lc-scale']) opts.box.style.removeProperty(v);
    delete opts.box.dataset['place'];
  };

  /**
   * The frame and the boxes the pick is made against, or `null` with no
   * projected boxes (a test fake): the party's faces and torsos and the beat's
   * other speakers are hard, the party's whole boxes preferred, every other
   * fiend soft.
   */
  const measure = (): LineCardInput | null => {
    const rects = opts.stage.screenRects?.();
    if (!rects) return null;
    lastBoxes = new Map(rects);
    const frame = opts.root.getBoundingClientRect();
    const width = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : frame.width;
    const height = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : frame.height;
    const staged = opts.stage.staged();
    const speaking = new Set<string>();
    for (const who of speakers) for (const id of speakerCombatants(game(), who, staged)) speaking.add(id);
    const hard: ScreenRect[] = [];
    const prefer: ScreenRect[] = [];
    const soft: ScreenRect[] = [];
    for (const [id, q] of rects) {
      const r = { x: q.x - frame.left, y: q.y - frame.top, w: q.w, h: q.h };
      const side = opts.stage.sideOf(id);
      if (side === 'party' || side === 'aeon') {
        hard.push(torsoOf(r));
        prefer.push(r);
      } else (speaking.has(id) ? hard : soft).push(r);
    }
    return { width, height, hard, prefer, soft };
  };

  const apply = (pick: LineCardPick): void => {
    lastPick = pick;
    const settling = opts.box.classList.contains('dbox--settling');
    opts.box.classList.remove(...CARD_CLASSES);
    opts.box.classList.add(pick.place === 'band' ? 'dbox--band' : 'dbox--card');
    if (settling) opts.box.classList.add('dbox--settling');
    opts.box.dataset['place'] = pick.place;
    opts.box.style.setProperty('--lc-x', `${Math.round(pick.rect.x)}px`);
    opts.box.style.setProperty('--lc-win-top', `${Math.round(pick.winTop)}px`);
    opts.box.style.setProperty('--lc-scale', String(pick.scale));
  };

  /** Measure, pick and apply. `false` when there is nothing to measure: the box keeps its own layout. */
  const pickNow = (): boolean => {
    const m = measure();
    if (!m) return false;
    apply(pickLineCardPlace(m));
    return true;
  };

  /** First line of a beat, or the first after a camera move: pick, and hold the line while the camera settles. */
  const place = (): void => {
    if (placed) return;
    placed = true;
    lastBoxes = null;
    if (!pickNow()) return;
    settleLeftMs = SETTLE_MS;
    stillMs = 0;
    opts.box.classList.add('dbox--settling');
  };

  /** Hidden and held while settling. */
  const endSettle = (): void => {
    settleLeftMs = 0;
    opts.box.classList.remove('dbox--settling');
  };

  /**
   * A later line: the card stays put unless the party or the speaker has come
   * under it since (a camera move inside the beat). Only ever between lines,
   * never during one (the concept's own rule: "re-check only between lines").
   */
  const recheck = (): void => {
    if (!lastPick || settleLeftMs > 0) return;
    const m = measure();
    if (m && coveredArea(lastPick.rect, m.hard.map((r) => grow(r, guardFor(m.width)))) > 0) apply(pickLineCardPlace(m));
  };

  return {
    beginBeat(script) {
      speakers = beatSpeakers(script);
      placed = false;
      settleLeftMs = 0;
      lastPick = null;
      clear();
    },
    endBeat() {
      placed = false;
      settleLeftMs = 0;
      clear();
    },
    cameraMoves() {
      if (!lastPick) return;
      placed = false;
      settleLeftMs = 0;
      opts.box.classList.add('dbox--settling');
    },
    update(dt) {
      if (settleLeftMs <= 0) return false;
      const ms = Math.max(0, dt * 1000);
      settleLeftMs -= ms;
      const before = lastBoxes;
      pickNow();
      stillMs = before && lastBoxes && largestShift(before, lastBoxes) <= STILL_PX ? stillMs + ms : 0;
      if (settleLeftMs <= 0 || stillMs >= STILL_MS) endSettle();
      return settleLeftMs > 0;
    },
    get holding() {
      return settleLeftMs > 0;
    },
    guard(port) {
      return {
        say: (step: SayStep) => {
          const line = fieldedLine(step, game(), fieldedParty());
          if (!line) return Promise.resolve();
          if (placed) recheck();
          else place();
          return port.say(line);
        },
        narrate: (step) => {
          place();
          return port.narrate(step);
        },
        choice: (step) => port.choice(step),
      };
    },
    get lastPick() {
      return lastPick;
    },
  };
}
