/**
 * Site B's own stage painter: the dark studio of
 * `docs/concepts/atlas/b-battle-studio/`, in three states joined by the
 * explode slider.
 *
 *  - **0, assembled** (`b1`): the Mt. Gagazet cyclorama, a lit turntable, the
 *    three painted cutouts on it, and eight numbered pins whose readouts sit
 *    beside the thing they describe (`paint-pins.ts`).
 *  - **the burst** (`b2`): the figures draw back into the middle and the
 *    eight steps ring them, each turned toward the centre and tied to it by a
 *    stub (`paint-steps.ts`).
 *  - **1, inventory** (`b3`): all 137 sourced rules as a wall of named tiles,
 *    largest first, panned by drag when it is taller than the stage
 *    (`paint-wall.ts`).
 *
 * The site A painter (`learn/shared/stage-authored.ts`) is not bent to fit
 * this: it draws one subject's parts from `Piece.stage`, and site B's subject
 * is a *turn*, whose pieces are readouts, cards and rules rather than cutouts.
 * They share the camera, the pointer handling and the inventory pan, which is
 * what `learn/shared/stage.ts` owns.
 *
 * Every number the stage prints comes from the live `TurnTrace` the caller
 * hands over, re-read on each paint: dragging the Agility control re-runs the
 * engine and the stage redraws from the new trace, never from cached text
 * (AGENTS.md hard rule 3).
 */

import type { Piece, Specimen } from '../shared/model.ts';
import { burstProgress } from '../shared/layout.ts';
import type { StagePainter, StagePainterFactory } from '../shared/stage.ts';
import type { ExplorerState } from '../shared/store.ts';
import { visiblePieces } from '../shared/store.ts';
import { escapeHtml } from '../shared/text.ts';
import { artUrl } from '../shared/urls.ts';
import type { SceneFigure, ScenePin, SceneState, SceneStep } from './scene.ts';
import { ASSEMBLED, BACKDROP_ART, DAMAGE_MARK, SEPARATED, wx, wy } from './scene.ts';
import { paintPins } from './paint-pins.ts';
import { paintSteps } from './paint-steps.ts';
import { paintWall } from './paint-wall.ts';
import { buildWall } from './wall.ts';
import { damageAmount } from './readout.ts';
import type { StudioComponentId, StudioRule } from './rules.ts';
import { stepPieceId } from './specimen.ts';
import type { TurnTrace } from './trace.ts';

/** What the site hands the painter: the rules behind the wall, and a way to read the current engine trace. */
export interface StudioPainterOptions {
  readonly rules: readonly StudioRule[];
  readonly trace: () => TurnTrace;
}

/** Fades, as fractions of `explode` — the same shape as the site A painter's, so the two sites feel like one tool. */
const FADE = { stepsIn: 0.1, pinsOut: 0.18, worldOut: [0.72, 0.92], invIn: 0.78 } as const;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function ramp(value: number, from: number, to: number): number {
  return to === from ? (value >= to ? 1 : 0) : clamp01((value - from) / (to - from));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** The pictorial composition partway between the two authored states. */
function blend(t: number): SceneState {
  const figures: SceneFigure[] = ASSEMBLED.figures.map((from, i) => {
    const to = SEPARATED.figures[i] ?? from;
    return {
      ...from,
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t),
      ...(from.width !== undefined ? { width: lerp(from.width, to.width ?? from.width, t) } : {}),
      ...(from.height !== undefined ? { height: lerp(from.height, to.height ?? from.height, t) } : {}),
    };
  });
  return {
    backdrop: {
      x: lerp(ASSEMBLED.backdrop.x, SEPARATED.backdrop.x, t),
      y: lerp(ASSEMBLED.backdrop.y, SEPARATED.backdrop.y, t),
      w: lerp(ASSEMBLED.backdrop.w, SEPARATED.backdrop.w, t),
      h: lerp(ASSEMBLED.backdrop.h, SEPARATED.backdrop.h, t),
    },
    table: {
      cx: lerp(ASSEMBLED.table.cx, SEPARATED.table.cx, t),
      cy: lerp(ASSEMBLED.table.cy, SEPARATED.table.cy, t),
      rx: lerp(ASSEMBLED.table.rx, SEPARATED.table.rx, t),
      squash: lerp(ASSEMBLED.table.squash, SEPARATED.table.squash, t),
    },
    shadows: ASSEMBLED.shadows.map((from, i) => {
      const to = SEPARATED.shadows[i] ?? from;
      return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), w: lerp(from.w, to.w, t), h: lerp(from.h, to.h, t) };
    }),
    figures,
  };
}

