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
import { pickLineCardPlace, type LineCardPick } from '../../ui/common/lineCardPlacement.ts';
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

const CARD_CLASSES = ['dbox--card', 'dbox--band'];

export function createMidBeatLineCard(opts: MidBeatLineCardOptions): MidBeatLineCard {
  let speakers: SpeakerId[] = [];
  let placed = false;
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

  const place = (): void => {
    if (placed) return;
    placed = true;
    const rects = opts.stage.screenRects?.();
    if (!rects) return; // No projected boxes (a test fake): the box keeps its own layout.
    const frame = opts.root.getBoundingClientRect();
    const width = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : frame.width;
    const height = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : frame.height;
    const local = (r: ScreenRect): ScreenRect => ({ x: r.x - frame.left, y: r.y - frame.top, w: r.w, h: r.h });
    const staged = opts.stage.staged();
    const hardIds = new Set<string>();
    for (const id of staged) {
      const side = opts.stage.sideOf(id);
      if (side === 'party' || side === 'aeon') hardIds.add(id);
    }
    for (const who of speakers) for (const id of speakerCombatants(game(), who, staged)) hardIds.add(id);
    const hard: ScreenRect[] = [];
    const soft: ScreenRect[] = [];
    for (const [id, r] of rects) (hardIds.has(id) ? hard : soft).push(local(r));
    const pick = pickLineCardPlace({ width, height, hard, soft });
    lastPick = pick;
    opts.box.classList.remove(...CARD_CLASSES);
    opts.box.classList.add(pick.place === 'band' ? 'dbox--band' : 'dbox--card');
    opts.box.dataset['place'] = pick.place;
    opts.box.style.setProperty('--lc-x', `${Math.round(pick.rect.x)}px`);
    opts.box.style.setProperty('--lc-win-top', `${Math.round(pick.winTop)}px`);
    opts.box.style.setProperty('--lc-scale', String(pick.scale));
  };

  return {
    beginBeat(script) {
      speakers = beatSpeakers(script);
      placed = false;
      clear();
    },
    endBeat() {
      placed = false;
      clear();
    },
    guard(port) {
      return {
        say: (step: SayStep) => {
          const line = fieldedLine(step, game(), fieldedParty());
          if (!line) return Promise.resolve();
          place();
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
