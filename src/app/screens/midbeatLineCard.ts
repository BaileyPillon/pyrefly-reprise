/**
 * The mid-battle line card's two rules, wired to the live battle: who may
 * speak (PR-0037) and where the card goes (PR-0211 option A).
 *
 * - **Fielded speakers only** (D-212, both games): each `say` passes through
 *   `story/fieldedSpeakers.ts#fieldedLine` against the party on the field, so
 *   a benched member never speaks and the authored fallback does.
 * - **The card goes where it covers nobody** (D-232, both games): once per
 *   beat, at its first line, the card takes the first of four slots clear of
 *   the party's and the speaker's on-screen boxes (`PaintedStage.screenRects`),
 *   or the bottom band when none is (`ui/common/lineCardPlacement.ts`). It
 *   does not move again until the next beat, so it never jumps mid-line.
 *
 * Kept out of `BattleScreenCutscenes.ts` (the runner adapter) so that file
 * only calls three hooks.
 */

import type { DialoguePort } from '../../story/runner/CutsceneRunner.ts';
import type { SayStep, SpeakerId, Step, StoryScript } from '../../story/dsl.ts';
import { fieldedLine, partyCombatantFor, type StoryGame } from '../../story/fieldedSpeakers.ts';
import type { ScreenRect } from '../../engine/ScreenRects.ts';
import type { BattleStage } from '../../engine/BattlePresenterPorts.ts';
import { coveredArea, pickLineCardPlace, type LineCardInput, type LineCardPick } from '../../ui/common/lineCardPlacement.ts';
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
  /** Per frame, on the scene clock: the settle window's re-picks (see {@link SETTLE_MS}). */
  update(dt: number): void;
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
 * How long a beat's card stays hidden while its place is re-picked every frame.
 *
 * A beat starts on the frame the triggering action resolves, often while the
 * camera is still easing back from that action's push or punch, so the boxes
 * measured at the first line are not the frame the player reads it on. Measured
 * in Chapter III at 1600x900: a pick taken then put the card over Braska's
 * Final Aeon once the camera settled (about 20,000 px²), and at 2000x1012 it
 * fell back to the band over the party when a slot was clear half a second
 * later. The card is held for this long (the text types on behind it) and then
 * shows, where it stays for the line.
 */
export const SETTLE_MS = 500;

export function createMidBeatLineCard(opts: MidBeatLineCardOptions): MidBeatLineCard {
  let speakers: SpeakerId[] = [];
  let placed = false;
  let settleLeftMs = 0;
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

  /** The frame and the boxes the pick is made against, or `null` with no projected boxes (a test fake). */
  const measure = (): LineCardInput | null => {
    const rects = opts.stage.screenRects?.();
    if (!rects) return null;
    const frame = opts.root.getBoundingClientRect();
    const width = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : frame.width;
    const height = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : frame.height;
    const staged = opts.stage.staged();
    const hardIds = new Set<string>();
    for (const id of staged) {
      const side = opts.stage.sideOf(id);
      if (side === 'party' || side === 'aeon') hardIds.add(id);
    }
    for (const who of speakers) for (const id of speakerCombatants(game(), who, staged)) hardIds.add(id);
    const hard: ScreenRect[] = [];
    const soft: ScreenRect[] = [];
    for (const [id, r] of rects) (hardIds.has(id) ? hard : soft).push({ x: r.x - frame.left, y: r.y - frame.top, w: r.w, h: r.h });
    return { width, height, hard, soft };
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

  /** First line of a beat: pick, and hold the card hidden while the camera settles. */
  const place = (): void => {
    if (placed) return;
    placed = true;
    if (!pickNow()) return;
    settleLeftMs = SETTLE_MS;
    opts.box.classList.add('dbox--settling');
  };

  /**
   * A later line: the card stays put unless the party or the speaker has come
   * under it since (a camera move inside the beat). Only ever between lines,
   * never during one (the concept's own rule: "re-check only between lines").
   */
  const recheck = (): void => {
    if (!lastPick || settleLeftMs > 0) return;
    const m = measure();
    if (m && coveredArea(lastPick.rect, m.hard) > 0) apply(pickLineCardPlace(m));
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
    update(dt) {
      if (settleLeftMs <= 0) return;
      settleLeftMs -= Math.max(0, dt * 1000);
      pickNow();
      if (settleLeftMs <= 0) opts.box.classList.remove('dbox--settling');
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
