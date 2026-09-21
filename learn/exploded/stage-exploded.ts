/**
 * Site C's own stage painter: one finished battle frame in three states,
 * joined by the explode slider (`docs/concepts/atlas/c-scene-exploded/`).
 *
 *  - **0, assembled** (`c1`): eight coincident sheets read as one finished
 *    frame — the Zanarkand Dome painting, the party and the boss, the hit,
 *    and the Ink & Gold HUD over it, with the caption that says where its one
 *    number came from.
 *  - **the burst** (`c2`): the frame turns to three-quarters and the sheets
 *    stand apart in depth, each named by a leader label, with the three
 *    components that were never paint as rails beneath them.
 *  - **1, inventory** (`c3`): every shipped piece as a named thumbnail,
 *    grouped by component, the chapter's own outlined in gold.
 *
 * Like site B's painter this is the site's own, not a bending of the shared
 * authored one: site A's subject is a boss's parts, site B's is a turn, and
 * this one's is a stack of sheets in perspective. What the three share — the
 * camera, the pointer handling, the inventory pan — is `learn/shared/stage.ts`.
 */

import { burstProgress, stageRotation } from '../shared/layout.ts';
import type { Piece, Specimen } from '../shared/model.ts';
import type { StagePainter, StagePainterFactory } from '../shared/stage.ts';
import type { ExplorerState } from '../shared/store.ts';
import { visiblePieces } from '../shared/store.ts';
import type { ChapterUse } from './chapter-use.ts';
import type { FrameRun } from './engine-run.ts';
import { PLANES, framePlacement, inventoryFade, ramp, worldFade } from './frame.ts';
import { captionHtml, labelsHtml, noteHtml, railsHtml } from './paint-chrome.ts';
import type { RailRow } from './paint-chrome.ts';
import { paintFrame } from './paint-frame.ts';
import { paintInventory } from './paint-inventory.ts';

export interface ExplodedPainterOptions {
  /** The real seed-1 turn the frame shows. */
  readonly run: FrameRun;
  /** Which pieces the chapter uses, for the inventory's gold outlines. */
  readonly use: ChapterUse;
  readonly chapterLabel: string;
  /** The caption under the assembled frame, as HTML (it carries its own emphasis). */
  readonly caption: string;
  readonly rails: readonly RailRow[];
}

/** Where each part of the composition fades in or out, as fractions of `explode`. */
const FADE = { labelsIn: 0.12, apart: 0.25, captionOut: 0.16 } as const;

/**
 * The frame turns with the explode, and the view rail can turn it further.
 * The shared camera applies that rail angle itself, but with no perspective
 * of its own it only squashes the composition horizontally, so this cancels
 * it exactly (`scaleX(1 / cos a)` against the camera's own `cos a`) and
 * re-applies the same angle inside this painter's perspective instead, where
 * it reads as a turn.
 */
function counterScale(angleDegrees: number): number {
  const cos = Math.cos((angleDegrees * Math.PI) / 180);
  return Math.abs(cos) < 0.2 ? 1 : 1 / cos;
}

export function createExplodedPainter(options: ExplodedPainterOptions): StagePainterFactory {
  return (specimen: Specimen, world: HTMLElement, invHost: HTMLElement): StagePainter => {
    let painting = false;

    function layerIdsOf(visible: readonly Piece[]): Set<string> {
      const ids = new Set<string>();
      for (const piece of visible) {
        if (piece.id.startsWith('layer-')) ids.add(piece.systemId);
      }
      return ids;
    }

    function paintOnce(state: ExplorerState): void {
      const explode = state.explode;
      const t = burstProgress(explode);
      const fade = worldFade(explode);
      const invFade = inventoryFade(explode);
      const angle = stageRotation(state.view, explode);
      const placement = framePlacement(t, angle);

      const visible = visiblePieces(specimen, state);
      const visibleLayers = layerIdsOf(visible);
      const selectedLayerId =
        state.selectedId !== null && state.selectedId.startsWith('layer-') ? state.selectedId.slice('layer-'.length) : null;
      const apart = t > FADE.apart;

      const gfStyle =
        `transform:scale3d(${placement.scale.toFixed(4)},${placement.scale.toFixed(4)},${placement.scale.toFixed(4)})` +
        ` rotateX(${placement.rotateX.toFixed(2)}deg) rotateY(${placement.rotateY.toFixed(2)}deg)`;
      const perspStyle =
        `left:${placement.left.toFixed(1)}px;top:${placement.top.toFixed(1)}px;` +
        `width:${placement.width.toFixed(1)}px;height:${placement.height.toFixed(1)}px;perspective:${placement.perspective}px`;

      const railRows = options.rails.filter((row) => visibleLayers.has(row.layerId));
      const railFade = ramp(explode, FADE.labelsIn, FADE.labelsIn + 0.14);
      const captionFade = 1 - ramp(explode, 0, FADE.captionOut);

      world.innerHTML =
        `<div class="pyc-root" style="transform:scaleX(${counterScale(angle).toFixed(4)})">` +
        `<div class="pyc-persp" style="${perspStyle}">` +
        `<div class="pyc-gf${apart ? ' pyc-gf--apart' : ''}" style="${gfStyle}">` +
        paintFrame({ run: options.run, gap: placement.gap, apart, visibleLayers, selectedLayerId }) +
        `</div>${apart ? '' : '<div class="pyc-edge"></div>'}</div>` +
        (captionFade > 0.01 ? captionHtml(options.caption, captionFade) : '') +
        (railFade > 0.01 ? noteHtml(railFade) : '') +
        (railFade > 0.01 ? railsHtml(railRows, railFade) : '') +
        `</div>`;

      // Leader labels are measured off the laid-out sheets, so they are appended
      // after the sheets exist rather than built with them.
      const labelFade = state.labels ? ramp(explode, FADE.labelsIn, FADE.labelsIn + 0.14) : 0;
      if (labelFade > 0.01) {
        const root = world.querySelector<HTMLElement>('.pyc-root');
        const persp = world.querySelector<HTMLElement>('.pyc-persp');
        const gf = world.querySelector<HTMLElement>('.pyc-gf');
        if (root !== null && persp !== null && gf !== null) {
          root.insertAdjacentHTML(
            'beforeend',
            labelsHtml(gf, persp, placement, PLANES.filter((plane) => visibleLayers.has(plane.layerId)), selectedLayerId, labelFade),
          );
        }
      }

      world.style.opacity = fade.toFixed(3);
      world.style.pointerEvents = fade > 0.05 ? 'auto' : 'none';

      invHost.innerHTML =
        invFade > 0.01
          ? paintInventory({
              specimen,
              visible,
              use: options.use,
              selectedId: state.selectedId,
              chapterLabel: options.chapterLabel,
            })
          : '';
      invHost.style.opacity = invFade.toFixed(3);
      invHost.style.pointerEvents = invFade > 0.5 ? 'auto' : 'none';
    }

    return {
      paint(state: ExplorerState): void {
        if (painting) return;
        painting = true;
        try {
          paintOnce(state);
        } finally {
          painting = false;
        }
      },
      destroy(): void {
        world.innerHTML = '';
        invHost.innerHTML = '';
      },
    };
  };
}
