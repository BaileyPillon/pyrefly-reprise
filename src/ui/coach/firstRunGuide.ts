/**
 * The guided first run: Auron's three-step pointer after the briefing
 * (fb2-0929 O2, Bailey's pick 2026-09-29, `docs/target/decisions.json` D-289;
 * built to `docs/concepts/fb2-0929/onboard/o2-step*-*.jpg`; preflight
 * `docs/plans/firstrun-o2-review.md`).
 *
 * 1. The board: a spot on the chosen chapter's picture (`.fe-hero`, Chapter I on a
 *    first run), "Start with the first one." (once the cursor is on another chapter the
 *    card says "Start with this one.": judgment call M of round 21, PR-0289, text only)
 * 2. Party prep: a spot on START BATTLE (`.prep__start`), "Your party is ready."
 * 3. The first command (FFX only): Auron's approved first-command line, word for
 *    word, becomes the third step's slab (`CoachMark`'s `guide` option), with a
 *    ring on ATTACK. One voice, one surface.
 *
 * ## When it runs
 *
 * Armed by `app/screens/raiseBriefing.ts` right after the briefing played on a
 * first launch, and resumed there on a later boot when a started guide is not
 * finished. A returning player, a veteran save and every `?coach=off` harness
 * never arm it. The three seen-ids live in the save's existing `seenCoach` list
 * through `coachState.ts`: no new save field.
 *
 * ## What it never does
 *
 * Block the control it points at: every drawn piece but the slab is
 * `pointer-events: none`, and the slab sits beside the target. Esc (or the skip
 * words) ends the guide for good; on the board and prep the Esc that did it is
 * taken back from the game's input (`FirstRunHost.absorbInput`), so it does not
 * also go BACK. In battle it is NOT taken back (FR-34-01, FFX only): the first
 * Esc at the first command menu skips the guide and opens the pause, as it does
 * everywhere else, instead of needing a second press.
 *
 * Game case: steps 1 and 2 **both**; step 3 **FFX only** (a first battle in FFX-2
 * ends the guide at its start, since nothing drew Rikku's version).
 */

import type { GameId } from '../../battle/common/types.ts';
import type { CoachGuide, CoachMarkOutcome } from './CoachMark.ts';
import { hasSeen, markSeen, shouldShow } from './coachState.ts';
import { FIRST_RUN_IDS, firstRunBoardQuote } from './firstRunCopy.ts';
import { FirstRunLayer, STEP_BATTLE, STEP_BOARD, STEP_PREP, onScreen, phoneLayout, slabHtml, type Box } from './firstRunView.ts';

/** What the guide needs of the app. */
export interface FirstRunHost {
  /** Where the drawn layer is mounted (`App.uiRoot`). */
  readonly root: HTMLElement;
  /** Drop the key edge just pressed, so the screen behind never acts on it. */
  readonly absorbInput: () => void;
}

const SEL = {
  plate: '.fe-hero',
  start: '.prep__start',
  brief: '.coach-brief',
  line: '.coach-mark.coach-mark--guide',
  rows: '.ig-cmd-stack .ig-cmd',
  band: ['.ig-ctb', '.eint__panel'],
} as const;

let host: FirstRunHost | null = null;
let layer: FirstRunLayer | null = null;
let raf = 0;

const allDone = (): boolean => FIRST_RUN_IDS.every((id) => hasSeen(id));

/** True while a guide is armed on this page. */
export function firstRunActive(): boolean {
  return host !== null;
}

/** Start the guide (after a first-launch briefing). A finished guide never restarts. */
export function armFirstRunGuide(h: FirstRunHost): void {
  if (host || allDone()) return;
  host = h;
  layer = new FirstRunLayer(skipFirstRun);
  h.root.appendChild(layer.el);
  window.addEventListener('keydown', onKey, true);
  schedule();
}

/** On a later boot: pick a started, unfinished guide back up. */
export function resumeFirstRunGuide(h: FirstRunHost): void {
  if (hasSeen('firstrun-board') && !allDone()) armFirstRunGuide(h);
}

/**
 * Esc, or the skip words: every step seen, everything down, the press taken back
 * unless `absorb` is false (in battle the Esc goes on to open the pause).
 */
export function skipFirstRun(absorb = true): void {
  for (const id of FIRST_RUN_IDS) markSeen(id);
  if (absorb) host?.absorbInput();
  stopFirstRun();
}

/** Take the guide down without marking anything (a test, a torn-down app). */
export function stopFirstRun(): void {
  if (raf) globalThis.cancelAnimationFrame?.(raf);
  raf = 0;
  window.removeEventListener('keydown', onKey, true);
  layer?.el.remove();
  layer = null;
  host = null;
}

/**
 * A battle HUD mounted (`CoachLayer`, both games): the first two steps are behind
 * the player. Outside FFX, or when FFX's first-command line was already shown,
 * no line will carry step 3, so the guide ends here.
 */
