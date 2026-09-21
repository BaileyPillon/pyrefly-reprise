/**
 * The pulled-apart frame's eight step cards and the leader lines behind them
 * (`docs/concepts/atlas/b-battle-studio/b2-exploded-selected.html`): the turn
 * ringed by its own steps, each card turned toward the middle, each tied back
 * to the figures by a short stub so it is obvious the card is about *that*.
 *
 * The paragraph on each card is the frame's own copy (`readout.ts`'s
 * `STEP_PLAIN`); the line under it is this run's real engine numbers.
 */

import { escapeHtml } from '../shared/text.ts';
import { CANVAS } from '../shared/region.ts';
import type { SceneStep } from './scene.ts';
import { STAGE_FOCUS, STEPS, TRACK_PATH, wx, wy } from './scene.ts';
import { STEP_PLAIN, stepLive } from './readout.ts';
import type { StudioComponentId } from './rules.ts';
import type { TurnTrace } from './trace.ts';

export interface StepContext {
  readonly trace: TurnTrace;
  readonly pieceOf: (step: SceneStep) => { readonly pieceId: string; readonly systemId: string } | undefined;
  readonly selectedId: string | null;
  readonly fade: number;
}

/** Length of the stub that ties a card back to the figures, in canvas pixels. */
const STUB = 26;

/** Where a card's leader line leaves it: the edge that faces the middle. */
function stubStart(step: SceneStep): { readonly x: number; readonly y: number } {
  if (step.y + step.h < STAGE_FOCUS.y) return { x: step.x + step.w / 2, y: step.y + step.h };
  if (step.x + step.w <= STAGE_FOCUS.x) return { x: step.x + step.w, y: step.y + step.h / 2 };
  return { x: step.x, y: step.y + step.h / 2 };
}

function linesHtml(visible: readonly SceneStep[], selectedOf: (step: SceneStep) => boolean, fade: number): string {
  const stubs = visible
    .map((step) => {
      const from = stubStart(step);
      const dx = STAGE_FOCUS.x - from.x;
      const dy = STAGE_FOCUS.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const to = { x: from.x + (dx / length) * STUB, y: from.y + (dy / length) * STUB };
      const cls = selectedOf(step) ? ' pyb-line--sel' : '';
      return (
        `<path class="pyb-line__stub${cls}" d="M${from.x.toFixed(1)} ${from.y.toFixed(1)} L${to.x.toFixed(1)} ${to.y.toFixed(1)}"/>` +
        `<circle class="pyb-line__dot${cls}" cx="${to.x.toFixed(1)}" cy="${to.y.toFixed(1)}" r="3"/>`
      );
    })
    .join('');
  return `<svg class="pyb-lines" style="left:${wx(0)}px;top:${wy(0)}px;width:${CANVAS.width}px;height:${CANVAS.height}px;opacity:${fade.toFixed(3)}"
    viewBox="0 0 ${CANVAS.width} ${CANVAS.height}"><path class="pyb-line__trk" d="${TRACK_PATH}"/>${stubs}</svg>`;
}

/** The step cards' own headings, as the b2 frame sets them. */
const LABELS: Readonly<Record<StudioComponentId, string>> = {
  turn: 'Turn order',
  command: 'Command',
  hit: 'Hit roll',
  damage: 'Damage',
  element: 'Element, affinity',
  status: 'Status',
  overdrive: 'Overdrive gauge',
  boss: "Boss's next move",
};

function cardHtml(step: SceneStep, attrs: string, selected: boolean, trace: TurnTrace, fade: number): string {
  const live = stepLive(step.component, trace);
  const plain = live.plain !== undefined ? `<span class="pyb-step__pw">${escapeHtml(live.plain)}</span>` : '';
  return `<div class="pyb-step${selected ? ' pyb-step--sel' : ''}" ${attrs}
    style="left:${wx(step.x)}px;top:${wy(step.y)}px;width:${step.w}px;height:${step.h}px;opacity:${fade.toFixed(3)};transform:perspective(1300px) ${step.tilt}">
    <div class="pyb-step__hd"><span class="pyb-step__no">${escapeHtml(step.badge)}</span><span>${escapeHtml(LABELS[step.component])}</span></div>
    <p class="pyb-step__p">${escapeHtml(STEP_PLAIN[step.component])}</p>
    <div class="pyb-step__lv"><i></i><b>${escapeHtml(live.value)}</b>${plain}</div></div>`;
}

/** The ring of step cards plus the track and stubs behind them. */
export function paintSteps(context: StepContext): string {
  const visible = STEPS.filter((step) => context.pieceOf(step) !== undefined);
  if (visible.length === 0) return '';

  const isSelected = (step: SceneStep): boolean => context.pieceOf(step)?.pieceId === context.selectedId;

  const cards = visible
    .map((step) => {
      const piece = context.pieceOf(step);
      if (piece === undefined) return '';
      const attrs = `data-piece-id="${escapeHtml(piece.pieceId)}" data-system-id="${escapeHtml(piece.systemId)}" role="button" tabindex="0" aria-label="${escapeHtml(LABELS[step.component])}"`;
      return cardHtml(step, attrs, isSelected(step), context.trace, context.fade);
    })
    .join('');

  return linesHtml(visible, isSelected, context.fade) + cards;
}
