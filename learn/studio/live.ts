/**
 * The live engine control: the one thing site B exists for.
 *
 * The approved frame `b2-exploded-selected.html` draws an Agility slider
 * inside the "Turn order" card, with the turn list at Tidus's own build beside
 * the turn list at whatever you dragged to. This module is that control, and
 * it is not a picture of one: moving it calls `runExampleTurn` again — the
 * real `src/battle/ffx` CTB engine, same as the page loaded with — and
 * everything on screen is repainted from the trace that came back (AGENTS.md
 * hard rule 3: prove it by running the engine).
 *
 * The slider's range, 10 to 62, is the frame's own: its knob sits at 65.4% for
 * Agility 44 and its baseline mark at 38.5% for Agility 30, which fixes both
 * ends. The baseline itself is not typed here — it is read off chapter 1's
 * own party build (`src/data/ffx`), so it can never drift from the fight.
 *
 * FFX only (hard rule 14): Agility drives the CTB counter. FFX-2's ATB has
 * gauges and no turn list, and this control is not offered there.
 */

import type { Piece } from '../shared/model.ts';
import { escapeHtml } from '../shared/text.ts';
import { requireEl } from '../shared/dom.ts';
import { gagazetBuild } from '../../src/data/ffx/index.ts';
import { STUDIO_COMPONENTS } from './rules.ts';
import { buildStepCard, stepPieceId } from './specimen.ts';
import { actorNextTick, baseTicks, turnRowsBefore } from './readout.ts';
import type { TurnRow } from './readout.ts';
import { runExampleTurn } from './trace.ts';
import type { TurnTrace } from './trace.ts';

/** The frame's own slider ends, recovered from its knob and baseline-mark percentages. */
export const AGILITY_RANGE = { min: 10, max: 62 } as const;

/** How many rows each column of the comparison shows (the frame draws eight). */
const ROWS = 8;

/** The single mutable reading every part of site B draws from. */
export interface StudioLive {
  /** The trace the page is showing right now. */
  trace(): TurnTrace;
  /** The trace at the chapter's own build, for the "before your drag" column. */
  baseTrace(): TurnTrace;
  seed(): number;
  agility(): number;
  /** Chapter 1's own Agility for Tidus, read from the party build. */
  readonly baselineAgility: number;
  setAgility(value: number): void;
  /** Picks the next seed and re-runs. Returns the new seed. */
  reroll(): number;
  subscribe(listener: () => void): () => void;
}

function tidusAgility(): number {
  const tidus = gagazetBuild.members.find((member) => member.id === 'tidus');
  if (tidus === undefined) throw new Error('live.ts: chapter 1 build has no "tidus" member');
  return tidus.stats.agi;
}

