/**
 * The stage (`docs/concepts/atlas/REFERENCE.md` item 1): drag to tilt
 * (painted cutouts cannot orbit — the A frames say "Drag to tilt"), wheel or
 * pinch to zoom, click a piece to inspect, drag to pan the inventory once
 * everything has settled at `explode` 1.
 *
 * Three painters sit behind one camera:
 *  - **A site's own** (`StageOptions.createPainter`) when the site brings one
 *    — site B's `learn/studio/stage-studio.ts`, whose three states are its
 *    own approved frames and whose live readouts come from a battle trace
 *    this module must know nothing about.
 *  - **Authored** (`stage-authored.ts`) when the specimen's pieces carry a
 *    `Piece.stage` — site A, whose assembled, pulled-apart and inventory
 *    states are all approved frames.
 *  - **Generic** (`stage-generic.ts`) otherwise — a fallback that places
 *    every piece from `size` through `tile-size.ts`, `pack.ts` and
 *    `layout.ts`.
 *
 * This module owns only what they share: the DOM shell, the camera
 * (tilt/zoom/pan), and turning a pointer or key into a `select`.
 */

import type { Specimen } from './model.ts';
import { stageRotation } from './layout.ts';
import type { PackBox } from './pack.ts';
import { CANVAS, freeStagePercent } from './region.ts';
import type { ExplorerState, Store } from './store.ts';
import { requireEl } from './dom.ts';
import { createAuthoredPainter } from './stage-authored.ts';
import { DEFAULT_PACK_BOX, paintGeneric } from './stage-generic.ts';

export { fadeInFor } from './stage-generic.ts';

/** What every painter behind this stage offers: turn state into DOM, and clean up after itself. */
export interface StagePainter {
  paint(state: ExplorerState): void;
  destroy(): void;
}

/**
 * How a site supplies its own painter. `world` is the camera-transformed
 * layer (stage units, origin at its own top-left); `invHost` sits outside the
 * camera so the 100% inventory's type never scales or tilts, and a painter
 * that wants the shared drag-to-pan puts its flow in a `[data-inv-flow]`
 * element inside it.
 */
export type StagePainterFactory = (specimen: Specimen, world: HTMLElement, invHost: HTMLElement) => StagePainter;

export interface CameraControls {
  zoomIn(): void;
  zoomOut(): void;
  resetCamera(): void;
}

export interface StageOptions {
  readonly packBox?: PackBox;
  /** A site's own painter. Takes precedence over the authored/generic choice below. */
  readonly createPainter?: StagePainterFactory;
}

export interface StageHandle {
  readonly camera: CameraControls;
  destroy(): void;
}

const ZOOM_MIN = 0.55;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 0.18;
const DRAG_CLICK_THRESHOLD_PX = 6;

