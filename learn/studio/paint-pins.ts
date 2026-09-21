/**
 * The assembled frame's eight numbered readouts
 * (`docs/concepts/atlas/b-battle-studio/b1-assembled.html`): the pin, and the
 * thing it points at — the command banner by Tidus, the gold damage numeral
 * between the fighters, the hit/element/status chips under it, the Overdrive
 * bar across the turntable, the boss's queued move over his aeon, and the
 * turn list down the right.
 *
 * Every number comes out of `readout.ts`, which reads it off a real engine
 * trace (AGENTS.md hard rule 3). This module only turns those strings into
 * markup, and puts each block **next to the figure it is about**, because on
 * a stage adjacency is what says which is which.
 */

import { escapeHtml } from '../shared/text.ts';
import { artUrl } from '../shared/urls.ts';
import type { ScenePin } from './scene.ts';
import { PINS, wx, wy } from './scene.ts';
import {
  bossIntent,
  commandBanner,
  commandNote,
  damageAmount,
  elementChip,
  hitChips,
  overdriveBar,
  statusChip,
  turnRowsBefore,
} from './readout.ts';
import type { TurnRow } from './readout.ts';
import type { TurnTrace } from './trace.ts';

/** How the caller says which of the eight readouts to draw, and how it is wired to the store. */
export interface PinContext {
  readonly trace: TurnTrace;
  /** The piece id a pin selects, and the system that piece belongs to. */
  readonly pieceOf: (pin: ScenePin) => { readonly pieceId: string; readonly systemId: string } | undefined;
  readonly selectedId: string | null;
  readonly fade: number;
}

function hit(pieceId: string, systemId: string, name: string): string {
  return `data-piece-id="${escapeHtml(pieceId)}" data-system-id="${escapeHtml(systemId)}" role="button" tabindex="0" aria-label="${escapeHtml(name)}"`;
}

function pinHtml(pin: ScenePin, attrs: string, selected: boolean): string {
  const label = pin.showLabel === false ? '' : `<span class="pyb-pin__t">${escapeHtml(pin.label)}</span>`;
  return `<div class="pyb-pin${selected ? ' pyb-pin--sel' : ''}" style="left:${wx(pin.pin.x)}px;top:${wy(pin.pin.y)}px" ${attrs}>
    <span class="pyb-pin__d">${escapeHtml(pin.badge)}</span>${label}</div>`;
}

function plainHtml(at: { x: number; y: number }, text: string, value?: string): string {
  const tail = value !== undefined ? ` <b>${escapeHtml(value)}</b>` : '';
  return `<div class="pyb-plain" style="left:${wx(at.x)}px;top:${wy(at.y)}px">${escapeHtml(text)}${tail}</div>`;
}

function chipHtml(
  pin: ScenePin,
  attrs: string,
  selected: boolean,
  chips: readonly { readonly label: string; readonly value: string }[],
): string {
  const body = chips
    .map((chip) => {
      const v = chip.value.length > 0 ? `<b>${escapeHtml(chip.value)}</b>` : '';
      return `<span class="pyb-chip">${escapeHtml(chip.label)}${v}</span>`;
    })
    .join('');
  return `<div class="pyb-chipline${selected ? ' pyb-chipline--sel' : ''}" style="left:${wx(pin.pin.x)}px;top:${wy(pin.pin.y)}px" ${attrs}>
    <span class="pyb-pin__d">${escapeHtml(pin.badge)}</span>${body}</div>`;
}

function actHtml(row: TurnRow): string {
  const face =
    row.art !== undefined
      ? `<span class="pyb-act__f"><img src="${escapeHtml(artUrl(row.art))}" alt=""></span>`
      : `<span class="pyb-act__f pyb-act__f--blank">${escapeHtml(row.name.charAt(0))}</span>`;
  const cls = `pyb-act${row.now ? ' pyb-act--now' : ''}${row.isParty ? '' : ' pyb-act--foe'}`;
  return `<div class="${cls}">${face}<span class="pyb-act__n">${escapeHtml(row.name)}</span><span class="pyb-act__t">${row.tick}</span></div>`;
}