export function firstRunBattleBegan(game: GameId): void {
  if (!host) return;
  markSeen('firstrun-board');
  markSeen('firstrun-prep');
  if (game !== 'ffx' || hasSeen('ffx-turn-order')) markSeen('firstrun-battle');
}

/**
 * Step 3's dress for FFX's first-command line, or null when step 3 is not due.
 * `CoachLayer` asks only for `ffx-turn-order` in an FFX battle.
 */
export function firstRunTurnGuide(): CoachGuide | null {
  if (!host || !hasSeen('firstrun-prep') || !shouldShow('firstrun-battle')) return null;
  return {
    decorate(el: HTMLElement, body: string, skip: () => void): void {
      el.classList.add('coach-mark--guide', 'ig'); // .ig: the Ink & Gold tokens the slab is drawn in
      el.dataset['guide'] = '3';
      el.innerHTML = slabHtml(STEP_BATTLE, body);
      el.querySelector('[data-role="firstrun-skip"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        skip();
      });
    },
    ended(outcome: CoachMarkOutcome, skipped: boolean): void {
      // FR-34-01 (FFX only): in battle the Esc that skips is not taken back, so the pause opens on it.
      if (skipped) skipFirstRun(false);
      else if (outcome === 'confirmed') markSeen('firstrun-battle');
      // A line the layer took down itself (a beat's card, auto-play) is not an
      // answer: the held line comes back dressed again, or a later boot ends it.
    },
    confirmReachesTarget(): boolean {
      return attackRow(document.querySelector<HTMLElement>(SEL.line))?.classList.contains('ig-cmd--selected') === true;
    },
  };
}

/** The ATTACK row of the HUD the line belongs to. */
function attackRow(line: HTMLElement | null): Element | null {
  const hud = line?.closest('.coach-layer')?.parentElement ?? document.body;
  return [...hud.querySelectorAll(SEL.rows)].find((r) => /^attack$/i.test(r.textContent?.trim() ?? '')) ?? null;
}

function schedule(): void {
  if (!raf && host) raf = globalThis.requestAnimationFrame?.(frame) ?? 0;
}

function onKey(e: KeyboardEvent): void {
  if (e.code !== 'Escape' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const step = layer?.step ?? 0;
  if (step !== 1 && step !== 2) return; // step 3's Esc is the line's own cancel (CoachMark)
  e.preventDefault();
  e.stopImmediatePropagation();
  skipFirstRun();
}

function frame(): void {
  raf = 0;
  if (!host || !layer) return;
  if (allDone()) {
    stopFirstRun();
    return;
  }
  const start = onScreen(document.querySelector(SEL.start));
  if (start && !hasSeen('firstrun-board')) markSeen('firstrun-board');
  const line = document.querySelector<HTMLElement>(SEL.line);
  if (line) drawTurn(layer, line);
  else if (document.querySelector(SEL.brief)) layer.hide();
  else {
    const plateEl = shouldShow('firstrun-board') ? document.querySelector<HTMLElement>(SEL.plate) : null;
    const plate = onScreen(plateEl);
    if (plate) layer.draw(STEP_BOARD, plate, 0, 0, firstRunBoardQuote(plateChapterNumber(plateEl)));
    else if (start && shouldShow('firstrun-prep')) layer.draw(STEP_PREP, start);
    else layer.hide();
  }
  schedule();
}

/** The number of the chapter on the board's plate (`data-chapter-number`, set by `heroHtml`), or null when it says none. */
function plateChapterNumber(plate: HTMLElement | null): number | null {
  const raw = plate?.dataset['chapterNumber'];
  return raw === undefined || raw === '' ? null : Number(raw);
}

/** Step 3: the ring on ATTACK, and FFX's line placed beside it (or under the top band). */
function drawTurn(view: FirstRunLayer, line: HTMLElement): void {
  const hud = line.closest('.coach-layer')?.parentElement ?? document.body;
  const box = onScreen(attackRow(line));
  const parent = line.offsetParent;
  if (!box || !parent) {
    view.hide();
    return;
  }
  const p = view.draw(STEP_BATTLE, box, phoneLayout() ? bandBottom(hud) : 0, line.getBoundingClientRect().height);
  const at = parent.getBoundingClientRect();
  line.style.left = `${Math.round(p.slab.left - at.left)}px`;
  line.style.top = `${Math.round(p.slab.top - at.top)}px`;
  line.style.width = `${Math.round(p.slab.width)}px`;
}

/** The phone battle's top band (turn portraits and the enemy-intent slab): the line sits under it. */
function bandBottom(hud: Element): number {
  let bottom = 0;
  for (const sel of SEL.band) {
    for (const el of hud.querySelectorAll(sel)) {
      const b: Box | null = onScreen(el);
      if (b && b.top < (globalThis.innerHeight ?? 844) * 0.4) bottom = Math.max(bottom, b.top + b.height);
    }
  }
  return bottom;
}