export function renderStage(host: HTMLElement, specimen: Specimen, store: Store, options: StageOptions = {}): StageHandle {
  // A site's own painter and the authored one share the same shell: a flat world (z-index,
  // not depth sorting), an inventory host outside the camera, and the hover tip that host uses.
  const flat = options.createPainter !== undefined || specimen.pieces.some((piece) => piece.stage !== undefined);
  host.innerHTML = flat
    ? `<div class="pyx-stage__world pyx-stage__world--flat"></div><div class="pyx-stage__inv" data-inv></div><div class="pyx-tip pyx-hidden" data-tip></div>`
    : `<div class="pyx-stage__world"></div>`;
  const world = requireEl(host, '.pyx-stage__world');
  const invHost = flat ? requireEl(host, '[data-inv]') : undefined;
  const tip = flat ? requireEl(host, '[data-tip]') : undefined;

  if (invHost !== undefined) {
    const region = freeStagePercent();
    invHost.style.left = region.left;
    invHost.style.top = region.top;
    invHost.style.width = region.width;
    invHost.style.height = region.height;
  }

  const createPainter: StagePainterFactory = options.createPainter ?? createAuthoredPainter;
  const painter: StagePainter | undefined = flat && invHost !== undefined ? createPainter(specimen, world, invHost) : undefined;

  let tiltX = 0;
  let tiltY = 0;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  /** How far the inventory flow is scrolled up, in px. Always <= 0. */
  let invPanY = 0;

  /** The canvas is authored at 1600 wide; a narrower one scales the whole stage rather than letting pieces overflow it. */
  function canvasScale(): number {
    const width = host.clientWidth;
    return width > 0 ? width / CANVAS.width : 1;
  }

  function applyCamera(): void {
    const state = store.getState();
    const settled = state.explode >= 0.999;
    const rotY = stageRotation(state.view, state.explode) + (settled ? 0 : tiltY);
    const rotX = settled ? 0 : tiltX;
    world.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom * canvasScale()}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  function applyInvPan(): void {
    const flow = invHost?.querySelector<HTMLElement>('[data-inv-flow]');
    if (flow === undefined || flow === null || invHost === undefined) return;
    const overflow = Math.max(0, flow.scrollHeight - invHost.clientHeight);
    invPanY = Math.max(-overflow, Math.min(0, invPanY));
    flow.style.transform = `translateY(${invPanY}px)`;
    invHost.classList.toggle('pyx-stage__inv--pannable', overflow > 0);
  }

  function paint(): void {
    applyCamera();
    if (painter !== undefined) {
      painter.paint(store.getState());
      applyInvPan();
    } else {
      paintGeneric(world, specimen, store.getState(), options.packBox ?? DEFAULT_PACK_BOX);
    }
  }

  // The authored painter asks for a repaint once it has learnt an image's real aspect ratio.
  function onRepaintRequest(): void {
    paint();
  }
  host.addEventListener('pyx:repaint', onRepaintRequest);

  // ---- drag: tilt while not settled, pan the inventory once settled; a small-movement release selects instead. ----
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let startTiltX = 0;
  let startTiltY = 0;
  let startPanX = 0;
  let startPanY = 0;
  let startInvPanY = 0;

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    startTiltX = tiltX;
    startTiltY = tiltY;
    startPanX = panX;
    startPanY = panY;
    startInvPanY = invPanY;
    host.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    if (Math.abs(dx) > DRAG_CLICK_THRESHOLD_PX || Math.abs(dy) > DRAG_CLICK_THRESHOLD_PX) dragMoved = true;

    const settled = store.getState().explode >= 0.999;
    if (settled && painter !== undefined) {
      invPanY = startInvPanY + dy;
      applyInvPan();
      host.classList.add('pyx-stage--panning');
    } else if (settled) {
      panX = startPanX + dx;
      panY = startPanY + dy;
      host.classList.add('pyx-stage--panning');
      applyCamera();
    } else {
      tiltY = Math.max(-70, Math.min(70, startTiltY + dx * 0.35));
      tiltX = Math.max(-30, Math.min(30, startTiltX - dy * 0.35));
      applyCamera();
    }
  }

  function selectFrom(target: HTMLElement | null): void {
    const el = target?.closest<HTMLElement>('[data-piece-id]') ?? null;
    if (el === null) return;
    const pieceId = el.dataset['pieceId'];
    const systemId = el.dataset['systemId'];
    if (pieceId !== undefined && systemId !== undefined) {
      store.dispatch({ type: 'select', pieceId, systemId });
    }
  }

  function onPointerUp(event: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    host.classList.remove('pyx-stage--panning');
    host.releasePointerCapture(event.pointerId);
    if (dragMoved) return;

    // `event.target` is unreliable here: `setPointerCapture` on pointerdown retargets every
    // subsequent pointer event for this pointer to `host` itself, regardless of what is
    // visually under the cursor. Ask the document what is actually there instead.
    selectFrom(document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
    applyCamera();
  }

  function onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-piece-id]')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectFrom(target);
    }
  }

  /** The inventory's hover label (the a3 frame's tip): a cell's name, its leading fact and its source. */
  function onPointerOver(event: PointerEvent): void {
    if (tip === undefined || invHost === undefined) return;
    const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-piece-id]') ?? null;
    if (cell === null || !invHost.contains(cell)) {
      tip.classList.add('pyx-hidden');
      return;
    }
    const piece = specimen.pieces.find((p) => p.id === cell.dataset['pieceId']);
    if (piece === undefined) return;
    const fact = piece.card.facts[0];
    tip.innerHTML = `<div class="pyx-tip__n"></div><div class="pyx-tip__f"></div><div class="pyx-tip__c"></div>`;
    (tip.querySelector('.pyx-tip__n') as HTMLElement).textContent = piece.name;
    (tip.querySelector('.pyx-tip__f') as HTMLElement).textContent =
      fact !== undefined ? `${fact.label}: ${fact.value}` : piece.card.eyebrow;
    (tip.querySelector('.pyx-tip__c') as HTMLElement).textContent = piece.card.cite;
    const hostBox = host.getBoundingClientRect();
    const cellBox = cell.getBoundingClientRect();
    tip.classList.remove('pyx-hidden');
    tip.style.left = `${Math.min(cellBox.right - hostBox.left + 12, hostBox.width - 280)}px`;
    tip.style.top = `${cellBox.top - hostBox.top}px`;
  }

  function onPointerLeave(): void {
    tip?.classList.add('pyx-hidden');
  }

  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerup', onPointerUp);
  host.addEventListener('pointercancel', onPointerUp);
  host.addEventListener('wheel', onWheel, { passive: false });
  host.addEventListener('keydown', onKeydown);
  host.addEventListener('pointerover', onPointerOver);
  host.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('resize', applyCamera);

  const camera: CameraControls = {
    zoomIn(): void {
      zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
      applyCamera();
    },
    zoomOut(): void {
      zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
      applyCamera();
    },
    resetCamera(): void {
      tiltX = 0;
      tiltY = 0;
      zoom = 1;
      panX = 0;
      panY = 0;
      invPanY = 0;
      applyCamera();
      applyInvPan();
    },
  };

  const unsubscribe = store.subscribe(paint);
  paint();

  return {
    camera,
    destroy(): void {
      unsubscribe();
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('wheel', onWheel);
      host.removeEventListener('keydown', onKeydown);
      host.removeEventListener('pointerover', onPointerOver);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pyx:repaint', onRepaintRequest);
      window.removeEventListener('resize', applyCamera);
      painter?.destroy();
      host.innerHTML = '';
    },
  };
}