function turnListHtml(pin: ScenePin, attrs: string, selected: boolean, trace: TurnTrace): string {
  const rows = turnRowsBefore(trace, 5).map(actHtml).join('');
  return (
    pinHtml(pin, attrs, selected) +
    (pin.note !== undefined ? plainHtml(pin.note, 'Ticks to wait · lowest acts next') : '') +
    `<div class="pyb-acts${selected ? ' pyb-acts--sel' : ''}" style="left:${wx(pin.body.x)}px;top:${wy(pin.body.y)}px" ${attrs}>${rows}</div>`
  );
}

function commandHtml(pin: ScenePin, attrs: string, selected: boolean, trace: TurnTrace): string {
  const banner = commandBanner(trace);
  return (
    pinHtml(pin, attrs, selected) +
    `<div class="pyb-banner${selected ? ' pyb-banner--sel' : ''}" style="left:${wx(pin.body.x)}px;top:${wy(pin.body.y)}px" ${attrs}>
      <span class="pyb-banner__nm">${escapeHtml(banner.label)}</span><span class="pyb-banner__chip">${escapeHtml(banner.rank)}</span></div>` +
    (pin.note !== undefined ? plainHtml(pin.note, commandNote(trace)) : '')
  );
}

function damageHtml(pin: ScenePin, attrs: string, selected: boolean, trace: TurnTrace): string {
  return (
    pinHtml(pin, attrs, selected) +
    `<div class="pyb-dmg${selected ? ' pyb-dmg--sel' : ''}" style="left:${wx(pin.body.x)}px;top:${wy(pin.body.y)}px" ${attrs}>
      <b>${damageAmount(trace)}</b></div>`
  );
}

function overdriveHtml(pin: ScenePin, attrs: string, selected: boolean, trace: TurnTrace): string {
  const bar = overdriveBar(trace);
  const gain = Math.max(0, bar.after - bar.before);
  return (
    pinHtml(pin, attrs, selected) +
    `<div class="pyb-od${selected ? ' pyb-od--sel' : ''}" style="left:${wx(pin.body.x)}px;top:${wy(pin.body.y)}px;width:${pin.width}px" ${attrs}>
      <div class="pyb-od__k"><span>Overdrive gauge</span><b>${escapeHtml(bar.text)}</b></div>
      <div class="pyb-od__bar"><i style="width:${bar.before}%"></i><em style="left:${bar.before}%;width:${gain}%"></em></div></div>`
  );
}

function bossHtml(pin: ScenePin, attrs: string, selected: boolean, trace: TurnTrace): string {
  const intent = bossIntent(trace);
  return (
    pinHtml(pin, attrs, selected) +
    `<div class="pyb-intent${selected ? ' pyb-intent--sel' : ''}" style="left:${wx(pin.body.x)}px;top:${wy(pin.body.y)}px" ${attrs}>
      <span class="pyb-intent__k">${escapeHtml(intent.key)}</span><span class="pyb-intent__v">${escapeHtml(intent.move)}</span></div>`
  );
}

/** The whole assembled annotation layer, in `STUDIO_COMPONENTS` order. */
export function paintPins(context: PinContext): string {
  const parts: string[] = [];
  for (const pin of PINS) {
    const piece = context.pieceOf(pin);
    if (piece === undefined) continue;
    const selected = context.selectedId === piece.pieceId;
    const attrs = hit(piece.pieceId, piece.systemId, pin.label);
    const { trace } = context;

    switch (pin.component) {
      case 'turn':
        parts.push(turnListHtml(pin, attrs, selected, trace));
        break;
      case 'command':
        parts.push(commandHtml(pin, attrs, selected, trace));
        break;
      case 'damage':
        parts.push(damageHtml(pin, attrs, selected, trace));
        break;
      case 'overdrive':
        parts.push(overdriveHtml(pin, attrs, selected, trace));
        break;
      case 'boss':
        parts.push(bossHtml(pin, attrs, selected, trace));
        break;
      case 'hit':
        parts.push(chipHtml(pin, attrs, selected, hitChips(trace)));
        break;
      case 'element':
        parts.push(chipHtml(pin, attrs, selected, [elementChip(trace)]));
        break;
      case 'status':
        parts.push(chipHtml(pin, attrs, selected, [statusChip(trace)]));
        break;
    }
  }
  return `<div class="pyb-pins" style="opacity:${context.fade.toFixed(3)}">${parts.join('')}</div>`;
}