function figureHtml(figure: SceneFigure, aspect: number): string {
  const size =
    figure.width !== undefined ? `width:${figure.width}px` : `height:${figure.height ?? 0}px;width:${(figure.height ?? 0) / aspect}px`;
  return `<img class="pyb-fig${figure.back === true ? ' pyb-fig--back' : ''}" data-art="${escapeHtml(figure.art)}"
    src="${escapeHtml(artUrl(figure.art))}" alt=""
    style="left:${wx(figure.x)}px;top:${wy(figure.y)}px;${size};z-index:${figure.layer}">`;
}

function sceneHtml(scene: SceneState, aspectOf: (art: string) => number, blur: number): string {
  const { table } = scene;
  const tableStyle = `left:${wx(table.cx - table.rx)}px;top:${wy(table.cy - table.rx)}px;width:${table.rx * 2}px;height:${table.rx * 2}px;transform:scaleY(${table.squash})`;
  return (
    `<div class="pyb-floor"></div>` +
    `<div class="pyb-cyc" style="left:${wx(scene.backdrop.x)}px;top:${wy(scene.backdrop.y)}px;width:${scene.backdrop.w}px;height:${scene.backdrop.h}px;filter:blur(${blur.toFixed(2)}px)">` +
    `<img src="${escapeHtml(artUrl(BACKDROP_ART))}" alt=""></div>` +
    `<div class="pyb-plinth" style="${tableStyle}"></div>` +
    `<div class="pyb-table" style="${tableStyle}"><i class="pyb-table__r"></i><i class="pyb-table__t"></i><i class="pyb-table__a"></i></div>` +
    scene.shadows
      .map((s) => `<div class="pyb-shadow" style="left:${wx(s.x)}px;top:${wy(s.y)}px;width:${s.w}px;height:${s.h}px"></div>`)
      .join('') +
    [...scene.figures]
      .sort((a, b) => a.layer - b.layer)
      .map((figure) => figureHtml(figure, aspectOf(figure.art)))
      .join('')
  );
}

function damageHtml(trace: TurnTrace, explode: number, t: number, hidden: boolean): string {
  if (hidden) return '';
  const from = DAMAGE_MARK.assembled;
  const to = DAMAGE_MARK.separated;
  const scale = lerp(from.scale, to.scale, t);
  // It takes over from the pinned "04 DAMAGE" readout exactly as that one fades, so the
  // number the turn is really about is on screen the whole way across the slider.
  const fade = ramp(explode, FADE.pinsOut - 0.06, FADE.pinsOut + 0.06);
  if (fade <= 0.01) return '';
  return `<div class="pyb-dmg pyb-dmg--float" style="left:${wx(lerp(from.x, to.x, t))}px;top:${wy(lerp(from.y, to.y, t))}px;opacity:${fade.toFixed(2)};transform:skewX(-12deg) rotate(-4deg) scale(${scale.toFixed(2)})"><b>${damageAmount(trace)}</b></div>`;
}

/**
 * Creates the factory `learn/shared/shell.ts` passes to the stage. The stage
 * gives it the world layer (inside the camera) and the inventory host
 * (outside it, so the wall's type never tilts or scales).
 */