export function createLive(seed: number): StudioLive {
  const baselineAgility = tidusAgility();
  const base = runExampleTurn({ seed });
  let currentSeed = seed;
  let currentAgility = baselineAgility;
  let current = base;
  let baseline = base;
  const listeners = new Set<() => void>();

  function rerun(): void {
    current = runExampleTurn({ seed: currentSeed, agility: currentAgility });
    baseline = currentAgility === baselineAgility ? current : runExampleTurn({ seed: currentSeed });
    for (const listener of listeners) listener();
  }

  return {
    trace: () => current,
    baseTrace: () => baseline,
    seed: () => currentSeed,
    agility: () => currentAgility,
    baselineAgility,
    setAgility(value: number): void {
      if (value === currentAgility) return;
      currentAgility = value;
      rerun();
    },
    reroll(): number {
      currentSeed += 1;
      rerun();
      return currentSeed;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function rowHtml(row: TurnRow, actorId: string, moved: boolean): string {
  const mine = row.actorId === actorId;
  const cls = `pyb-tl${mine ? ' pyb-tl--me' : ''}${row.isParty ? '' : ' pyb-tl--foe'}${moved ? ' pyb-tl--moved' : ''}`;
  return `<div class="${cls}"><span>${escapeHtml(row.name)}</span><span class="pyb-tl__t">${row.tick}</span></div>`;
}

function columnHtml(heading: string, now: boolean, trace: TurnTrace, markSecondTurn: boolean): string {
  let seen = 0;
  const rows = turnRowsBefore(trace, ROWS)
    .map((row) => {
      const mine = row.actorId === trace.actorId;
      if (mine) seen += 1;
      return rowHtml(row, trace.actorId, markSecondTurn && mine && seen === 2);
    })
    .join('');
  return `<div><div class="pyb-col__h${now ? ' pyb-col__h--now' : ''}">${escapeHtml(heading)}</div>${rows}</div>`;
}

/** "Base ticks 8 → 6 · Attack costs 24 → 18 ticks", or as much of it as the engine actually reported. */
function subLine(baseline: TurnTrace, live: TurnTrace, command: string): string {
  const parts: string[] = [];
  const fromBase = baseTicks(baseline);
  const toBase = baseTicks(live);
  if (fromBase !== null && toBase !== null) parts.push(`Base ticks <b>${fromBase} → ${toBase}</b>`);
  const fromNext = actorNextTick(baseline);
  const toNext = actorNextTick(live);
  if (fromNext !== null && toNext !== null) parts.push(`${escapeHtml(command)} costs <b>${fromNext} → ${toNext}</b> ticks`);
  return parts.join(' · ');
}

function noteLine(baseline: TurnTrace, live: TurnTrace): string {
  if (baseline.actorId !== live.actorId) {
    return `Numbers are ticks from now. At this Agility the turn no longer opens on ${baseline.actorName} — ${live.actorName} is now fastest, and the whole reading below is ${live.actorName}'s turn.`;
  }
  return 'Numbers are ticks from now. Every row is one actor waiting to act; the lowest goes next.';
}

/**
 * Rewrites the open detail card from a freshly-run trace.
 *
 * The card's own markup is built once by `learn/shared/card.ts` from the
 * specimen; re-running the engine does not rebuild the page, so the body, the
 * fact row and the citation of the card being read are written back here.
 * Without this the card would quietly keep the numbers of a turn that is no
 * longer on the stage.
 */
function rewriteCard(host: HTMLElement, piece: Piece, trace: TurnTrace): void {
  const component = STUDIO_COMPONENTS.find((c) => stepPieceId(c.id) === piece.id);
  const step = component !== undefined ? trace.steps.find((s) => s.component === component.id) : undefined;
  if (component === undefined || step === undefined) return;
  const card = buildStepCard(component, step, trace);
  const root = host.closest<HTMLElement>('.pyx-card');
  if (root === null) return;

  const body = root.querySelector<HTMLElement>('.pyx-card__body');
  if (body !== null) body.textContent = card.body;

  const activeTab = root.querySelector<HTMLElement>('.pyx-dtab--on')?.dataset['tabId'];
  const tabContent = root.querySelector<HTMLElement>('[data-tab-content]');
  if (tabContent !== null && activeTab === 'overview') {
    tabContent.innerHTML = `<p class="pyx-card__tabtext">${escapeHtml(card.body)}</p>`;
  }

  const factsRow = root.querySelector<HTMLElement>('.pyx-facts-row');
  if (factsRow !== null) {
    factsRow.innerHTML = card.facts
      .map(
        (f) =>
          `<div><div class="pyx-facts-row__l">${escapeHtml(f.label)}</div><div class="pyx-facts-row__v">${escapeHtml(f.value)}</div></div>`,
      )
      .join('');
  }

  const note = root.querySelector<HTMLElement>('.pyx-facts-note');
  if (note !== null) note.textContent = card.cite;
}

/**
 * The control itself, for the card's `renderExtra` slot. Returns the cleanup
 * the shared card runs before its next render.
 */
export function renderAgilityControl(host: HTMLElement, live: StudioLive, piece: Piece): () => void {
  const percent = ((live.agility() - AGILITY_RANGE.min) / (AGILITY_RANGE.max - AGILITY_RANGE.min)) * 100;
  const markPercent = ((live.baselineAgility - AGILITY_RANGE.min) / (AGILITY_RANGE.max - AGILITY_RANGE.min)) * 100;

  host.innerHTML = `
    <div class="pyb-try">
      <div class="pyb-try__k"><span class="pyx-caps">Drag ${escapeHtml(live.baseTrace().actorName)}’s Agility</span>
        <em class="pyx-caps"><i></i>Live</em></div>
      <div class="pyb-agi">
        <div class="pyb-agi__track">
          <div class="pyb-agi__groove"></div>
          <div class="pyb-agi__fill" data-fill style="width:${percent.toFixed(1)}%"></div>
          <div class="pyb-agi__mark" data-l="${live.baselineAgility}" style="left:${markPercent.toFixed(1)}%"></div>
          <div class="pyb-agi__knob" data-knob style="left:${percent.toFixed(1)}%"></div>
          <input type="range" class="pyb-agi__input" data-agi
            min="${AGILITY_RANGE.min}" max="${AGILITY_RANGE.max}" step="1" value="${live.agility()}"
            aria-label="Tidus’s Agility: re-runs the battle engine and redraws the turn list">
        </div>
        <div class="pyb-agi__val" data-val>${live.agility()}</div>
      </div>
      <div class="pyb-try__sub" data-sub></div>
      <div class="pyb-cols" data-cols></div>
      <div class="pyb-try__note" data-note></div>
    </div>`;

  const input = requireEl<HTMLInputElement>(host, '[data-agi]');
  const fill = requireEl(host, '[data-fill]');
  const knob = requireEl(host, '[data-knob]');
  const value = requireEl(host, '[data-val]');
  const sub = requireEl(host, '[data-sub]');
  const cols = requireEl(host, '[data-cols]');
  const note = requireEl(host, '[data-note]');

  function paint(): void {
    const baseline = live.baseTrace();
    const trace = live.trace();
    const agility = live.agility();
    const p = ((agility - AGILITY_RANGE.min) / (AGILITY_RANGE.max - AGILITY_RANGE.min)) * 100;
    input.value = String(agility);
    input.setAttribute('aria-valuetext', `Agility ${agility}`);
    fill.style.width = `${p.toFixed(1)}%`;
    knob.style.left = `${p.toFixed(1)}%`;
    value.textContent = String(agility);
    sub.innerHTML = subLine(baseline, trace, trace.commandLabel);
    cols.innerHTML =
      columnHtml(`At ${live.baselineAgility} (his build)`, false, baseline, false) +
      columnHtml(`At ${agility} (your drag)`, agility !== live.baselineAgility, trace, true);
    note.textContent = noteLine(baseline, trace);
    rewriteCard(host, piece, trace);
  }

  function onInput(): void {
    live.setAgility(Number(input.value));
  }

  input.addEventListener('input', onInput);
  const unsubscribe = live.subscribe(paint);
  paint();

  return () => {
    unsubscribe();
    input.removeEventListener('input', onInput);
    host.innerHTML = '';
  };
}

/** True for the one piece the live control belongs to: the turn-order step. */
export function isTurnOrderPiece(piece: Piece): boolean {
  return piece.id === stepPieceId('turn');
}

/**
 * For every **other** step card: no control, but the same promise. Re-rolling
 * the seed from the Live engine panel changes the damage, the hit roll and the
 * gauge too, so a card that is open while that happens is rewritten from the
 * new trace rather than left showing the previous turn.
 */
export function syncCardToLive(host: HTMLElement, live: StudioLive, piece: Piece): () => void {
  const repaint = (): void => rewriteCard(host, piece, live.trace());
  const unsubscribe = live.subscribe(repaint);
  repaint();
  return unsubscribe;
}