export function createStudioPainter(options: StudioPainterOptions): StagePainterFactory {
  return (specimen: Specimen, world: HTMLElement, invHost: HTMLElement): StagePainter => {
    const byId = new Map(specimen.pieces.map((piece) => [piece.id, piece] as const));
    const systemOf = (component: StudioComponentId): string => byId.get(stepPieceId(component))?.systemId ?? component;

    /** Art path -> real height ÷ width, learnt from the images as they load (the authored aspect draws frame one). */
    const aspects = new Map<string, number>();
    let lastState: ExplorerState | undefined;
    let painting = false;

    function aspectOf(art: string): number {
      const learnt = aspects.get(art);
      if (learnt !== undefined) return learnt;
      const authored = [...ASSEMBLED.figures, ...SEPARATED.figures].find((f) => f.art === art);
      return authored?.aspect ?? 1;
    }

    function learn(img: HTMLImageElement): boolean {
      const key = img.dataset['art'];
      if (key === undefined || img.naturalWidth === 0) return false;
      const aspect = img.naturalHeight / img.naturalWidth;
      if (aspects.get(key) === aspect) return false;
      aspects.set(key, aspect);
      return true;
    }

    function onLoadLater(event: Event): void {
      if (learn(event.target as HTMLImageElement) && lastState !== undefined) paintOnce(lastState);
    }

    function paintOnce(state: ExplorerState): boolean {
      const explode = state.explode;
      const t = burstProgress(explode);
      const worldFade = 1 - ramp(explode, FADE.worldOut[0], FADE.worldOut[1]);
      const pinFade = (1 - ramp(explode, 0.02, FADE.pinsOut)) * worldFade;
      const stepFade = ramp(explode, FADE.stepsIn, FADE.stepsIn + 0.14) * worldFade;
      const invFade = ramp(explode, FADE.invIn, 1);

      const visible = new Set(visiblePieces(specimen, state).map((piece: Piece) => piece.id));
      const pieceFor = (component: StudioComponentId): { pieceId: string; systemId: string } | undefined => {
        const id = stepPieceId(component);
        if (!visible.has(id)) return undefined;
        return { pieceId: id, systemId: systemOf(component) };
      };

      const trace = options.trace();
      const scene = blend(t);
      const blur = lerp(0, 1.2, t);

      world.innerHTML =
        sceneHtml(scene, aspectOf, blur) +
        damageHtml(trace, explode, t, !visible.has(stepPieceId('damage'))) +
        (stepFade > 0.01
          ? paintSteps({
              trace,
              pieceOf: (step: SceneStep) => pieceFor(step.component),
              selectedId: state.selectedId,
              fade: stepFade,
            })
          : '') +
        (pinFade > 0.01
          ? paintPins({
              trace,
              pieceOf: (pin: ScenePin) => pieceFor(pin.component),
              selectedId: state.selectedId,
              fade: pinFade,
            })
          : '');
      world.style.opacity = worldFade.toFixed(3);
      world.style.pointerEvents = worldFade > 0.05 ? 'auto' : 'none';

      invHost.innerHTML =
        invFade > 0.01 ? paintWall(buildWall(options.rules, (id) => visible.has(id)), systemOf, state.selectedId) : '';
      invHost.style.opacity = invFade.toFixed(3);
      invHost.style.pointerEvents = invFade > 0.5 ? 'auto' : 'none';

      let learnedNow = false;
      for (const img of world.querySelectorAll<HTMLImageElement>('img[data-art]')) {
        if (img.complete) learnedNow = learn(img) || learnedNow;
        else img.addEventListener('load', onLoadLater, { once: true });
      }
      return learnedNow;
    }

    return {
      paint(state: ExplorerState): void {
        if (painting) return;
        painting = true;
        try {
          lastState = state;
          if (paintOnce(state)) paintOnce(state);
        } finally {
          painting = false;
        }
      },
      destroy(): void {
        lastState = undefined;
        world.innerHTML = '';
        invHost.innerHTML = '';
      },
    };
  };
}
